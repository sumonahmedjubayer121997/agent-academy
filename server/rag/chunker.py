"""Chunk the exported curriculum into retrieval-sized units with metadata.

Chunking lesson: one section per chunk (simple / intuition / technical / deeper /
code) — section-level granularity keeps citations meaningful. Modules: one chunk
each. Metadata (route) lets the UI link every citation back into the app.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Chunk:
    id: str
    title: str
    route: str
    text: str


def build_chunks(data: dict) -> list[Chunk]:
    chunks: list[Chunk] = []
    for lesson in data.get("lessons", []):
        lid = lesson["id"]
        base = f"lesson:{lid}"
        sections = (
            ("overview", f"{lesson['title']} — {lesson['tagline']}", " ".join(lesson.get("simple", []))),
            ("intuition", f"{lesson['title']} — intuition", " ".join(lesson.get("intuition", {}).get("paragraphs", []))),
            ("technical", f"{lesson['title']} — technical", " ".join(lesson.get("technical", []))),
            ("deeper", f"{lesson['title']} — deeper", " ".join(lesson.get("deeper", []))),
            ("code", f"{lesson['title']} — code walkthrough", str(lesson.get("walkthroughCode", ""))),
            ("real-world", f"{lesson['title']} — real world", " ".join(lesson.get("realWorld", []))),
        )
        for kind, title, text in sections:
            if text.strip():
                chunks.append(Chunk(id=f"{base}:{kind}", title=title, route=f"/learn/{lid}", text=text))
    for mod in data.get("modules", []):
        text = " ".join(
            [
                f"Phase {mod['phase']}.",
                mod["why"],
                "Objectives: " + "; ".join(mod.get("objectives", [])) + ".",
                mod.get("deliverable", ""),
            ]
        )
        if text.strip():
            chunks.append(
                Chunk(id=f"module:{mod['id']}", title=f"{mod['title']} (module)", route=f"/roadmap/{mod['id']}", text=text)
            )
    return chunks


def load_chunks(path: Path | None = None) -> list[Chunk]:
    path = path or Path(__file__).resolve().parent.parent / "data" / "content.json"
    if not path.exists():
        # regenerate hint: node --experimental-strip-types scripts/export-content.mjs
        raise FileNotFoundError(f"{path} missing — run the export script (see server/README.md)")
    return build_chunks(json.loads(path.read_text()))
