"""Puertos del gateway: contratos que el núcleo necesita y los adaptadores
implementan.

Son ``Protocol`` para no obligar a heredar de una clase base: cualquier objeto
con la firma correcta sirve, incluido un doble de prueba.
"""

from __future__ import annotations

from typing import Protocol

from app.dominio.modelos import Identity, RateDecision, ResultadoIA


class ProveedorIA(Protocol):
    """Proveedor de generación de texto (Groq u otro intercambiable)."""

    async def generate(
        self,
        *,
        prompt: str,
        system: str,
        temperature: float,
        max_tokens: int,
        request_id: str,
    ) -> ResultadoIA: ...


class Limitador(Protocol):
    """Control de cuota por identidad."""

    def check(
        self, kind: str, key: str, *, now: float | None = None
    ) -> RateDecision: ...


class VerificadorIdentidad(Protocol):
    """Traduce una petición HTTP a una identidad de dominio."""

    def __call__(
        self, request: object, authorization: str | None, settings: object
    ) -> Identity: ...
