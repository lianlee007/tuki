#!/usr/bin/env python3
"""Valida el catálogo mínimo de Backstage (`catalog-info.yaml`).

Comprueba que las entidades esperadas existan y que `owner`, `system` y `domain`
apunten a entidades declaradas. Lo usa la CI y también `pnpm verificar`.

Uso:
    python scripts/validar-catalogo.py
"""

from __future__ import annotations

import os
import pathlib
import sys

try:
    import yaml
except ImportError:  # pragma: no cover - depende del entorno
    print("Falta PyYAML. Instálalo con: python -m pip install pyyaml==6.0.3")
    raise SystemExit(2)

RAIZ = pathlib.Path(__file__).resolve().parent.parent
CATALOGO = RAIZ / "catalog-info.yaml"
ENTIDADES_ESPERADAS = 8


def main() -> int:
    docs = [d for d in yaml.safe_load_all(CATALOGO.read_text(encoding="utf-8")) if d]
    kinds = {(d["kind"], d["metadata"]["name"]) for d in docs}
    errores: list[str] = []

    if len(docs) != ENTIDADES_ESPERADAS:
        errores.append(f"se esperaban {ENTIDADES_ESPERADAS} entidades, hay {len(docs)}")

    for doc in docs:
        kind = doc["kind"]
        name = doc["metadata"]["name"]
        spec = doc.get("spec", {})
        for campo, tipo in (("owner", "Group"), ("system", "System"), ("domain", "Domain")):
            valor = spec.get(campo)
            if valor and (tipo, valor) not in kinds:
                errores.append(f"{kind}/{name}: {campo} inexistente {valor}")

    if errores:
        for error in errores:
            prefijo = "::error::" if os.environ.get("GITHUB_ACTIONS") else "FALLO: "
            print(f"{prefijo}{error}")
        return 1

    print(f"Catálogo válido: {len(docs)} entidades y referencias correctas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
