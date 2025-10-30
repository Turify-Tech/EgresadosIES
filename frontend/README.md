# Sistema de Gestión de Egresados IES - Frontend

Interfaz de usuario desarrollada con Astro y Tailwind CSS para el sistema de gestión de egresados del Instituto de Educación Superior.

## ✨ Características Principales

-   🔍 **Búsqueda Avanzada**: Sistema completo de filtros con autocompletado
-   📱 **Responsive Design**: Optimizado para móviles y tablets
-   🎨 **UI Moderna**: Interfaz limpia con efectos glassmorphism
-   ⚡ **Rendimiento**: Carga rápida con Astro y componentes optimizados
-   🔒 **Autenticación**: Sistema seguro de login unificado
-   📊 **Perfiles Dinámicos**: Visualización rica de información de egresados

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

## � Sistema de Búsqueda Avanzada

### Funcionalidades implementadas

#### Búsqueda Principal

-   **Autocompletado inteligente**: Sugerencias en tiempo real mientras escribes
-   **Búsqueda difusa**: Encuentra resultados en nombres, empresas, puestos y carreras
-   **Navegación por teclado**: Usa las flechas para navegar las sugerencias

#### Filtros Básicos

-   **Por carrera**: Filtra egresados por su carrera académica
-   **Situación laboral**: Empleado, Desempleado, Estudiando, Emprendedor, Freelancer
-   **Ordenamiento**: Por nombre, carrera o fecha de registro

#### Filtros Avanzados (Colapsables)

-   **Por empresa**: Busca egresados que trabajaron en empresas específicas
-   **Por puesto**: Filtra por rol o posición laboral
-   **Combinables**: Todos los filtros funcionan en conjunto

#### Características Técnicas

-   **URL compartible**: Los filtros se reflejan en la URL para compartir búsquedas
-   **Responsive**: Optimizado para móviles y tablets
-   **Debounce**: Búsqueda en tiempo real con retraso de 500ms
-   **Loading states**: Indicadores visuales durante las búsquedas
-   **Sin resultados**: Mensajes informativos cuando no hay coincidencias

### Componentes de Búsqueda

```
src/components/busqueda/
├── BarraBusqueda.astro     # Barra principal con autocompletado
└── FiltrosBusqueda.astro   # Panel de filtros avanzados

src/utils/
├── searchBar.js            # Lógica del autocompletado
└── advancedSearch.js       # Coordinador de búsqueda
```

### Endpoints del Backend

-   `GET /api/buscar` - Búsqueda con filtros múltiples
-   `GET /api/buscar/autocomplete` - Sugerencias de autocompletado
-   `GET /api/buscar/filtros` - Opciones dinámicas de filtros

## �🔗 Integración con Backend

El frontend se conecta con la API REST del backend para:

-   Autenticación de usuarios
-   Gestión de perfiles
-   **Búsqueda avanzada de egresados**
-   Carga de CVs
-   Reportes y estadísticas

## 🎯 Páginas Principales

-   `/` - Página de inicio
-   `/acceso` - Formulario de login unificado
-   `/perfiles` - **Búsqueda y listado de egresados públicos**
-   `/perfiles/[id]` - Perfil individual detallado
-   `/perfil` - Edición de perfil personal
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
5. **Prueba la búsqueda en diferentes dispositivos**
