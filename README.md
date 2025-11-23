<div align="center">
  <h1>🍽️ SmartFood</h1>
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
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Variables de Entorno](#-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

## 🎯 Descripción

**SmartFood** es una plataforma SaaS moderna que permite a restaurantes crear, gestionar y publicar sus sitios web de menú digital en minutos. Con integración de Inteligencia Artificial, diseño neumórfico elegante y funcionalidades avanzadas, SmartFood elimina la necesidad de conocimientos técnicos para tener presencia digital profesional.

### ¿Qué hace SmartFood?

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
- **Groq API** - Generación de contenido con IA (Llama 3.3)
- **Google Gemini** - API de IA adicional (opcional)

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
   cd LeeFood
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

# APIs de Inteligencia Artificial
VITE_GROQ_API_KEY=tu_clave_de_groq
GEMINI_API_KEY=tu_clave_de_gemini  # Opcional
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
4. Crea un Upload Preset sin firmar (unsigned) llamado `smartfood_unsigned`

#### Groq
1. Crea una cuenta en [console.groq.com](https://console.groq.com)
2. Genera una API Key
3. Copia la clave en `VITE_GROQ_API_KEY`

## 💻 Uso

### Desarrollo

Inicia el servidor de desarrollo:

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

## 📁 Estructura del Proyecto

```
LeeFood/
├── componentes/           # Componentes React organizados por funcionalidad
│   ├── autenticacion/    # Formularios de login y registro
│   ├── dinamica/         # Juegos y elementos interactivos
│   ├── landing/          # Componentes de la página de inicio
│   ├── panel/            # Componentes del panel de control
│   ├── restaurante/      # Plantillas y componentes de vista pública
│   ├── rutas/            # Componentes de protección de rutas
│   └── sistema-diseno/   # Componentes base del sistema de diseño
├── contexto/             # Contextos de React (Autenticación, Tema)
├── hooks/                # Custom hooks personalizados
├── lib/                  # Utilidades y servicios (Supabase, Groq, Cloudinary)
├── paginas/              # Componentes de páginas principales
├── servicios/            # Servicios de API y lógica de negocio
├── store/                # Estado global con Zustand
├── tipos/                # Definiciones de TypeScript
├── App.tsx               # Componente raíz y configuración de rutas
├── constantes.ts         # Constantes y configuración global
├── index.tsx             # Punto de entrada de la aplicación
├── vite.config.ts        # Configuración de Vite
└── package.json          # Dependencias y scripts
```

## 📜 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el servidor de desarrollo en modo watch |
| `pnpm build` | Construye la aplicación para producción |
| `pnpm preview` | Previsualiza la build de producción localmente |

## 🔐 Variables de Entorno

Todas las variables de entorno deben estar prefijadas con `VITE_` para que Vite las exponga al cliente. Las variables sensibles como API keys deben estar en `.env.local` que está en `.gitignore`.

### Variables Requeridas

- `VITE_SUPABASE_URL` - URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase
- `VITE_CLOUDINARY_CLOUD_NAME` - Nombre de tu cuenta Cloudinary
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Preset de carga de Cloudinary
- `VITE_GROQ_API_KEY` - Clave API de Groq para generación de contenido

### Variables Opcionales

- `GEMINI_API_KEY` - Clave API de Google Gemini (si se usa)

## 🚢 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Vercel detectará automáticamente Vite y configurará el build

### Netlify

1. Conecta tu repositorio a Netlify
2. Configura el build command: `pnpm build`
3. Configura el publish directory: `dist`
4. Agrega las variables de entorno en Site settings

### Otros Proveedores

Cualquier proveedor que soporte aplicaciones estáticas puede hostear SmartFood:
- GitHub Pages
- AWS S3 + CloudFront
- Firebase Hosting
- Azure Static Web Apps

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
  <p>© 2024 SmartFood. Todos los derechos reservados.</p>
</div>
