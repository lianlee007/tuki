"""Modelos y errores del dominio de visión."""

from app.dominio.clasificador import (
    ClasificadorComida,
    ClasificadorYolo,
    ErrorModelo,
    Veredicto,
)

__all__ = [
    "ClasificadorComida",
    "ClasificadorYolo",
    "ErrorModelo",
    "Veredicto",
]
