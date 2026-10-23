"""Provider-independent LLM interface.

Every feature talks to this protocol; adapters (fake / openai-compatible / ollama)
plug in behind it. This is the layer you will meet again as litellm-style routing
in production systems: one interface, many models, selection by config.
"""
from typing import Protocol


class Provider(Protocol):
    name: str

    def complete(self, system: str, user: str) -> str:
        """Free-text completion."""
        ...

    def complete_json(self, system: str, user: str, schema_hint: str) -> str:
        """Completion expected to be a JSON string matching schema_hint (may raise on transport errors)."""
        ...


class ProviderError(RuntimeError):
    """Transport/configuration failure calling the underlying model."""
