# Catálogo de servicios y golden path de Riki

Documento de Platform Engineering (módulo 2). Describe el catálogo mínimo de
Backstage, cómo registrarlo y qué camino debe seguir un servicio nuevo para
reutilizar los controles de Riki.

> **Alcance:** modelo de catálogo y golden path. No se instala Backstage en este
> repositorio; el PDF admite esta alternativa cuando la infraestructura no
> permite levantar la plataforma completa.

---

## 1. Entidades del catálogo

El archivo `catalog-info.yaml` de la raíz define:

| Entidad | Kind | Nombre | Propósito |
| --- | --- | --- | --- |
| Equipo | `Group` | `riki-team` | Propietario de todos los recursos |
| Dominio | `Domain` | `riki` | Agrupa el sistema de menús digitales |
| Sistema | `System` | `riki` | Conjunto SPA + gateway + servicios gestionados |
| Componente | `Component` | `riki-web` | SPA React/Vite servida por Nginx |
| Componente | `Component` | `riki-ai-gateway` | Gateway FastAPI hacia Groq |
| Recurso | `Resource` | `supabase` | Postgres, Auth y RLS |
| Recurso | `Resource` | `cloudinary` | Imágenes de platillos |
| Recurso | `Resource` | `groq` | Inferencia de texto externa |

Relaciones:

```
riki-web ──dependsOn──► riki-ai-gateway
   │                         │
   ├──► supabase ◄───────────┤
   ├──► cloudinary           └──► groq
```

Anotaciones relevantes:

- `backstage.io/kubernetes-id`: nombre del Deployment/Service que el plugin de
  Kubernetes debe correlacionar (`riki` y `riki-ai-gateway`). Los Deployments de
  `deploy/k8s/base/` llevan la misma etiqueta en `metadata.labels` y en el
  `template`, que es lo que consulta el plugin.
- `backstage.io/kubernetes-namespace`: `riki`.
- `github.com/project-slug`: `Leonardo007x/LeeFood`, para el plugin de GitHub.

No se usa `backstage.io/techdocs-ref` porque el repositorio no incluye
`mkdocs.yml`. Añadirlo sin esa configuración produciría un TechDocs roto.

---

## 2. Cómo registrar el catálogo

En una instancia de Backstage existente:

1. Abrir **Catalog → Locations → Add location**.
2. Pegar la URL del archivo en la rama principal:

   ```
   https://github.com/Leonardo007x/LeeFood/blob/main/catalog-info.yaml
   ```

3. Elegir el tipo `url` y guardar.
4. Verificar que aparecen el dominio, el sistema, los dos componentes y los tres
   recursos, sin errores de validación.

Si el repositorio es privado, Backstage necesita una integración de GitHub con
permisos de lectura. No se guardan tokens en este archivo.

### 2.1 Validación local del YAML

```bash
python - <<'PY'
import pathlib
import yaml

docs = list(yaml.safe_load_all(pathlib.Path("catalog-info.yaml").read_text(encoding="utf-8")))
docs = [d for d in docs if d]
print(f"{len(docs)} entidades")
for d in docs:
    print(d["kind"], d["metadata"]["name"])
PY
```

Resultado esperado: 8 entidades (`Group`, `Domain`, `System`, 3 `Resource` y 2
`Component`).

### 2.2 Validación en Backstage

El catálogo se valida al registrar la location. Los errores típicos son:

- `owner` que no existe: debe ser `riki-team`.
- `system` o `domain` inexistente.
- `dependsOn` con un nombre mal escrito.
- `metadata.name` con mayúsculas o guiones bajos.

---

## 3. Convenciones de propiedad y ciclo de vida

| Campo | Convención en Riki |
| --- | --- |
| `metadata.name` | Minúsculas, guiones, sin espacios (`riki-web`) |
| `spec.owner` | `riki-team`; si el equipo crece, un grupo por dominio |
| `spec.system` | `riki` para todo lo que compone el producto |
| `spec.lifecycle` | `production`; usar `experimental` para prototipos |
| `spec.type` | `website` para la SPA, `service` para el gateway |
| `dependsOn` | Declarar solo dependencias reales de ejecución |
| `links` | Código, despliegue, runbook y ADR relevante |

