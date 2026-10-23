from .base import Provider, ProviderError
from .fake import FakeProvider


def get_provider() -> Provider:
    """Factory: selection by env — the single place provider choice happens."""
    from .. import config

    if config.LLM_PROVIDER == "openai":
        from .openai_compat import OpenAICompatProvider

        return OpenAICompatProvider()
    if config.LLM_PROVIDER == "ollama":
        from .ollama import OllamaProvider

        return OllamaProvider()
    return FakeProvider()


__all__ = ["Provider", "ProviderError", "FakeProvider", "get_provider"]
