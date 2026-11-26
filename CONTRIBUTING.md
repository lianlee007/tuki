# Cómo contribuir a TukiTuki

Gracias por querer aportar. Este repositorio es un monorepo de pnpm con tres
frontends, seis servicios Node, dos servicios Python y paquetes compartidos.
Antes de abrir un cambio, revisa el [README](README.md) y
[`docs/convenciones.md`](docs/convenciones.md).

## Requisitos

- Node.js 22 y pnpm 12.14 (`corepack enable`).
- Docker Desktop con Compose v2.
- Python 3.12 solo para `ai-gateway` y `vision-service`.
- Para E2E: `pnpm exec playwright install chromium`.

## Ramas

- `main` es la rama estable y está protegida con los checks de CI.
- Una rama por tema, con prefijo:
  - `feat/` para funcionalidad.
  - `fix/` para correcciones.
  - `docs/` para documentación.
  - `chore/` para mantenimiento.
  - `test/` para pruebas.
- No se trabaja directamente sobre `main`. Las ramas de respaldo
  (`respaldo/...`) no se fusionan; solo conservan trabajo histórico.

Ejemplo:

```bash
git switch -c feat/resenas-con-fotos
```

## Commits

Se usan Conventional Commits en español:

```text
feat(panel): agrega la respuesta a reseñas
fix(ci): corrige el tag de Trivy
docs(monografia): actualiza la matriz de cumplimiento
test(ai): ajusta la aserción del prompt
```

Un commit debe explicar el qué y el porqué, no solo el archivo. Evita
`cambios`, `arreglos` o `update`.

## Antes de abrir el pull request

Ejecuta la misma puerta que corre el CI:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Para los servicios Python:

```bash
cd services/ai-gateway
pip install -r requirements-dev.txt
ruff check app tests
pytest -q

cd ../vision-service
pip install -r requirements-test.txt
pytest -q
```

Para los manifiestos:

```bash
kubectl kustomize infra/k8s/overlays/local > /dev/null
kubectl kustomize infra/k8s/overlays/production > /dev/null
```

## Reglas de código

- Los servicios Node usan arquitectura hexagonal:
  `entrada/http -> aplicacion -> puertos <- adaptadores`.
- `dominio` no importa Fastify, PostgreSQL ni `fetch`.
- Los componentes de frontend no llaman `fetch` directamente; usan
  `@tuki/api-cliente`.
- Cada servicio es dueño de su base. No se consultan tablas de otro servicio;
  la comunicación es HTTP.
- Los nombres de dominio van en español y los sufijos técnicos en inglés,
  como se describe en [`docs/convenciones.md`](docs/convenciones.md).
- Los archivos nuevos deben tener una responsabilidad clara y, cuando sea
  posible, menos de 200 líneas.
- No se agregan credenciales, tokens ni archivos `.env` al repositorio.

## Pull requests

1. Abre un issue o explica el problema en la descripción del PR.
2. Mantén el cambio pequeño y con una sola intención.
3. Incluye pruebas para la regla o el flujo que cambia.
4. Actualiza el README o la documentación si cambia un comando, una variable
   de entorno o una ruta.
5. Espera los checks de calidad y seguridad. No fusiones con checks en rojo.
6. Si el cambio toca visión, revisa también el aviso de AGPL en
   [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Issues

Usa las plantillas de `.github/ISSUE_TEMPLATE/`. Un issue debe incluir:

- Qué se esperaba.
- Qué pasó.
- Cómo reproducirlo.
- Versión o commit.
- Evidencia (log, captura o salida de un comando).

## Seguridad

No publiques vulnerabilidades explotables en un issue público. Si encuentras
una, escribe a los mantenedores y da un plazo razonable antes de divulgarla.
