"""Prepara un dataset de clasificación a partir de una exportación de Label Studio.

Label Studio exporta un JSON con una tarea por imagen y una anotación de tipo
``choices``. Este script:

1. Lee cada tarea y resuelve la ruta local de la imagen.
2. Se queda con la etiqueta elegida y normaliza el nombre de la carpeta
   (``no comida`` → ``no-comida``).
3. Descarta archivos que no son imágenes y anotaciones vacías.
4. Elimina duplicados por hash para que una misma foto no caiga en train y test.
5. Reparte las imágenes en ``train/``, ``val/`` y ``test/`` manteniendo la
   proporción de cada clase.
6. Escribe un manifiesto CSV con el origen y el destino de cada foto.

Uso típico (desde ``services/vision-service``):

    python entrenamiento/preparar_dataset.py \
        --export ~/Downloads/project-2-at-2026-11-17-16-54-7d167419.json \
        --raiz ~/ \
        --salida datos/comida

El script no sube nada a la red y no modifica las fotos originales.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
import shutil
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote

from PIL import Image, ImageOps, UnidentifiedImageError

EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp"}
# Formatos que OpenCV (y por tanto Ultralytics) decodifica de forma fiable.
FORMATOS_YOLO = {"JPEG", "PNG", "WEBP"}
SPLITS = ("train", "val", "test")


def normalizar_clase(texto: str) -> str:
    """``"No comida"`` → ``"no-comida"`` para que sirva como carpeta."""
    sin_tildes = "".join(
        caracter
        for caracter in unicodedata.normalize("NFKD", texto.strip())
        if not unicodedata.combining(caracter)
    )
    return "-".join(sin_tildes.lower().split())


def ruta_de_imagen(valor: str, raiz: Path) -> Path | None:
    """Extrae la ruta local del valor de Label Studio.

    Formatos vistos en las exportaciones:
      ``/data/local-files/?d=Downloads%5CComida%5Cfoto.jpg``
      ``/data/local-files/?d=/home/ana/fotos/foto.jpg``
    """
    if not valor:
        return None
    if "?d=" in valor:
        valor = valor.split("?d=", 1)[1]
    valor = unquote(valor)
    # Las exportaciones de Windows traen ``\`` escapados tras el decode.
    candidata = Path(valor.replace("\\", "/"))
    if not candidata.is_absolute():
        candidata = raiz / candidata
    return candidata


def etiqueta_de_tarea(tarea: dict) -> str | None:
    """Devuelve la etiqueta elegida o ``None`` si la tarea no está anotada."""
    for anotacion in tarea.get("annotations", []):
        if anotacion.get("was_cancelled"):
            continue
        for resultado in anotacion.get("result", []):
            if resultado.get("type") != "choices":
                continue
            elecciones = resultado.get("value", {}).get("choices") or []
            if elecciones:
                return str(elecciones[0])
    return None


def sha256(ruta: Path) -> str:
    digest = hashlib.sha256()
    with ruta.open("rb") as archivo:
        for bloque in iter(lambda: archivo.read(1024 * 1024), b""):
            digest.update(bloque)
    return digest.hexdigest()


def formato_imagen(ruta: Path) -> str | None:
    """Devuelve el formato real (no la extensión) o ``None`` si está rota."""
    try:
        with Image.open(ruta) as imagen:
            imagen.verify()
            return imagen.format
    except (UnidentifiedImageError, OSError, ValueError):
        return None


def ruta_manifiesto(ruta: Path, base: Path) -> str:
    """Ruta estable para el CSV: relativa cuando vive bajo la base."""
    try:
        return ruta.resolve().relative_to(base.resolve()).as_posix()
    except ValueError:
        return ruta.as_posix()


def repartir(por_clase: dict[str, list[Path]], val: float, test: float, semilla: int):
    """Divide cada clase para conservar la proporción en los tres conjuntos."""
    generador = random.Random(semilla)
    asignacion: dict[str, list[tuple[Path, str]]] = defaultdict(list)
    for clase, rutas in por_clase.items():
        rutas = sorted(rutas)
        generador.shuffle(rutas)
        total = len(rutas)
        n_test = max(1, round(total * test)) if test > 0 else 0
        n_val = max(1, round(total * val)) if val > 0 else 0
        # Nunca dejar train vacío.
        while n_val + n_test >= total and (n_val or n_test):
            if n_test >= n_val and n_test > 1:
                n_test -= 1
            elif n_val > 1:
                n_val -= 1
            else:
                break

        for indice, ruta in enumerate(rutas):
            if indice < n_test:
                split = "test"
            elif indice < n_test + n_val:
                split = "val"
            else:
                split = "train"
            asignacion[clase].append((ruta, split))
    return asignacion


def escribir_imagen(origen: Path, destino: Path, usar_enlace: bool, convertir: bool) -> None:
    """Copia la foto o la convierte a JPEG si su formato no lo lee OpenCV."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    if convertir:
        with Image.open(origen) as imagen:
            # Reorienta según EXIF y descarta canales que YOLO no usa.
            ImageOps.exif_transpose(imagen).convert("RGB").save(
                destino, format="JPEG", quality=95
            )
        return
    copiar_imagen(origen, destino, usar_enlace)


