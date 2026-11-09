from __future__ import annotations

import time

import jwt as pyjwt
import pytest
from conftest import make_client
from starlette.requests import Request

from app.adaptadores.supabase import AuthError, resolve_identity


def make_request(*, authorization: str | None = None, ip: str = "198.51.100.7") -> Request:
    headers = []
    if authorization:
        headers.append((b"authorization", authorization.encode()))
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/ai/chat",
            "headers": headers,
            "client": (ip, 12345),
            "server": ("gateway", 80),
            "scheme": "http",
            "query_string": b"",
        }
    )


def supabase_settings(settings_factory, **overrides):
    return settings_factory(
        auth_mode="supabase",
        supabase_url="https://proyecto.supabase.co",
        **overrides,
    )


def test_modo_disabled_identifica_por_ip(settings_factory):
    from app.config import Settings

    settings = Settings(auth_mode="disabled", groq_api_key="x")
    identity = resolve_identity(make_request(ip="10.0.0.5"), None, settings)
    assert identity.kind == "anon"
    assert identity.key == "ip:10.0.0.5"


def test_prefiere_x_real_ip_sobre_x_forwarded_for(settings_factory):
    from app.config import Settings

    request = make_request()
    request.scope["headers"].append((b"x-real-ip", b"192.0.2.50"))
    request.scope["headers"].append((b"x-forwarded-for", b"6.6.6.6, 192.0.2.50"))
    settings = Settings(auth_mode="disabled", groq_api_key="x")
    identity = resolve_identity(request, None, settings)
    assert identity.key == "ip:192.0.2.50"


def test_supabase_sin_token_y_anonimo_permitido(settings_factory):
    settings = supabase_settings(settings_factory, allow_anon=True)
    identity = resolve_identity(make_request(), None, settings)
    assert identity.kind == "anon"


def test_supabase_sin_token_y_anonimo_desactivado(settings_factory):
    settings = supabase_settings(settings_factory, allow_anon=False)
    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), None, settings)
    assert exc.value.code == "auth_required"
    assert exc.value.status_code == 401


def test_supabase_token_authenticated(settings_factory, monkeypatch):
    settings = supabase_settings(settings_factory)

    monkeypatch.setattr(
        "app.adaptadores.supabase.verify_supabase_jwt",
        lambda token, cfg: {
            "sub": "usuario-123",
            "role": "authenticated",
            "email": "persona@example.com",
        },
    )
    identity = resolve_identity(make_request(), "Bearer token-valido", settings)
    assert identity.kind == "user"
    assert identity.key == "user:usuario-123"
    assert identity.email == "persona@example.com"


def test_supabase_rol_no_permitido(settings_factory, monkeypatch):
    settings = supabase_settings(settings_factory)
    monkeypatch.setattr(
        "app.adaptadores.supabase.verify_supabase_jwt",
        lambda token, cfg: {"sub": "x", "role": "service_role"},
    )
    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), "Bearer token", settings)
    assert exc.value.status_code == 403
    assert exc.value.reason == "invalid_role"


async def test_api_exige_sesion_si_anonimo_desactivado(settings_factory):
    settings = supabase_settings(settings_factory, allow_anon=False)
    async with make_client(settings) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "auth_required"
    assert response.headers["www-authenticate"] == "Bearer"


def test_local_token_valido(settings_factory):
    from app.config import Settings

    secreto = "secreto-de-pruebas-de-32-caracteres"
    settings = Settings(
        auth_mode="local",
        jwt_secreto=secreto,
        jwt_emisor="tuki-identidad",
        jwt_audiencia="tuki",
    )
    ahora = int(time.time())
    token = pyjwt.encode(
        {
            "sub": "usuario-123",
            "rol": "dueno",
            "email": "dueno@example.com",
            "iat": ahora,
            "exp": ahora + 600,
            "iss": "tuki-identidad",
            "aud": "tuki",
        },
        secreto,
        algorithm="HS256",
    )
    identity = resolve_identity(make_request(), f"Bearer {token}", settings)
    assert identity.kind == "user"
    assert identity.key == "user:usuario-123"
    assert identity.role == "dueno"


def test_local_token_con_rol_invalido(settings_factory):
    from app.config import Settings

    secreto = "secreto-de-pruebas-de-32-caracteres"
    settings = Settings(auth_mode="local", jwt_secreto=secreto)
    ahora = int(time.time())
    token = pyjwt.encode(
        {
            "sub": "usuario-123",
            "rol": "desconocido",
            "iat": ahora,
            "exp": ahora + 600,
            "iss": "tuki-identidad",
            "aud": "tuki",
        },
        secreto,
        algorithm="HS256",
    )
    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), f"Bearer {token}", settings)
    assert exc.value.status_code == 403


async def test_api_token_invalido_no_degrada_a_anonimo(settings_factory):
    settings = supabase_settings(settings_factory, allow_anon=True)
    async with make_client(settings) as client:
        # Sin red hacia el JWKS, un token con formato inválido falla en la
        # validación local antes de intentar descargar claves.
        response = await client.post(
            "/api/v1/ai/chat",
            json={"prompt": "Hola"},
            headers={"Authorization": "Bearer no-es-un-jwt"},
        )
    assert response.status_code in (401, 503)
    assert response.json()["detail"]["code"] in {"invalid_token", "auth_unavailable"}


