from __future__ import annotations

import pytest

from app.config import Settings


def base(**overrides):
    valores = {
        "auth_mode": "disabled",
        "environment": "test",
        "ollama_modelo_chat": "tuki-chef",
        "ollama_modelo_embeddings": "nomic-embed-text",
    }
    valores.update(overrides)
    return Settings(**valores)


def test_deriva_jwks_e_issuer():
    settings = Settings(
        supabase_url="https://abc.supabase.co/",
        ollama_modelo_chat="tuki-chef",
    )
    assert settings.supabase_url == "https://abc.supabase.co"
    assert settings.supabase_jwks_url == (
        "https://abc.supabase.co/auth/v1/.well-known/jwks.json"
    )
    assert settings.supabase_issuer == "https://abc.supabase.co/auth/v1"


def test_parsea_modelo_y_algoritmos():
    settings = base(
        ollama_modelo_chat=" tuki-chef ",
        ollama_modelo_embeddings=" nomic-embed-text ",
        jwt_algorithms="RS256, ES256",
    )
    assert settings.models == ["tuki-chef"]
    assert settings.modelo_chat == "tuki-chef"
    assert settings.modelo_embeddings == "nomic-embed-text"
    assert settings.algorithms == ["RS256", "ES256"]


def test_auth_supabase_sin_url_falla():
    settings = base(auth_mode="supabase")
    with pytest.raises(RuntimeError, match="SUPABASE_URL"):
        settings.validate_or_raise()


def test_auth_disabled_en_produccion_falla():
    settings = base(auth_mode="disabled", environment="production")
    with pytest.raises(RuntimeError, match="no se permite en producción"):
        settings.validate_or_raise()


def test_modelo_vacio_es_error_fatal():
    settings = base(ollama_modelo_chat="")
    with pytest.raises(RuntimeError, match="AI_OLLAMA_MODELO_CHAT"):
        settings.validate_or_raise()


def test_solapamiento_mayor_que_chunk_es_error():
    settings = base(rag_chunk_tokens=100, rag_chunk_overlap=100)
    with pytest.raises(RuntimeError, match="rag_chunk_overlap"):
        settings.validate_or_raise()


def test_mmr_fuera_de_rango_es_error():
    settings = base(rag_mmr_lambda=1.5)
    with pytest.raises(RuntimeError, match="rag_mmr_lambda"):
        settings.validate_or_raise()


def test_sin_ollama_no_hay_error_fatal_pero_si_readiness_de_auth():
    settings = base(auth_mode="supabase")
    settings.validate_or_raise() if settings.supabase_url else None
    assert "JWKS de Supabase no configurado" in settings.readiness_errors()


def test_secreto_no_se_renderiza():
    settings = Settings(
        supabase_anon_key="clave-super-secreta",
        ollama_modelo_chat="tuki-chef",
    )
    assert "clave-super-secreta" not in repr(settings)
    assert "clave-super-secreta" not in str(settings)
