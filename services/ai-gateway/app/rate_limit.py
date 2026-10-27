"""Compatibilidad: el limitador vive en ``app.adaptadores.memoria``.

``RateRule`` y ``RateDecision`` son modelos del dominio.
"""

from app.adaptadores.memoria import RateLimiter
from app.dominio.modelos import RateDecision, RateRule

__all__ = ["RateDecision", "RateLimiter", "RateRule"]
