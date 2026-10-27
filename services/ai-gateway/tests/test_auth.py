from __future__ import annotations

import pytest
from conftest import make_client
from starlette.requests import Request

from app.auth import AuthError, resolve_identity


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
        "app.auth.verify_supabase_jwt",
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
        "app.auth.verify_supabase_jwt",
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
