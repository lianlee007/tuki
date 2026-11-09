"""Cliente de Groq con timeouts, reintentos y fallback entre modelos.

El navegador ya no conoce la clave. El gateway decide el modelo, reintenta
errores transitorios (429/5xx/red) y pasa al siguiente modelo si el actual no
está disponible en la cuenta.
"""

from __future__ import annotations

import asyncio
import logging
import random
import re
import time

import httpx

from app.config import Settings
from app.dominio.errores import ErrorIA
from app.dominio.modelos import ResultadoIA
from app.observability import TOKENS, UPSTREAM_DURATION, UPSTREAM_REQUESTS

logger = logging.getLogger(__name__)

_SALIDA_CODIGO = re.compile(r"```[a-z]*\s*|```", re.IGNORECASE)
_SALIDA_ETIQUETA = re.compile(
    r"^\s*(eslogan|descripci[oó]n|nombre|categor[ií]a|ingredientes|respuesta|resultado)"
    r"\s*:\s*",
    re.IGNORECASE,
)
_COMILLAS = "\"'“”«»"


class GroqError(ErrorIA):
    """Error devuelto por el adaptador de Groq."""


def limpiar_salida(texto: str) -> str:
    texto = _SALIDA_CODIGO.sub("", texto)
    texto = _SALIDA_ETIQUETA.sub("", texto)
    return texto.strip().strip(_COMILLAS).strip()


def _retry_after_seconds(response: httpx.Response) -> float | None:
    raw = response.headers.get("retry-after", "").strip()
    if not raw:
        return None
    try:
        return max(0.0, float(raw))
    except ValueError:
        return None


def _upstream_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return ""
    error = payload.get("error") if isinstance(payload, dict) else None
    if isinstance(error, dict):
        return str(error.get("message", ""))[:300]
    return ""


