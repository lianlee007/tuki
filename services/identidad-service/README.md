# identidad-service

Cuentas, credenciales, roles, sesiones y superadmin de TukiTuki. Es el quinto
servicio migrado a **arquitectura hexagonal**.

## Estructura

```text
src/
  dominio/        Usuario, sesión, roles y errores. Sin Fastify ni PostgreSQL.
  puertos/        UsuariosRepositorio, AuditoriaRepositorio, HasherPassword
                  y TokensSesion (interfaces).
  aplicacion/     registro, login, refresh, perfil, superadmin y administración.
  adaptadores/    postgres/, seguridad/ (Argon2) y jwt/ (jose).
  entrada/http/   rutas, controladores y esquemas Zod.
  plugins/        Autenticación Bearer y formato de errores.
  composicion.ts  Raíz de composición reutilizada por la app y el script.
  scripts/        Creación del superadmin inicial.
```

## Decisiones clave

- La aplicación no importa `argon2` ni `jose`: los usa a través de
  `HasherPassword` y `TokensSesion`.
- El repositorio traduce la violación de unicidad de PostgreSQL a un error de
  dominio `conflicto`; la aplicación no inspecciona códigos `23505`.
- El plugin de autenticación recibe `TokensSesion` por opciones, no importa el
  adaptador JWT directamente.
- `crearServiciosIdentidad()` es la misma composición para la app y para
  `crear-superadmin`.

```text
entrada/http -> aplicacion -> puertos <- adaptadores
                                 |
                              dominio
```

## Pruebas

```bash
pnpm --filter identidad-service test
pnpm --filter identidad-service typecheck
```

`aplicacion/registrar.test.ts` y `aplicacion/iniciar-sesion.test.ts` usan dobles
de repositorio, hasher y tokens: no necesitan PostgreSQL, Argon2 real ni JWT.

## Contrato HTTP

```text
POST   /v1/identidad/registro
POST   /v1/identidad/login
POST   /v1/identidad/refresh
POST   /v1/identidad/logout
GET    /v1/identidad/perfil
PATCH  /v1/identidad/perfil
GET    /v1/admin/usuarios
GET    /v1/admin/usuarios/resumen
PATCH  /v1/admin/usuarios/:id/rol
```
