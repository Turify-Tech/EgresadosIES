# Sistema de Gestión de Egresados IES - Frontend

Interfaz de usuario desarrollada con Astro y Tailwind CSS para el sistema de gestión de egresados del Instituto de Educación Superior.

## 🚀 Inicio Rápido

### Prerrequisitos

-   Node.js 18+
-   npm o yarn

### Instalación

1. **Instalar dependencias**

```bash
npm install
```

2. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`

## 🛠️ Comandos Disponibles

-   `npm run dev` - Servidor de desarrollo
-   `npm run build` - Build para producción
-   `npm run preview` - Preview del build
-   `npm run astro` - CLI de Astro

## 🎨 Tecnologías

-   **Astro** - Framework principal
-   **Tailwind CSS** - Styling
-   **TypeScript** - Tipado estático
-   **Responsive Design** - Mobile-first

## 📱 Características

-   ✅ Diseño responsive
-   ✅ Navegación intuitiva
-   ✅ Formularios accesibles
-   ✅ Optimización SEO
-   ✅ Carga rápida (SSG)

## 🗂️ Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── layouts/        # Layouts de página
│   ├── pages/          # Páginas de la aplicación
│   ├── styles/         # Estilos globales
│   └── utils/          # Utilidades frontend
├── public/             # Assets estáticos
├── astro.config.mjs    # Configuración Astro
├── tailwind.config.mjs # Configuración Tailwind
└── package.json
```

## 🔗 Integración con Backend

El frontend se conecta con la API REST del backend para:

-   Autenticación de usuarios
-   Gestión de perfiles
-   Carga de CVs
-   Reportes y estadísticas

## 🎯 Páginas Principales

-   `/` - Página de inicio
-   `/login` - Formulario de login unificado
-   `/profile` - Perfil del egresado
-   `/admin` - Panel administrativo
-   Más páginas según issues...

## ⚡ Rendimiento

Astro genera sitios estáticos ultrarrápidos con hidratación selectiva de componentes interactivos.

## 🛠️ Desarrollo

Para contribuir:

1. Revisa las issues del proyecto
2. Sigue las convenciones de código
3. Usa componentes Astro para máximo rendimiento
4. Mantén el diseño responsive y accesible
