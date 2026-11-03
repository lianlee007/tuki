# Guía para la reunión con el profesor

Documento de preparación para la sustentación del proyecto integrador del
diplomado CloudForge AI 5.0 (módulos 1–3). Está escrito para leerse en diez
minutos y consultarse durante la reunión.

- **Versión del proyecto:** `main` en `6aec822`
- **Fecha de la guía:** 2026-10-30

---

## 1. El discurso de un minuto

> Tuki es un constructor de sitios web para restaurantes. El dueño entra a un
> panel, carga su menú, elige un tema y obtiene una página pública con su menú
> y un botón de WhatsApp para pedir. El comensal, por su lado, tiene un buscador
> de platos que le permite encontrar qué comer cerca y ver el menú del
> restaurante.
>
> Está construido como una SPA en React y TypeScript, con un gateway en FastAPI
> para la parte de inteligencia artificial, y usa Supabase como base de datos,
> autenticación y almacenamiento de imágenes. Se despliega en Kubernetes con
> Kustomize y ArgoCD, las imágenes se firman con Cosign y se promueven por pull
> request, y la entrega está protegida por una capa de borde en Cloudflare con
> WAF y cuota global.
>
> Lo que quiero validar con usted es si la decisión de apoyarme en un BaaS en
> lugar de construir un backend propio es defendible para el alcance del
> diplomado, y qué evidencia espera ver en la entrega.

Ese último párrafo es la clave: conviertes la duda en pregunta y dejas que él
marque el terreno.

---

## 2. Qué es la aplicación, en dos capas

| Capa | Para quién | Qué hace |
| --- | --- | --- |
| **Descubrir** | Comensal | Busca platos por tipo de cocina, ciudad o nombre, y abre el menú público del restaurante |
| **Panel** | Dueño | Menú, categorías, platillos, temas, reseñas, pedidos por WhatsApp y código QR |

Servicios transversales: cuenta del comensal (datos de envío, historial de
pedidos, reseñas), carrito, ayuda de IA para redactar textos del menú, y una
vista pública de reseñas.

---

## 3. La arquitectura, en una imagen

```
                 ┌──────────────────────────────┐
   Internet ────►│ Cloudflare (borde)           │
                 │ DNS · WAF · caché · cuota    │
                 └──────────────┬───────────────┘
                                │ Cloudflare Tunnel (sin puertos abiertos)
                 ┌──────────────▼───────────────┐
                 │ Kubernetes                   │
                 │  ingress-nginx + TLS         │
                 │  ┌────────────┐  ┌─────────┐ │
                 │  │ web (Nginx)│  │ gateway │ │
                 │  │ SPA React  │─►│ FastAPI │ │
                 │  └─────┬──────┘  └────┬────┘ │
                 └────────┼──────────────┼──────┘
                          │              │ HTTPS
              ┌───────────▼──────────────▼─────┐
              │ Supabase                        │
              │ Postgres + RLS · Auth · Storage │
              └────────────────┬────────────────┘
                               │
                          ┌────▼────┐
                          │  Groq   │  (inferencia de texto)
                          └─────────┘
```

Y por debajo, la cadena de entrega:

```
GitHub Actions → build multi-arquitectura → SBOM (Syft/Syft+Trivy)
   → firma Cosign keyless → GHCR
   → promover.yml (verifica firma) → PR con el nuevo tag
   → ArgoCD aplica el overlay de producción
```

### Capas del código

- **Frontend** (`src/`): monolito modular. Cuatro módulos de dominio —`cuenta`,
  `menu`, `pedidos`, `resenas`— cada uno con `dominio`, `aplicacion` e
  `infraestructura`. Nada de microservicios: un solo despliegue, fronteras
  internas claras (ADR 0007).
- **Gateway** (`services/ai-gateway/`): arquitectura hexagonal (ADR 0005).
  Dominio, puertos y adaptadores. No habla con Postgres: solo valida el JWT de
  Supabase contra su JWKS y llama a Groq.
- **Infraestructura** (`deploy/`): Kustomize con base y overlays (`local`,
  `local-plataforma`, `production`), más `cloudflare/` y `observability/`.

