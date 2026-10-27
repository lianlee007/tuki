# ADR 0002 — Cadena de suministro verificable

- **Estado:** aceptado
- **Fecha:** 2026-10-25
- **Contexto:** Fase 0 del trabajo CloudForge AI

## Contexto

Un Dockerfile que usa `latest` y un pipeline que solo hace `docker build`
permiten desplegar código distinto al revisado, sin evidencia de qué contiene la
imagen. El trabajo exige demostrar control sobre la procedencia, el contenido y
la integridad de los artefactos.

## Decisión

1. **Bases fijadas por digest** para Node, Nginx, Python y el exporter.
2. **Build multi-etapa** y usuario no root (`101` en web, `10001` en gateway).
3. **Hadolint** en CI y en local para el Dockerfile.
4. **Trivy** para CVEs, secretos y misconfiguraciones; el pipeline falla ante
   `CRITICAL`/`HIGH` corregibles.
5. **Syft** para generar SBOM SPDX y **Buildx** para provenance/SBOM de la
   imagen publicada.
6. **Cosign keyless** con OIDC de GitHub Actions y verificación explícita de la
   firma.
7. **kubeconform + kube-linter + conftest** para los manifiestos.
8. **`apk upgrade --no-cache`** en la etapa runtime de Nginx para aplicar
   parches de Alpine posteriores al digest de la base.

## Consecuencias

**Positivas**

- Cada despliegue tiene digest, SBOM y firma verificable.
- Los errores de configuración y las CVEs corregibles frenan el pipeline.
- Las políticas propias (rootfs de solo lectura, capabilities, límites) se
  aplican antes de llegar al clúster.

**Negativas**

- `apk upgrade` introduce variabilidad entre builds del mismo commit. Se acepta
  porque la alternativa es desplegar CVEs conocidas; el digest publicado y su
  SBOM son la fuente de verdad de lo que se ejecuta.
- La firma keyless requiere que el workflow tenga `id-token: write` y que la
  verificación use la identidad exacta del repositorio.
- El escaneo de imágenes en CI consume tiempo y cuota de GitHub Actions.

## Excepciones

- En este entorno no hay registro remoto ni clúster de producción. La firma y la
  atestación se validan en GitHub Actions; en local se ejecutan Trivy y Syft.
- `kubeconform` omite `ServiceMonitor`, `PrometheusRule` y `Application` porque
  sus CRDs no están en el catálogo por defecto. Se validan con su CRD o en el
  clúster.
