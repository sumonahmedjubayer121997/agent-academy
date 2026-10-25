"""RAG evaluation: a golden question set with expected chunks, hit-rate@5 measured.

This is the W5 eval harness — retrieval quality is measured, not asserted by vibes.
Offline (fake provider) the answer is extractive, so these tests measure retrieval
only; generated-answer faithfulness is evaluated once a real provider is connected.
"""
from fastapi.testclient import TestClient

from ..main import app
from ..rag.retriever import get_retriever

client = TestClient(app)

GOLDEN: list[tuple[str, tuple[str, ...]]] = [
    # (question, acceptable id-prefixes — ANY chunk of the right lesson/module counts)
    ("what stops an agent loop from running forever", ("lesson:agent-loop:", "module:p6-agent-loop")),
    ("who actually executes a tool call", ("lesson:agent-loop:", "module:p4-function-calling")),
    ("how much does one agent run cost", ("lesson:agent-loop:",)),
    ("what is an embedding", ("lesson:embeddings-intuition:", "module:p3-embeddings-repr")),
    ("why cosine instead of euclidean", ("lesson:embeddings-intuition:",)),
    ("compute cosine similarity of two vectors", ("lesson:embeddings-intuition:", "module:p2-linear-algebra")),
    ("library shelves analogy for embeddings", ("lesson:embeddings-intuition:",)),
    ("attention weighted sum of values", ("lesson:agent-loop:", "module:p3-attention")),
    ("dependencies for the mcp module", ("module:p6-mcp",)),
    ("what do i build in phase 4 project", ("module:p4-project",)),
    ("tokenisation and context windows", ("module:p3-tokens-inference",)),
    ("hybrid retrieval and reranking", ("module:p5-hybrid-retrieval",)),
    # -- Prompt Engineering (public Beta) --
    ("what does json mode actually guarantee", ("lesson:json-you-can-trust:", "module:pe-json-mode")),
    ("feed validation errors back for repair", ("lesson:json-you-can-trust:", "module:pe-validation-repair")),
    ("how should i budget my context window", ("lesson:what-the-model-sees:", "module:pe-context-budget")),
    ("why is content in the middle of long prompts retrieved worse", ("lesson:what-the-model-sees:", "module:pe-long-context")),
    ("what is indirect prompt injection", ("module:pe-injection",)),
    ("how do i calibrate an llm judge", ("module:pe-metrics",)),
    ("how many few-shot examples should i use", ("module:pe-few-shot",)),
    ("how to red team my own prompts", ("module:pe-red-team",)),
]


def test_retrieval_hit_rate_at_5():
    r = get_retriever()
    hits = 0
    for q, prefixes in GOLDEN:
        retrieved = r.retrieve(q, k=5)
        if any(c.id.startswith(p) for p in prefixes for c in retrieved):
            hits += 1
    rate = hits / len(GOLDEN)
    # Publish the real number; gate at a level that leaves room for variance.
    print(f"\nhit-rate@5 = {rate:.2f} ({hits}/{len(GOLDEN)})")
    assert rate >= 0.75, f"retrieval quality regression: hit-rate@5 = {rate:.2f}"


def test_ask_endpoint_returns_citations():
    r = client.post("/api/ask", json={"q": "what is an embedding"})
    assert r.status_code == 200
    body = r.json()
    assert body["citations"], "cited Q&A must carry citations"
    assert body["provider"] == "fake"
    assert all("route" in c for c in body["citations"])


def test_ask_endpoint_empty_query_rejected():
    r = client.post("/api/ask", json={"q": "  "})
    assert r.status_code == 422