---

## 4. Las ocho decisiones que tienes que saber defender

| # | Decisión | Alternativa descartada | Porqué |
| --- | --- | --- | --- |
| 0001 | Gateway de IA propio | Clave de Groq en el frontend | Una clave en el bundle es pública; el gateway permite cuota, validación y observabilidad |
| 0002 | Cadena de suministro firmada | Solo `docker build` | Trazabilidad: SBOM, Cosign keyless, digest en producción |
| 0003 | Servicios gestionados (Supabase, Groq) | Backend y base de datos propios | Tiempo, costo y RLS maduro para un equipo de una persona |
| 0004 | Cuota en memoria por proceso | Redis compartido | Simplicidad; exige una sola réplica, y eso se documenta como límite |
| 0005 | Hexagonal en el gateway | Capas acopladas a FastAPI | Cambiar de proveedor de IA o de validador sin tocar el dominio |
| 0006 | Gateway en Python | Gateway en Node | Ecosistema de IA, `pydantic`, pruebas rápidas |
| 0007 | Monolito modular | Microservicios | Un equipo, un despliegue, menos coste operativo; fronteras verificadas por script |
| 0008 | Imágenes en Supabase Storage | Cloudinary | Un proveedor menos, mismos permisos que la base de datos |

**Regla de oro al responder:** toda decisión tiene su ADR y su alternativa
descartada. Si te pregunta «¿por qué no X?», la respuesta casi nunca es «porque
no sabía», es «está en el ADR N, y el criterio fue este».

---

## 5. Estado real: qué está hecho y qué es solo diseño

Esto es lo que más credibilidad te da. Dilo tú antes de que lo pregunte.

### Funciona y está probado

- SPA completa: descubrir, menú público, panel, cuenta, carrito, reseñas, temas.
- Puerta local: `pnpm verificar` (typecheck, lint, pruebas, arquitectura,
  manifiestos).
- **87 pruebas** de frontend, **41** del gateway, **4** de extremo a extremo
  (Escritorio y móvil), **53** archivos revisados por el verificador de
  arquitectura con 0 violaciones.
- `kubectl kustomize` válido en los seis overlays.
- Políticas de Kyverno probadas en el laboratorio.

### Está diseñado y documentado, pero no aplicado en un entorno real

- **Cloudflare:** existen las reglas (WAF, caché, cuota) y el manifiesto del
  túnel, pero **no hay zona ni túnel creados**. Es configuración lista para
  aplicar, no evidencia de runtime.
- **Clúster de producción:** no existe. Todo se validó en Docker Desktop, kind y
  por renderizado de manifiestos.
- **SLO:** las reglas y alertas están escritas, pero nunca han disparado porque
  no hay tráfico real.
- **Storage:** el código ya usa Supabase Storage, pero las 23 imágenes siguen en
  Cloudinary hasta que se aplique el SQL y se ejecute el migrador.

Frase para decirlo: *«Tengo el diseño, los manifiestos y las pruebas; lo que no
tengo es un entorno de producción donde eso corra. Prefiero decirlo antes de que
lo descubra.»*

---

## 6. Las preguntas que le vas a hacer

Llévalas escritas. Son el objetivo real de la reunión.

1. **BaaS.** Para el alcance de los módulos 1–3, ¿es defendible apoyarse en
   Supabase (Postgres, Auth y Storage) en lugar de construir backend propio, si
   la decisión está documentada en un ADR con criterios y plan de salida? ¿O
   espera ver al menos un servicio propio para demostrar el dominio de la capa
   de aplicación?
2. **Evidencia.** De todo lo que entregué —manifiestos, ADRs, pruebas,
   políticas, SLO—, ¿qué pesa más en la nota y qué le sobra?
3. **Alcance de DevSecOps.** Firmo imágenes con Cosign y verifico en el flujo de
   promoción, pero no tengo controlador de admisión rechazando imágenes sin
   firma. ¿Basta con la verificación en el pipeline o es obligatorio el
   rechazo en el clúster?
4. **Observabilidad.** Definí SLO de 99,5 % y alertas de burn-rate sin tráfico
   real. ¿Cómo prefiere que demuestre que funcionan: con carga sintética, con un
   laboratorio, o basta el diseño?
