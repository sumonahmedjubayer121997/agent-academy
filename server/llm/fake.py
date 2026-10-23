"""Deterministic fake provider — the default.

Makes the whole backend runnable for free (tests, local dev, demos) with clearly
labelled behaviour: critique scores follow transparent heuristics, and the agent
loop uses an injectable script (tests) or a tiny heuristic policy. Never pretend
this is a real model — the /health endpoint reports the provider name honestly.
"""
from __future__ import annotations

import json
import re


class FakeProvider:
    name = "fake"

    def __init__(self) -> None:
        self.json_script: list[str] = []  # popped by complete_json when set (tests)

    def complete(self, system: str, user: str) -> str:
        return f"[fake:{self.name}] {user[:120]}"

    def complete_json(self, system: str, user: str, schema_hint: str) -> str:
        if self.json_script:
            return self.json_script.pop(0)
        # Heuristic critique when the caller looks like a critique request.
        if "critique" in system.lower():
            text = user.split("Learner explanation:", 1)[-1].strip()
            return self._critique(text)
        # Heuristic agent step otherwise.
        return self._agent_step(user)

    # ── heuristics ────────────────────────────────────────────────
    def _critique(self, text: str) -> str:
        words = len(text.split())
        score = min(10, 2 + words // 40)
        gaps: list[str] = []
        strengths: list[str] = []
        if words < 40:
            gaps.append("Too short to cover the concept — aim for 4-5 sentences.")
        if not re.search(r"\d", text):
            gaps.append("No concrete example or number given; explanations stick better with one.")
        if words >= 60:
            strengths.append("Explains in own words at reasonable length.")
        if any(k in text.lower() for k in ("because", "so that", "which means")):
            strengths.append("Uses causal language ('because', 'which means') — good sign of understanding.")
        if not strengths:
            strengths.append("Attempt made — keep refining.")
        return json.dumps({"score": score, "gaps": gaps or ["None obvious — compare against the lesson's technical section."], "strengths": strengths})

    def _agent_step(self, user: str) -> str:
        lowered = user.lower()
        if "error" in lowered and lowered.count("error") >= 2:
            return json.dumps({"thought": "Tools keep failing; stopping gracefully.", "tool_call": None, "final": "Stopped: repeated tool failures (fake provider)."})
        if "history:" in lowered and "tool error" not in lowered:
            # At least one successful observation exists — wrap up like a good demo citizen.
            return json.dumps({"thought": "I have a result; reporting back.", "tool_call": None, "final": "Done (fake provider): task completed using the available tool results."})
        if "send_email" in lowered:
            return json.dumps({"thought": "Draft done; send_email is irreversible.", "tool_call": {"name": "send_email", "args": {"to": "me@example.com", "subject": "Report"}}, "final": None})
        return json.dumps({"thought": "Gathering information first.", "tool_call": {"name": "calculator", "args": {"expression": "2+2"}}, "final": None})
