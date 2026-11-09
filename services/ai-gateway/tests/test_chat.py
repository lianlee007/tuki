from __future__ import annotations

import json

import httpx
import respx
from conftest import make_client

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def groq_payload(content: str = "Delicias de la casa", model: str = "openai/gpt-oss-120b"):
    return {
        "id": "chatcmpl-test",
        "model": model,
        "choices": [{"index": 0, "message": {"role": "assistant", "content": content}}],
        "usage": {"prompt_tokens": 11, "completion_tokens": 7, "total_tokens": 18},
    }


@respx.mock
async def test_chat_feliz_y_limpia_salida():
    route = respx.post(GROQ_URL).mock(
        return_value=httpx.Response(
            200, json=groq_payload('Eslogan: "Delicias de la casa"')
        )
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/chat",
            json={"prompt": "Crea un eslogan", "system": "Sé breve"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["content"] == "Delicias de la casa"
    assert body["model"] == "openai/gpt-oss-120b"
    assert body["usage"] == {
        "prompt_tokens": 11,
        "completion_tokens": 7,
        "total_tokens": 18,
    }
    assert body["request_id"] == response.headers["x-request-id"]

    sent = json.loads(route.calls[0].request.content)
    assert sent["messages"][0] == {"role": "system", "content": "Sé breve"}
    assert sent["messages"][1]["content"] == "Crea un eslogan"
    assert sent["stream"] is False
    assert route.calls[0].request.headers["authorization"] == "Bearer test-key"


@respx.mock
async def test_fallback_a_segundo_modelo_si_el_primero_no_existe():
    calls = []

    def responder(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        calls.append(payload["model"])
        if payload["model"] == "openai/gpt-oss-120b":
            return httpx.Response(404, json={"error": {"message": "model not found"}})
        return httpx.Response(200, json=groq_payload("Segundo modelo", payload["model"]))

    respx.post(GROQ_URL).mock(side_effect=responder)

    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 200
    assert response.json()["model"] == "openai/gpt-oss-20b"
    assert calls == ["openai/gpt-oss-120b", "openai/gpt-oss-20b"]


@respx.mock
async def test_reintenta_5xx_y_luego_responde():
    responses = [
        httpx.Response(503, json={"error": {"message": "unavailable"}}),
        httpx.Response(200, json=groq_payload("Recuperado")),
    ]
    respx.post(GROQ_URL).mock(side_effect=responses)

    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 200
    assert response.json()["content"] == "Recuperado"
    assert response.json()["attempts"] == 2


@respx.mock
async def test_rate_limit_agotado_devuelve_429(settings_factory):
    respx.post(GROQ_URL).mock(
        return_value=httpx.Response(429, json={"error": {"message": "rate limited"}})
    )

    settings = settings_factory(groq_max_attempts=1)
    async with make_client(settings) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "ai_rate_limited"
    assert response.headers["retry-after"] == "5"


@respx.mock
async def test_clave_de_groq_invalida_no_se_expone():
    respx.post(GROQ_URL).mock(
        return_value=httpx.Response(401, json={"error": {"message": "invalid api key"}})
    )

    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "ai_auth_error"
    assert "test-key" not in response.text


async def test_sin_clave_devuelve_503(settings_factory):
    async with make_client(settings_factory(groq_api_key="")) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ai_not_configured"


async def test_validacion_de_payload():
    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": ""})
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "validation_error"


async def test_prompt_demasiado_largo(settings_factory):
    settings = settings_factory(request_max_chars=10)
    async with make_client(settings) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "x" * 11})
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "prompt_too_long"


@respx.mock
async def test_rate_limit_por_ip(settings_factory):
    respx.post(GROQ_URL).mock(return_value=httpx.Response(200, json=groq_payload()))
    settings = settings_factory(
        rate_limit_anon_per_minute=1,
        rate_limit_anon_burst=1,
    )

    async with make_client(settings) as client:
        first = await client.post("/api/v1/ai/chat", json={"prompt": "Uno"})
        second = await client.post("/api/v1/ai/chat", json={"prompt": "Dos"})

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["detail"]["code"] == "rate_limited"
    assert int(second.headers["retry-after"]) >= 1


async def test_extra_fields_rechazados():
    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/chat",
            json={"prompt": "Hola", "api_key": "intento-de-fuga"},
        )
    assert response.status_code == 422
