"""Rate limit en memoria con token bucket.

Ventajas: cero dependencias y suficiente para una primera fase. Limitación
conocida: cada réplica tiene su propio contador, así que la cuota efectiva se
multiplica por el número de pods. Para producción multirréplica estricta se
recomienda Redis (ver docs/runbook.md); la interfaz de esta clase está pensada
para sustituirse sin tocar los endpoints.
"""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass

from app.config import Settings
from app.dominio.modelos import RateDecision, RateRule


@dataclass(slots=True)
class _Bucket:
    tokens: float
    updated_at: float


class RateLimiter:
    def __init__(self, rules: dict[str, RateRule], *, stale_seconds: float = 600.0) -> None:
        self._rules = rules
        self._buckets: dict[tuple[str, str], _Bucket] = {}
        self._lock = threading.Lock()
        self._stale_seconds = stale_seconds
        self._last_gc: float | None = None

    @classmethod
    def from_settings(cls, settings: Settings) -> RateLimiter:
        return cls(
            {
                "user": RateRule(
                    per_minute=settings.rate_limit_auth_per_minute,
                    burst=settings.rate_limit_auth_burst,
                ),
                "anon": RateRule(
                    per_minute=settings.rate_limit_anon_per_minute,
                    burst=settings.rate_limit_anon_burst,
                ),
            }
        )

    def check(self, kind: str, key: str, *, now: float | None = None) -> RateDecision:
        rule = self._rules.get(kind) or self._rules["anon"]
        current = time.monotonic() if now is None else now

        with self._lock:
            self._maybe_gc(current)
            bucket_key = (kind, key)
            bucket = self._buckets.get(bucket_key)
            if bucket is None:
                bucket = _Bucket(tokens=rule.capacity, updated_at=current)
                self._buckets[bucket_key] = bucket

            elapsed = max(0.0, current - bucket.updated_at)
            bucket.tokens = min(rule.capacity, bucket.tokens + elapsed * rule.rate_per_second)
            bucket.updated_at = current

            if bucket.tokens >= 1.0:
                bucket.tokens -= 1.0
                return RateDecision(
                    allowed=True,
                    limit=int(rule.capacity),
                    remaining=int(bucket.tokens),
                    retry_after=0.0,
                    reset_after=0.0,
                )

            missing = 1.0 - bucket.tokens
            retry_after = missing / rule.rate_per_second
            return RateDecision(
                allowed=False,
                limit=int(rule.capacity),
                remaining=0,
                retry_after=retry_after,
                reset_after=(rule.capacity - bucket.tokens) / rule.rate_per_second,
            )

    def _maybe_gc(self, now: float) -> None:
        if self._last_gc is None:
            self._last_gc = now
            return
        if now - self._last_gc < 300:
            return
        self._last_gc = now
        cutoff = now - self._stale_seconds
        stale = [key for key, bucket in self._buckets.items() if bucket.updated_at < cutoff]
        for key in stale:
            self._buckets.pop(key, None)
        # Protección ante memoria ilimitada si llega una avalancha de IPs.
        if len(self._buckets) > 20_000:
            self._buckets.clear()

    @property
    def size(self) -> int:
        with self._lock:
            return len(self._buckets)
