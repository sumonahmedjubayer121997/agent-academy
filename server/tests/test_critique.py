import pytest
from pydantic import ValidationError

from ..critique import critique_explanation, Critique
from ..llm.fake import FakeProvider


def test_repair_loop_recovers_from_invalid_json():
    p = FakeProvider()
    p.json_script = [
        "not json at all {",
        '{"score": 8, "gaps": ["none"], "strengths": ["clear"]}',
    ]
    out = critique_explanation(p, "Embeddings", "Vectors encode meaning because similar texts map to nearby points.")
    assert out.score == 8
    assert out.gaps == ["none"]


def test_repair_loop_raises_after_second_failure():
    p = FakeProvider()
    p.json_script = ["still not json", "also not json"]
    with pytest.raises((ValidationError, ValueError)):
        critique_explanation(p, "T", "x" * 30)


def test_critique_schema_bounds():
    with pytest.raises(ValidationError):
        Critique(score=11, gaps=[], strengths=[])
    with pytest.raises(ValidationError):
        Critique(score=-1, gaps=[], strengths=[])
