# 📁 Estructura del Proyecto - Sistema de Gestión de Egresados IES

## 📋 Descripción General

Este documento describe la estructura organizativa del proyecto, las convenciones de carpetas y dónde encontrar cada tipo de documentación y código.

**Fecha de última actualización:** Noviembre 2025  
**Estado:** ✅ Reorganizado y documentado

---

## 🏗️ Estructura de Carpetas

```
EgresadosIES/
├── backend/                      # Servidor API REST (Node.js + Express)
│   ├── src/                      # Código fuente del backend
│   │   ├── controllers/          # Controladores de endpoints
│   │   ├── routes/               # Definición de rutas
│   │   ├── middleware/           # Middlewares (auth, roles, etc.)
│   │   ├── config/               # Configuración (database, etc.)
│   │   ├── utils/                # Utilidades compartidas
│   │   └── validators/           # Validadores de datos
│   │   
│   ├── scripts/                  # Scripts de mantenimiento y migración
│   │   ├── migrate-*.js          # Scripts de migración de BD
│   │   ├── seed-data.js          # Datos de prueba
│   │   └── create-*.js           # Scripts de creación (índices, etc.)
│   │
│   ├── docs/                     # 📚 DOCUMENTACIÓN DEL BACKEND
│   │   ├── api-error-corregido.md
│   │   ├── errores-backend-frontend-corregidos.md
│   │   ├── FEATURE_SOCIAL_POSTS.md
│   │   ├── solucion-editor-perfil.md
│   │   ├── advanced-search-improvements.md
│   │   ├── unified-auth.md
│   │   ├── social-comments-likes-system.md
│   │   ├── profile-management.md
│   │   ├── security-improvements.md
│   │   ├── security-patch-memory-leak.md
│   │   ├── setup-guide.md
│   │   ├── testing-report.md
│   │   ├── admin-dni-management.md
│   │   ├── messaging-system-final.md
│   │   └── perfiles-publicos-api.md
│   │
│   ├── .env                      # Variables de entorno (NO en git)
│   ├── package.json              # Dependencias del backend
│   └── README.md                 # Guía de inicio rápido del backend
│
├── frontend/                     # Aplicación web (Astro)
│   ├── src/                      # Código fuente del frontend
│   │   ├── pages/                # Páginas de la aplicación
│   │   │   ├── index.astro       # Página pública (feed)
│   │   │   ├── acceso.astro      # Login
│   │   │   ├── dashboard.astro   # Dashboard de egresados
│   │   │   └── perfil/           # Páginas de perfil
│   │   │
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── ComentariosModal.astro
│   │   │   └── busqueda/         # Componentes de búsqueda
│   │   │
│   │   ├── layouts/              # Layouts de página
│   │   │   └── BaseLayout.astro
│   │   │
│   │   ├── styles/               # 🎨 ESTILOS CSS ORGANIZADOS
│   │   │   ├── dashboard.css     # Estilos del dashboard
│   │   │   ├── comentarios-modal.css
│   │   │   └── index.css         # Estilos de la página pública
│   │   │
│   │   └── utils/                # Utilidades del frontend
│   │       ├── api.js            # Funciones de llamadas a API
│   │       ├── advancedSearch.js
│   │       └── advancedSearchSidebar.js
│   │
│   ├── public/                   # Archivos estáticos
│   │   └── images/               # Imágenes públicas
│   │
│   ├── docs/                     # 📚 DOCUMENTACIÓN DEL FRONTEND
│   │   ├── CSS_ORGANIZATION_AND_UI_IMPROVEMENTS.md
│   │   ├── UNIFIED_AUTH.md
│   │   ├── FEED_SOCIAL_DOCUMENTATION.md
│   │   ├── IMPLEMENTATION-SUMMARY.md
│   │   ├── correcciones-imagekit.md
│   │   ├── imagekit-mejoras-perfil.md
│   │   ├── imagekit-setup.md
│   │   ├── debug-tarjetas-perfiles.md
│   │   ├── test-search-implementation.md
│   │   ├── tarjetas-perfil-actualizadas.md
│   │   ├── RESUMEN-PERFIL-MULTIPLE-ELEMENTOS.md
│   │   ├── test-sidebar-design.md
│   │   └── filtros-respuesta-corregida.md
│   │
│   ├── .env                      # Variables de entorno (NO en git)
│   ├── package.json              # Dependencias del frontend
│   ├── astro.config.mjs          # Configuración de Astro
│   └── README.md                 # Guía de inicio rápido del frontend
│
├── schema.sql                    # Esquema completo de la base de datos
├── PROJECT_STRUCTURE.md          # 📖 Este documento
└── README.md                     # Documentación principal del proyecto
```

