"""Agent-loop tests: completion, the approval gate, rejection, tool errors, budgets."""
import json

import pytest

from ..agent.loop import decide, execute, new_run
from ..agent.tools import calculator, fetch_page
from ..llm.fake import FakeProvider


def step(thought="", name=None, args=None, final=None):
    return json.dumps({"thought": thought, "tool_call": {"name": name, "args": args} if name else None, "final": final})


def test_calculator_is_safe():
    assert calculator("2+2") == "4"
    assert calculator("2**10 / 4") == "256.0"
    assert calculator("__import__('os')").startswith("tool error")
    assert calculator("open('/etc/passwd')").startswith("tool error")


def test_fetch_page_blocks_ssrf_targets():
    assert "only https://" in fetch_page("http://example.com")
    assert "blocked" in fetch_page("https://localhost/admin")
    assert "blocked" in fetch_page("https://127.0.0.1:8000/api/health")
    assert "blocked" in fetch_page("https://169.254.169.254/latest/meta-data/")


def test_agent_completes_after_tool_call():
    p = FakeProvider()
    p.json_script = [
        step("Need the number first.", "calculator", {"expression": "6*7"}),
        step(final="The answer is 42."),
    ]
    state = execute(p, new_run("compute 6*7"))
    assert state.status == "done"
    kinds = [t["k"] for t in state.trace]
    assert "act" in kinds and "final" in kinds and "gate" not in kinds


def test_destructive_tool_hits_the_gate_then_approval_executes():
    p = FakeProvider()
    p.json_script = [
        step("Draft ready.", "send_email", {"to": "me@example.com", "subject": "hi"}),
    ]
    state = execute(p, new_run("email me a summary"))
    assert state.status == "awaiting_approval"
    assert state.pending["name"] == "send_email"
    gate = [t for t in state.trace if t["k"] == "gate"][0]
    assert "send_email" in gate["action"]

    p.json_script = [step(final="Sent and done.")]
    state = decide(p, state, approved=True)
    assert state.status == "done"
    assert any("approved ✓" in t.get("t", "") for t in state.trace)


def test_rejection_finishes_without_the_action():
    p = FakeProvider()
    p.json_script = [step("Send it.", "send_email", {"to": "x@y.z", "subject": "s"})]
    state = execute(p, new_run("email someone"))
    state = decide(p, state, approved=False)
    assert state.status == "rejected"
    assert not any(t["k"] == "result" and "queued to" in t.get("t", "") for t in state.trace)


def test_unknown_tool_returns_recoverable_observation():
    p = FakeProvider()
    p.json_script = [
        step("Trying a tool I don't have.", "delete_database", {}),
        step(final="That tool does not exist; nothing was deleted."),
    ]
    state = execute(p, new_run("try something"))
    assert state.status == "done"
    assert any("unknown tool" in t.get("t", "") for t in state.trace if t["k"] == "result")


def test_step_budget_stops_the_loop():
    from .. import config

    p = FakeProvider()
    # Infinite tool-looping model: always wants the calculator again.
    p.json_script = [step("again", "calculator", {"expression": str(i)}) for i in range(config.MAX_AGENT_STEPS + 5)]
    state = execute(p, new_run("loop forever"))
    assert state.status == "stopped"
    assert state.used_steps <= config.MAX_AGENT_STEPS


@pytest.mark.parametrize(
    "body,expected",
    [
        ({"goal": "x"}, 422),  # too short
    ],
)
def test_agent_endpoint_validation(body, expected):
    from fastapi.testclient import TestClient

    from ..main import app

    client = TestClient(app)
    assert client.post("/api/agent", json=body).status_code == expected
