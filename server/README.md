# Agent Academy API

FastAPI backend for the platform's AI features. **Defaults to a deterministic `fake` provider** —
everything runs free and offline; `/health` always reports which provider is live, and the UI labels
fake output as such. Switching to a real model is one env var.

## Run (local)

```bash
python3 -m venv --without-pip .venv && .venv/bin/python get-pip.py  # or: python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# from the REPOSITORY ROOT (package-style imports):
.venv/bin/python -m uvicorn server.main:app --reload --port 8000
```

## Run (Docker)

```bash
# from the repository root:
docker build -f server/Dockerfile -t agent-academy-api .
docker run --env-file server/.env -p 8000:8000 agent-academy-api
```

## Tests

```bash
.venv/bin/python -m pytest server/tests -q
```

## Providers

| `LLM_PROVIDER` | What you get | Needs |
|---|---|---|
| `fake` (default) | Deterministic heuristics; tests + free demos; honestly labelled | nothing |
| `openai` | Any OpenAI-compatible API (OpenAI, OpenRouter, Groq, vLLM…) | `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`, `LLM_MODEL`) |
| `ollama` | Local open-weight models; data never leaves the machine | `OLLAMA_URL`, `LLM_MODEL` (e.g. `llama3.2`) |

Copy `.env.example` → `.env`. **Keys live only in server env — never in frontend code.**

## Endpoints

- `GET /health` — status + active provider/model
- `POST /api/critique` — Feynman explanation critique (validated structured output, one repair retry)