---

## 📚 Guía de Documentación

### ¿Dónde Encontrar Cada Tipo de Documentación?

#### **Backend (`backend/docs/`)**
Documentación relacionada con:
- **APIs y Endpoints:** `FEATURE_SOCIAL_POSTS.md`, `perfiles-publicos-api.md`
- **Base de Datos:** `solucion-editor-perfil.md`, `profile-management.md`
- **Autenticación:** `unified-auth.md`, `admin-dni-management.md`
- **Búsqueda:** `advanced-search-improvements.md`
- **Mensajería:** `messaging-system-final.md`
- **Sistema Social:** `social-comments-likes-system.md`
- **Seguridad:** `security-improvements.md`, `security-patch-memory-leak.md`
- **Correcciones:** `api-error-corregido.md`, `errores-backend-frontend-corregidos.md`
- **Setup:** `setup-guide.md`, `testing-report.md`

#### **Frontend (`frontend/docs/`)**
Documentación relacionada con:
- **UI/UX y CSS:** `CSS_ORGANIZATION_AND_UI_IMPROVEMENTS.md`
- **Autenticación:** `UNIFIED_AUTH.md`
- **Feed Social:** `FEED_SOCIAL_DOCUMENTATION.md`
- **Búsqueda:** `IMPLEMENTATION-SUMMARY.md`, `test-search-implementation.md`, `filtros-respuesta-corregida.md`
- **Perfiles:** `tarjetas-perfil-actualizadas.md`, `RESUMEN-PERFIL-MULTIPLE-ELEMENTOS.md`, `debug-tarjetas-perfiles.md`
- **ImageKit:** `imagekit-setup.md`, `imagekit-mejoras-perfil.md`, `correcciones-imagekit.md`
- **Diseño:** `test-sidebar-design.md`

#### **Raíz del Proyecto**
- `PROJECT_STRUCTURE.md` - Este documento (estructura y organización)
- `README.md` - Documentación principal y guía de inicio
- `schema.sql` - Esquema de base de datos

---

## 🎯 Convenciones del Proyecto

### Nomenclatura de Archivos

#### **Documentación (.md)**
- **MAYÚSCULAS_CON_GUIONES.md** - Documentación principal/importante
  - Ejemplo: `FEED_SOCIAL_DOCUMENTATION.md`, `CSS_ORGANIZATION_AND_UI_IMPROVEMENTS.md`
  
- **minusculas-con-guiones.md** - Documentación específica/correcciones
  - Ejemplo: `api-error-corregido.md`, `solucion-editor-perfil.md`

#### **Código JavaScript**
- **camelCase.js** - Archivos de código
  - Ejemplo: `advancedSearch.js`, `perfilController.js`

#### **Componentes Astro**
- **PascalCase.astro** - Componentes reutilizables
  - Ejemplo: `BaseLayout.astro`, `ComentariosModal.astro`
  
- **kebab-case.astro** - Páginas y componentes simples
  - Ejemplo: `index.astro`, `dashboard.astro`

#### **Estilos CSS**
- **kebab-case.css** - Archivos de estilos
  - Ejemplo: `dashboard.css`, `comentarios-modal.css`

### Estructura de Carpetas por Funcionalidad

