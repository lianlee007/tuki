"""Compatibilidad: el adaptador de Groq vive en ``app.adaptadores.groq``.

Se conserva este módulo para que las importaciones existentes sigan
funcionando. El código nuevo debe importar desde ``app.adaptadores``.
"""

from app.adaptadores.groq import GroqClient, GroqError, limpiar_salida
from app.dominio.modelos import ResultadoIA as GroqResult

__all__ = ["GroqClient", "GroqError", "GroqResult", "limpiar_salida"]