5. **Multi-tenant.** Hoy el aislamiento es por RLS con `restaurante_id`. ¿Le
   parece suficiente para un SaaS, o esperaría ver límites por plan y auditoría
   de accesos?
6. **Cierre.** Si tuviera dos semanas más, ¿qué priorizaría usted: el controlador
   de admisión, la auditoría de RLS o el clúster de producción?

La 1 es la importante. Las demás te posicionan como alguien que ya pensó el
siguiente nivel.

---

## 7. Preguntas que él te puede hacer (y cómo responder)

### Sobre el producto

**¿Qué problema resuelve y quién paga?**
El restaurante pequeño que no tiene página web ni alguien que se la haga. Paga
el dueño, con una suscripción mensual; el comensal usa gratis. Hoy no hay cobro
implementado: es el siguiente paso natural del producto.

**¿En qué se diferencia de un Linktree o de un menú en PDF?**
En que el menú es estructurado: se puede buscar por plato, por tipo de cocina y
por ciudad, y el pedido sale por WhatsApp con el carrito armado, no con un PDF
que el cliente tiene que leer.

**¿Cuántos restaurantes tiene?**
Trece cargados, todos de Popayán, como datos reales de demostración. No hay
clientes facturando todavía.

### Sobre la arquitectura

**¿Por qué no microservicios?**
Porque el equipo es una persona y los límites del dominio ya están separados en
módulos con dependencias verificadas por script (`pnpm arquitectura`). Partir
eso en servicios añadiría red, despliegues y fallos parciales sin beneficio.
Cuando un módulo necesite escalar por su cuenta, la frontera ya está lista.

**¿Por qué un gateway aparte y no una función serverless?**
Porque necesito cuota por IP, validación de JWT, timeout y reintentos contra
Groq, métricas y un techo de tokens. Eso vive mejor en un proceso que controlo,
y me deja cambiar de proveedor de IA sin tocar el frontend.

**¿El gateway habla con la base de datos?**
No. Solo valida el JWT contra el JWKS de Supabase y llama a Groq. El frontend
habla directo con Supabase usando la clave `anon` y RLS.

**¿Qué pasa si Supabase se cae?**
La aplicación deja de funcionar: es un punto único de fallo y lo tengo asumido.
Mitigación: plan de pago con copias y recuperación a un punto en el tiempo, y la
salida es barata porque todo es Postgres estándar, sin procedimientos
propietarios.

**¿Cómo evitas que un restaurante vea los datos de otro?**
RLS en Postgres: 16 políticas sobre 11 tablas, con el `restaurante_id` amarrado
al usuario autenticado. La clave `anon` es pública y no sirve sin sesión. Tengo
un hallazgo abierto (H-004): falta la auditoría tabla por tabla de esas
políticas.

**¿Y las imágenes?**
Buckets de Supabase Storage con lectura pública, escritura solo autenticada y
borrado del propietario. Se comprimen en el navegador a WebP de 1600 px antes
de subir, porque el plan gratuito no incluye transformaciones.

### Sobre Kubernetes y plataforma

**¿Cuántas réplicas y por qué?**
El frontend escala con HPA. El gateway corre con **una sola réplica a propósito**
y sin HPA: su cuota está en memoria y con dos réplicas el límite real se
duplicaría. La cuota autoritativa vive en Cloudflare. El PDB permite una
indisponibilidad para no bloquear mantenimiento.

**¿Eso no es un punto único de fallo?**
Sí, y es un intercambio consciente: prefiero una cuota exacta a una alta
disponibilidad que hoy nadie está pagando. Si crece, el camino es Redis y
vuelvo a escalar horizontalmente. Está escrito en `docs/arquitectura/rate-limit.md`.

**¿Cómo despliegas?**
Git: el pipeline construye, genera SBOM, firma con Cosign y publica en GHCR. Un
flujo aparte verifica la firma del tag y abre un pull request que cambia el tag
del overlay de producción. ArgoCD sincroniza. Nunca hago `kubectl apply` a mano
en producción.