```
Funcionalidad: Sistema de Publicaciones Sociales
├── Backend:
│   ├── src/controllers/publicacionesController.js
│   ├── src/routes/publicacionesRoutes.js
│   └── docs/FEATURE_SOCIAL_POSTS.md
│
└── Frontend:
    ├── src/pages/dashboard.astro
    ├── src/styles/dashboard.css
    └── docs/FEED_SOCIAL_DOCUMENTATION.md
```

---

## 🔄 Proceso de Reorganización (Noviembre 2025)

### Cambios Realizados

#### **1. Organización de Documentación**
**Antes:**
```
EgresadosIES/
├── docs/                         # Documentación mezclada
│   ├── advanced-search-improvements.md
│   ├── correcciones-imagekit.md
│   ├── imagekit-mejoras-perfil.md
│   ├── imagekit-setup.md
│   └── resumen-guardado-perfil.md (vacío)
│
├── FEATURE_SOCIAL_POSTS.md       # Archivos sueltos en raíz
├── FEED_SOCIAL_DOCUMENTATION.md
├── debug-tarjetas-perfiles.md
├── errores-backend-frontend-corregidos.md
├── test-search-implementation.md
└── ... (12+ archivos .md en raíz)
```

**Después:**
```
EgresadosIES/
├── backend/docs/                 # Docs de backend organizados
├── frontend/docs/                # Docs de frontend organizados
└── PROJECT_STRUCTURE.md          # Guía de estructura (este archivo)
```

#### **2. Eliminación de Archivos Temporales**
Archivos de testing eliminados:
- ✅ `test-imagekit.html` - Testing de ImageKit (temporal)
- ✅ `test-publicaciones.http` - Testing de endpoints (temporal)
- ✅ `test-search-endpoints.http` - Testing de búsqueda (temporal)
- ✅ `check-imagekit.sh` - Script bash incompatible con Windows
- ✅ `resumen-guardado-perfil.md` - Archivo vacío sin contenido

#### **3. Extracción de CSS a Archivos Separados**
**Antes:** Estilos inline en componentes Astro (920+ líneas por archivo)

**Después:**
```
frontend/src/styles/
├── dashboard.css (735 líneas)
├── comentarios-modal.css (~490 líneas)
└── index.css (~220 líneas)
```

**Importación en componentes:**
```astro
---
import "../styles/dashboard.css";
---
```

---

## 📖 Documentación por Características

### Sistema de Autenticación
- **Backend:** `backend/docs/unified-auth.md`
- **Frontend:** `frontend/docs/UNIFIED_AUTH.md`
- **Componentes:** `frontend/src/pages/acceso.astro`

### Feed Social y Publicaciones
- **Backend:** `backend/docs/FEATURE_SOCIAL_POSTS.md`, `social-comments-likes-system.md`
- **Frontend:** `frontend/docs/FEED_SOCIAL_DOCUMENTATION.md`, `CSS_ORGANIZATION_AND_UI_IMPROVEMENTS.md`
- **Componentes:** `dashboard.astro`, `index.astro`, `ComentariosModal.astro`

### Búsqueda Avanzada
- **Backend:** `backend/docs/advanced-search-improvements.md`
- **Frontend:** `frontend/docs/IMPLEMENTATION-SUMMARY.md`, `test-search-implementation.md`
- **Componentes:** `frontend/src/components/busqueda/`

### Gestión de Perfiles
- **Backend:** `backend/docs/profile-management.md`, `solucion-editor-perfil.md`
- **Frontend:** `frontend/docs/tarjetas-perfil-actualizadas.md`, `RESUMEN-PERFIL-MULTIPLE-ELEMENTOS.md`
- **Componentes:** `frontend/src/pages/perfil/`

### Carga de Imágenes (ImageKit)
- **Configuración:** `frontend/docs/imagekit-setup.md`
- **Mejoras:** `frontend/docs/imagekit-mejoras-perfil.md`
- **Correcciones:** `frontend/docs/correcciones-imagekit.md`

