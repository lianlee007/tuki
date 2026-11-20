"""Extracción del conocimiento gastronómico desde los servicios de Tuki.

El gateway no lee PostgreSQL: pide el catálogo al servicio de restaurantes y las
valoraciones al servicio de reseñas. Así se respeta la frontera entre servicios
y el índice se puede reconstruir sin credenciales de base de datos.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import Settings
from app.dominio.conocimiento import Documento
from app.dominio.errores import ErrorIA
from app.dominio.texto import chunk_texto

logger = logging.getLogger(__name__)

# En local, Docker Desktop acepta pocas conexiones TCP simultáneas al puerto
# de PostgreSQL. Extraer de dos en dos evita los CONNECT_TIMEOUT sin volver
# eterna la reconstrucción del índice.
_CONCURRENCIA = 2


class ExtractorRestaurantes:
    def __init__(self, settings: Settings, client: httpx.AsyncClient) -> None:
        self._settings = settings
        self._client = client
        self._semaforo = asyncio.Semaphore(_CONCURRENCIA)

    async def extraer(self) -> list[Documento]:
        restaurantes = await self._listar_restaurantes()
        if not restaurantes:
            return []

        tareas = [self._extraer_uno(restaurante) for restaurante in restaurantes]
        resultados = await asyncio.gather(*tareas, return_exceptions=True)

        documentos: list[Documento] = []
        for resultado in resultados:
            if isinstance(resultado, Exception):
                logger.warning(
                    "conocimiento_restaurante_omitido",
                    extra={
                        "event": "knowledge_partial",
                        "error": str(resultado)[:200],
                    },
                )
                continue
            documentos.extend(resultado)
        return documentos

    async def _listar_restaurantes(self) -> list[dict[str, Any]]:
        limite = 60
        desde = 0
        acumulado: list[dict[str, Any]] = []
        while len(acumulado) < self._settings.conocimiento_max_restaurantes:
            try:
                respuesta = await self._client.get(
                    f"{self._settings.restaurantes_url}/v1/restaurantes",
                    params={"limite": limite, "desde": desde},
                    timeout=httpx.Timeout(connect=5.0, read=20.0, write=10.0, pool=5.0),
                )
            except httpx.HTTPError as exc:
                raise ErrorIA(
                    "No se pudo leer el catálogo de restaurantes.",
                    status_code=503,
                    code="knowledge_unavailable",
                ) from exc
            if respuesta.status_code != 200:
                raise ErrorIA(
                    "El servicio de restaurantes no respondió correctamente.",
                    status_code=503,
                    code="knowledge_unavailable",
                )
            datos = respuesta.json()
            items = datos.get("items") or []
            acumulado.extend(item for item in items if isinstance(item, dict))
            total = int(datos.get("total") or 0)
            desde += limite
            if not items or desde >= total:
                break
        return acumulado[: self._settings.conocimiento_max_restaurantes]

    async def _extraer_uno(self, resumen: dict[str, Any]) -> list[Documento]:
        slug = str(resumen.get("slug") or "").strip()
        if not slug:
            return []
        async with self._semaforo:
            respuesta: httpx.Response | None = None
            for intento in range(2):
                try:
                    respuesta = await self._client.get(
                        f"{self._settings.restaurantes_url}/v1/restaurantes/{slug}",
                        timeout=httpx.Timeout(
                            connect=5.0, read=20.0, write=10.0, pool=5.0
                        ),
                    )
                except httpx.HTTPError:
                    respuesta = None
                if respuesta is not None and respuesta.status_code == 200:
                    break
                if intento == 0:
                    await asyncio.sleep(0.4)
            if respuesta is None or respuesta.status_code != 200:
                return []
            ficha = respuesta.json()

        restaurante = ficha.get("restaurante") or {}
        if not isinstance(restaurante, dict):
            restaurante = {}
        cocinas = [
            str(item.get("nombre"))
            for item in ficha.get("cocinas") or []
            if isinstance(item, dict) and item.get("nombre")
        ]
        categorias = {
            str(item.get("id")): str(item.get("nombre"))
            for item in ficha.get("categorias") or []
            if isinstance(item, dict) and item.get("id")
        }
        valoracion = await self._valoracion(str(restaurante.get("id") or ""))

        documentos: list[Documento] = []
        documentos.extend(
            self._documentos_restaurante(restaurante, cocinas, valoracion)
        )
        for platillo in ficha.get("platillos") or []:
            if not isinstance(platillo, dict):
                continue
            documentos.extend(self._documentos_platillo(platillo, restaurante, categorias))
        return documentos

    async def _valoracion(self, restaurante_id: str) -> dict[str, Any]:
        if not restaurante_id or not self._settings.resenas_url:
            return {}
        try:
            respuesta = await self._client.get(
                f"{self._settings.resenas_url}/v1/resenas/restaurante/{restaurante_id}",
                timeout=httpx.Timeout(connect=3.0, read=10.0, write=5.0, pool=3.0),
            )
        except httpx.HTTPError:
            return {}
        if respuesta.status_code != 200:
            return {}
        try:
            datos = respuesta.json()
        except ValueError:
            return {}
        resumen = datos.get("resumen") if isinstance(datos, dict) else None
        if not isinstance(resumen, dict):
            return {}
        return {
            "promedio": float(resumen.get("promedio") or 0),
            "cantidad": int(resumen.get("cantidad") or 0),
        }

    def _documentos_restaurante(
        self,
        restaurante: dict[str, Any],
        cocinas: list[str],
        valoracion: dict[str, Any],
    ) -> list[Documento]:
        nombre = str(restaurante.get("nombre") or "Restaurante")
        ciudad = _texto(restaurante.get("ciudad"))
        direccion = _texto(restaurante.get("direccion"))
        horario = _horario(restaurante)
        descripcion = _texto(restaurante.get("descripcion"))
        eslogan = _texto(restaurante.get("eslogan"))

        partes = [
            f"Restaurante: {nombre}.",
            f"Ciudad: {ciudad}." if ciudad else "",
            f"Cocinas: {', '.join(cocinas)}." if cocinas else "",
            f"Eslogan: {eslogan}." if eslogan else "",
            f"Descripción: {descripcion}." if descripcion else "",
            f"Horario: {horario}." if horario else "",
            f"Dirección: {direccion}." if direccion else "",
            f"Teléfono: {_texto(restaurante.get('telefono'))}."
            if restaurante.get("telefono")
            else "",
        ]
        if valoracion.get("cantidad"):
            partes.append(
                f"Valoración: {valoracion['promedio']:.1f} de 5 "
                f"con {valoracion['cantidad']} reseñas."
            )
        texto = " ".join(parte for parte in partes if parte)
        metadata = {
            "id": str(restaurante.get("id") or ""),
            "tipo": "restaurante",
            "nombre": nombre,
            "restaurante": nombre,
            "restaurante_id": str(restaurante.get("id") or ""),
            "restaurante_slug": str(restaurante.get("slug") or ""),
            "ciudad": ciudad,
            "direccion": direccion,
            "horario": horario,
            "telefono": _texto(restaurante.get("telefono")),
            "whatsapp": _texto(restaurante.get("whatsapp")),
            "cocinas": cocinas,
            "calificacion": valoracion.get("promedio"),
            "resenas_cantidad": valoracion.get("cantidad"),
            "imagen_url": restaurante.get("imagenBannerUrl") or restaurante.get("imagenLogoUrl"),
        }
        return [
            Documento(
                id=f"restaurante:{metadata['id']}" + (f"#{posicion}" if posicion else ""),
                tipo="restaurante",
                texto=fragmento,
                metadata=metadata,
            )
            for posicion, fragmento in enumerate(
                chunk_texto(
                    texto,
                    max_tokens=self._settings.rag_chunk_tokens,
                    overlap=self._settings.rag_chunk_overlap,
                )
            )
        ]

    def _documentos_platillo(
        self,
        platillo: dict[str, Any],
        restaurante: dict[str, Any],
        categorias: dict[str, str],
    ) -> list[Documento]:
        nombre = str(platillo.get("nombre") or "Plato")
        restaurante_nombre = str(restaurante.get("nombre") or "Restaurante")
        ciudad = _texto(restaurante.get("ciudad"))
        categoria = categorias.get(str(platillo.get("categoriaId") or ""), "")
        precio = _precio(platillo.get("precio"))
        descripcion = _texto(platillo.get("descripcion"))
        ingredientes = _lista(platillo.get("ingredientes"))
        alergenos = _lista(platillo.get("alergenos"))
        etiquetas = [
            etiqueta
            for etiqueta, activo in (
                ("vegetariano", platillo.get("vegetariano")),
                ("vegano", platillo.get("vegano")),
                ("picante", platillo.get("picante")),
                ("destacado", platillo.get("destacado")),
            )
            if activo
        ]
        tiempo = platillo.get("tiempoPreparacion")

        partes = [
            f"Plato: {nombre}.",
            f"Restaurante: {restaurante_nombre}.",
            f"Ciudad: {ciudad}." if ciudad else "",
            f"Categoría: {categoria}." if categoria else "",
            f"Precio: {precio:.0f} COP." if precio is not None else "",
            f"Descripción: {descripcion}." if descripcion else "",
            f"Ingredientes: {', '.join(ingredientes)}." if ingredientes else "",
            f"Alérgenos: {', '.join(alergenos)}." if alergenos else "Sin alérgenos declarados.",
            f"Etiquetas: {', '.join(etiquetas)}." if etiquetas else "",
            f"Tiempo de preparación: {tiempo} minutos." if tiempo else "",
        ]
        texto = " ".join(parte for parte in partes if parte)
        metadata = {
            "id": str(platillo.get("id") or ""),
            "tipo": "plato",
            "nombre": nombre,
            "restaurante": restaurante_nombre,
            "restaurante_id": str(restaurante.get("id") or ""),
            "restaurante_slug": str(restaurante.get("slug") or ""),
            "ciudad": ciudad,
            "categoria": categoria or None,
            "descripcion": descripcion,
            "precio": precio,
            "moneda": "COP",
            "imagen_url": platillo.get("imagenUrl"),
            "vegetariano": bool(platillo.get("vegetariano")),
            "vegano": bool(platillo.get("vegano")),
            "picante": bool(platillo.get("picante")),
            "destacado": bool(platillo.get("destacado")),
            "ingredientes": ingredientes,
            "alergenos": alergenos,
        }
        return [
            Documento(
                id=f"plato:{metadata['id']}" + (f"#{posicion}" if posicion else ""),
                tipo="plato",
                texto=fragmento,
                metadata=metadata,
            )
            for posicion, fragmento in enumerate(
                chunk_texto(
                    texto,
                    max_tokens=self._settings.rag_chunk_tokens,
                    overlap=self._settings.rag_chunk_overlap,
                )
            )
        ]


def _texto(valor: Any) -> str:
    return str(valor).strip() if valor is not None else ""


def _lista(valor: Any) -> list[str]:
    if not isinstance(valor, list):
        return []
    return [str(item).strip() for item in valor if str(item).strip()]


def _precio(valor: Any) -> float | None:
    try:
        return float(valor) if valor is not None else None
    except (TypeError, ValueError):
        return None


def _horario(restaurante: dict[str, Any]) -> str:
    apertura = _texto(restaurante.get("horarioApertura"))
    cierre = _texto(restaurante.get("horarioCierre"))
    if apertura and cierre:
        return f"de {apertura} a {cierre}"
    return ""
