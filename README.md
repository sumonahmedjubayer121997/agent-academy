# Agent Academy — Become an AI Agent Engineer

[![CI](https://github.com/sumonahmedjubayer121997/agent-academy/actions/workflows/ci.yml/badge.svg)](https://github.com/sumonahmedjubayer121997/agent-academy/actions/workflows/ci.yml)

**Live:** https://agent-academy-peach.vercel.app

An interactive learning platform: a personalised, project-driven roadmap from React/ML foundations
to production AI agent engineering — with the learning mechanics (spaced repetition, calibration,
Feynman practice) and the AI systems (RAG, a bare-metal agent loop, approval gates) built in.
Frontend: Vite + React 18 + TypeScript + Tailwind. Backend: FastAPI with a provider-independent
LLM layer (defaults to a deterministic, honestly-labelled `fake` provider — no keys needed).

## Quickstart

```bash
npm install
npm run dev        # http://localhost:5173 — works fully offline

# optional backend (AI feedback, Ask-the-Roadmap, live playground):
python3 -m venv --without-pip server/.venv && server/.venv/bin/python get-pip.py  # or plain venv
server/.venv/bin/pip install -r server/requirements.txt
server/.venv/bin/python -m uvicorn server.main:app --port 8000

# or everything in docker (add --profile ollama for local models):
docker compose up -d
```

## Tests

```bash
npm test                                        # frontend: SRS math, schedule, components (29)
server/.venv/bin/python -m pytest server/tests -q  # backend: critique repair, RAG evals
                                                # (hit-rate@5 gated), agent gate/budgets, rate limit
```

## What's inside

- **Learning engine** — 8 phases · 60 modules as typed data; interactive SVG roadmap with
  prerequisites; diagnostic assessment with prior-knowledge credit; spaced-repetition reviews;
  confidence calibration; pre-questions; focus timer; honest planner (pace from logged sessions).
- **Lessons** — nine-section format with "go deeper" layers, interactive demos (agent loop,
  draggable vector similarity), knowledge checks, Feynman boxes with AI critique.
- **AI systems (server/)** — provider-independent layer (fake | OpenAI-compatible | Ollama),
  schema-validated critique with a repair loop, BM25 RAG over the curriculum with clickable
  citations, and a framework-free agent loop with tool registry, budgets, and a human-approval
  gate — mirrored by the Playground's simulation/live modes.
- **Production posture** — per-IP rate limiting, structured JSON logging, non-root Docker,
  security review + ops runbook (`docs/SECURITY.md`, `docs/OPS.md`).

## Build phases (docs/PHASED_BUILD_PLAN.md)

W0 hardening ✓ · W1 retention ✓ · W2 depth ✓ · W3 analytics ✓ · W4 backend+LLM ✓ ·
W5 RAG ✓ · W6 agent runtime ✓ · W7 production hardening ✓ *(auth/multi-user = next)*

## Layout

```
src/content/   curriculum as typed data (phases, modules, lessons, glossary, edges)
src/lib/       pure logic: SRS scheduler, schedule builder, API client
src/pages/     one file per route
server/        FastAPI: llm/ providers, rag/, agent/, critique, rate limit, tests/
docs/          ROADMAP_REPORT · LEARNING_ACCELERATION_REPORT · PHASED_BUILD_PLAN · SECURITY · OPS
```

API keys live only in server env (`server/.env`, git-ignored) — never in frontend code.
