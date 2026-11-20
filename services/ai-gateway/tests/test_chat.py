from __future__ import annotations

import json

import httpx
import respx
from conftest import make_client

OLLAMA_CHAT = "http://ollama.test/api/chat"


def ollama_payload(content: str = "Delicias de la casa", model: str = "tuki-chef"):
    return {
        "model": model,
        "message": {"role": "assistant", "content": content},
        "prompt_eval_count": 11,
        "eval_count": 7,
    }


@respx.mock
async def test_chat_feliz_y_limpia_salida():
    route = respx.post(OLLAMA_CHAT).mock(
        return_value=httpx.Response(
            200, json=ollama_payload('Eslogan: "Delicias de la casa"')
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
    assert body["model"] == "tuki-chef"
    assert body["usage"] == {
        "prompt_tokens": 11,
        "completion_tokens": 7,
        "total_tokens": 18,
    }
    assert body["request_id"] == response.headers["x-request-id"]

    sent = json.loads(route.calls[0].request.content)
    assert sent["model"] == "tuki-chef"
    assert sent["messages"][0] == {"role": "system", "content": "Sé breve"}
    assert sent["messages"][1]["content"] == "Crea un eslogan"
    assert sent["stream"] is False
    assert sent["keep_alive"] == "15m"
    assert sent["options"]["num_ctx"] == 3072
    assert sent["options"]["temperature"] == 0.7


@respx.mock
async def test_cae_al_modelo_base_si_el_personalizado_no_existe():
    llamadas: list[str] = []

    def responder(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content)
        llamadas.append(payload["model"])
        if payload["model"] == "tuki-chef":
            return httpx.Response(404, json={"error": "model not found"})
        return httpx.Response(200, json=ollama_payload("Listo", payload["model"]))

    respx.post(OLLAMA_CHAT).mock(side_effect=responder)

    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 200
    assert response.json()["model"] == "qwen2.5:1.5b-instruct"
    assert llamadas == ["tuki-chef", "qwen2.5:1.5b-instruct"]


@respx.mock
async def test_reintenta_5xx_y_luego_responde():
    respuestas = [
        httpx.Response(503, json={"error": "unavailable"}),
        httpx.Response(200, json=ollama_payload("Recuperado")),
    ]
    respx.post(OLLAMA_CHAT).mock(side_effect=respuestas)

    async with make_client() as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 200
    assert response.json()["content"] == "Recuperado"
    assert response.json()["attempts"] == 2


@respx.mock
async def test_ollama_ocupado_devuelve_429(settings_factory):
    respx.post(OLLAMA_CHAT).mock(
        return_value=httpx.Response(429, json={"error": "rate limited"})
    )

    settings = settings_factory(ollama_max_attempts=1)
    async with make_client(settings) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 429
    assert response.json()["detail"]["code"] == "ai_rate_limited"
    assert response.headers["retry-after"] == "5"


@respx.mock
async def test_modelo_inexistente_no_expone_detalles(settings_factory):
    respx.post(OLLAMA_CHAT).mock(
        return_value=httpx.Response(404, json={"error": "model not found"})
    )

    settings = settings_factory(ollama_modelo_respaldo="", ollama_max_attempts=1)
    async with make_client(settings) as client:
        response = await client.post("/api/v1/ai/chat", json={"prompt": "Hola"})

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "ai_model_missing"
    assert "model not found" not in response.text


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
    respx.post(OLLAMA_CHAT).mock(return_value=httpx.Response(200, json=ollama_payload()))
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
