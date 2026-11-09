"""Modelos del dominio del gateway.

No dependen de FastAPI, de HTTP ni de ningún proveedor. Los adaptadores y la
capa HTTP los usan, nunca al revés.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True, slots=True)
class Identity:
    """Identidad resuelta para una petición (usuario o anónimo por IP)."""

    kind: Literal["user", "anon"]
    subject: str
    key: str
    role: str | None = None
    email: str | None = None


@dataclass(frozen=True, slots=True)
class RateRule:
    per_minute: int
    burst: int

    @property
    def rate_per_second(self) -> float:
        return self.per_minute / 60.0

    @property
    def capacity(self) -> float:
        return float(max(1, self.burst))


@dataclass(frozen=True, slots=True)
class RateDecision:
    allowed: bool
    limit: int
    remaining: int
    retry_after: float
    reset_after: float


@dataclass(frozen=True, slots=True)
class ResultadoIA:
    """Respuesta normalizada de cualquier proveedor de IA."""

    content: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    attempts: int
    latency_ms: int
