"""Genera las gráficas y el resumen numérico a partir de resultados.json."""

from __future__ import annotations

import json
import statistics
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

RAIZ = Path(__file__).resolve().parent
DATOS = RAIZ / "datos"
GRAFICAS = RAIZ / "graficas"
GRAFICAS.mkdir(parents=True, exist_ok=True)

datos = json.loads((DATOS / "resultados.json").read_text(encoding="utf-8"))
filas = [fila for fila in datos["filas"] if not fila.get("error")]
frio = datos["frio"]

ETIQUETAS = {
    "¿Qué me recomiendas para almorzar?": "Recomienda\nalmorzar",
    "¿Qué puedo comer hoy?": "Qué comer\nhoy",
    "Recomiéndame un plato típico para almorzar": "Plato típico\npara almorzar",
    "Busco algo delicioso para compartir": "Algo para\ncompartir",
    "Algo vegetariano y barato": "Vegetariano\nbarato",
    "Quiero un postre": "Un postre",
    "¿Cuánto cuesta el Ajiaco Bogotano?": "Precio del\najiaco",
    "¿Cómo funciona el panel de restaurantes?": "Panel de\nrestaurantes",
    "Hola": "Saludo",
}
ORDEN = list(ETIQUETAS)

COLORES = {
    "fondo": "#FBF6EA",
    "texto": "#2D2A26",
    "suave": "#8A7E72",
    "terracota": "#B85C38",
    "terracota_claro": "#E6B8A4",
    "verde": "#2F7A58",
    "verde_claro": "#A8C9B8",
    "dorado": "#C9A227",
    "linea": "#D9CDBE",
}

plt.rcParams.update(
    {
        "figure.facecolor": COLORES["fondo"],
        "axes.facecolor": COLORES["fondo"],
        "savefig.facecolor": COLORES["fondo"],
        "font.family": "DejaVu Sans",
        "text.color": COLORES["texto"],
        "axes.labelcolor": COLORES["texto"],
        "xtick.color": COLORES["suave"],
        "ytick.color": COLORES["texto"],
        "axes.edgecolor": COLORES["linea"],
        "axes.grid": True,
        "grid.color": "#E9DFD2",
        "grid.linewidth": 0.8,
        "grid.alpha": 0.75,
        "axes.axisbelow": True,
    }
)


def promedio(valores: list[float]) -> float:
    return round(sum(valores) / len(valores), 1) if valores else 0.0


def percentil(valores: list[float], p: float) -> float:
    if not valores:
        return 0.0
    ordenados = sorted(valores)
    indice = (len(ordenados) - 1) * p
    inferior = int(indice)
    superior = min(inferior + 1, len(ordenados) - 1)
    fraccion = indice - inferior
    return round(ordenados[inferior] + (ordenados[superior] - ordenados[inferior]) * fraccion, 1)


def por_consulta() -> list[dict]:
    resultado = []
    for consulta in ORDEN:
        grupo = [fila for fila in filas if fila["consulta"] == consulta]
        if not grupo:
            continue
        resultado.append(
            {
                "consulta": consulta,
                "etiqueta": ETIQUETAS[consulta],
                "n": len(grupo),
                "latencia": promedio([f["latency_ms"] for f in grupo]),
                "recuperacion": promedio([f["recuperacion_ms"] for f in grupo]),
                "generacion": promedio([f["generacion_ms"] for f in grupo]),
                "prompt_tokens": promedio([f["prompt_tokens"] for f in grupo]),
                "completion_tokens": promedio([f["completion_tokens"] for f in grupo]),
                "total_tokens": promedio([f["total_tokens"] for f in grupo]),
                "fuentes": promedio([f["fuentes"] for f in grupo]),
            }
        )
    return resultado


