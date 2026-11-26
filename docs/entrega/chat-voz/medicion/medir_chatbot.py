"""Mide el chatbot real contra el stack local.

Uso:
    python medir_chatbot.py

Guarda `datos/resultados.json` y `datos/resultados.csv`. El primer request se
marca como `cold_start`: conviene reiniciar `tukituki-ai-gatewaybe` antes de
ejecutarlo para medir la construcción inicial del índice RAG.
"""

from __future__ import annotations

import csv
import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "http://localhost:8084"
LOGIN_URL = "http://localhost:3001/v1/identidad/login"
CORREO = "cliente@tukituki.local"
CLAVE = "Demo12345"
REPETICIONES = 3
PAUSA_SEGUNDOS = 3.0

CONSULTAS = [
    ("recomendacion", "¿Qué me recomiendas para almorzar?"),
    ("recomendacion", "¿Qué puedo comer hoy?"),
    ("recomendacion", "Recomiéndame un plato típico para almorzar"),
    ("recomendacion", "Busco algo delicioso para compartir"),
    ("filtro_vegetariano", "Algo vegetariano y barato"),
    ("filtro_postre", "Quiero un postre"),
    ("dato_plato", "¿Cuánto cuesta el Ajiaco Bogotano?"),
    ("plataforma", "¿Cómo funciona el panel de restaurantes?"),
    ("saludo", "Hola"),
]

SALIDA = Path(__file__).resolve().parent
DATOS = SALIDA / "datos"
DATOS.mkdir(parents=True, exist_ok=True)

SIN_PROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def solicitar(url: str, *, payload: dict | None = None, token: str | None = None) -> tuple[dict, float]:
    datos = json.dumps(payload).encode("utf-8") if payload is not None else None
    cabeceras = {"Content-Type": "application/json"}
    if token:
        cabeceras["Authorization"] = f"Bearer {token}"
    peticion = urllib.request.Request(url, data=datos, headers=cabeceras, method="POST" if datos else "GET")
    inicio = time.perf_counter()
    with SIN_PROXY.open(peticion, timeout=240) as respuesta:
        cuerpo = json.loads(respuesta.read().decode("utf-8"))
    return cuerpo, round((time.perf_counter() - inicio) * 1000, 1)


def iniciar_sesion() -> str | None:
    try:
        sesion, _ = solicitar(
            LOGIN_URL,
            payload={"email": CORREO, "password": CLAVE},
        )
        return sesion.get("accessToken")
    except Exception as error:  # noqa: BLE001 - el modo anónimo es un respaldo
        print(f"[aviso] sin sesión: {error}")
        return None


def medir(
    prompt: str,
    categoria: str,
    repeticion: int,
    token: str | None,
    *,
    reintento: bool = False,
) -> dict:
    try:
        respuesta, pared_ms = solicitar(
            f"{BASE}/api/v1/ai/recomendar",
            payload={"mensaje": prompt, "historial": []},
            token=token,
        )
    except urllib.error.HTTPError as error:
        detalle = error.read().decode("utf-8", "replace")[:300]
        if error.code == 429 and not reintento:
            print("  límite de peticiones; espero 30 s y reintento")
            time.sleep(30)
            return medir(prompt, categoria, repeticion, token, reintento=True)
        return {
            "consulta": prompt,
            "categoria": categoria,
            "repeticion": repeticion,
            "error": f"HTTP {error.code}: {detalle}",
            "wall_ms": None,
        }
    except Exception as error:  # noqa: BLE001 - se reporta tal cual
        return {
            "consulta": prompt,
            "categoria": categoria,
            "repeticion": repeticion,
            "error": str(error)[:300],
            "wall_ms": None,
        }

    uso = respuesta.get("usage") or {}
    latencia = int(respuesta.get("latency_ms") or 0)
    recuperacion = int(respuesta.get("recuperacion_ms") or 0)
    return {
        "consulta": prompt,
        "categoria": categoria,
        "repeticion": repeticion,
        "wall_ms": pared_ms,
        "latency_ms": latencia,
        "recuperacion_ms": recuperacion,
        "generacion_ms": max(0, latencia - recuperacion),
        "prompt_tokens": int(uso.get("prompt_tokens") or 0),
        "completion_tokens": int(uso.get("completion_tokens") or 0),
        "total_tokens": int(uso.get("total_tokens") or 0),
        "contexto_tokens": int(respuesta.get("contexto_tokens") or 0),
        "attempts": int(respuesta.get("attempts") or 0),
        "modelo": respuesta.get("modelo"),
        "fuentes": len(respuesta.get("fuentes") or []),
        "respuesta_chars": len(respuesta.get("respuesta") or ""),
        "request_id": respuesta.get("request_id"),
        "respuesta": respuesta.get("respuesta"),
        "error": None,
    }


def main() -> None:
    token = iniciar_sesion()
    print("token:", "sí" if token else "no (anónimo)")

    # Primer request: construcción del índice RAG.
    frio = medir(CONSULTAS[0][1], "arranque_en_frio", 0, token)
    print(
        "frío:",
        frio.get("error")
        or f"{frio.get('latency_ms')} ms · {frio.get('total_tokens')} tokens",
    )

    filas: list[dict] = []
    for categoria, prompt in CONSULTAS:
        for repeticion in range(1, REPETICIONES + 1):
            fila = medir(prompt, categoria, repeticion, token)
            filas.append(fila)
            print(
                f"{categoria:20} r{repeticion} "
                f"{fila.get('latency_ms')} ms · "
                f"{fila.get('total_tokens')} tokens · "
                f"{fila.get('modelo')}"
            )
            time.sleep(PAUSA_SEGUNDOS)

    metadatos = {
        "medido_en": datetime.now(timezone.utc).isoformat(),
        "endpoint": f"{BASE}/api/v1/ai/recomendar",
        "consultas": len(CONSULTAS),
        "repeticiones": REPETICIONES,
        "pausa_segundos": PAUSA_SEGUNDOS,
        "modelo_chat": "tuki-chef",
        "modelo_embeddings": "nomic-embed-text",
    }
    (DATOS / "resultados.json").write_text(
        json.dumps({"metadatos": metadatos, "frio": frio, "filas": filas}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    columnas = [
        "consulta",
        "categoria",
        "repeticion",
        "wall_ms",
        "latency_ms",
        "recuperacion_ms",
        "generacion_ms",
        "prompt_tokens",
        "completion_tokens",
        "total_tokens",
        "contexto_tokens",
        "attempts",
        "modelo",
        "fuentes",
        "respuesta_chars",
        "request_id",
        "error",
    ]
    with (DATOS / "resultados.csv").open("w", newline="", encoding="utf-8") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas, extrasaction="ignore")
        escritor.writeheader()
        escritor.writerows(filas)
    print("guardado en", DATOS)


if __name__ == "__main__":
    main()
