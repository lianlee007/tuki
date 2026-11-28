# Seeds de demostración

Contraseña de las cuentas demo: **Demo12345**

| Cuenta | Rol |
|---|---|
| `cliente@tukituki.local` | cliente |
| `dueno1@tukituki.local` | dueño de Café Bolívar |
| `dueno2@tukituki.local` | dueño de Pizzería Centenario |

## Aplicar en local

```bash
psql postgresql://tuki_identidad:tuki_identidad_dev@localhost:5432/tuki_identidad \
  -f db/seeds/identidad-demo.sql

psql postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes \
  -f db/seeds/restaurantes-demo.sql

# Descripciones, ingredientes y alérgenos de los 61 platos demo. Es lo que
# alimenta el índice de la IA local para responder por ingredientes.
psql postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes \
  -f db/seeds/platillos-descripciones.sql

# Banderas vegetarianas/veganas y alérgenos declarados de esos platos.
psql postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes \
  -f db/seeds/restaurantes-dietas.sql

# Platos extra para la demo del chat: opciones picantes, veganas y para
# compartir. Idempotente.
psql postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes \
  -f db/seeds/platillos-demo-extra.sql

# Reseñas demo: idempotente (UUID fijos). Incluye respuestas del dueño y fotos
# reales de los platos ya alojadas en el almacén local.
psql postgresql://tuki_resenas:tuki_resenas_dev@localhost:5432/tuki_resenas \
  -f db/seeds/resenas-demo.sql
```

## Aplicar en Kubernetes

```bash
kubectl exec -i -n tukituki postgres-0 -- \
  psql -U tuki_admin -d tuki_identidad < db/seeds/identidad-demo.sql

kubectl exec -i -n tukituki postgres-0 -- \
  psql -U tuki_admin -d tuki_restaurantes < db/seeds/restaurantes-demo.sql
```

El superadmin se crea aparte con `node dist/scripts/crear-superadmin.js` o con
el comando de `pnpm` documentado en `docs/despliegue.md`.