class GroqClient:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self._settings = settings
        self._client = client
        self._url = f"{settings.groq_base_url}/chat/completions"

    async def generate(
        self,
        *,
        prompt: str,
        system: str,
        temperature: float,
        max_tokens: int,
        request_id: str,
    ) -> ResultadoIA:
        if not self._settings.groq_key_configured:
            raise GroqError(
                "La IA no está configurada en el servidor.",
                status_code=503,
                code="ai_not_configured",
            )

        max_tokens = min(max_tokens, self._settings.max_output_tokens)
        started = time.perf_counter()
        deadline = started + self._settings.groq_total_timeout_seconds
        last_error = "La IA no está disponible en este momento."
        timed_out = False

        for model in self._settings.models:
            if timed_out:
                break
            for attempt in range(1, self._settings.groq_max_attempts + 1):
                remaining = deadline - time.monotonic()
                if remaining <= 0.5:
                    last_error = "La IA tardó demasiado en responder. Inténtalo de nuevo."
                    timed_out = True
                    break
                try:
                    response = await self._client.post(
                        self._url,
                        headers={
                            "Authorization": (
                                "Bearer "
                                f"{self._settings.groq_api_key.get_secret_value()}"
                            ),
                            "Content-Type": "application/json",
                            "X-Request-Id": request_id,
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": prompt},
                            ],
                            "temperature": max(0.0, min(2.0, temperature)),
                            "max_tokens": max_tokens,
                            "top_p": 1,
                            "stream": False,
                        },
                        timeout=httpx.Timeout(
                            connect=min(5.0, remaining),
                            read=remaining,
                            write=min(10.0, remaining),
                            pool=min(5.0, remaining),
                        ),
                    )
                except httpx.HTTPError as exc:
                    UPSTREAM_REQUESTS.labels(model=model, outcome="network_error").inc()
                    last_error = "No se pudo contactar al proveedor de IA."
                    logger.warning(
                        "groq_network_error",
                        extra={
                            "event": "upstream_error",
                            "model": model,
                            "attempt": attempt,
                            "error": str(exc)[:200],
                        },
                    )
                    if attempt < self._settings.groq_max_attempts:
                        await self._sleep(attempt)
                        continue
                    break

                if response.status_code == 200:
                    parsed = self._parse_success(response, model, attempt, started)
                    if parsed is not None:
                        return parsed
                    last_error = "La IA no devolvió contenido."
                    UPSTREAM_REQUESTS.labels(model=model, outcome="empty").inc()
                    break

                upstream_message = _upstream_message(response)
                logger.warning(
                    "groq_upstream_error",
                    extra={
                        "event": "upstream_error",
                        "model": model,
                        "attempt": attempt,
                        "status": response.status_code,
                        "upstream": upstream_message,
                    },
                )

                if response.status_code in (401, 403):
                    UPSTREAM_REQUESTS.labels(model=model, outcome="auth_error").inc()
                    raise GroqError(
                        "La clave del proveedor de IA no es válida.",
                        status_code=502,
                        code="ai_auth_error",
                    )

                # Modelo inexistente o retirado: no tiene sentido insistir.
                if response.status_code == 404 or (
                    response.status_code == 400 and "model" in upstream_message.lower()
                ):
                    UPSTREAM_REQUESTS.labels(model=model, outcome="model_unavailable").inc()
                    last_error = "Ningún modelo de IA está disponible en la cuenta."
                    break

                if response.status_code == 429 or response.status_code >= 500:
                    outcome = "rate_limited" if response.status_code == 429 else "server_error"
                    UPSTREAM_REQUESTS.labels(model=model, outcome=outcome).inc()
                    last_error = (
                        "La IA está recibiendo demasiadas solicitudes."
                        if response.status_code == 429
                        else "El proveedor de IA falló temporalmente."
                    )
                    if attempt < self._settings.groq_max_attempts:
                        await self._sleep(attempt, _retry_after_seconds(response))
                        continue
                    break

                UPSTREAM_REQUESTS.labels(model=model, outcome="client_error").inc()
                last_error = "La solicitud a la IA no es válida."
                break

        logger.error(
            "groq_exhausted",
            extra={
                "event": "upstream_exhausted",
                "models": ",".join(self._settings.models),
                "detail": last_error,
            },
        )
        if timed_out:
            raise GroqError(
                last_error,
                status_code=504,
                code="ai_timeout",
            )
        raise GroqError(
            last_error,
            status_code=429 if "demasiadas" in last_error else 502,
            code="ai_rate_limited" if "demasiadas" in last_error else "ai_unavailable",
            retry_after=5 if "demasiadas" in last_error else None,
        )

    async def _sleep(self, attempt: int, retry_after: float | None = None) -> None:
        base = self._settings.groq_backoff_seconds * (2 ** (attempt - 1))
        delay = base * (0.7 + random.random() * 0.6)
        if retry_after is not None:
            delay = max(delay, retry_after)
        delay = min(delay, self._settings.groq_max_backoff_seconds)
        if delay > 0:
            await asyncio.sleep(delay)

    def _parse_success(
        self,
        response: httpx.Response,
        model: str,
        attempt: int,
        started: float,
    ) -> ResultadoIA | None:
        try:
            payload = response.json()
        except ValueError:
            return None

        choices = payload.get("choices") or []
        raw = ""
        if choices and isinstance(choices[0], dict):
            raw = str((choices[0].get("message") or {}).get("content") or "")
        content = limpiar_salida(raw)
        if not content:
            return None

        usage = payload.get("usage") or {}
        prompt_tokens = int(usage.get("prompt_tokens") or 0)
        completion_tokens = int(usage.get("completion_tokens") or 0)
        total_tokens = int(usage.get("total_tokens") or prompt_tokens + completion_tokens)

        latency = time.perf_counter() - started
        UPSTREAM_REQUESTS.labels(model=model, outcome="success").inc()
        UPSTREAM_DURATION.labels(model=model).observe(latency)
        TOKENS.labels(model=model, kind="prompt").inc(prompt_tokens)
        TOKENS.labels(model=model, kind="completion").inc(completion_tokens)

        return ResultadoIA(
            content=content,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            attempts=attempt,
            latency_ms=int(latency * 1000),
        )
