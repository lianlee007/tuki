"""Manejadores de error del gateway.

Todos los errores salen con la misma forma:
``{"detail": {"code", "message"}, "request_id"}`` para que la SPA no tenga que
distinguir entre un fallo de validación, de cuota o de Groq.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.dominio.errores import ErrorIA
from app.observability import current_request_id

logger = logging.getLogger(__name__)


def error_content(code: str, message: str) -> dict:
    return {
        "detail": {"code": code, "message": message},
        "request_id": current_request_id(),
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ErrorIA)
    async def ai_error_handler(request: Request, exc: ErrorIA) -> JSONResponse:
        headers = None
        if exc.retry_after:
            headers = {"Retry-After": str(exc.retry_after)}
        logger.warning(
            "ai_request_failed",
            extra={
                "event": "ai_error",
                "code": exc.code,
                "status": exc.status_code,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_content(exc.code, exc.message),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        location = ".".join(str(part) for part in first.get("loc", []) if part != "body")
        message = str(first.get("msg", "La solicitud no es válida."))
        return JSONResponse(
            status_code=422,
            content=error_content(
                "validation_error",
                f"{location}: {message}" if location else message,
            ),
        )

    @app.exception_handler(HTTPException)
    async def http_handler(request: Request, exc: HTTPException) -> JSONResponse:
        detail = exc.detail
        if isinstance(detail, dict):
            code = str(detail.get("code", "http_error"))
            message = str(detail.get("message", "Error"))
        else:
            code = "http_error"
            message = str(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=error_content(code, message),
            headers=exc.headers,
        )

    @app.exception_handler(Exception)
    async def unexpected_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled_error",
            extra={"event": "unhandled_error", "path": request.url.path},
        )
        return JSONResponse(
            status_code=500,
            content=error_content(
                "internal_error",
                "Ocurrió un error inesperado. Inténtalo de nuevo.",
            ),
        )
