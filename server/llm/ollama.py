"""Ollama adapter — local open-weight models, zero API cost, data never leaves the machine."""
from __future__ import annotations

import ipaddress
import os
import socket
from urllib.parse import urlparse

import httpx

from .. import config
from .base import ProviderError

# Local Ollama listens on a loopback or compose-network address by design. Because
# OLLAMA_URL is operator-editable, the adapter validates every target before the
# request: http/https only, and loopback/private/reserved/link-local hosts refused
# unless the deployment explicitly opts in for a local model.
ALLOW_LOCAL_TARGET = os.getenv("OLLAMA_ALLOW_LOCAL", "").lower() in {"1", "true", "yes"}


def _is_disallowed_host(host: str) -> bool:
    """True for hostnames/ips that must not be requested without the local opt-in."""
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        return (
            addr.is_loopback
            or addr.is_private
            or addr.is_reserved
            or addr.is_link_local
            or addr.is_unspecified
        )
    try:
        infos = socket.getaddrinfo(host, None)
    except OSError:
        return True  # unresolvable host: refuse rather than fire the request
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (
            ip.is_loopback
            or ip.is_private
            or ip.is_reserved
            or ip.is_link_local
            or ip.is_unspecified
        ):
            return True
    return False


def _validated(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ProviderError(f"ollama target must be http(s), got {parsed.scheme!r}")
    host = parsed.hostname or ""
    if not host:
        raise ProviderError("ollama target URL has no host")
    if not ALLOW_LOCAL_TARGET and _is_disallowed_host(host):
        raise ProviderError(
            "ollama target refuses local/private/reserved hosts — "
            "set OLLAMA_ALLOW_LOCAL=1 to target a local model"
        )
    return url


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
            resp = httpx.post(
                _validated(f"{config.OLLAMA_URL.rstrip('/')}/api/chat"),
                json=body,
                timeout=120,
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]
        except httpx.HTTPError as e:
            raise ProviderError(f"ollama call failed: {e}") from e

    def complete(self, system: str, user: str) -> str:
        return self._chat(system, user, json_mode=False)

    def complete_json(self, system: str, user: str, schema_hint: str) -> str:
        system = f"{system}\nReply with ONLY a JSON object matching this shape:\n{schema_hint}"
        return self._chat(system, user, json_mode=True)
