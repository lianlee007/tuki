from __future__ import annotations

from pathlib import Path

from app.dominio.conocimiento import Documento
from app.servicios.conocimiento import ServicioConocimiento


def documento(nombre: str = "Arepa de queso") -> Documento:
    return Documento(
        id="plato:1",
        tipo="plato",
        texto=f"Plato: {nombre}. Restaurante: Café Bolívar. Precio: 12000 COP.",
        metadata={
            "id": "1",
            "nombre": nombre,
            "restaurante": "Café Bolívar",
            "restaurante_id": "r1",
            "restaurante_slug": "cafe-bolivar",
            "ciudad": "Popayán",
            "precio": 12000.0,
        },
    )


class ExtractorFalso:
    def __init__(self, documentos: list[Documento]) -> None:
        self.documentos = documentos
        self.llamadas = 0

    async def extraer(self) -> list[Documento]:
        self.llamadas += 1
        return self.documentos


class ExtractorQueFalla:
    async def extraer(self) -> list[Documento]:
        raise RuntimeError("catálogo caído")


class EmbeddingsFalsos:
    def __init__(self, falla: bool = False) -> None:
        self.falla = falla

    async def embed(self, textos: list[str]) -> list[list[float]]:
        if self.falla:
            raise RuntimeError("ollama no responde")
        return [[1.0, float(len(texto) % 5), 0.5] for texto in textos]


async def test_construye_indice_y_lo_cachea(tmp_path: Path, settings_factory):
    settings = settings_factory(conocimiento_directorio=str(tmp_path))
    extractor = ExtractorFalso([documento()])
    servicio = ServicioConocimiento(extractor, EmbeddingsFalsos(), settings)

    indice = await servicio.obtener()
    assert len(indice.documentos) == 1
    assert indice.tiene_embeddings is True
    assert servicio.estado()["platos"] == 1
    assert (tmp_path / "indice-rag.json").exists()

    # El segundo servicio reutiliza el disco sin volver a pedir el catálogo.
    segundo = ServicioConocimiento(ExtractorQueFalla(), EmbeddingsFalsos(), settings)
    indice_cacheado = await segundo.obtener()
    assert len(indice_cacheado.documentos) == 1
    assert segundo.estado()["fuente"] == "disco"


async def test_si_embeddings_falla_sigue_con_bm25(tmp_path: Path, settings_factory):
    settings = settings_factory(conocimiento_directorio=str(tmp_path))
    servicio = ServicioConocimiento(
        ExtractorFalso([documento()]),
        EmbeddingsFalsos(falla=True),
        settings,
    )

    indice = await servicio.obtener()
    assert indice.tiene_embeddings is False
    assert servicio.estado()["embeddings"] == 0
    assert servicio.estado()["error_embeddings"] is not None


async def test_si_el_catalogo_falla_y_no_hay_cache_propaga(tmp_path: Path, settings_factory):
    settings = settings_factory(conocimiento_directorio=str(tmp_path))
    servicio = ServicioConocimiento(ExtractorQueFalla(), EmbeddingsFalsos(), settings)

    try:
        await servicio.obtener()
    except RuntimeError as exc:
        assert "catálogo caído" in str(exc)
    else:  # pragma: no cover - el test debe fallar si no propaga
        raise AssertionError("se esperaba el error del catálogo")


async def test_recargar_fuerza_una_nueva_extraccion(tmp_path: Path, settings_factory):
    settings = settings_factory(conocimiento_directorio=str(tmp_path))
    extractor = ExtractorFalso([documento()])
    servicio = ServicioConocimiento(extractor, EmbeddingsFalsos(), settings)

    await servicio.obtener()
    await servicio.recargar()
    assert extractor.llamadas == 2
