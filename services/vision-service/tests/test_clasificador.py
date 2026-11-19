"""Pruebas de las reglas de etiquetas (sin cargar torch)."""

from app.dominio.clasificador import _normalizar, buscar_indice_comida


def test_normaliza_tildes_guiones_y_mayusculas() -> None:
    assert _normalizar("No comida") == "no comida"
    assert _normalizar("NO-Comida") == "no comida"
    assert _normalizar("  Comida  ") == "comida"
    assert _normalizar("Comidá") == "comida"


def test_indice_de_comida_en_orden_de_ultralytics() -> None:
    assert buscar_indice_comida(["comida", "no-comida"], "comida") == 0
    assert buscar_indice_comida(["no-comida", "comida"], "comida") == 1
    assert buscar_indice_comida(["Comida", "No comida"], "comida") == 0


def test_no_confunde_no_comida_con_comida() -> None:
    assert buscar_indice_comida(["no-comida"], "comida") is None
    assert buscar_indice_comida(["no comida"], "comida") is None


def test_modelo_sin_clase_comida() -> None:
    assert buscar_indice_comida(["plato", "postre"], "comida") is None
