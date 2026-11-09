"""Autenticación con Supabase (JWT + JWKS) y modo local sin autenticación.

Política:
- ``auth_mode=disabled``: identidad por IP. Solo para desarrollo.
- ``auth_mode=supabase``:
    * token válido con rol ``authenticated`` -> cuota por usuario;
    * token válido con rol ``anon`` o sin token -> cuota anónima por IP
      (necesario para la corrección de barrio del carrito público);
    * token inválido -> 401, nunca se degrada silenciosamente a anónimo.
- ``auth_mode=local``: valida el JWT HS256 que emite ``identidad-service``.
    * roles ``cliente``, ``dueno`` o ``superadmin`` -> cuota por usuario;
    * sin token -> cuota anónima si ``allow_anon``;
    * token inválido -> 401.

La clave ``anon`` de Supabase es pública por diseño y ya viaja en el bundle,
así que permitir tráfico anónimo no añade exposición nueva; el objetivo real es
sacar ``GROQ_API_KEY`` del navegador y poder limitar el abuso por IP.
"""

from __future__ import annotations

import hashlib
import ipaddress
import threading
import time

import httpx
import jwt
from fastapi import Request
from jwt import PyJWKClient

from app.config import Settings
from app.dominio.modelos import Identity

_JWK_CLIENTS: dict[str, PyJWKClient] = {}
_JWK_LOCK = threading.Lock()

# Caché de tokens HS256 ya validados contra GoTrue. Evita una llamada de red por
# cada petición de la SPA sin guardar el token en claro: la clave es su hash.
_LEGACY_CACHE: dict[str, tuple[dict, float]] = {}
_LEGACY_LOCK = threading.Lock()
_LEGACY_CACHE_MAX = 512


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


def clear_legacy_cache() -> None:
    """Solo para pruebas: vacía la caché de tokens HS256."""
    with _LEGACY_LOCK:
        _LEGACY_CACHE.clear()


def _token_algorithm(token: str) -> str:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        ) from exc
    return str(header.get("alg", ""))


def _legacy_cache_key(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _legacy_cache_get(key: str) -> dict | None:
    now = time.monotonic()
    with _LEGACY_LOCK:
        entry = _LEGACY_CACHE.get(key)
        if entry is None:
            return None
        claims, expires_at = entry
        if expires_at <= now:
            _LEGACY_CACHE.pop(key, None)
            return None
        return claims


def _legacy_cache_put(key: str, claims: dict, ttl: float) -> None:
    if ttl <= 0:
        return
    with _LEGACY_LOCK:
        if len(_LEGACY_CACHE) >= _LEGACY_CACHE_MAX:
            # Descarte barato: la memoria no debe crecer con cada token visto.
            _LEGACY_CACHE.clear()
        _LEGACY_CACHE[key] = (claims, time.monotonic() + ttl)


def verify_legacy_token(token: str, settings: Settings) -> dict:
    """Valida un JWT HS256 contra GoTrue.

    Los proyectos de Supabase creados antes de las claves asimétricas firman con
    HS256 y su JWKS queda vacío. En lugar de repartir el secreto del proyecto,
    se pregunta a Supabase por el usuario del token con la clave pública `anon`:
    el propio GoTrue comprueba la firma y la caducidad.
    """
    key = _legacy_cache_key(token)
    cached = _legacy_cache_get(key)
    if cached is not None:
        return cached

    anon_key = settings.supabase_anon_key.get_secret_value().strip()
    if not anon_key or not settings.supabase_userinfo_url:
        raise AuthError(
            "No se pudo validar la sesión en este momento. Inténtalo de nuevo.",
            code="auth_unavailable",
            status_code=503,
            reason="legacy_unavailable",
        )

    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get(
                settings.supabase_userinfo_url,
                headers={
                    "apikey": anon_key,
                    "Authorization": f"Bearer {token}",
                },
            )
    except httpx.HTTPError as exc:
        raise AuthError(
            "No se pudo validar la sesión en este momento. Inténtalo de nuevo.",
            code="auth_unavailable",
            status_code=503,
            reason="gotrue_unavailable",
        ) from exc

    if response.status_code in (401, 403):
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        )
    if response.status_code >= 500:
        raise AuthError(
            "No se pudo validar la sesión en este momento. Inténtalo de nuevo.",
            code="auth_unavailable",
            status_code=503,
            reason="gotrue_unavailable",
        )
    if response.status_code != 200:
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        )

    try:
        user = response.json()
    except ValueError as exc:
        raise AuthError(
            "No se pudo validar la sesión en este momento. Inténtalo de nuevo.",
            code="auth_unavailable",
            status_code=503,
            reason="gotrue_bad_response",
        ) from exc

    subject = str(user.get("id") or "").strip()
    if not subject:
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        )

    claims = {
        "sub": subject,
        "role": str(user.get("role") or "authenticated"),
        "email": user.get("email"),
        "aud": user.get("aud"),
    }
    _legacy_cache_put(key, claims, float(settings.legacy_token_cache_seconds))
    return claims


def verify_supabase_jwt(token: str, settings: Settings) -> dict:
    if _token_algorithm(token).startswith("HS"):
        return verify_legacy_token(token, settings)
    try:
        signing_key = get_jwk_client(settings).get_signing_key_from_jwt(token)
    except jwt.InvalidTokenError as exc:
        # Token mal formado: no se consulta la red ni se degrada a anónimo.
        raise AuthError(
            "La sesión no es válida. Vuelve a iniciar sesión.",
            reason="invalid",
        ) from exc
    except (jwt.PyJWKClientError, jwt.exceptions.PyJWKSetError) as exc:
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


def verify_local_jwt(token: str, settings: Settings) -> dict:
    """Valida el JWT HS256 emitido por identidad-service."""
    secreto = settings.jwt_secreto.get_secret_value().strip()
    if not secreto:
        raise AuthError(
            "La autenticación no está configurada.",
            code="auth_unavailable",
            status_code=503,
            reason="local_unavailable",
        )
    try:
        return jwt.decode(
            token,
            secreto,
            algorithms=["HS256"],
            audience=settings.jwt_audiencia or None,
            issuer=settings.jwt_emisor or None,
            options={"require": ["exp", "iat", "sub"]},
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

    if settings.auth_mode == "local":
        claims = verify_local_jwt(token, settings)
        role = str(claims.get("rol") or claims.get("role") or "")
        subject = str(claims.get("sub") or "")
        email = claims.get("email")
        if subject and role in {"cliente", "dueno", "superadmin"}:
            return Identity(
                kind="user",
                subject=subject,
                key=f"user:{subject}",
                role=role,
                email=str(email) if email else None,
            )
        raise AuthError(
            "La sesión no tiene permiso para usar la IA.",
            code="forbidden",
            status_code=403,
            reason="invalid_role",
        )

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
