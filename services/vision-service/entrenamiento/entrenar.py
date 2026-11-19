"""Entrena el clasificador comida / no comida con Ultralytics.

Parte de un modelo preentrenado de clasificación (por defecto ``yolo11n-cls``),
usa el dataset que genera ``preparar_dataset.py`` y deja los pesos listos en
``modelos/`` para que el servicio de visión los cargue.

Uso típico (desde ``services/vision-service``):

    python entrenamiento/entrenar.py --datos datos/comida --epocas 20

En CPU tarda unos minutos por época con ~1000 fotos. En una GPU basta con
``--dispositivo 0``.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import UTC, datetime
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--datos", type=Path, default=Path("datos/comida"))
    parser.add_argument(
        "--base",
        default="yolo11n-cls.pt",
        help="Pesos preentrenados de clasificación de Ultralytics",
    )
    parser.add_argument("--epocas", type=int, default=20)
    parser.add_argument("--imgsz", type=int, default=224)
    parser.add_argument("--lote", type=int, default=16)
    parser.add_argument("--paciencia", type=int, default=8, help="Épocas sin mejora")
    parser.add_argument("--semilla", type=int, default=42)
    parser.add_argument("--dispositivo", default="cpu", help="cpu o el id de la GPU (0)")
    parser.add_argument("--trabajadores", type=int, default=0)
    parser.add_argument("--proyecto", type=Path, default=Path("modelos/entrenamientos"))
    parser.add_argument("--nombre", default="comida-v1")
    parser.add_argument("--salida", type=Path, default=Path("modelos/comida-v1.pt"))
    args = parser.parse_args()

    if not (args.datos / "train").is_dir():
        print(
            f"No hay {args.datos / 'train'}. Ejecuta antes preparar_dataset.py.",
            file=sys.stderr,
        )
        return 1

    from ultralytics import YOLO

    print(f"Entrenando {args.base} con {args.datos} durante {args.epocas} épocas…")
    modelo = YOLO(args.base)
    modelo.train(
        data=str(args.datos.resolve()),
        epochs=args.epocas,
        imgsz=args.imgsz,
        batch=args.lote,
        device=args.dispositivo,
        workers=args.trabajadores,
        patience=args.paciencia,
        seed=args.semilla,
        project=str(args.proyecto.resolve()),
        name=args.nombre,
        exist_ok=True,
        pretrained=True,
        plots=True,
        amp=args.dispositivo != "cpu",
    )

    mejor = Path(modelo.trainer.save_dir) / "weights" / "best.pt"
    if not mejor.exists():
        print(f"No se generó {mejor}", file=sys.stderr)
        return 1

    args.salida.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(mejor, args.salida)

    metricas: dict = {}
    if (args.datos / "test").is_dir():
        final = YOLO(str(args.salida))
        validacion = final.val(
            data=str(args.datos.resolve()),
            split="test",
            device=args.dispositivo,
        )
        metricas = {
            "split": "test",
            "top1": float(getattr(validacion, "top1", 0.0)),
            "top5": float(getattr(validacion, "top5", 0.0)),
        }

    informe = {
        "modelo": args.salida.name,
        "fecha": datetime.now(UTC).isoformat(timespec="seconds"),
        "dataset": str(args.datos),
        "clases": [str(nombre) for nombre in modelo.names.values()],
        "entrenamiento": {
            "base": args.base,
            "epocas": args.epocas,
            "imgsz": args.imgsz,
            "lote": args.lote,
            "semilla": args.semilla,
            "dispositivo": args.dispositivo,
        },
        "validacion_ultralytics": metricas,
    }
    ruta_informe = args.salida.with_suffix(".metricas.json")
    ruta_informe.write_text(json.dumps(informe, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\nModelo: {args.salida}")
    print(f"Métricas: {ruta_informe}")
    if metricas:
        print(f"Top-1 en test: {metricas['top1']:.3f}")
    print("Siguiente paso: python entrenamiento/evaluar.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