### Sistema de Mensajería
- **Backend:** `backend/docs/messaging-system-final.md`
- **Componentes:** `frontend/src/pages/mensajes/`

---

## 🛠️ Scripts Útiles

### Backend

```bash
# Desarrollo
npm run dev                       # Iniciar servidor con nodemon

# Migraciones
node scripts/migrate-*.js         # Ejecutar migraciones específicas

# Datos de prueba
node scripts/seed-data.js         # Poblar BD con datos de prueba

# Optimización
node scripts/create-search-indexes.js  # Crear índices de búsqueda
```

### Frontend

```bash
# Desarrollo
npm run dev                       # Iniciar servidor de desarrollo

# Build
npm run build                     # Compilar para producción

# Preview
npm run preview                   # Preview de build de producción
```

---

## 🔐 Variables de Entorno

### Backend (`.env`)
```env
# Base de datos
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=

# Servidor
PORT=3000
FRONTEND_URL=http://localhost:4321

# JWT
JWT_SECRET=

# ImageKit
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=
```

### Frontend (`.env`)
```env
# API
PUBLIC_API_URL=http://localhost:3000

# ImageKit
PUBLIC_IMAGEKIT_PUBLIC_KEY=
PUBLIC_IMAGEKIT_URL_ENDPOINT=
```

---

## 📊 Estadísticas del Proyecto

### Líneas de Código CSS Organizadas
| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `dashboard.css` | 735 | Estilos del dashboard de egresados |
| `comentarios-modal.css` | ~490 | Estilos del modal de comentarios |
| `index.css` | ~220 | Estilos de la página pública |
| **Total** | **~1445** | **CSS organizado y reutilizable** |

### Documentación Organizada
| Ubicación | Archivos | Tipo |
|-----------|----------|------|
| `backend/docs/` | 15 | Documentación de backend y APIs |
| `frontend/docs/` | 14 | Documentación de UI/UX y frontend |
| Raíz | 2 | Documentación general del proyecto |
| **Total** | **31** | **Archivos de documentación** |

---

## 🎯 Próximos Pasos para Desarrolladores

### Para Nuevos Desarrolladores
1. Leer `README.md` en la raíz del proyecto
2. Leer este documento (`PROJECT_STRUCTURE.md`)
3. Configurar variables de entorno según `backend/docs/setup-guide.md`
4. Revisar `backend/docs/unified-auth.md` para entender autenticación
5. Revisar `frontend/docs/UNIFIED_AUTH.md` para el flujo frontend

### Para Agregar Nueva Funcionalidad
1. **Crear endpoints** en `backend/src/controllers/` y `backend/src/routes/`
2. **Documentar API** en `backend/docs/FEATURE_NOMBRE.md`
3. **Crear componentes** en `frontend/src/components/` o `frontend/src/pages/`
4. **Crear estilos** en `frontend/src/styles/nombre-componente.css`
5. **Documentar UI** en `frontend/docs/nombre-feature.md`

### Para Reportar Problemas
1. Revisar documentación relevante en `backend/docs/` o `frontend/docs/`
2. Verificar archivos de correcciones existentes (ej: `api-error-corregido.md`)
3. Si es nuevo, crear documento siguiendo convenciones de nomenclatura

---

## 📝 Notas Finales

### Mantenimiento de la Estructura
- ✅ Mantener separación clara entre backend y frontend
- ✅ Documentar cada feature en su carpeta correspondiente
- ✅ Eliminar archivos temporales después de testing
- ✅ Seguir convenciones de nomenclatura establecidas
- ✅ Actualizar este documento cuando haya cambios estructurales

### Contribuciones
Al agregar nueva documentación o código:
1. Seguir la estructura de carpetas establecida
2. Usar nomenclatura consistente
3. Actualizar README.md si es necesario
4. Documentar cambios significativos

---

**Última actualización:** Noviembre 2025  
**Mantenido por:** Equipo de Desarrollo IES  
**Versión:** 1.0
