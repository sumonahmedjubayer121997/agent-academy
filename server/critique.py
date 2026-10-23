"""Feynman critique: explanations in, validated structured feedback out.

Demonstrates the Phase-4 patterns end to end: prompt design, structured outputs,
pydantic as the contract, and a single validate-and-repair retry with error feedback.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, ValidationError

from .llm.base import Provider

CRITIQUE_SYSTEM = """You are a patient technical tutor. A learner just studied a lesson and
explained the concept back in their own words (the Feynman technique). Critique the explanation
against what a solid practitioner would say.

Be specific and kind. Judge: correctness of the core idea, completeness, and whether an
example or number would make it concrete. Score 0-10 (be honest; 7 means genuinely good).

Reply with ONLY a JSON object: {"score": int 0-10, "gaps": [string], "strengths": [string]}."""

CRITIQUE_SCHEMA_HINT = '{"score": 0-10 integer, "gaps": ["..."], "strengths": ["..."]}'


class Critique(BaseModel):
    score: int = Field(ge=0, le=10)
    gaps: list[str]
    strengths: list[str]


def critique_explanation(provider: Provider, lesson_title: str, explanation: str) -> Critique:
    user = f"Lesson: {lesson_title}\n\nLearner explanation:\n{explanation}"
    raw = provider.complete_json(CRITIQUE_SYSTEM, user, CRITIQUE_SCHEMA_HINT)
    try:
        return Critique.model_validate_json(raw)
    except ValidationError:
        # One repair round-trip: feed the failure back so the model can fix itself.
        repaired = provider.complete_json(
            CRITIQUE_SYSTEM,
            user + "\n\nYour previous reply was not valid JSON matching the schema. Reply again with ONLY the JSON object.",
            CRITIQUE_SCHEMA_HINT,
        )
        return Critique.model_validate_json(repaired)  # raises upstream → 502
