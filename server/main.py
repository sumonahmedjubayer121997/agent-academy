"""Agent Academy API — the Phase-4+ backend.

Run:  .venv/bin/python -m uvicorn server.main:app --reload --port 8000   (repo root)
Default provider is "fake" (deterministic, free, honestly labelled in /health).
Real models: set LLM_PROVIDER=openai|ollama + credentials in .env (see .env.example).
"""
from __future__ import annotations

import json
import logging
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import config
from .critique import critique_explanation, Critique
from .llm import get_provider
from .llm.base import ProviderError
from .ratelimit import RateLimitMiddleware

logger = logging.getLogger("agent-academy")


def log_event(name: str, **fields: object) -> None:
    """Structured (JSON-lines) event logging — grep-able, dashboard-ready."""
    logger.info(json.dumps({"event": name, **fields}, default=str))


app = FastAPI(title="Agent Academy API", version="0.1.0")

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request, call_next):  # type: ignore[no-untyped-def]
    start = time.monotonic()
    response = await call_next(request)
    if request.url.path.startswith("/api"):
        log_event(
            "request",
            path=request.url.path,
            method=request.method,
            status=response.status_code,
            ms=round((time.monotonic() - start) * 1000),
        )
    return response


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


class AskRequest(BaseModel):
    q: str = Field(min_length=3, max_length=300)


@app.get("/api/ask")
def ask_get(q: str) -> dict:
    return _ask(q)


@app.post("/api/ask")
def ask(req: AskRequest) -> dict:
    return _ask(req.q)


def _ask(q: str) -> dict:
    from .rag.retriever import get_retriever

    try:
        return get_retriever().ask(get_provider(), q)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except ProviderError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider unavailable: {e}") from e


# ── Agent endpoints (W6) ──────────────────────────────────────────────
from .agent.loop import decide as agent_decide  # noqa: E402
from .agent.loop import execute as agent_execute  # noqa: E402
from .agent.loop import new_run  # noqa: E402

RUNS: dict[str, object] = {}


class AgentRequest(BaseModel):
    goal: str = Field(min_length=5, max_length=500)


class DecideRequest(BaseModel):
    runId: str
    approved: bool


@app.post("/api/agent")
def agent_start(req: AgentRequest) -> dict:
    state = new_run(req.goal)
    try:
        agent_execute(get_provider(), state)
    except ProviderError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider unavailable: {e}") from e
    RUNS[state.run_id] = state
    log_event("agent_run", run_id=state.run_id, status=state.status, steps=state.used_steps)
    return _run_view(state)


@app.post("/api/agent/decide")
def agent_decide_endpoint(req: DecideRequest) -> dict:
    state = RUNS.get(req.runId)
    if state is None:
        raise HTTPException(status_code=404, detail="run not found (runs are in-memory; restart clears them)")
    try:
        agent_decide(get_provider(), state, req.approved)
    except ProviderError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider unavailable: {e}") from e
    return _run_view(state)


def _run_view(state) -> dict:
    return {
        "runId": state.run_id,
        "status": state.status,
        "trace": state.trace,
        "steps": state.used_steps,
        "provider": get_provider().name if state.status != "awaiting_approval" else None,
        "pendingAction": (state.pending or {}).get("name"),
    }
