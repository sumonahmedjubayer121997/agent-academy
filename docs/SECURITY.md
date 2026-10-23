# Security Review — Agent Academy backend

Scope: `server/` (the AI surface). Frontend holds no secrets by design — all model
access goes through the API. Written per build-plan W7; revisit at every phase.

## Trust boundaries

```
Browser (untrusted UI, no secrets)  →  FastAPI (trusted)  →  LLM provider (external)
                                          │
                                          └→ Tools (calculator/time/fetch/gated email)
```

The model is NOT inside the trust boundary: everything it "says" is untrusted output
until validated. Tool execution is the privilege boundary.

## Threat model & mitigations (shipped)

| Threat | Mitigation in place |
|---|---|
| **Direct prompt injection** (user crafts input to hijack the agent) | Tools are least-privilege by construction; the loop cannot execute anything not in the registry; responses validated as JSON; step + token budgets stop runaway loops |
| **Indirect injection** (malicious text inside fetched pages) | `fetch_page` is read-only, bounded (600 chars), results are observations only — fetched content can influence the model but can never execute tools the model can't already call; the irreversible tool still gates |
| **Irreversible action abuse** | `send_email` is marked destructive and HARD-gated server-side (`awaiting_approval` → human decision). Rejection ends the run; the model cannot retry a rejected action |
| **Code execution via "calculator"** | AST whitelist (numbers, `+ - * / % **`) — no names, no calls, no `eval`. Verified by tests (`__import__`, `open` both fail) |
| **Cost/resource abuse** | Per-IP sliding-window rate limit (default 30 req/min, `/health` exempt), per-run step budget, per-run approx-token budget |
| **Secret exposure** | Keys only in server env (`server/.env`, git-ignored); `.env.example` carries no values; frontend never sees provider config beyond the provider *name* |
| **Unbounded fetch (bandwidth/SSRF-ish)** | `fetch_page` is https-only-by-convention, 15s timeout, truncated output. **Known gap:** no hostname allowlist yet — add before exposing publicly |
| **Validation attacks** | Pydantic bounds on every endpoint (lengths, types); 422s before any model call |

## Known gaps (deliberate, documented — close before public exposure)

1. **No authentication** — single-user assumption. Add auth + per-user state before any multi-user use (build-plan W7+).
2. **In-memory run state** — agent runs and rate buckets reset on restart; fine for a demo, not for scale (move to Redis/Postgres).
3. **No TLS termination** — assume a reverse proxy / platform (Railway, Fly, Caddy) provides HTTPS.
4. **`fetch_page` allowlist** — see above.
5. **Fake provider honesty** — `/health` and every UI surface label the provider; never present fake output as model intelligence.

## Red-team checklist (run before each deploy)

- [ ] `calculator("__import__('os')")` → tool error (test covers)
- [ ] Agent requesting `send_email` → gate; reject → run ends, nothing sent (test covers)
- [ ] 31 rapid requests → 429 (test covers)
- [ ] No secret in client bundle: `grep -r "sk-\|API_KEY" dist/` → empty
- [ ] `/health` reports the provider you expect
