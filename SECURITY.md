# Política de seguridad de Tuki

Tuki es una aplicación web para restaurantes: una SPA de React servida por
Nginx, un AI Gateway en FastAPI y los manifiestos de despliegue. Este documento
describe cómo se reporta una vulnerabilidad y qué controles protegen el
repositorio y la cadena de suministro.

## Versiones soportadas

| Versión | Soporte |
| --- | --- |
| `main` | Recibe correcciones de seguridad |
| Etiquetas `v*` | Solo la última etiqueta publicada |
| Ramas de trabajo | Sin soporte; se descartan tras el merge |

## Cómo reportar una vulnerabilidad

No abras un issue público. Usa **Security → Report a vulnerability** en GitHub
(aviso privado) o escribe al propietario que figura en `.github/CODEOWNERS`.

Incluye: versión o commit, pasos para reproducir, impacto esperado y, si lo
tienes, una propuesta de mitigación. No adjuntes secretos reales ni datos
personales: usa valores de ejemplo.

Las claves comprometidas se rotan en Supabase, Cloudinary y Groq antes de
cualquier otra acción; el procedimiento está en `docs/runbook.md`.

## Alcance

Dentro del alcance:

- Código de la SPA, del AI Gateway y los scripts del repositorio.
- Manifiestos de `deploy/`, políticas de `deploy/policies/` y `deploy/security/`.
- Pipeline de `.github/workflows/` y sus dependencias.
- Configuración de seguridad de Nginx, Ingress y contenedores.

Fuera del alcance:

- Supabase, Cloudinary y Groq como servicios gestionados.
- El clúster de laboratorio y sus credenciales.
- Ataques de denegación de servicio sin una prueba de concepto acotada.

## Controles vigentes

| Control | Dónde se ejecuta | Umbral |
| --- | --- | --- |
| Tipos y lint del frontend | CI y `pnpm verificar` | Cualquier error falla |
| Pruebas del frontend y del gateway | CI y `pnpm verificar` | 36 + 39 pruebas |
| Dependencias Python | CI (`pip-audit`) | Cualquier vulnerabilidad conocida falla |
| Dependencias JavaScript | CI (`pnpm audit`) | Críticas bloquean; altas se revisan |
| Licencias | CI (`scripts/licencias.mjs`) | GPL/AGPL bloquean |
| Secretos en el historial | CI (gitleaks) | Cualquier hallazgo falla |
| Vulnerabilidades de imagen | CI (Trivy) | `HIGH` y `CRITICAL` corregibles |
| Manifiestos | CI (kubeconform, kube-linter) | Esquema estricto y cero errores |
| Políticas de admisión | CI (conftest y Kyverno CLI) | 225 pruebas y políticas probadas |
| Hardening de contenedores | Compose y Kubernetes | Sin root, rootfs de solo lectura, `cap_drop: ALL` |
| Firma de imágenes | CI (Cosign keyless) | Solo push y etiquetas |
| SBOM | CI (Syft + atestación Cosign) | SPDX por imagen |

El detalle y los resultados de la última ejecución están en
`docs/modulos-1-3.md` §5.4.

## Secretos

- `.env.local` nunca se versiona; solo se publica `.env.example` sin valores.
- `GROQ_API_KEY` es un secreto de servidor: no se incrusta en el bundle y el
  pipeline falla si aparece `gsk_` en `dist/`.
- En Kubernetes, el secreto `tuki-ai-gateway` se crea fuera de Git. Para GitOps
  se admite Sealed Secrets, External Secrets Operator o SOPS.
- Los manifiestos no contienen credenciales: `ai-gateway-secret.example.yaml`
  solo documenta la forma del objeto.

## Código generado por IA

El uso de asistentes está permitido con validación obligatoria: pruebas,
linters, análisis de dependencias, revisión de licencias y comparación con la
documentación oficial. Cada cambio relevante se anota en
`docs/security/registro-uso-ia.md`.

## Divulgación

Se coordina la divulgación con quien reporta: primero se corrige y se publica la
versión, después se documenta el hallazgo en `docs/security/hallazgos.md`.
