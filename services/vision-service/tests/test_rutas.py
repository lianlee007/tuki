"""Pruebas del contrato HTTP del servicio de visión."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import crear_app
from tests.conftest import ClasificadorFalso, imagen_png


class VeredictoError(RuntimeError):
    pass


def _cliente(ajustes: Settings, clasificador: ClasificadorFalso | None) -> TestClient:
    return TestClient(crear_app(settings=ajustes, clasificador=clasificador))


def test_health(ajustes: Settings) -> None:
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.get("/healthz")
        assert respuesta.status_code == 200
        assert respuesta.json()["service"] == "tuki-vision"


def test_readyz_con_modelo(ajustes: Settings) -> None:
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.get("/readyz")
        assert respuesta.status_code == 200
        assert respuesta.json()["checks"]["modelo"] is True


def test_readyz_sin_modelo(ajustes: Settings) -> None:
    # El path del fixture no existe: el arranque queda degradado, no roto.
    with _cliente(ajustes, None) as cliente:
        assert cliente.get("/readyz").status_code == 503
        assert cliente.get("/healthz").status_code == 200


def test_clasifica_comida(ajustes: Settings) -> None:
    falso = ClasificadorFalso(0.93)
    with _cliente(ajustes, falso) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("plato.png", imagen_png(), "image/png")},
        )
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["es_comida"] is True
    assert datos["probabilidad_comida"] == 0.93
    assert datos["modelo"] == "falso.pt"
    assert falso.llamadas == 1


def test_rechaza_foto_que_no_es_comida(ajustes: Settings) -> None:
    with _cliente(ajustes, ClasificadorFalso(0.12)) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("perro.png", imagen_png(), "image/png")},
        )
    assert respuesta.status_code == 200
    assert respuesta.json()["es_comida"] is False


def test_rechaza_archivo_que_no_es_imagen(ajustes: Settings) -> None:
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("notas.txt", b"no soy una foto", "image/jpeg")},
        )
    assert respuesta.status_code == 400


def test_rechaza_tipo_que_no_es_imagen(ajustes: Settings) -> None:
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("notas.txt", b"hola", "text/plain")},
        )
    assert respuesta.status_code == 415


def test_rechaza_imagen_demasiado_grande(ajustes: Settings) -> None:
    ajustes.max_imagen_bytes = 10
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("plato.png", imagen_png(), "image/png")},
        )
    assert respuesta.status_code == 413


def test_sin_modelo_no_clasifica(ajustes: Settings) -> None:
    with _cliente(ajustes, None) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("plato.png", imagen_png(), "image/png")},
        )
    assert respuesta.status_code == 503


def test_modelo_expone_metadatos(ajustes: Settings, tmp_path: Path) -> None:
    metricas = tmp_path / "falso.metricas.json"
    metricas.write_text('{"metricas": {"accuracy": 0.97}}', encoding="utf-8")
    with _cliente(ajustes, ClasificadorFalso()) as cliente:
        respuesta = cliente.get("/api/v1/vision/modelo")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["etiquetas"] == ["comida", "no-comida"]
    # El fixture apunta a tmp_path, así que el sidecar se encuentra.
    assert datos["metricas"]["metricas"]["accuracy"] == 0.97


def test_error_de_inferencia_devuelve_500(ajustes: Settings) -> None:
    class ClasificadorRoto(ClasificadorFalso):
        def clasificar(self, imagen):  # type: ignore[override]
            raise VeredictoError()

    with _cliente(ajustes, ClasificadorRoto()) as cliente:
        respuesta = cliente.post(
            "/api/v1/vision/clasificar",
            files={"imagen": ("plato.png", imagen_png(), "image/png")},
        )
    assert respuesta.status_code == 500
