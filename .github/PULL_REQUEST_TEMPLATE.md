## Qué cambia

<!-- Una o dos frases. Si el cambio responde a un hallazgo, enlázalo. -->

## Módulo del diplomado afectado

- [ ] 1. Fundamentos (contenedores, Compose, Git)
- [ ] 2. Kubernetes, GitOps y plataforma
- [ ] 3. DevSecOps y cadena de suministro
- [ ] Transversal (frontend, gateway, documentación)

## Evidencia

<!-- Comandos ejecutados y su resultado. No vale "funciona en local". -->

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Checklist de seguridad

- [ ] No hay secretos, tokens ni datos personales en el diff.
- [ ] Las dependencias nuevas tienen licencia compatible (`node scripts/licencias.mjs`).
- [ ] Si cambian manifiestos: `bash deploy/scripts/validar-k8s.sh`.
- [ ] Si cambia una imagen: SBOM y firma se generan en CI.
- [ ] El cambio asistido por IA fue validado y quedó en `docs/security/registro-uso-ia.md`.
- [ ] El rollback está documentado o no aplica.

## Riesgo y reversión

<!-- Qué puede romperse y cómo se vuelve atrás. -->
