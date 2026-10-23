"""Pure-Python BM25 (Okapi) — keyword retrieval with zero dependencies.

This is the "sparse" half of hybrid retrieval: exact-term precision that
embeddings can miss (function names, acronyms, rare words).
"""
from __future__ import annotations

import math
import re

STOP = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "for", "it", "this",
    "that", "with", "on", "as", "be", "by", "what", "how", "why", "do", "does", "my",
    "i", "you", "your", "me", "we", "can", "should", "at", "from",
}


def tokenize(text: str) -> list[str]:
    return [t for t in re.findall(r"[a-z0-9]+", text.lower()) if t not in STOP]


class BM25Index:
    def __init__(self, docs: list[str], k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.doc_tokens = [tokenize(d) for d in docs]
        self.doc_len = [len(t) for t in self.doc_tokens]
        self.avg_len = sum(self.doc_len) / max(1, len(self.doc_len))
        self.df: dict[str, int] = {}
        for tokens in self.doc_tokens:
            for term in set(tokens):
                self.df[term] = self.df.get(term, 0) + 1
        self.n = len(docs)

    def _idf(self, term: str) -> float:
        df = self.df.get(term, 0)
        return math.log(1 + (self.n - df + 0.5) / (df + 0.5))

    def score(self, query: str, i: int) -> float:
        tokens = tokenize(query)
        total = 0.0
        tf: dict[str, int] = {}
        for t in self.doc_tokens[i]:
            tf[t] = tf.get(t, 0) + 1
        for term in tokens:
            if term not in tf:
                continue
            freq = tf[term]
            denom = freq + self.k1 * (1 - self.b + self.b * self.doc_len[i] / max(1e-9, self.avg_len))
            total += self._idf(term) * freq * (self.k1 + 1) / denom
        return total

    def search(self, query: str, k: int = 5) -> list[tuple[int, float]]:
        scored = [(i, self.score(query, i)) for i in range(self.n)]
        scored = [(i, s) for i, s in scored if s > 0]
        scored.sort(key=lambda x: -x[1])
        return scored[:k]
