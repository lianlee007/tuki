"""Autenticación con Supabase (JWT + JWKS) y modo local sin autenticación.

Política:
- ``auth_mode=disabled``: identidad por IP. Solo para desarrollo.
- ``auth_mode=supabase``:
    * token válido con rol ``authenticated`` -> cuota por usuario;
    * token válido con rol ``anon`` o sin token -> cuota anónima por IP
      (necesario para la corrección de barrio del carrito público);
    * token inválido -> 401, nunca se degrada silenciosamente a anónimo.

La clave ``anon`` de Supabase es pública por diseño y ya viaja en el bundle,
así que permitir tráfico anónimo no añade exposición nueva; el objetivo real es
sacar ``GROQ_API_KEY`` del navegador y poder limitar el abuso por IP.
"""

from __future__ import annotations

import ipaddress
import threading

import jwt
from fastapi import Request
from jwt import PyJWKClient

from app.config import Settings
from app.dominio.modelos import Identity

_JWK_CLIENTS: dict[str, PyJWKClient] = {}
_JWK_LOCK = threading.Lock()


class AuthError(Exception):
    def __init__(
        self,
        message: str,
        *,
        code: str = "invalid_token",
        status_code: int = 401,
        reason: str = "invalid_token",
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.reason = reason


def get_jwk_client(settings: Settings) -> PyJWKClient:
    uri = settings.supabase_jwks_url
    with _JWK_LOCK:
        client = _JWK_CLIENTS.get(uri)
        if client is None:
            client = PyJWKClient(
                uri,
                cache_jwk_set=True,
                lifespan=settings.jwks_cache_seconds,
                timeout=5,
            )
            _JWK_CLIENTS[uri] = client
        return client


def clear_jwk_cache() -> None:
    """Solo para pruebas: obliga a reconstruir el cliente JWKS."""
    with _JWK_LOCK:
        _JWK_CLIENTS.clear()


def verify_supabase_jwt(token: str, settings: Settings) -> dict:
    try:
        signing_key = get_jwk_client(settings).get_signing_key_from_jwt(token)
    except jwt.InvalidTokenError as exc:
        # Token mal formado: no se consulta la red ni se degrada a anónimo.
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        ) from exc
    except jwt.PyJWKClientError as exc:
        raise AuthError(
            "No se pudo validar la sesión en este momento. Inténtalo de nuevo.",
            code="auth_unavailable",
            status_code=503,
            reason="jwks_unavailable",
        ) from exc

    try:
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=settings.algorithms,
            audience=settings.supabase_audience or None,
            issuer=settings.supabase_issuer or None,
            options={"require": ["exp", "iat"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthError(
            "Tu sesión expiró. Vuelve a iniciar sesión.",
            code="token_expired",
            reason="expired",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        ) from exc


def client_ip(request: Request, settings: Settings) -> str:
    """Obtiene la IP real. Nginx sobrescribe X-Real-IP; no se confía en XFF crudo."""
    if settings.trust_proxy_headers:
        candidate = request.headers.get("x-real-ip", "").strip()
        if not candidate:
            forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
            candidate = forwarded
        if candidate:
            try:
                return ipaddress.ip_address(candidate).compressed
            except ValueError:
                pass
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def resolve_identity(
    request: Request,
    authorization: str | None,
    settings: Settings,
) -> Identity:
    if settings.auth_mode == "disabled":
        ip = client_ip(request, settings)
        return Identity(kind="anon", subject=f"ip:{ip}", key=f"ip:{ip}", role="disabled")

    token = ""
    if authorization:
        scheme, _, value = authorization.partition(" ")
        if scheme.lower() == "bearer" and value.strip():
            token = value.strip()

    if not token:
        if not settings.allow_anon:
            raise AuthError(
                "Inicia sesión para usar la IA.",
                code="auth_required",
                reason="missing_token",
            )
        ip = client_ip(request, settings)
        return Identity(kind="anon", subject=f"ip:{ip}", key=f"ip:{ip}", role="anon")

    claims = verify_supabase_jwt(token, settings)
    role = str(claims.get("role", ""))
    subject = str(claims.get("sub", ""))
    email = claims.get("email")

    if role == "authenticated" and subject:
        return Identity(
            kind="user",
            subject=subject,
            key=f"user:{subject}",
            role=role,
            email=str(email) if email else None,
        )

    if role == "anon":
        if not settings.allow_anon:
            raise AuthError(
                "Inicia sesión para usar la IA.",
                code="auth_required",
                reason="anon_not_allowed",
            )
        ip = client_ip(request, settings)
        return Identity(kind="anon", subject=f"ip:{ip}", key=f"ip:{ip}", role="anon")

    raise AuthError(
        "La sesión no tiene permiso para usar la IA.",
        code="forbidden",
        status_code=403,
        reason="invalid_role",
    )
