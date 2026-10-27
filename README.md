<div align="center">
  <h1>🍽️ Tuki</h1>
  <!-- v0.0.1 -->
  <p><strong>Constructor de sitios web para restaurantes con IA</strong></p>
  <p>Diseña, gestiona y escala. La solución definitiva para restauradores que buscan elegancia visual y eficiencia operativa.</p>
  
  [![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.83-3ECF8E?logo=supabase)](https://supabase.com/)
</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [AI Gateway](#-ai-gateway)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## 🎯 Descripción

**Tuki** es una plataforma SaaS moderna que permite a restaurantes crear, gestionar y publicar sus sitios web de menú digital en minutos. Con integración de Inteligencia Artificial, un diseño limpio y funcionalidades avanzadas, Tuki elimina la necesidad de conocimientos técnicos para tener presencia digital profesional.

### ¿Qué hace Tuki?

- ✅ **Crea sitios web personalizados** para restaurantes sin código
- ✅ **Gestiona menús digitales** con categorías, precios e imágenes
- ✅ **Genera contenido con IA** para descripciones y textos atractivos
- ✅ **Diseño neumórfico** con modo oscuro/claro adaptable
- ✅ **Múltiples plantillas** de diseño profesional
- ✅ **Carrito de compras** integrado con envío a WhatsApp
- ✅ **Códigos QR** para compartir menús fácilmente
- ✅ **Optimización de imágenes** automática con Cloudinary

## ✨ Características

### 🎨 Diseño y Personalización
- **Diseño Neumórfico**: Interfaz moderna con efectos de profundidad y sombras
- **Modo Oscuro/Claro**: Tema adaptable que respeta las preferencias del usuario
- **Plantillas Múltiples**: Estilos Moderno, Carta e Inmersivo
- **Personalización Completa**: Colores, fuentes, logos y banners personalizables
- **Responsive Design**: Optimizado para móviles, tablets y desktop

### 🤖 Inteligencia Artificial
- **Generación de Contenido**: Descripciones de platillos y textos de marketing generados con IA (Groq)
- **Asistente de Escritura**: Ayuda a crear contenido atractivo sin esfuerzo
- **Optimización Automática**: Sugerencias inteligentes para mejorar el menú

### 🛒 Funcionalidades de E-commerce
- **Carrito de Compras**: Sistema completo de gestión de pedidos
- **Integración WhatsApp**: Envío directo de pedidos a WhatsApp del restaurante
- **Códigos QR**: Generación automática de QR para compartir menús
- **Gestión de Disponibilidad**: Control de horarios y disponibilidad de platillos

### 📊 Panel de Control
- **Gestión de Información**: Edición completa de datos del restaurante
- **Editor de Menú**: Crear, editar y organizar platillos por categorías
- **Vista Previa en Tiempo Real**: Ver cambios antes de publicar
- **Reportes y Analytics**: Seguimiento de visitas y rendimiento
- **Difusión**: Compartir en redes sociales y generar enlaces

### 🔐 Seguridad y Autenticación
- **Autenticación Segura**: Sistema de login/registro con Supabase Auth
- **Rutas Protegidas**: Acceso controlado al panel de administración
- **Validación de Formularios**: Validación robusta con Zod y React Hook Form
- **Gestión de Sesiones**: Recordar usuario opcional

## 🛠️ Tecnologías

### Frontend
- **React 19.2.0** - Biblioteca de UI
- **TypeScript 5.8** - Tipado estático
- **Vite 6.3** - Build tool y dev server
- **React Router 7.9** - Enrutamiento
- **Framer Motion 11** - Animaciones fluidas
- **Zustand 5.0** - Gestión de estado global
- **React Hook Form 7.51** - Formularios
- **Zod 4.1** - Validación de esquemas
- **Lucide React** - Iconos

### Backend y Servicios
- **Supabase** - Base de datos, autenticación y backend
- **Cloudinary** - Almacenamiento y optimización de imágenes
- **Groq API** - Generación de contenido con IA, siempre a través del AI Gateway
- **FastAPI** - AI Gateway propio: auth JWT, cuotas, reintentos y métricas

### Estilos
- **Tailwind CSS** - Framework CSS utility-first
- **Diseño Neumórfico** - Sistema de diseño personalizado

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18.0 o superior
- **pnpm** 8.0 o superior (recomendado) o npm/yarn
- Cuentas activas en:
  - Supabase (para base de datos y autenticación)
  - Cloudinary (para almacenamiento de imágenes)
  - Groq (para generación de contenido con IA)

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd tuki
   ```

2. **Instala las dependencias**
   ```bash
   pnpm install
   # o
   npm install
   ```

3. **Configura las variables de entorno**
   
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```bash
   cp .env.example .env.local  # Si existe un ejemplo
   # o crea el archivo manualmente
   ```

4. **Configura las variables de entorno** (ver sección [Configuración](#-configuración))

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Supabase - Base de datos y autenticación
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase

# Cloudinary - Almacenamiento de imágenes
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset

# AI Gateway (el navegador nunca ve la clave de Groq)
VITE_AI_GATEWAY_URL=/api
GROQ_API_KEY=tu_clave_de_groq
```

### Obtener las Credenciales

#### Supabase
1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API
4. Copia la URL del proyecto y la clave anónima (anon key)

#### Cloudinary
1. Crea una cuenta en [cloudinary.com](https://cloudinary.com)
2. Ve al Dashboard
3. Copia el Cloud Name
4. Crea un Upload Preset sin firmar (unsigned) llamado `tuki_unsigned` (el nombre real vive en la variable de entorno `VITE_CLOUDINARY_UPLOAD_PRESET`)

#### Groq
1. Crea una cuenta en [console.groq.com](https://console.groq.com)
2. Genera una API Key
3. Copia la clave en `GROQ_API_KEY` (solo la lee el AI Gateway; **no** lleva el
   prefijo `VITE_` y no se incrusta en el bundle)

## 🤖 AI Gateway

La IA ya no se llama desde el navegador con una clave expuesta. La SPA hace
`POST /api/v1/ai/chat` al **AI Gateway** (`services/ai-gateway`), que:

- Valida el JWT de Supabase contra su JWKS.
- Permite tráfico anónimo del carrito con una cuota por IP y da más cuota a los
  usuarios autenticados.
- Reintenta con backoff y hace fallback entre modelos de Groq.
- Expone logs JSON, métricas Prometheus y trazas OpenTelemetry opcionales.

En desarrollo se ejecuta en `http://localhost:8001` y Vite proxya `/api`:

```bash
cd services/ai-gateway
python -m venv .venv
.venv/Scripts/pip install --require-hashes -r requirements-dev.txt   # Windows
.venv/bin/pip install --require-hashes -r requirements-dev.txt       # Linux/macOS
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8001
```

En otra terminal, `pnpm dev`. La guía completa (auth, cuotas, Docker, K8s y
observabilidad) está en **[deploy/README.md](deploy/README.md)**.

## 💻 Uso

### Desarrollo

Inicia el servidor de desarrollo (con el gateway arriba, ver arriba):

```bash
pnpm dev
# o
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

Construye la aplicación para producción:

```bash
pnpm build
# o
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

### Preview de Producción

Para previsualizar la build de producción:

```bash
pnpm preview
# o
npm run preview
```

`preview` solo sirve `dist/`: no incluye el proxy `/api` de Vite. Para probar la
IA en local usa `pnpm dev` o el stack de Compose.

## 📁 Estructura del Proyecto

```
tuki/
├── src/                      # Todo el código de la SPA (TypeScript/React)
│   ├── componentes/          # Componentes React por funcionalidad
│   │   ├── autenticacion/    # Formularios de login y registro
│   │   ├── dinamica/         # Juegos y elementos interactivos
│   │   ├── landing/          # Componentes de la página de inicio
│   │   ├── panel/            # Componentes del panel de control
│   │   ├── restaurante/      # Plantillas y vista pública
│   │   ├── rutas/            # Protección de rutas
│   │   └── sistema-diseno/   # Componentes base del sistema de diseño
│   ├── paginas/              # Páginas principales (una por ruta)
│   ├── api/                  # Clientes HTTP del navegador (Supabase, gateway)
│   ├── contexto/             # Contextos de React (autenticación, tema)
│   ├── hooks/                # Hooks personalizados
│   ├── lib/                  # Utilidades puras (color, slug, formato)
│   ├── store/                # Estado global con Zustand
│   ├── tipos/                # Tipos de TypeScript
│   ├── App.tsx               # Componente raíz y rutas
│   ├── constantes.ts         # Configuración global
│   └── index.tsx             # Punto de entrada de la SPA
├── public/                   # Estáticos servidos tal cual
├── tests/frontend/           # Pruebas de Vitest
├── db/                       # Scripts SQL aplicados en Supabase
├── services/ai-gateway/      # FastAPI: auth, cuotas, Groq y métricas
├── deploy/                   # K8s, ArgoCD, observabilidad y políticas
├── scripts/                  # Utilidades de desarrollo y verificación
├── docker/                   # Configuración de Nginx
├── docs/                     # ADRs, seguridad, arquitectura y runbook
├── Dockerfile                # Imagen de la SPA (Node → Nginx)
├── docker-compose.yml        # Stack local web + AI Gateway
└── package.json              # Dependencias y scripts
```

`src/api/` es el **cliente** que corre en el navegador;
`services/ai-gateway/` es el **servicio** que corre en el servidor. Son cosas
distintas y por eso ya no comparten nombre. El mapa completo, con las reglas de
nombres y la justificación de cada carpeta, está en `docs/estructura.md`.

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo en modo watch |
| `pnpm build` | Construye la aplicación para producción |
| `pnpm preview` | Previsualiza la build de producción localmente |
| `pnpm typecheck` | Verifica los tipos con `tsc --noEmit` |
| `pnpm lint` | ESLint sobre todo el frontend |
| `pnpm test` | Pruebas unitarias con Vitest |

## ✅ Calidad y seguridad
El pipeline bloquea el merge si falla cualquiera de estos controles:

| Control | Comando |
|---------|---------|
| Tipos | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Pruebas del frontend | `pnpm test` |
| Pruebas del gateway | `pytest` en `services/ai-gateway` |
| Secretos en el historial | gitleaks |
| Vulnerabilidades | `pnpm audit --prod` y `pip-audit` |
| Licencias | `node scripts/licencias.mjs licencias.json` |
| Manifiestos | `bash deploy/scripts/validar-k8s.sh` |
| Imágenes | `bash deploy/scripts/verificar-supply-chain.sh` |

## 🧠 Herramientas del agente

El repositorio integra dos servidores MCP locales, registrados en
**`opencode.json`**:

- **CodeGraph** indexa el código en un grafo (símbolos, llamadas, imports,
  impacto) y lo expone al agente con 42 herramientas.
- **Engram** conserva decisiones y hallazgos entre sesiones, aislados por
  proyecto (`tuki`), con 23 herramientas.

```powershell
# instala los binarios en .tools/ (fuera de Git) y verifica el handshake
powershell -ExecutionPolicy Bypass -File scripts/instalar-herramientas.ps1

# o solo la verificación, si ya están instalados
pnpm mcp:verificar
```

Guía completa, recetas de uso y criterios de privacidad:
**[docs/herramientas/codegraph-y-engram.md](docs/herramientas/codegraph-y-engram.md)**.
Las convenciones para agentes están en **[AGENTS.md](AGENTS.md)**.

## 🔐 Variables de Entorno

Las variables `VITE_*` son las únicas que Vite expone al navegador: son públicas
por diseño. Los secretos de servidor (`GROQ_API_KEY`) no llevan ese prefijo y
solo los lee el AI Gateway. Todo `.env.local` está en `.gitignore` y nunca debe
confirmarse en Git.

### Variables Requeridas

- `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_CLOUDINARY_CLOUD_NAME` - Nombre de tu cuenta Cloudinary
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Preset de carga de Cloudinary
- `GROQ_API_KEY` - Clave de Groq, **solo para el AI Gateway** (runtime)

### Variables Opcionales

- `VITE_AI_GATEWAY_URL` - Prefijo del gateway; por defecto `/api`
- `AI_AUTH_MODE` - `disabled` en local, `supabase` en producción
- `AI_RATE_LIMIT_*` - Cuotas anónimas y autenticadas
- `AI_GROQ_MODELS` - Orden de fallback de modelos

> Las variables `VITE_*` son públicas por diseño. `GROQ_API_KEY` nunca debe
> llevar ese prefijo ni aparecer en `dist/`.

## 🚢 Despliegue

### Vercel (solo SPA)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Vercel detectará automáticamente Vite y configurará el build

> La IA necesita el AI Gateway. Si despliegas solo la SPA, configura un rewrite
> de `/api/*` hacia el gateway o define `VITE_AI_GATEWAY_URL` con su URL pública
> y habilita `AI_CORS_ORIGINS` en el gateway. Sin eso, las funciones de IA
> devolverán error.

### Netlify (solo SPA)

1. Conecta tu repositorio a Netlify
2. Configura el build command: `pnpm build`
3. Configura el publish directory: `dist`
4. Agrega las variables de entorno en Site settings
5. Agrega un redirect de `/api/*` al AI Gateway (o usa `VITE_AI_GATEWAY_URL`)

### Otros Proveedores

Cualquier proveedor que soporte aplicaciones estáticas puede hostear Tuki:
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting
- Azure Static Web Apps

### Docker y Kubernetes

El proyecto incluye empaquetado listo para producción sin tocar el código de la
aplicación:

- **Docker:** dos imágenes multi-etapa, usuario no root, rootfs de solo lectura,
  health checks y bases fijadas por digest.
- **Compose:** `docker compose --env-file .env.local up -d --build` publica la
  SPA en <http://localhost:8080> y el gateway en `127.0.0.1:8001`.
- **Kubernetes:** Kustomize con overlays local/producción, Deployments con
  probes y límites, Ingress `/api`, HPA, PDB, NetworkPolicy y Pod Security
  `restricted`.
- **Observabilidad:** ServiceMonitors, 7 alertas y dashboard de Grafana.
- **GitOps:** ArgoCD con sync manual en local y automático en producción.
- **Supply chain:** Hadolint, Trivy, Syft (SBOM), Cosign keyless,
  kubeconform, kube-linter y políticas conftest.

La guía completa (variables, despliegue, TLS, escalado, observabilidad,
seguridad y diagnóstico) está en **[deploy/README.md](deploy/README.md)**. Las
decisiones están en **[docs/adr/](docs/adr/)** y los incidentes en
**[docs/runbook.md](docs/runbook.md)**.

La aplicación de los módulos 1–3 de CloudForge AI 5.0 (fundamentos,
Kubernetes/GitOps/Platform Engineering y DevSecOps) está documentada en
**[docs/modulos-1-3.md](docs/modulos-1-3.md)**, con el modelo de amenazas en
**[docs/security/](docs/security/)** y el catálogo de servicios en
**[catalog-info.yaml](catalog-info.yaml)**.

La práctica de diagnóstico está en
**[docs/laboratorio/fallo-inducido.md](docs/laboratorio/fallo-inducido.md)** y las
evidencias de clúster en
**[docs/laboratorio/modulo-2-runtime.md](docs/laboratorio/modulo-2-runtime.md)**.

La propuesta para la capa social (reseñas, guardados, perfiles y seguimiento)
está en **[docs/producto/red-social-restaurantes.md](docs/producto/red-social-restaurantes.md)**.
El sistema de marca —logo modular, versiones, tamaños y reglas— está en
**[docs/marca/marca-tuki.md](docs/marca/marca-tuki.md)**.
Para reproducir la demostración:

```bash
bash deploy/scripts/demo-plataforma.sh plataforma
bash deploy/scripts/demo-plataforma.sh app
bash deploy/scripts/demo-plataforma.sh verificar
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y de uso interno.

---

<div align="center">
  <p>Hecho con ❤️ para restaurantes que buscan destacar</p>
  <p>© 2024 Tuki. Todos los derechos reservados.</p>
</div>
