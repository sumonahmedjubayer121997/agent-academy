"""Agent Academy API — the Phase-4+ backend.

Run:  uvicorn main:app --reload --port 8000   (from server/)
Default provider is "fake" (deterministic, free, honestly labelled in /health).
Real models: set LLM_PROVIDER=openai|ollama + credentials in .env (see .env.example).
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config
from .critique import critique_explanation, Critique
from .llm import get_provider
from .llm.base import ProviderError

app = FastAPI(title="Agent Academy API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "provider": config.LLM_PROVIDER, "model": config.LLM_MODEL}


class CritiqueRequest(BaseModel):
    lessonId: str
    lessonTitle: str
    text: str = Field(min_length=20, max_length=4000)


@app.post("/api/critique", response_model=Critique)
def critique(req: CritiqueRequest) -> Critique:
    try:
        return critique_explanation(get_provider(), req.lessonTitle, req.text)
    except ProviderError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider unavailable: {e}") from e
    except Exception as e:  # invalid JSON even after repair
        raise HTTPException(status_code=502, detail=f"provider returned unparseable output: {e}") from e
