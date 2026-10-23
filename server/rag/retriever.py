"""Retrieval + grounded answering over the curriculum — "Ask the Roadmap" (W5).

Hybrid by design: BM25 (sparse) provides exact-term precision today; an embeddings
half drops into `retrieve()` without touching callers. With the fake provider the
answer is honestly extractive; with a real provider it is a grounded, cited answer
prompted to refuse when evidence is missing.
"""
from __future__ import annotations

import json

from ..llm.base import Provider
from .bm25 import BM25Index, tokenize
from .chunker import Chunk, load_chunks

ANSWER_SYSTEM = """You answer questions about a learning curriculum using ONLY the provided
context sections. Cite the section titles you used. If the context does not contain the
answer, say so plainly — never invent curriculum content."""


class Retriever:
    def __init__(self) -> None:
        self.chunks: list[Chunk] = load_chunks()
        # Index titles alongside text: users query with the words titles carry
        # ("analogy", "technical", "project") — a classic sparse-retrieval trick.
        self.index = BM25Index([f"{c.title}. {c.text}" for c in self.chunks])

    def retrieve(self, query: str, k: int = 5) -> list[Chunk]:
        hits = self.index.search(query, k)
        return [self.chunks[i] for i, _ in hits]

    def ask(self, provider: Provider, query: str, k: int = 5) -> dict:
        hits = self.retrieve(query, k)
        if not hits:
            return {
                "answer": "No relevant section found in the curriculum for that question.",
                "citations": [],
                "provider": provider.name,
            }
        context = "\n\n".join(f"[{i + 1}] {c.title}\n{c.text[:800]}" for i, c in enumerate(hits))
        if provider.name.startswith("fake"):
            # Honest extractive fallback: point at the best section, don't pretend to reason.
            best = hits[0]
            snippet = " ".join(best.text.split()[:45]) + "…"
            answer = (
                f"(Extractive answer from the top-matching section — connect a real provider "
                f"for generated answers.) Best match: {best.title}. Key content: {snippet}"
            )
        else:
            answer = provider.complete(ANSWER_SYSTEM, f"Question: {query}\n\nContext:\n{context}")
        return {
            "answer": answer,
            "citations": [{"id": c.id, "title": c.title, "route": c.route} for c in hits],
            "provider": provider.name,
        }


# Lazy singleton so importing the module never fails on a cold start.
_retriever: Retriever | None = None


def get_retriever() -> Retriever:
    global _retriever
    if _retriever is None:
        _retriever = Retriever()
    return _retriever
