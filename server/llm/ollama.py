"""Ollama adapter — local open-weight models, zero API cost, data never leaves the machine."""
from __future__ import annotations

import httpx

from .. import config
from .base import ProviderError


class OllamaProvider:
    def __init__(self) -> None:
        self.name = f"ollama:{config.LLM_MODEL}"

    def _chat(self, system: str, user: str, json_mode: bool) -> str:
        body: dict = {
            "model": config.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
        }
        if json_mode:
            body["format"] = "json"
        try:
            resp = httpx.post(f"{config.OLLAMA_URL.rstrip('/')}/api/chat", json=body, timeout=120)
            resp.raise_for_status()
            return resp.json()["message"]["content"]
        except httpx.HTTPError as e:
            raise ProviderError(f"ollama call failed: {e}") from e

    def complete(self, system: str, user: str) -> str:
        return self._chat(system, user, json_mode=False)

    def complete_json(self, system: str, user: str, schema_hint: str) -> str:
        system = f"{system}\nReply with ONLY a JSON object matching this shape:\n{schema_hint}"
        return self._chat(system, user, json_mode=True)
