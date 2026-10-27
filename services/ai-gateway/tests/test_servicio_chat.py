from __future__ import annotations

import pytest

from app.dominio.errores import PromptDemasiadoLargo
from app.dominio.modelos import ResultadoIA
from app.servicios.chat import ServicioChat


class ProveedorFalso:
    """Implementa el puerto ``ProveedorIA`` sin conocer Groq."""

    def __init__(self) -> None:
        self.llamadas: list[dict] = []

    async def generate(self, **kwargs) -> ResultadoIA:
        self.llamadas.append(kwargs)
        return ResultadoIA(
            content="Listo",
            model="modelo-falso",
            prompt_tokens=3,
            completion_tokens=2,
            total_tokens=5,
            attempts=1,
            latency_ms=7,
        )


async def test_el_servicio_depende_del_puerto_y_no_de_groq():
    proveedor = ProveedorFalso()
    servicio = ServicioChat(proveedor, max_chars=100)

    resultado = await servicio.generar(
        prompt="Hola",
        system="Sé breve",
        temperature=0.5,
        max_tokens=10,
        request_id="req-1",
    )

    assert resultado.content == "Listo"
    assert proveedor.llamadas == [
        {
            "prompt": "Hola",
            "system": "Sé breve",
            "temperature": 0.5,
            "max_tokens": 10,
            "request_id": "req-1",
        }
    ]


async def test_el_servicio_rechaza_un_prompt_largo_sin_llamar_al_proveedor():
    proveedor = ProveedorFalso()
    servicio = ServicioChat(proveedor, max_chars=5)

    with pytest.raises(PromptDemasiadoLargo):
        await servicio.generar(
            prompt="demasiado largo",
            system="Sé breve",
            temperature=0.5,
            max_tokens=10,
            request_id="req-2",
        )

    assert proveedor.llamadas == []
