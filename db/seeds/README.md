# Seeds de demostración

Contraseña de las cuentas demo: **Demo12345**

| Cuenta | Rol |
|---|---|
| `cliente@tuki.local` | cliente |
| `dueno1@tuki.local` | dueño de Café Bolívar |
| `dueno2@tuki.local` | dueño de Pizzería Centenario |

## Aplicar en local

```bash
psql postgresql://tuki_identidad:tuki_identidad_dev@localhost:5432/tuki_identidad \
  -f db/seeds/identidad-demo.sql

psql postgresql://tuki_restaurantes:tuki_restaurantes_dev@localhost:5432/tuki_restaurantes \
  -f db/seeds/restaurantes-demo.sql
```

## Aplicar en Kubernetes

```bash
kubectl exec -i -n tuki postgres-0 -- \
  psql -U tuki_admin -d tuki_identidad < db/seeds/identidad-demo.sql

kubectl exec -i -n tuki postgres-0 -- \
  psql -U tuki_admin -d tuki_restaurantes < db/seeds/restaurantes-demo.sql
```

El superadmin se crea aparte con `node dist/scripts/crear-superadmin.js` o con
el comando de `pnpm` documentado en `docs/despliegue.md`.