def grafica_latencia(resumen: list[dict]) -> None:
    fig, ax = plt.subplots(figsize=(11, 6.4))
    y = range(len(resumen))
    recuperacion = [f["recuperacion"] for f in resumen]
    generacion = [f["generacion"] for f in resumen]
    ax.barh(y, recuperacion, color=COLORES["verde_claro"], edgecolor="white", label="Recuperación / reglas")
    ax.barh(y, generacion, left=recuperacion, color=COLORES["terracota"], edgecolor="white", label="Generación con Ollama")
    for indice, fila in enumerate(resumen):
        total = fila["latencia"]
        ax.text(total + 90, indice, f"{total:,.0f} ms", va="center", fontsize=9, color=COLORES["texto"])
    ax.set_yticks(list(y))
    ax.set_yticklabels([f["etiqueta"] for f in resumen], fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel("Latencia media por consulta (ms)")
    ax.set_xlim(0, max(f["latencia"] for f in resumen) * 1.22)
    ax.legend(loc="lower right", frameon=False, fontsize=9)
    ax.set_title("Latencia media por tipo de consulta", loc="left", fontsize=15, fontweight="bold", pad=14)
    ax.text(
        0,
        1.01,
        "3 repeticiones por consulta · gateway + RAG + Ollama · sin el arranque en frío",
        transform=ax.transAxes,
        fontsize=9,
        color=COLORES["suave"],
    )
    fig.tight_layout()
    fig.savefig(GRAFICAS / "01-latencia-por-consulta.png", dpi=200)
    plt.close(fig)


def grafica_tokens(resumen: list[dict]) -> None:
    fig, ax = plt.subplots(figsize=(11, 6.4))
    y = range(len(resumen))
    prompt = [f["prompt_tokens"] for f in resumen]
    completion = [f["completion_tokens"] for f in resumen]
    ax.barh(y, prompt, color=COLORES["verde"], edgecolor="white", label="Prompt (contexto + pregunta)")
    ax.barh(y, completion, left=prompt, color=COLORES["dorado"], edgecolor="white", label="Respuesta")
    for indice, fila in enumerate(resumen):
        total = fila["total_tokens"]
        etiqueta = f"{total:,.0f} tok" if total else "0 tok · ruta sin LLM"
        ax.text(total + 18, indice, etiqueta, va="center", fontsize=9, color=COLORES["texto"])
    ax.set_yticks(list(y))
    ax.set_yticklabels([f["etiqueta"] for f in resumen], fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel("Tokens medios por consulta")
    ax.set_xlim(0, max(f["total_tokens"] for f in resumen) * 1.35)
    ax.legend(loc="lower right", frameon=False, fontsize=9)
    ax.set_title("Consumo de tokens por tipo de consulta", loc="left", fontsize=15, fontweight="bold", pad=14)
    ax.text(
        0,
        1.01,
        "Las rutas factuales, de filtro y de plataforma responden sin invocar al modelo",
        transform=ax.transAxes,
        fontsize=9,
        color=COLORES["suave"],
    )
    fig.tight_layout()
    fig.savefig(GRAFICAS / "02-tokens-por-consulta.png", dpi=200)
    plt.close(fig)


def grafica_dispersion() -> None:
    fig, ax = plt.subplots(figsize=(11, 6.2))
    paleta = {
        "recomendacion": COLORES["terracota"],
        "filtro_vegetariano": COLORES["verde"],
        "filtro_postre": COLORES["verde_claro"],
        "dato_plato": COLORES["dorado"],
        "plataforma": "#6B7C93",
        "saludo": "#B9AFA4",
    }
    nombres = {
        "recomendacion": "Recomendación",
        "filtro_vegetariano": "Filtro vegetariano",
        "filtro_postre": "Filtro postre",
        "dato_plato": "Dato de plato",
        "plataforma": "Plataforma",
        "saludo": "Saludo",
    }
    for categoria, color in paleta.items():
        puntos = [f for f in filas if f["categoria"] == categoria]
        if not puntos:
            continue
        ax.scatter(
            [p["total_tokens"] for p in puntos],
            [p["latency_ms"] for p in puntos],
            s=70,
            color=color,
            edgecolor="white",
            linewidth=1.2,
            label=nombres.get(categoria, categoria),
            zorder=3,
        )
    fallback = next((f for f in filas if f["total_tokens"] == 0 and f["latency_ms"] > 1000), None)
    if fallback:
        ax.annotate(
            "fallback a lista\nsin tokens",
            xy=(fallback["total_tokens"], fallback["latency_ms"]),
            xytext=(260, 4200),
            fontsize=8.5,
            color=COLORES["suave"],
            arrowprops={"arrowstyle": "->", "color": COLORES["suave"], "lw": 1},
        )
    ax.set_xlabel("Tokens totales de la respuesta")
    ax.set_ylabel("Latencia observada (ms)")
    ax.set_xlim(-50, 1900)
    ax.set_ylim(-200, 8000)
    ax.legend(frameon=False, fontsize=9, loc="upper left")
    ax.set_title("Tokens frente a latencia (27 ejecuciones)", loc="left", fontsize=15, fontweight="bold", pad=14)
    ax.text(
        0,
        1.01,
        "Cada punto es una ejecución real; las rutas deterministas se agrupan en 0 tokens",
        transform=ax.transAxes,
        fontsize=9,
        color=COLORES["suave"],
    )
    fig.tight_layout()
    fig.savefig(GRAFICAS / "03-tokens-vs-latencia.png", dpi=200)
    plt.close(fig)


def grafica_frio_caliente(resumen: list[dict]) -> None:
    calientes = [f for f in filas]
    media_caliente = promedio([f["latency_ms"] for f in calientes])
    mediana_caliente = statistics.median([f["latency_ms"] for f in calientes])
    recomendacion = next((f for f in resumen if f["consulta"] == ORDEN[0]), None)

    fig, ax = plt.subplots(figsize=(10, 5.6))
    categorias = ["Arranque\nen frío", "Caliente\n(media global)", "Caliente\n(recomendación)"]
    valores = [frio["latency_ms"], media_caliente, recomendacion["latencia"] if recomendacion else 0]
    recuperaciones = [frio["recuperacion_ms"], promedio([f["recuperacion_ms"] for f in calientes]), recomendacion["recuperacion"] if recomendacion else 0]
    generaciones = [max(0, valores[i] - recuperaciones[i]) for i in range(3)]
    x = range(3)
    ax.bar(x, recuperaciones, color=COLORES["verde_claro"], edgecolor="white", label="Recuperación / índice")
    ax.bar(x, generaciones, bottom=recuperaciones, color=COLORES["terracota"], edgecolor="white", label="Generación con Ollama")
    for indice, valor in enumerate(valores):
        ax.text(indice, valor + 350, f"{valor:,.0f} ms", ha="center", fontsize=10, fontweight="bold")
    ax.set_xticks(list(x))
    ax.set_xticklabels(categorias, fontsize=9)
    ax.set_ylabel("Latencia (ms)")
    ax.set_ylim(0, max(valores) * 1.18)
    ax.legend(frameon=False, fontsize=9, loc="upper right")
    ax.set_title("Costo del primer request frente a las respuestas calientes", loc="left", fontsize=15, fontweight="bold", pad=14)
    ax.text(
        0,
        1.01,
        f"El arranque en frío incluye la construcción del índice RAG; mediana caliente: {mediana_caliente:,.0f} ms",
        transform=ax.transAxes,
        fontsize=9,
        color=COLORES["suave"],
    )
    fig.tight_layout()
    fig.savefig(GRAFICAS / "04-frio-vs-caliente.png", dpi=200)
    plt.close(fig)


def grafica_rutas() -> dict:
    con_llm = [f for f in filas if f["total_tokens"] > 0]
    sin_llm = [f for f in filas if f["total_tokens"] == 0]
    fig, ax = plt.subplots(figsize=(7.2, 5.2))
    valores = [len(con_llm), len(sin_llm)]
    etiquetas = ["Con LLM\n(tuki-chef)", "Sin LLM\n(reglas / catálogo)"]
    colores = [COLORES["terracota"], COLORES["verde"]]
    cuñas, _ = ax.pie(
        valores,
        colors=colores,
        startangle=90,
        wedgeprops={"width": 0.38, "edgecolor": COLORES["fondo"], "linewidth": 3},
    )
    ax.text(0, 0.08, f"{len(filas)}", ha="center", va="center", fontsize=24, fontweight="bold")
    ax.text(0, -0.18, "ejecuciones", ha="center", va="center", fontsize=9, color=COLORES["suave"])
    ax.legend(
        cuñas,
        [f"{etiquetas[i]} · {valores[i]}" for i in range(2)],
        loc="lower center",
        bbox_to_anchor=(0.5, -0.18),
        frameon=False,
        fontsize=9,
    )
    ax.set_title("Reparto de rutas de respuesta", loc="left", fontsize=15, fontweight="bold", pad=14)
    fig.tight_layout()
    fig.savefig(GRAFICAS / "05-rutas-llm.png", dpi=200)
    plt.close(fig)
    return {"con_llm": len(con_llm), "sin_llm": len(sin_llm)}


def main() -> None:
    resumen = por_consulta()
    grafica_latencia(resumen)
    grafica_tokens(resumen)
    grafica_dispersion()
    grafica_frio_caliente(resumen)
    rutas = grafica_rutas()

    latencias = [f["latency_ms"] for f in filas]
    generativas = [f for f in filas if f["total_tokens"] > 0]
    resumen_global = {
        "ejecuciones": len(filas),
        "latencias": {
            "media": promedio(latencias),
            "mediana": round(statistics.median(latencias), 1),
            "p95": percentil(latencias, 0.95),
            "min": min(latencias),
            "max": max(latencias),
        },
        "tokens": {
            "total": sum(f["total_tokens"] for f in filas),
            "prompt_total": sum(f["prompt_tokens"] for f in filas),
            "completion_total": sum(f["completion_tokens"] for f in filas),
            "media_por_ejecucion": promedio([f["total_tokens"] for f in filas]),
            "media_solo_llm": promedio([f["total_tokens"] for f in generativas]),
            "prompt_medio_solo_llm": promedio([f["prompt_tokens"] for f in generativas]),
            "completion_medio_solo_llm": promedio([f["completion_tokens"] for f in generativas]),
        },
        "rutas": rutas,
        "frio": {
            "latencia_ms": frio["latency_ms"],
            "recuperacion_ms": frio["recuperacion_ms"],
            "tokens": frio["total_tokens"],
        },
        "recomendacion": next((f for f in resumen if f["consulta"] == ORDEN[0]), None),
        "por_consulta": resumen,
    }
    (DATOS / "resumen.json").write_text(
        json.dumps(resumen_global, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(resumen_global, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
