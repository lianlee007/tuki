from __future__ import annotations

from app.dominio.conocimiento import Documento, Recuperado
from app.dominio.recuperacion import (
    BM25,
    Filtros,
    IndiceRAG,
    coseno,
    extraer_filtros,
    seleccionar_contexto,
)
from app.dominio.texto import chunk_texto, normalizar, tokenizar


def test_normaliza_acentos_y_plurales():
    assert normalizar("Pizzería Popayán") == "pizzeria popayan"
    assert "pizza" in tokenizar("Pizzas artesanales")


def test_chunk_largo_con_solapamiento():
    texto = " ".join(f"palabra{i}" for i in range(400))
    fragmentos = chunk_texto(texto, max_tokens=100, overlap=20)
    assert len(fragmentos) > 1
    assert fragmentos[0].split()[-1] in fragmentos[1].split()


def test_bm25_prioriza_el_nombre_del_plato():
    corpus = [
        tokenizar("Pizza artesanal con mozzarella"),
        tokenizar("Sushi de salmón fresco"),
        tokenizar("Ensalada vegetariana"),
    ]
    bm25 = BM25(corpus)
    puntajes = bm25.puntuar([("pizza", 1.0)])
    assert puntajes[0] > puntajes[1]
    assert puntajes[0] > puntajes[2]


def _documentos() -> list[Documento]:
    return [
        Documento(
            "plato:1",
            "plato",
            "Plato: Arepa de queso. Restaurante: Café Bolívar. Precio: 12000 COP.",
            {
                "id": "1",
                "nombre": "Arepa de queso",
                "restaurante_slug": "cafe-bolivar",
                "restaurante": "Café Bolívar",
                "ciudad": "Popayán",
                "precio": 12000.0,
                "vegetariano": True,
                "vegano": False,
                "picante": False,
                "alergenos": ["lácteos"],
            },
        ),
        Documento(
            "plato:2",
            "plato",
            "Plato: Pizza de pepperoni. Restaurante: Pizzería Centenario. Precio: 32000 COP.",
            {
                "id": "2",
                "nombre": "Pizza de pepperoni",
                "restaurante_slug": "pizzeria-centenario",
                "restaurante": "Pizzería Centenario",
                "ciudad": "Popayán",
                "precio": 32000.0,
                "vegetariano": False,
                "vegano": False,
                "picante": False,
                "alergenos": ["gluten", "lácteos"],
            },
        ),
        Documento(
            "plato:3",
            "plato",
            "Plato: Pizza vegetariana. Restaurante: Pizzería Centenario. Precio: 27000 COP.",
            {
                "id": "3",
                "nombre": "Pizza vegetariana",
                "restaurante_slug": "pizzeria-centenario",
                "restaurante": "Pizzería Centenario",
                "ciudad": "Popayán",
                "precio": 27000.0,
                "vegetariano": True,
                "vegano": False,
                "picante": False,
                "alergenos": ["gluten", "lácteos"],
            },
        ),
    ]


def test_indice_filtra_vegetariano_y_precio():
    indice = IndiceRAG(_documentos())
    resultados = indice.buscar(
        "algo vegetariano barato",
        filtros=Filtros(vegetariano=True, precio_max=25000),
        top_k=3,
    )
    assert [r.documento.id for r in resultados] == ["plato:1"]


def test_indice_detecta_la_ciudad_y_excluye_alergenos():
    indice = IndiceRAG(_documentos())
    filtros = extraer_filtros("pizza en Popayán sin gluten")
    resultados = indice.buscar("pizza en Popayán sin gluten", filtros=filtros, top_k=3)
    assert resultados
    assert all("gluten" not in r.documento.metadata["alergenos"] for r in resultados)


def test_indice_diversifica_por_restaurante():
    indice = IndiceRAG(_documentos())
    resultados = indice.buscar("menu", top_k=3)
    assert len(resultados) == 3
    assert len({r.documento.metadata["restaurante_slug"] for r in resultados}) >= 2


def test_extraer_filtros_de_lenguaje_natural():
    filtros = extraer_filtros("Quiero algo vegano, picante y por menos de 25.000")
    assert filtros.vegano is True
    assert filtros.vegetariano is True
    assert filtros.picante is True
    assert filtros.precio_max == 25000


def test_extraer_filtros_de_alergeno():
    filtros = extraer_filtros("¿Tienen algo sin gluten?")
    assert filtros.excluir_alergeno == "gluten"


def test_detecta_cocina_que_no_esta_en_los_platos():
    indice = IndiceRAG(_documentos())
    assert indice.termino_sin_datos("¿Hay comida china?") == "china"
    assert indice.termino_sin_datos("¿Tienen sushi?") == "sushi"
    assert indice.termino_sin_datos("Quiero pizza") is None


def test_coseno_y_contexto():
    assert coseno([1, 0], [1, 0]) == 1.0
    assert coseno([1, 0], [0, 1]) == 0.0
    contexto, usados = seleccionar_contexto(
        [
            Recuperado(_documentos()[0], 1.0, "lexico"),
            Recuperado(_documentos()[1], 0.5, "lexico"),
        ],
        max_tokens=20,
    )
    assert contexto.startswith("[P1]")
    assert len(usados) == 1
