from __future__ import annotations

import json

import httpx
import respx
from conftest import make_client

from app.dominio.conocimiento import Documento, Recuperado
from app.dominio.recuperacion import extraer_filtros
from app.servicios.recomendador import (
    _citadas,
    _levantar_exclusion,
    _sabor_solicitado,
)

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


def ficha_sin_lacteos() -> dict:
    datos = ficha()
    datos["platillos"] = [
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
        },
        {
            "id": "p2",
            "nombre": "Sopa de verduras",
            "descripcion": "Sopa de verduras de la huerta con papa y mazorca.",
            "precio": "11000",
            "categoriaId": "c1",
            "vegetariano": True,
            "vegano": True,
            "picante": False,
            "ingredientes": ["papa", "mazorca", "zanahoria"],
            "alergenos": [],
            "destacado": False,
        },
    ]
    return datos


def ficha_dulce_salado() -> dict:
    datos = ficha()
    datos["categorias"] = [
        {"id": "c1", "nombre": "Postres"},
        {"id": "c2", "nombre": "Sopas"},
    ]
    datos["platillos"] = [
        {
            "id": "p1",
            "nombre": "Brownie con helado",
            "descripcion": "Brownie tibio de chocolate con helado de vainilla.",
            "precio": "12000",
            "categoriaId": "c1",
            "vegetariano": True,
            "vegano": False,
            "picante": False,
            "ingredientes": ["chocolate", "harina", "huevo", "helado"],
            "alergenos": ["gluten", "huevo", "lactosa"],
            "destacado": True,
        },
        {
            "id": "p2",
            "nombre": "Sopa de la huerta",
            "descripcion": "Sopa de maíz, papa criolla y zanahoria.",
            "precio": "16900",
            "categoriaId": "c2",
            "vegetariano": True,
            "vegano": True,
            "picante": False,
            "ingredientes": ["maíz", "papa", "zanahoria"],
            "alergenos": [],
            "destacado": False,
        },
    ]
    return datos


def test_no_dulce_es_una_peticion_de_salado():
    assert _sabor_solicitado("algo que no sea dulce") == "salado"
    assert _sabor_solicitado("algo que nos sea dulce") == "salado"
    assert _sabor_solicitado("quiero algo dulce") == "dulce"
    assert _sabor_solicitado("un postre, pero no muy dulce") == "dulce"
    assert _sabor_solicitado("algo salado") == "salado"
    assert _sabor_solicitado("algo para almorzar") is None


def montar_catalogo(datos: dict | None = None) -> None:
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
        return_value=httpx.Response(200, json=datos or ficha())
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


def test_el_turno_actual_puede_levantar_la_exclusion_del_historial():
    filtros = extraer_filtros("algo que no tenga carne")
    levantados = _levantar_exclusion(filtros, "pollo")
    assert levantados.excluir_ingredientes == ()
    assert levantados.vegetariano is None

    sin_leche = extraer_filtros("algo sin lácteos ni queso")
    assert _levantar_exclusion(sin_leche, "pollo") == sin_leche


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
async def test_no_recomienda_queso_ni_lacteos_cuando_se_piden_evitar():
    montar_catalogo(ficha_sin_lacteos())
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={
                "mensaje": (
                    "¿Qué platos me puedes recomendar que no tengan lácteos ni queso?"
                )
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert "Arepa de queso" not in body["respuesta"]
    assert [fuente["nombre"] for fuente in body["fuentes"]] == ["Sopa de verduras"]
    assert "sin lácteos" in body["respuesta"]
    assert chat.calls == []


@respx.mock
async def test_no_dulce_recomienda_salado_y_entiende_el_typo():
    montar_catalogo(ficha_dulce_salado())
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        for mensaje in ("algo que no sea dulce", "algo que nos sea dulce"):
            response = await client.post(
                "/api/v1/ai/recomendar",
                json={"mensaje": mensaje},
            )
            assert response.status_code == 200
            body = response.json()
            assert "Brownie" not in body["respuesta"], mensaje
            assert [fuente["nombre"] for fuente in body["fuentes"]] == [
                "Sopa de la huerta"
            ], mensaje
            assert "salados" in body["respuesta"], mensaje

    assert chat.calls == []


@respx.mock
async def test_preguntar_por_un_restaurante_del_catalogo_no_es_tema_ajeno():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "¿qué hay en Café Bolívar?"},
        )

    assert response.status_code == 200
    body = response.json()
    assert "no lo manejo" not in body["respuesta"].lower()
    assert "Café Bolívar" in body["respuesta"]
    assert body["fuentes"]
    # La carta del local se responde con el catálogo, sin pasar por el modelo.
    assert chat.calls == []


@respx.mock
async def test_los_temas_ajenos_no_llegan_al_modelo():
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        for mensaje in (
            "dame el precio del dólar",
            "¿me recomiendas una película?",
            "¿qué opinas de la política?",
            "cuéntame un chiste",
        ):
            response = await client.post(
                "/api/v1/ai/recomendar",
                json={"mensaje": mensaje},
            )
            assert response.status_code == 200
            body = response.json()
            assert "no lo manejo" in body["respuesta"].lower(), mensaje
            assert body["fuentes"] == [], mensaje

    assert chat.calls == []


def test_solo_se_muestran_las_fuentes_citadas_por_la_respuesta():
    usados = [
        Recuperado(Documento("plato:1", "plato", "", {"nombre": "Arepa de queso"})),
        Recuperado(Documento("plato:2", "plato", "", {"nombre": "Bandeja paisa"})),
        Recuperado(Documento("plato:3", "plato", "", {"nombre": "Churrasco"})),
    ]
    citadas = _citadas("Te recomiendo la Bandeja paisa [P2] y el Churrasco [P3].", usados)
    assert [recuperado.documento.metadata["nombre"] for recuperado in citadas] == [
        "Bandeja paisa",
        "Churrasco",
    ]
    assert _citadas("Sin etiquetas, solo texto.", usados) == []


@respx.mock
async def test_no_recomienda_carne_cuando_se_pide_evitar():
    montar_catalogo()
    chat = respx.post(f"{OLLAMA}/api/chat").mock(
        return_value=httpx.Response(200, json={"message": {"content": "No"}})
    )

    async with make_client() as client:
        response = await client.post(
            "/api/v1/ai/recomendar",
            json={"mensaje": "algo que no tenga carne"},
        )

    assert response.status_code == 200
    body = response.json()
    assert "Bandeja paisa" not in body["respuesta"]
    assert [fuente["nombre"] for fuente in body["fuentes"]] == ["Arepa de queso"]
    assert "sin carne" in body["respuesta"]
    assert chat.calls == []


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
    assert "REGLAS OBLIGATORIAS" in enviado["messages"][0]["content"]
    assert "No inventes platos" in enviado["messages"][0]["content"]


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
