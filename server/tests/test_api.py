from fastapi.testclient import TestClient

from ..main import app

client = TestClient(app)


def test_health_reports_fake_provider_honestly():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["provider"] == "fake"


def test_critique_short_text_scores_low_with_gap():
    r = client.post(
        "/api/critique",
        json={
            "lessonId": "agent-loop",
            "lessonTitle": "The Agent Loop",
            "text": "It loops and calls tools and stuff.",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert 0 <= body["score"] <= 10
    assert any("short" in g.lower() for g in body["gaps"])


def test_critique_rich_text_scores_higher():
    short = client.post(
        "/api/critique",
        json={"lessonId": "l", "lessonTitle": "T", "text": "An agent is a program that asks a model what to do next, and it "},
    ).json()["score"]
    rich = client.post(
        "/api/critique",
        json={
            "lessonId": "l",
            "lessonTitle": "T",
            "text": (
                "An agent is a loop around an LLM. The model sees the message history plus tool "
                "schemas and returns either a tool call or a final answer, because the model itself "
                "cannot execute anything. My runtime runs the tool, appends the observation, and "
                "loops until a final answer or a step budget of 6 is reached, which means cost is "
                "bounded. For example, 6 steps at 800 in / 200 out tokens costs about $0.03."
            ),
        },
    ).json()["score"]
    assert rich > short


def test_critique_rejects_too_short_input():
    r = client.post(
        "/api/critique",
        json={"lessonId": "l", "lessonTitle": "T", "text": "too short"},
    )
    assert r.status_code == 422
