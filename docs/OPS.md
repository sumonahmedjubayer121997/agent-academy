# Ops Runbook — Agent Academy

## Components

| Service | What | Where |
|---|---|---|
| Frontend | React SPA (this repo, `src/`) | Vercel: https://agent-academy-peach.vercel.app (manual `npx vercel deploy --prod` until Git integration is connected) |
| API | FastAPI (`server/`) | local / Docker; no cloud host yet |

## Frontend deploy

```bash
npx vercel deploy --prod        # from repo root (already linked)
```
To enable auto-deploy on push: Vercel → project → Settings → Git → connect the repo.

## API run

```bash
# local (repo root)
server/.venv/bin/python -m uvicorn server.main:app --port 8000

# docker
docker compose up -d            # api on :8000 (add --profile ollama for local models)
```

## Configuration (all env — see server/.env.example)

| Var | Default | Notes |
|---|---|---|
| `LLM_PROVIDER` | `fake` | `openai` / `ollama` for real models |
| `LLM_MODEL` | `gpt-4o-mini` | any model your provider serves |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` | — | only for `openai` provider |
| `ALLOWED_ORIGINS` | `*` | tighten to the Vercel URL in production |
| `RATE_LIMIT_PER_MIN` | 30 | per-IP sliding window |
| `MAX_AGENT_STEPS` / `AGENT_APPROX_TOKEN_BUDGET` | 8 / 40000 | runaway protection |

## Health & logs

- `GET /health` → `{status, provider, model}` — the frontend shows backend state from this.
- Logs are JSON lines (`event=request path=… status=… ms=…`, `event=agent_run run_id=… status=… steps=…`) — grep-able and ready for any log shipper.

## Costs (with a real provider)

- Critique: ~1k tokens/call — well under $0.01 on a mini-tier model.
- Agent run: bounded by `MAX_AGENT_STEPS` × history growth; the fake provider costs $0.
- Rate limit is the primary cost brake; set it lower if worried.

## Failure playbook

| Symptom | Check | Fix |
|---|---|---|
| UI shows "backend offline" | `curl :8000/health` | start/restart the API |
| 502 provider unavailable | `/health` provider + key env | fix `LLM_PROVIDER`/credentials |
| 429s in normal use | burst client or loop | check logs; raise `RATE_LIMIT_PER_MIN` only if justified |
| `server/data/content.json` missing | export step skipped | `node --experimental-strip-types scripts/export-content.mjs` |
| Agent runs vanish after restart | in-memory by design | re-run; move to a store when persistence matters |

## Test gates before any deploy

```bash
npm test && npm run build                 # frontend (vitest 29 + typecheck + bundle)
server/.venv/bin/python -m pytest server/tests -q   # backend (critique, RAG evals, agent, rate limit)
```
