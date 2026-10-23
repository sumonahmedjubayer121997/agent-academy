"""Central env-based configuration. Secrets live ONLY here (server side) — never in frontend code."""
import os

# LLM provider: "fake" (default — deterministic, free, for dev/tests), "openai" (any
# OpenAI-compatible API), or "ollama" (local open-weight models).
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "fake")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# OpenAI-compatible adapter
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

# Ollama adapter
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# CORS origins (comma-separated). Tighten in production.
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]

# Agent safety rails (W6/W7)
MAX_AGENT_STEPS = int(os.getenv("MAX_AGENT_STEPS", "8"))
AGENT_APPROX_TOKEN_BUDGET = int(os.getenv("AGENT_APPROX_TOKEN_BUDGET", "40000"))
RATE_LIMIT_PER_MIN = int(os.getenv("RATE_LIMIT_PER_MIN", "30"))
