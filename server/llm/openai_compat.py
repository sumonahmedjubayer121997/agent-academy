"""OpenAI-compatible adapter (works with OpenAI, OpenRouter, Groq, Together, vLLM servers…).

Uses raw httpx instead of a vendor SDK — one less dependency and the same code path
for every compatible endpoint. The API key is read from config (server env) only.
"""
from __future__ import annotations

import httpx

from .. import config
from .base import ProviderError


class OpenAICompatProvider:
    def __init__(self) -> None:
        if not config.OPENAI_API_KEY:
            raise ProviderError("OPENAI_API_KEY is not set — cannot use the openai provider.")
        self.name = f"openai-compatible:{config.LLM_MODEL}"

    def _chat(self, system: str, user: str, json_mode: bool) -> str:
        body: dict = {
            "model": config.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        try:
            resp = httpx.post(
                f"{config.OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
                json=body,
                timeout=60,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except httpx.HTTPError as e:
            raise ProviderError(f"provider call failed: {e}") from e

    def complete(self, system: str, user: str) -> str:
        return self._chat(system, user, json_mode=False)

    def complete_json(self, system: str, user: str, schema_hint: str) -> str:
        system = f"{system}\nReply with ONLY a JSON object matching this shape:\n{schema_hint}"
        return self._chat(system, user, json_mode=True)
