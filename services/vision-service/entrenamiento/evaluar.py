"""Evalúa el clasificador en el split de prueba y propone el umbral de comida.

Genera un informe JSON junto al modelo (``comida-v1.metricas.json``) que el
servicio expone en ``GET /api/v1/vision/modelo``. El barrido de umbrales existe
porque la decisión del producto no es la clase más probable, sino la
probabilidad de que la foto sea comida: si baja del umbral, se rechaza.

Uso típico (desde ``services/vision-service``):

    python entrenamiento/evaluar.py --modelo modelos/comida-v1.pt --datos datos/comida
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
UMBRALES = [round(0.05 * paso, 2) for paso in range(1, 20)]  # 0.05 … 0.95


def _normalizar(nombre: str) -> str:
    return " ".join(
        nombre.lower()
        .replace("-", " ")
        .replace("_", " ")
        .replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
        .split()
    )


def _metricas(probabilidades: list[float], reales: list[bool], umbral: float) -> dict:
    tp = fp = tn = fn = 0
    for probabilidad, real in zip(probabilidades, reales, strict=True):
        predicho = probabilidad >= umbral
        if predicho and real:
            tp += 1
        elif predicho:
            fp += 1
        elif real:
            fn += 1
        else:
            tn += 1

    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    exactitud = (tp + tn) / len(reales) if reales else 0.0
    return {
        "umbral": umbral,
        "accuracy": round(exactitud, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "verdaderos_positivos": tp,
        "falsos_positivos": fp,
        "verdaderos_negativos": tn,
        "falsos_negativos": fn,
    }


def _graficar_matriz(referencia: dict, ruta: Path) -> None:
    """PNG reproducible de la matriz de confusión en el umbral desplegado."""
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    # Filas: clase real. Columnas: clase predicha.
    matriz = [
        [referencia["verdaderos_positivos"], referencia["falsos_negativos"]],
        [referencia["falsos_positivos"], referencia["verdaderos_negativos"]],
    ]
    figura, eje = plt.subplots(figsize=(4.2, 3.8))
    imagen = eje.imshow(matriz, cmap="Blues", vmin=0)
    eje.set_xticks([0, 1], ["comida", "no-comida"])
    eje.set_yticks([0, 1], ["comida", "no-comida"])
    eje.set_xlabel("Predicho")
    eje.set_ylabel("Real")
    eje.set_title(f"Test · umbral {referencia['umbral']:.2f}")
    for fila in range(2):
        for columna in range(2):
            valor = matriz[fila][columna]
            eje.text(
                columna,
                fila,
                str(valor),
                ha="center",
                va="center",
                color="white" if valor > max(max(fila) for fila in matriz) / 2 else "black",
                fontsize=13,
                fontweight="bold",
            )
    figura.colorbar(imagen, ax=eje, fraction=0.046, pad=0.04)
    figura.tight_layout()
    ruta.parent.mkdir(parents=True, exist_ok=True)
    figura.savefig(ruta, dpi=150)
    plt.close(figura)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--modelo", type=Path, default=Path("modelos/comida-v1.pt"))
    parser.add_argument("--datos", type=Path, default=Path("datos/comida"))
    parser.add_argument("--split", default="test", choices=["val", "test"])
    parser.add_argument("--imgsz", type=int, default=224)
    parser.add_argument("--lote", type=int, default=16)
    parser.add_argument("--dispositivo", default="cpu")
    parser.add_argument("--umbral", type=float, default=0.5, help="Umbral de referencia")
    parser.add_argument(
        "--grafico",
        type=Path,
        default=None,
        help="Guarda la matriz de confusión del umbral de referencia como PNG",
    )
    args = parser.parse_args()

    carpeta = args.datos / args.split
    if not carpeta.is_dir():
        print(f"No existe {carpeta}. Prepara el dataset primero.", file=sys.stderr)
        return 1
    if not args.modelo.exists():
        print(f"No existe el modelo {args.modelo}.", file=sys.stderr)
        return 1

    rutas = sorted(
        ruta
        for ruta in carpeta.rglob("*")
        if ruta.is_file() and ruta.suffix.lower() in EXTENSIONES
    )
    if not rutas:
        print(f"No hay imágenes en {carpeta}.", file=sys.stderr)
        return 1

    from ultralytics import YOLO

    modelo = YOLO(str(args.modelo))
    etiquetas = [str(nombre) for nombre in modelo.names.values()]
    indices_comida = [
        indice for indice, nombre in enumerate(etiquetas) if _normalizar(nombre) == "comida"
    ]
    if not indices_comida:
        print(f"El modelo no tiene la clase 'comida': {etiquetas}", file=sys.stderr)
        return 1
    indice_comida = indices_comida[0]

    resultados = modelo.predict(
        source=[str(ruta) for ruta in rutas],
        imgsz=args.imgsz,
        batch=args.lote,
        device=args.dispositivo,
        verbose=False,
        stream=True,
    )

    probabilidades: list[float] = []
    reales: list[bool] = []
    for ruta, resultado in zip(rutas, resultados, strict=True):
        valores = resultado.probs.data.tolist()
        probabilidades.append(float(valores[indice_comida]))
        # La carpeta inmediata es la etiqueta: test/comida/..., test/no-comida/...
        reales.append(_normalizar(ruta.parent.name) == "comida")

    barrido = [_metricas(probabilidades, reales, umbral) for umbral in UMBRALES]
    # Mejor F1; en empate, el umbral más cercano a 0,5 (menos agresivo).
    mejor = max(barrido, key=lambda fila: (fila["f1"], -abs(fila["umbral"] - 0.5)))
    referencia = _metricas(probabilidades, reales, args.umbral)

    informe = {}
    ruta_informe = args.modelo.with_suffix(".metricas.json")
    if ruta_informe.exists():
        try:
            informe = json.loads(ruta_informe.read_text(encoding="utf-8"))
        except ValueError:
            informe = {}

    informe.update(
        {
            "modelo": args.modelo.name,
            "fecha": datetime.now(UTC).isoformat(timespec="seconds"),
            "dataset": str(args.datos),
            "split": args.split,
            "n": len(rutas),
            "clases": etiquetas,
            "umbral_recomendado": mejor["umbral"],
            "metricas": {
                "umbral": referencia["umbral"],
                "accuracy": referencia["accuracy"],
                "precision": referencia["precision"],
                "recall": referencia["recall"],
                "f1": referencia["f1"],
                "matriz_confusion": {
                    "verdaderos_positivos": referencia["verdaderos_positivos"],
                    "falsos_positivos": referencia["falsos_positivos"],
                    "verdaderos_negativos": referencia["verdaderos_negativos"],
                    "falsos_negativos": referencia["falsos_negativos"],
                },
            },
            "barrido_umbral": barrido,
        }
    )
    ruta_informe.write_text(
        json.dumps(informe, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    if args.grafico:
        _graficar_matriz(referencia, args.grafico)

    print(f"Imágenes evaluadas: {len(rutas)}")
    print(
        f"Umbral {args.umbral:.2f}: accuracy={referencia['accuracy']:.3f} "
        f"precision={referencia['precision']:.3f} recall={referencia['recall']:.3f} "
        f"f1={referencia['f1']:.3f}"
    )
    print(f"Umbral recomendado por F1: {mejor['umbral']:.2f} (f1={mejor['f1']:.3f})")
    print(f"Informe: {ruta_informe}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
