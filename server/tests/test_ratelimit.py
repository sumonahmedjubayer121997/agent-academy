"""Rate limiter: bursts get 429s; /health stays exempt."""
from fastapi.testclient import TestClient

from ..main import app
from .. import config

client = TestClient(app)


def test_burst_gets_throttled_but_health_exempt():
    # Exhaust the budget with cheap /api/ask requests.
    limited = 0
    for i in range(config.RATE_LIMIT_PER_MIN + 5):
        r = client.post("/api/ask", json={"q": f"rate limit probe {i}"})
        if r.status_code == 429:
            limited += 1
    assert limited >= 5, "requests beyond the budget must be throttled"
    # Health is exempt so status checks never burn quota.
    assert client.get("/health").status_code == 200
