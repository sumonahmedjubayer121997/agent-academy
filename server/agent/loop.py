"""The agent loop, bare-metal (Phase 6 core): observe → reason → act → evaluate.

No framework — this is the loop you must be able to write from scratch. The trace
shapes intentionally match the frontend's simulation UI, so the live playground
renders exactly like the scripted one (honesty by symmetry).
"""
from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field

from .. import config
from ..llm.base import Provider
from .tools import TOOLS_SCHEMA, TOOL_SPECS

AGENT_SYSTEM = f"""You are a focused task agent. You have these tools:
{json.dumps(TOOLS_SCHEMA)}

Each turn reply with ONLY a JSON object:
{{"thought": "one sentence of reasoning", "tool_call": {{"name": "...", "args": {{...}}}} | null, "final": "answer to the user" | null}}

Rules: call one tool at a time; prefer the cheapest path; if a tool errors twice,
stop and explain; never call an irreversible tool assuming approval."""

STEP_SCHEMA = '{"thought": str, "tool_call": {"name": str, "args": {}} or null, "final": str or null}'


@dataclass
class RunState:
    run_id: str
    goal: str
    trace: list[dict] = field(default_factory=list)
    history: list[dict] = field(default_factory=list)  # observation digest for the model
    pending: dict | None = None  # gated tool call awaiting human decision
    used_steps: int = 0
    approx_tokens: int = 0
    status: str = "running"  # running | done | awaiting_approval | stopped | rejected


def _model_context(state: RunState) -> str:
    lines = [f"Goal: {state.goal}"]
    if state.history:
        lines.append("History:")
        lines.extend(f"- {h}" for h in state.history[-8:])
    return "\n".join(lines)


def execute(provider: Provider, state: RunState) -> RunState:
    """Advance the run until a final answer, an approval gate, or a budget stop."""
    if not state.trace:
        state.trace.append({"k": "user", "t": state.goal})
        state.trace.append(
            {"k": "plan", "items": ["Work toward the goal one tool call at a time", "Stop at a final answer or the step budget", "Irreversible actions pause for approval"]}
        )
    state.status = "running"

    while state.status == "running":
        if state.used_steps >= config.MAX_AGENT_STEPS:
            state.trace.append({"k": "eval", "t": f"Step budget reached ({config.MAX_AGENT_STEPS}). Stopping gracefully."})
            state.status = "stopped"
            break
        if state.approx_tokens > config.AGENT_APPROX_TOKEN_BUDGET:
            state.trace.append({"k": "eval", "t": "Token budget reached. Stopping gracefully."})
            state.status = "stopped"
            break

        state.used_steps += 1
        state.approx_tokens += len(_model_context(state)) // 4 + 120
        raw = provider.complete_json(AGENT_SYSTEM, _model_context(state), STEP_SCHEMA)
        try:
            step = json.loads(raw)
        except json.JSONDecodeError:
            state.trace.append({"k": "eval", "t": "Model returned unparseable JSON; stopping."})
            state.status = "stopped"
            break

        thought = str(step.get("thought") or "")
        if thought:
            state.trace.append({"k": "think", "t": thought})

        final = step.get("final")
        if final and not step.get("tool_call"):
            state.trace.append({"k": "eval", "t": "Goal satisfied; final answer ready."})
            state.trace.append({"k": "final", "t": str(final)})
            state.status = "done"
            break

        call = step.get("tool_call")
        if not isinstance(call, dict) or "name" not in call:
            state.trace.append({"k": "eval", "t": "No actionable step; stopping."})
            state.status = "stopped"
            break
        name, args = call["name"], call.get("args", {}) or {}
        state.trace.append({"k": "act", "tool": name, "args": json.dumps(args, ensure_ascii=False)})

        tool = TOOL_SPECS.get(name)
        if tool is None:
            obs = f"tool error: unknown tool {name!r}; available: {', '.join(TOOL_SPECS)}"
        elif tool["destructive"] and state.pending is None:
            state.pending = {"name": name, "args": args}
            state.trace.append(
                {"k": "gate", "action": f"{name}({json.dumps(args, ensure_ascii=False)})", "detail": "Irreversible action — human approval required before execution."}
            )
            state.status = "awaiting_approval"
            break
        else:
            state.pending = None
            obs = str(tool["run"](args))
        state.trace.append({"k": "result", "t": obs})
        state.trace.append({"k": "obs", "t": f"Observed: {obs}"[:220]})
        state.history.append(f"{name}({json.dumps(args, ensure_ascii=False)}) → {obs}"[:300])

    return state


def decide(provider: Provider, state: RunState, approved: bool) -> RunState:
    """Resolve a gate: execute the pending tool, or reflect and finish without it."""
    pending, state.pending = state.pending, None
    if pending is None:
        return state
    if approved:
        state.trace.append({"k": "result", "t": "Human approved ✓"})
        obs = str(TOOL_SPECS[pending["name"]]["run"](pending["args"]))
        state.trace.append({"k": "result", "t": obs})
        state.history.append(f"{pending['name']} (approved) → {obs}"[:300])
        state.status = "running"
        return execute(provider, state)
    state.trace.append({"k": "result", "t": "Human rejected ✗ — action blocked"})
    state.trace.append({"k": "reflect", "t": "The irreversible action was rejected; I will not retry it. Finishing with what I have."})
    state.trace.append({"k": "final", "t": "Action rejected by the human — nothing irreversible was done. Here is the work so far."})
    state.status = "rejected"
    return state


def new_run(goal: str) -> RunState:
    return RunState(run_id=uuid.uuid4().hex[:12], goal=goal)
