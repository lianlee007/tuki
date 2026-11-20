from __future__ import annotations

import json

import httpx
import respx
from conftest import make_client

RESTAURANTES = "http://restaurantes.test"
RESENAS = "http://resenas.test"
OLLAMA = "http://ollama.test"


def ficha() -> dict:
    return {
        "restaurante": {
            "id": "r1",
            "nombre": "Café Bolívar",
            "slug": "cafe-bolivar",
            "ciudad": "Popayán",
            "descripcion": "Café de especialidad y repostería en el centro.",
            "eslogan": "El mejor café de la ciudad",
            "direccion": "Calle 5 # 4-21",
            "horarioApertura": "08:00",
            "horarioCierre": "20:00",
        },
        "tema": {},
        "cocinas": [{"nombre": "Cafetería"}],
        "categorias": [{"id": "c1", "nombre": "Cafés"}],
        "platillos": [
            {
                "id": "p1",
                "nombre": "Arepa de queso",
                "descripcion": "Arepa de maíz con queso campesino.",
                "precio": "12000",
                "categoriaId": "c1",
                "vegetariano": True,
                "vegano": False,
                "picante": False,
                "ingredientes": ["maíz", "queso"],
                "alergenos": ["lácteos"],
                "destacado": True,
                "tiempoPreparacion": 10,
            },
            {
                "id": "p2",
                "nombre": "Bandeja paisa",
                "descripcion": "Frijoles, arroz, chicharrón y huevo.",
                "precio": "28000",
                "categoriaId": "c1",
                "vegetariano": False,
                "vegano": False,
                "picante": False,
                "ingredientes": ["frijol", "arroz", "cerdo"],
                "alergenos": ["huevo"],
                "destacado": False,
            },
        ],
    }


def montar_catalogo() -> None:
    respx.get(f"{RESTAURANTES}/v1/restaurantes").mock(
        return_value=httpx.Response(
            200,
            json={
                "items": [{"id": "r1", "nombre": "Café Bolívar", "slug": "cafe-bolivar"}],
                "total": 1,
                "desde": 0,
                "limite": 60,
            },
        )
    )
    respx.get(f"{RESTAURANTES}/v1/restaurantes/cafe-bolivar").mock(
        return_value=httpx.Response(200, json=ficha())
    )
    respx.get(f"{RESENAS}/v1/resenas/restaurante/r1").mock(
        return_value=httpx.Response(
            200,
            json={"resenas": [], "resumen": {"promedio": 4.7, "cantidad": 12}},
        )
    )
    respx.post(f"{OLLAMA}/api/embed").mock(
        side_effect=lambda request: httpx.Response(
            200,
            json={
                "embeddings": [
                    [1.0, float(indice % 3), 0.5]
                    for indice, _ in enumerate(json.loads(request.content)["input"])
                ]
            },
        )
    )


@respx.mock
async def test_filtro_vegetariano_responde_lista_sin_llm():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "Quiero algo vegetariano y barato"},
        )
        estado = await client.get("/api/v1/ai/conocimiento")

    assert response.status_code == 200
    body = response.json()
    assert "Arepa de queso" in body["respuesta"]
    assert "Alérgenos declarados" in body["respuesta"]
    assert "lácteos" in body["respuesta"]
    assert body["fuentes"][0]["nombre"] == "Arepa de queso"
    assert body["fuentes"][0]["alergenos"] == ["lácteos"]
    assert body["fuentes"][0]["precio"] == 12000
    assert body["fuentes"][0]["vegetariano"] is True
    assert body["recuperacion_ms"] >= 0
    assert body["usage"]["prompt_tokens"] == 0
    assert chat.calls == []

    assert estado.status_code == 200
    assert estado.json()["documentos"] >= 3
    assert estado.json()["embeddings"] >= 3


@respx.mock
async def test_recomienda_con_modelo_local_y_fuentes():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "tuki-chef",
                "message": {
                    "content": (
                        "Te recomiendo la Arepa de queso [P1] del Café Bolívar, "
                        "cuesta 12.000 COP. ¿Quieres algo para beber?"
                    )
                },
                "prompt_eval_count": 180,
                "eval_count": 25,
            },
        )
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "¿Qué me recomiendas?"},
        )

    assert response.status_code == 200
    body = response.json()
    assert "Arepa de queso" in body["respuesta"]
    assert body["usage"]["prompt_tokens"] == 180

    enviado = json.loads(chat.calls[0].request.content)
    prompt = enviado["messages"][1]["content"]
    assert "CONTEXTO DEL CATÁLOGO" in prompt
    assert "Arepa de queso" in prompt
    assert "12000" in prompt
    assert enviado["options"]["num_predict"] == 200
    assert "Solo puedes recomendar platos" in enviado["messages"][0]["content"]


@respx.mock
async def test_pregunta_ajena_no_consume_el_modelo():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "¿Quién ganó el partido de fútbol?"},
        )

    assert response.status_code == 200
    assert "no lo manejo" in response.json()["respuesta"].lower()
    assert chat.calls == []


@respx.mock
async def test_saludo_no_consume_el_modelo():
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "Hola"},
        )

    assert response.status_code == 200
    assert "recomendador de platos" in response.json()["respuesta"]
    assert response.json()["fuentes"] == []
    assert chat.calls == []


@respx.mock
async def test_historial_se_usa_para_resolver_el_seguimiento():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "tuki-chef",
                "message": {"content": "También te puede gustar la Bandeja paisa [P1]."},
                "prompt_eval_count": 120,
                "eval_count": 18,
            },
        )
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={
                "mensaje": "¿Y algo más contundente?",
                "historial": [
                    {"rol": "user", "contenido": "Busco un almuerzo en Popayán"},
                    {"rol": "assistant", "contenido": "Te recomiendo una arepa."},
                ],
            },
        )

    assert response.status_code == 200
    enviado = json.loads(chat.calls[0].request.content)
    prompt = enviado["messages"][1]["content"]
    assert "Busco un almuerzo en Popayán" in prompt
    assert "CONVERSACIÓN RECIENTE" in prompt
