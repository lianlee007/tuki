"""Logs JSON, métricas Prometheus y trazas OpenTelemetry opcionales."""

from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar
from datetime import UTC, datetime

from prometheus_client import Counter, Gauge, Histogram

from app.config import Settings

_REQUEST_ID: ContextVar[str] = ContextVar("request_id", default="")

_STANDARD_LOG_KEYS = {
    "name",
    "msg",
    "args",
    "levelname",
    "levelno",
    "pathname",
    "filename",
    "module",
    "exc_info",
    "exc_text",
    "stack_info",
    "lineno",
    "funcName",
    "created",
    "msecs",
    "relativeCreated",
    "thread",
    "threadName",
    "processName",
    "process",
    "taskName",
    "message",
    "asctime",
}

HTTP_REQUESTS = Counter(
    "ai_gateway_http_requests_total",
    "Peticiones HTTP atendidas por el gateway.",
    ["method", "route", "status"],
)
HTTP_DURATION = Histogram(
    "ai_gateway_http_request_duration_seconds",
    "Latencia de las peticiones HTTP.",
    ["method", "route"],
    buckets=(0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30),
)
HTTP_INFLIGHT = Gauge(
    "ai_gateway_http_inflight_requests",
    "Peticiones en curso.",
)
UPSTREAM_REQUESTS = Counter(
    "ai_gateway_upstream_requests_total",
    "Intentos contra Ollama por modelo y resultado.",
    ["model", "outcome"],
)
UPSTREAM_DURATION = Histogram(
    "ai_gateway_upstream_duration_seconds",
    "Latencia de las llamadas a Ollama.",
    ["model"],
    buckets=(0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30, 60, 120),
)
TOKENS = Counter(
    "ai_gateway_tokens_total",
    "Tokens consumidos en Ollama.",
    ["model", "kind"],
)
RATE_LIMITED = Counter(
    "ai_gateway_rate_limited_total",
    "Peticiones rechazadas por rate limit.",
    ["identity_type"],
)
AUTH_FAILURES = Counter(
    "ai_gateway_auth_failures_total",
    "Fallos de autenticación.",
    ["reason"],
)


def set_request_id(value: str) -> object:
    return _REQUEST_ID.set(value)


def reset_request_id(token: object) -> None:
    _REQUEST_ID.reset(token)  # type: ignore[arg-type]


def current_request_id() -> str:
    return _REQUEST_ID.get()


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, object] = {
            "ts": datetime.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        request_id = current_request_id()
        if request_id:
            payload["request_id"] = request_id
        for key, value in record.__dict__.items():
            if key not in _STANDARD_LOG_KEYS and not key.startswith("_"):
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


def setup_logging(level: str = "INFO") -> None:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(getattr(logging, level, logging.INFO))

    for name in ("uvicorn", "uvicorn.error"):
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True

    access = logging.getLogger("uvicorn.access")
    access.handlers.clear()
    access.propagate = False


def setup_telemetry(settings: Settings) -> bool:
    """Configura OTLP si las dependencias opcionales están instaladas."""
    if not settings.otel_enabled:
        return False
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError:
        logging.getLogger(__name__).warning(
            "AI_OTEL_ENABLED=true pero faltan las dependencias de OpenTelemetry; "
            "se continúa solo con métricas Prometheus."
        )
        return False

    provider = TracerProvider(
        resource=Resource.create({"service.name": settings.otel_service_name})
    )
    exporter_kwargs = {}
    if settings.otel_endpoint:
        exporter_kwargs["endpoint"] = settings.otel_endpoint
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(**exporter_kwargs)))
    trace.set_tracer_provider(provider)
    return True


def instrument_fastapi(app) -> None:  # noqa: ANN001
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    except ImportError:
        return
    FastAPIInstrumentor.instrument_app(app)


def instrument_httpx(client) -> None:  # noqa: ANN001
    try:
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    except ImportError:
        return
    HTTPXClientInstrumentor().instrument_client(client)