Un componente sin `owner` o sin `system` no debe registrarse: el catálogo perdería
su utilidad operativa.

---

## 4. Golden path para un servicio nuevo

El objetivo es que un servicio nuevo herede los controles de Riki sin copiar
decisiones a mano. Ruta mínima:

### Paso 1 — Repositorio y decisiones

- Crear el repositorio con `README.md` y un ADR inicial.
- Elegir el runtime y documentar por qué.
- Definir si usa servicios gestionados o estado propio.

### Paso 2 — Contenedor reproducible

- Dockerfile multi-etapa.
- Usuario no root y rootfs de solo lectura cuando sea posible.
- Imagen base fijada por digest.
- `.dockerignore` que excluya `.env*`, `node_modules`, `dist` y tests.
- Healthcheck y puerto explícito.

### Paso 3 — Configuración y secretos

- Variables de ejemplo en `.env.example`, sin valores reales.
- Secretos inyectados en runtime, nunca en el bundle.
- Si el servicio es frontend, verificar que ninguna clave de servidor aparece en
  `dist/`.

### Paso 4 — Pruebas y lint

- Tests automatizados.
- Lint del lenguaje y del Dockerfile.
- Si es frontend, `tsc --noEmit` y ESLint antes de publicar.
- Auditoría de dependencias (`pip-audit`, `pnpm audit` o equivalente).

### Paso 5 — Kubernetes

- `Deployment` con probes, `requests`/`limits`, `securityContext` restringido.
- `Service` ClusterIP.
- `ConfigMap` para configuración no secreta y `Secret` para lo demás.
- `NetworkPolicy` de ingress/egress.
- `PDB` y réplicas si el servicio es crítico.

### Paso 6 — GitOps

- Base y overlays con Kustomize.
- Aplicación de ArgoCD con `selfHeal` y `prune`.
- `ignoreDifferences` para los campos que gestiona un HPA.

### Paso 7 — Observabilidad y operación

- Endpoint `/healthz` y `/readyz`.
- Métricas Prometheus.
- Alertas accionables y runbook con diagnóstico y rollback.

### Paso 8 — Cadena de suministro

- CI con Trivy, SBOM y firma Cosign.
- Publicación en GHCR por digest.
- Verificación de firma antes de desplegar.

### Paso 9 — Catálogo

- Añadir la entidad a `catalog-info.yaml` con `owner`, `system`, `lifecycle`,
  `dependsOn` y enlaces.
- Registrar la location en Backstage.
- Enlazar el runbook y el ADR.

---

## 5. Checklist de revisión de un componente

- [ ] `metadata.name` cumple la convención.
- [ ] `spec.owner` existe y es el equipo correcto.
- [ ] `spec.system` y `spec.lifecycle` están definidos.
- [ ] `dependsOn` refleja dependencias reales.
- [ ] Los enlaces apuntan a código, despliegue y runbook.
- [ ] Las anotaciones de Kubernetes coinciden con los nombres reales.
- [ ] El componente tiene health checks y métricas.
- [ ] El componente tiene pipeline de pruebas y escaneo.
- [ ] El componente tiene una política de rollback documentada.
- [ ] El componente no expone secretos en el bundle ni en los logs.

---

## 6. Limitaciones y evolución

Limitaciones actuales:

- No hay instancia de Backstage ni portal de desarrolladores.
- No hay TechDocs ni `mkdocs.yml`.
- No hay software templates (scaffolder) que creen repositorios automáticamente.
- No hay scorecards ni métricas de adopción del golden path.

Evolución sugerida:

1. Levantar Backstage en un clúster de laboratorio con el plugin de Kubernetes.
2. Añadir TechDocs y publicar `deploy/README.md` y `docs/runbook.md`.
3. Convertir el golden path en un software template.
4. Añadir scorecards de seguridad, observabilidad y documentación.
5. Integrar ArgoCD en Backstage para ver el estado de sincronización.

---

## 7. Referencias

- `catalog-info.yaml` — entidades del catálogo.
- `docs/modulos-1-3.md` — matriz de cumplimiento del módulo 2.
- `deploy/k8s/` — manifiestos que el catálogo referencia.
- `deploy/argocd/` — aplicaciones GitOps.
- `docs/security/modelo-de-amenazas.md` — controles de seguridad del servicio.
