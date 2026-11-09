from __future__ import annotations

import pytest

from app.config import Settings


def test_deriva_jwks_e_issuer():
    settings = Settings(supabase_url="https://abc.supabase.co/", groq_api_key="x")
    assert settings.supabase_url == "https://abc.supabase.co"
    assert settings.supabase_jwks_url == (
        "https://abc.supabase.co/auth/v1/.well-known/jwks.json"
    )
    assert settings.supabase_issuer == "https://abc.supabase.co/auth/v1"


def test_parsea_modelos_y_algoritmos():
    settings = Settings(
        groq_api_key="x",
        groq_models=" modelo-a ,, modelo-b ",
        jwt_algorithms="RS256, ES256",
    )
    assert settings.models == ["modelo-a", "modelo-b"]
    assert settings.algorithms == ["RS256", "ES256"]


def test_auth_supabase_sin_url_falla():
    settings = Settings(auth_mode="supabase", groq_api_key="x")
    with pytest.raises(RuntimeError, match="SUPABASE_URL"):
        settings.validate_or_raise()


def test_auth_disabled_en_produccion_falla():
    settings = Settings(auth_mode="disabled", environment="production", groq_api_key="x")
    with pytest.raises(RuntimeError, match="no se permite en producción"):
        settings.validate_or_raise()


def test_sin_groq_key_no_es_error_fatal_pero_si_readiness():
    settings = Settings(auth_mode="disabled", environment="test", groq_api_key="")
    settings.validate_or_raise()
    assert "GROQ_API_KEY no configurada" in settings.readiness_errors()


def test_secreto_no_se_renderiza():
    settings = Settings(groq_api_key="clave-super-secreta")
    assert "clave-super-secreta" not in repr(settings)
    assert "clave-super-secreta" not in str(settings)