def copiar_imagen(origen: Path, destino: Path, usar_enlace: bool) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if usar_enlace:
        try:
            destino.hardlink_to(origen)
            return
        except (OSError, NotImplementedError):
            pass
    shutil.copy2(origen, destino)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--export", required=True, type=Path, help="JSON exportado de Label Studio")
    parser.add_argument(
        "--raiz",
        type=Path,
        default=Path.home(),
        help="Carpeta contra la que se resuelven las rutas relativas (por defecto ~)",
    )
    parser.add_argument(
        "--salida",
        type=Path,
        default=Path("datos/comida"),
        help="Carpeta del dataset (train/val/test)",
    )
    parser.add_argument("--val", type=float, default=0.15, help="Proporción de validación")
    parser.add_argument("--test", type=float, default=0.15, help="Proporción de prueba")
    parser.add_argument("--semilla", type=int, default=42)
    parser.add_argument(
        "--enlace",
        action="store_true",
        help="Enlazar en vez de copiar (más rápido, pero frágil en OneDrive)",
    )
    parser.add_argument(
        "--sin-copiar",
        action="store_true",
        help="Solo generar el manifiesto y validar las rutas",
    )
    parser.add_argument(
        "--manifiesto",
        type=Path,
        default=None,
        help="CSV de salida (por defecto <salida>/manifiesto.csv)",
    )
    parser.add_argument(
        "--sobrescribir",
        action="store_true",
        help="Borra la carpeta de salida antes de generarla",
    )
    args = parser.parse_args()

    if not (0 <= args.val < 1 and 0 <= args.test < 1 and args.val + args.test < 1):
        parser.error("--val y --test deben sumar menos de 1")

    export = args.export.expanduser()
    if not export.exists():
        print(f"No existe la exportación: {export}", file=sys.stderr)
        return 1

    tareas = json.loads(export.read_text(encoding="utf-8"))
    if not isinstance(tareas, list):
        print("La exportación no es una lista de tareas de Label Studio.", file=sys.stderr)
        return 1

    por_clase: dict[str, list[Path]] = defaultdict(list)
    formatos: dict[Path, str | None] = {}
    descartes: Counter[str] = Counter()
    vistos: dict[str, tuple[str, int]] = {}
    manifiesto: list[dict[str, str]] = []

    for tarea in tareas:
        etiqueta_original = etiqueta_de_tarea(tarea)
        if not etiqueta_original:
            descartes["sin anotación"] += 1
            continue

        ruta = ruta_de_imagen(str(tarea.get("data", {}).get("image", "")), args.raiz)
        if ruta is None or not ruta.exists():
            descartes["archivo no encontrado"] += 1
            continue
        if ruta.suffix.lower() not in EXTENSIONES:
            descartes["no es imagen"] += 1
            continue
        formato = formato_imagen(ruta)
        if formato is None:
            descartes["imagen ilegible"] += 1
            continue

        clase = normalizar_clase(etiqueta_original)
        huella = sha256(ruta)
        if huella in vistos:
            clase_previa, tarea_previa = vistos[huella]
            if clase_previa != clase:
                print(
                    f"Aviso: la tarea {tarea.get('id')} duplica la {tarea_previa} "
                    f"con otra etiqueta ({clase} vs {clase_previa}); se conserva la primera.",
                    file=sys.stderr,
                )
            descartes["duplicado"] += 1
            continue
        vistos[huella] = (clase, int(tarea.get("id", 0)))
        por_clase[clase].append(ruta)
        formatos[ruta] = formato
        manifiesto.append(
            {
                "tarea_id": str(tarea.get("id", "")),
                "archivo_origen": ruta_manifiesto(ruta, args.raiz),
                "archivo_destino": "",
                "clase": clase,
                "split": "",
                "sha256": huella,
            }
        )

    if len(por_clase) < 2:
        print(
            "Se necesitan al menos dos clases. Revisa las etiquetas de la exportación.",
            file=sys.stderr,
        )
        return 1

    asignacion = repartir(por_clase, args.val, args.test, args.semilla)
    indice_manifiesto = {fila["sha256"]: fila for fila in manifiesto}
    transcodificadas = 0

    if not args.sin_copiar and args.salida.exists():
        if not args.sobrescribir:
            print(
                f"La carpeta {args.salida} ya existe. Usa --sobrescribir para rehacerla.",
                file=sys.stderr,
            )
            return 1
        shutil.rmtree(args.salida)

    for clase, pares in asignacion.items():
        for origen, split in pares:
            fila = indice_manifiesto[sha256(origen)]
            fila["split"] = split
            if args.sin_copiar:
                continue
            convertir = formatos.get(origen) not in FORMATOS_YOLO
            destino = args.salida / split / clase / origen.name
            if convertir:
                destino = destino.with_suffix(".jpg")
                transcodificadas += 1
            # Evita colisiones de nombre entre carpetas distintas.
            if destino.exists():
                destino = destino.with_name(
                    f"{origen.stem}-{sha256(origen)[:8]}{destino.suffix}"
                )
            escribir_imagen(origen, destino, args.enlace, convertir)
            fila["archivo_destino"] = ruta_manifiesto(destino, args.salida)

    if not args.sin_copiar:
        print(f"Dataset creado en {args.salida}")
        if transcodificadas:
            print(f"Imágenes convertidas a JPEG (AVIF/HEIC u otro formato): {transcodificadas}")

    destino_manifiesto = args.manifiesto or (args.salida / "manifiesto.csv")
    destino_manifiesto.parent.mkdir(parents=True, exist_ok=True)
    campos = ["tarea_id", "archivo_origen", "archivo_destino", "clase", "split", "sha256"]
    with destino_manifiesto.open("w", newline="", encoding="utf-8") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=campos)
        escritor.writeheader()
        for fila in manifiesto:
            escritor.writerow({campo: fila.get(campo, "") for campo in campos})
    print(f"Manifiesto: {destino_manifiesto}")

    print("\nResumen por split y clase:")
    for split in SPLITS:
        conteo = Counter(
            clase for clase, pares in asignacion.items() for _, destino in pares if destino == split
        )
        if sum(conteo.values()):
            detalle = ", ".join(f"{clase}={n}" for clase, n in sorted(conteo.items()))
            print(f"  {split:5s} {sum(conteo.values()):4d}  ({detalle})")
    print(f"  total {len(vistos):4d}")
    if descartes:
        print("\nDescartes:")
        for motivo, cantidad in descartes.most_common():
            print(f"  {motivo}: {cantidad}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