**¿Qué impide desplegar una imagen no firmada?**
Hoy, el pipeline. Falta el controlador de admisión que la rechace en el clúster;
tengo Kyverno probado en el laboratorio y la política escrita, pero no aplicada
en producción. Es el hallazgo H-007.

**¿Qué es un SLO y cómo lo elegiste?**
99,5 % de disponibilidad y 95 % de las peticiones por debajo de 8 segundos.
Sobre eso, alertas de burn-rate: si el error se consume 14,4 veces más rápido de
lo normal en una hora, o 6 veces en seis horas, se alerta. No inventé las
ventanas: son las del manual de SRE de Google.

### Sobre seguridad

**¿Dónde está la clave de Groq?**
En un secreto de Kubernetes, nunca en el bundle. Ese fue el motivo del gateway:
antes la clave viajaba al navegador.

**¿Qué pasa si alguien abusa de la IA?**
Tres capas: cuota en Cloudflare por IP a nivel global, cuota en el gateway (10
peticiones por minuto anónimo, 30 autenticado) y un techo de caracteres y de
tokens por petición.

**¿Prompt injection?**
Está en el modelo de amenazas. El gateway separa instrucciones de sistema del
texto del usuario y limita la salida, pero no hay un filtro que garantice que no
se filtre información: se mitiga no enviando datos personales a Groq.

### Las incómodas

**¿Esto es solo un trabajo de clase o un producto?**
Es un producto con alcance de clase. Lo que demuestra el diplomado es la
plataforma: despliegue, seguridad de la cadena, GitOps y observabilidad. Lo que
falta para ser negocio es cobro, soporte y clientes.

**¿Qué no funciona?**
Las fotos nuevas de los platillos todavía no se suben a Storage en producción
porque falta aplicar la migración; el resto del flujo funciona. Y no hay
entorno de producción real.

**¿Lo hiciste tú o lo hizo una IA?**
Lo hice con asistencia de IA y está registrado en
`docs/security/registro-uso-ia.md`, fila por fila: qué se generó, con qué
herramienta, qué archivos tocó y cómo se verificó. Puedo explicar cualquier
decisión del repositorio.

**¿Cuánto cuesta operarlo?**
Supabase gratuito o 25 dólares al mes en plan Pro, Cloudflare en su plan free,
y el clúster solo cuesta cuando existe. El costo real hoy es tiempo.

---

## 8. Cómo manejar lo que no sepas

No improvises. Usa una de estas tres:

1. **«No lo he medido.»** Y añade cómo lo medirías. Eso es honestidad técnica.
2. **«Está en el ADR N y la razón fue esta; si quiere, se lo muestro.»**
3. **«No lo sé, ¿usted qué haría?»** Convierte el hueco en conversación y te
   dice exactamente qué espera.

Lo que nunca funciona: inventar un número, decir que algo está desplegado
cuando solo está documentado, o prometer que «en producción estaría resuelto».

---

## 9. Números para tener en la cabeza

| Dato | Valor |
| --- | --- |
| Tablas / políticas RLS / funciones | 11 / 16 / 8 |
| Pruebas frontend / gateway / extremo a extremo | 79 / 41 / 4 |
| Archivos verificados por arquitectura | 53, con 0 violaciones |
| Manifiestos válidos (`kubectl kustomize`) | 6 overlays |
| ADRs | 8 |
| SLO | 99,5 % disponibilidad, p95 < 8 s |
| Cuota del gateway | 10/min anónimo, 30/min autenticado |
| Imágenes pendientes de migrar | 23 |
| Buckets de Storage | 3 (`platillos`, `restaurantes`, `resenas`) |

---

## 10. Cierre sugerido

> «Resumiendo: el producto está completo y probado a nivel de aplicación, la
> plataforma está diseñada y verificada de punta a punta en local, y lo que no
> tengo es un entorno de producción. Mi duda honesta es si apoyarme en Supabase
> es aceptable para el alcance del diplomado, porque es la decisión que más
> define la arquitectura. ¿Qué opina?»

Termina con una pregunta. Una reunión que acaba en pregunta deja al profesor
pensando en cómo ayudarte, no en qué te faltó.