async def test_health_no_exige_token(settings_factory):
    settings = supabase_settings(settings_factory, allow_anon=False)
    async with make_client(settings) as client:
        response = await client.get("/healthz")
    assert response.status_code == 200


# --- Proyectos antiguos de Supabase (JWT HS256 y JWKS vacío) ---------------


class _RespuestaFalsa:
    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        if isinstance(self._payload, Exception):
            raise self._payload
        return self._payload


class _ClienteFalso:
    llamadas: list[dict] = []

    def __init__(self, respuesta):
        self._respuesta = respuesta

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def get(self, url, headers=None):
        _ClienteFalso.llamadas.append({"url": url, "headers": headers or {}})
        if isinstance(self._respuesta, Exception):
            raise self._respuesta
        return self._respuesta


def token_hs256(sub: str = "usuario-123") -> str:
    import jwt as pyjwt

    return pyjwt.encode(
        {
            "sub": sub,
            "role": "authenticated",
            "aud": "authenticated",
            "iat": 1_700_000_000,
            "exp": 1_900_000_000,
        },
        "secreto-de-pruebas-con-mas-de-32-bytes",
        algorithm="HS256",
        headers={"kid": "legacy"},
    )


def settings_hs256(settings_factory, **overrides):
    return supabase_settings(
        settings_factory,
        supabase_anon_key="anon-publica",
        **overrides,
    )


def usar_respuesta(monkeypatch, respuesta) -> None:
    import app.adaptadores.supabase as modulo

    _ClienteFalso.llamadas = []
    monkeypatch.setattr(modulo.httpx, "Client", lambda timeout=None: _ClienteFalso(respuesta))
    modulo.clear_legacy_cache()


def test_hs256_se_valida_contra_gotrue(settings_factory, monkeypatch):
    from app.adaptadores.supabase import resolve_identity

    settings = settings_hs256(settings_factory)
    usar_respuesta(
        monkeypatch,
        _RespuestaFalsa(200, {"id": "usuario-123", "role": "authenticated", "email": "a@b.co"}),
    )

    identity = resolve_identity(make_request(), f"Bearer {token_hs256()}", settings)

    assert identity.kind == "user"
    assert identity.key == "user:usuario-123"
    assert identity.email == "a@b.co"
    llamada = _ClienteFalso.llamadas[0]
    assert llamada["url"] == "https://proyecto.supabase.co/auth/v1/user"
    assert llamada["headers"]["apikey"] == "anon-publica"


def test_hs256_cachea_el_token_valido(settings_factory, monkeypatch):
    from app.adaptadores.supabase import resolve_identity

    settings = settings_hs256(settings_factory)
    usar_respuesta(
        monkeypatch,
        _RespuestaFalsa(200, {"id": "usuario-123", "role": "authenticated"}),
    )
    token = token_hs256()

    for _ in range(3):
        resolve_identity(make_request(), f"Bearer {token}", settings)

    assert len(_ClienteFalso.llamadas) == 1


def test_hs256_token_rechazado_por_gotrue(settings_factory, monkeypatch):
    from app.adaptadores.supabase import resolve_identity

    settings = settings_hs256(settings_factory)
    usar_respuesta(monkeypatch, _RespuestaFalsa(401, {"message": "invalid"}))

    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), f"Bearer {token_hs256()}", settings)
    assert exc.value.status_code == 401
    assert exc.value.code == "invalid_token"


def test_hs256_caida_de_gotrue_es_503(settings_factory, monkeypatch):
    import httpx

    from app.adaptadores.supabase import resolve_identity

    settings = settings_hs256(settings_factory)
    usar_respuesta(monkeypatch, httpx.ConnectError("sin red"))

    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), f"Bearer {token_hs256()}", settings)
    assert exc.value.status_code == 503
    assert exc.value.code == "auth_unavailable"


def test_hs256_sin_clave_anon_no_inventa_identidad(settings_factory, monkeypatch):
    from app.adaptadores.supabase import resolve_identity

    settings = supabase_settings(settings_factory)
    usar_respuesta(
        monkeypatch,
        _RespuestaFalsa(200, {"id": "usuario-123", "role": "authenticated"}),
    )

    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), f"Bearer {token_hs256()}", settings)
    assert exc.value.code == "auth_unavailable"
    assert _ClienteFalso.llamadas == []


def test_jwks_vacio_no_rompe_con_500(settings_factory, monkeypatch):
    import jwt as pyjwt

    import app.adaptadores.supabase as modulo
    from app.adaptadores.supabase import resolve_identity

    settings = supabase_settings(settings_factory)
    token = pyjwt.encode(
        {"sub": "x", "role": "authenticated"},
        "clave-de-pruebas-con-mas-de-32-bytes",
        algorithm="HS256",
    )

    def sin_claves(_settings):
        raise pyjwt.exceptions.PyJWKSetError("The JWK Set did not contain any keys")

    monkeypatch.setattr(modulo, "_token_algorithm", lambda token: "RS256")
    monkeypatch.setattr(modulo, "get_jwk_client", sin_claves)

    with pytest.raises(AuthError) as exc:
        resolve_identity(make_request(), f"Bearer {token}", settings)
    assert exc.value.status_code == 503
    assert exc.value.code == "auth_unavailable"

