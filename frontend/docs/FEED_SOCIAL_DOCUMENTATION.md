# 📱 Feed Social de Egresados - Documentación Completa

## 📋 Índice
1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Características por Tipo de Usuario](#características-por-tipo-de-usuario)
5. [Elementos Visuales](#elementos-visuales)
6. [Funcionalidades Pendientes](#funcionalidades-pendientes)
7. [Enlaces y Funcionalidades No Operativas](#enlaces-y-funcionalidades-no-operativas)
8. [Cambios Realizados en el Backend](#cambios-realizados-en-el-backend)
9. [Notas Técnicas](#notas-técnicas)

---

## 🎯 Resumen del Proyecto

Se implementó un **feed social completo** para la plataforma de egresados del IES, siguiendo el patrón de redes sociales modernas. El feed permite a los egresados autenticados compartir experiencias, logros y conectar con otros miembros de la comunidad.

### Objetivos Cumplidos
- ✅ Feed social funcional en `/dashboard` para usuarios autenticados
- ✅ Vista pública de solo lectura en `/` (index)
- ✅ Creación de publicaciones con validación
- ✅ Eliminación de publicaciones propias
- ✅ Integración con perfiles de usuario (fotos, nombres, información académica)
- ✅ Diseño responsive y moderno con soporte móvil completo
- ✅ Sistema de autenticación y permisos
- ✅ Header sticky y sidebar sticky en desktop
- ✅ Desplegables móviles para tecnicaturas y menú de usuario

---

## ✅ Funcionalidades Implementadas

### 1. **Sistema de Autenticación**
- ✅ Login con DNI y contraseña
- ✅ Verificación de tipo de usuario (Egresado/Administrador)
- ✅ Redirección automática según autenticación
- ✅ Tokens JWT para seguridad
- ✅ Almacenamiento en localStorage
- ✅ Fondo blanco en página de login

### 2. **Feed de Publicaciones (Dashboard)**
**Ubicación:** `/dashboard` (solo egresados autenticados)

#### Características:
- ✅ Saludo personalizado con nombre del usuario y emoji Vector.png
- ✅ Formulario para crear publicaciones
- ✅ Vista de publicaciones en tiempo real
- ✅ Paginación con botón "Cargar más"
- ✅ Eliminación de publicaciones propias
- ✅ Mostrar autor con foto de perfil
- ✅ Fechas relativas (ej: "3h", "2d", "Hace 5 minutos")
- ✅ Botones de likes y comentarios (UI lista, funcionalidad pendiente)

#### Sidebar Izquierdo:
**Card de Perfil:**
- ✅ Banner azul decorativo
- ✅ Foto de perfil del usuario
- ✅ Nombre completo
- ✅ Año de egreso (de formación académica)
- ✅ Título profesional/carrera
- ✅ Enlaces a CV y Portafolio (enlaces deshabilitados)
- ✅ Estado laboral (ej: "En búsqueda de trabajo")

**Card de Menú:**
- ✅ Banner azul decorativo
- ✅ Título "Menú de usuario"
- ✅ "Editar mis datos personales" → `/perfil/editar` (✅ funcional)
- ✅ "Editar mi CV o Portafolio" (❌ enlace no funcional)
- ✅ "Mis publicaciones" (❌ enlace no funcional)

### 3. **Vista Pública (Index)**
**Ubicación:** `/` (accesible sin autenticación)

#### Características:
- ✅ Vista de publicaciones (solo lectura)
- ✅ Sidebar con lista de tecnicaturas
- ✅ Estadísticas de likes y comentarios (sin interacción)
- ✅ Sin formulario de crear publicación
- ✅ Sin botones de acción
- ✅ Descripción del IES en header

### 4. **Header Global**
- ✅ Logo que redirige a `/dashboard` si está autenticado, a `/` si no
- ✅ Navegación dinámica según tipo de usuario
- ✅ Enlace "Ver egresados" → `/perfiles`
- ✅ Botón "Ingresar" para usuarios no autenticados
- ✅ Menú de perfil con dropdown para usuarios autenticados
- ✅ Actualización automática del nombre al editar perfil
- ⚠️ Eliminado enlace duplicado "Mi Perfil" en navegación

### 5. **Formulario de Crear Publicación**
- ✅ Avatar del usuario con foto de perfil
- ✅ Nombre del usuario autenticado
- ✅ Textarea con placeholder descriptivo
- ✅ Botón para subir imágenes (UI presente, funcionalidad pendiente)
- ✅ Validación de contenido vacío
- ✅ Estados de carga (botón "Publicando...")
- ✅ Notificaciones de éxito/error

### 6. **Tarjetas de Publicación**
- ✅ Avatar con foto de perfil del autor
- ✅ Nombre del autor
- ✅ Fecha relativa de publicación
- ✅ Contenido escapado (prevención XSS)
- ✅ Botón de eliminar (solo para el autor)
- ✅ Botones de likes y comentarios (funcionalidad pendiente)
- ✅ Grid de imágenes (si la publicación tiene imágenes)

### 7. **Sistema de Perfiles**
- ✅ Carga de datos de perfil desde API (`/api/perfil/mi-perfil`)
- ✅ Integración de foto de perfil en todos los componentes
- ✅ Nombre completo desde Usuario (nombre + apellido)
- ✅ Título profesional desde tabla Perfil
- ✅ Información académica desde formacionAcademica

---

## 📁 Estructura de Archivos

### Frontend (`/frontend/src/`)

#### Páginas Principales:
```
pages/
├── index.astro               # Vista pública del feed (solo lectura)
├── dashboard.astro           # Feed completo para egresados autenticados
├── acceso.astro             # Página de login con fondo blanco
└── perfil/
    └── editar.astro         # Edición de perfil (funcional)
```

#### Layouts:
```
layouts/
└── BaseLayout.astro         # Layout base con header dinámico
```

#### Imágenes:
```
public/images/
├── logo.png                 # Logo del IES
├── Vector.png               # Emoji de saludo ✋
├── Fondo Azul card.jpg     # Banner de las cards
└── Group 99.png            # Icono "Ver egresados"
```

### Backend (`/backend/src/`)

#### Controladores:
```
controllers/
├── publicacionesController.js  # CRUD de publicaciones + autor con foto
└── perfilController.js         # Datos de perfil de usuario
```

#### Rutas:
```
routes/
└── publicacionesRoutes.js     # GET públicos, POST/DELETE privados
```

---

## 👥 Características por Tipo de Usuario

### 🚫 Usuario NO Autenticado (Vista Pública)
**Puede:**
- ✅ Ver todas las publicaciones
- ✅ Ver nombres de autores
- ✅ Ver fechas de publicación
- ✅ Ver estadísticas de likes y comentarios (números)
- ✅ Ver lista de tecnicaturas en sidebar

**NO Puede:**
- ❌ Crear publicaciones
- ❌ Dar likes
- ❌ Comentar
- ❌ Eliminar publicaciones
- ❌ Acceder a perfiles completos

### ✅ Usuario Autenticado (Egresado)
**Puede:**
- ✅ Todo lo del usuario no autenticado +
- ✅ Ver dashboard personalizado con saludo
- ✅ Crear nuevas publicaciones
- ✅ Eliminar sus propias publicaciones
- ✅ Ver su card de perfil con foto y datos
- ✅ Acceder al menú de usuario
- ✅ Editar sus datos personales
- ✅ Ver su foto de perfil en formularios y publicaciones

**NO Puede (funcionalidad pendiente):**
- ⏳ Dar likes a publicaciones
- ⏳ Comentar en publicaciones
- ⏳ Editar publicaciones existentes
- ⏳ Subir imágenes a publicaciones
- ⏳ Acceder a "Mis publicaciones"
- ⏳ Editar CV/Portafolio desde el menú

---

## 🎨 Elementos Visuales

### Espaciado y Layout
- ✅ **Gap entre columnas:** 2.5rem (aumentado desde 1.5rem)
- ✅ **Padding superior del contenedor:** 1.5rem
- ✅ **Sticky sidebar:** `top: 2.5rem` (aumentado desde 1rem)
- ✅ **Todas las cards:** `box-shadow: 0 4px 12px rgba(0,0,0,0.15)` (sombra más pronunciada)

### Cards
- ✅ **Profile Card:** Fondo blanco, border-radius 8px, sombra elevada
- ✅ **Menu Card:** Fondo blanco, border-radius 8px, sombra elevada
- ✅ **Crear Post Card:** Fondo blanco, border-radius 8px, sombra elevada
- ✅ **Post Card:** Fondo blanco, border-radius 8px, borde gris, sombra elevada

### Colores
- **Primario:** `#1437C3` (azul IES)
- **Fondo:** `#f5f5f5` (gris claro)
- **Cards:** `#ffffff` (blanco)
- **Avatar por defecto:** `#c7d2fe` (azul claro)
- **Texto principal:** `#000000`
- **Texto secundario:** `#666666`
- **Bordes:** `#e5e7eb`

### Tipografía
- **Fuente principal:** Inter, sans-serif
- **Fuente títulos:** Pontano Sans, sans-serif
- **Tamaños:**
  - Nombres: 1rem (16px)
  - Subtítulos: 0.8rem (13px)
  - Texto normal: 0.95rem (15px)
  - Títulos sección: 1.75rem (28px)

---

## ⏳ Funcionalidades Pendientes

### Alta Prioridad
1. **Sistema de Likes**
   - ❌ Backend: Crear endpoints POST/DELETE `/api/publicaciones/:id/likes`
   - ❌ Frontend: Implementar `toggleLike()` function
   - ❌ Base de datos: Posible tabla Likes (publicacionId, usuarioId, timestamp)
   - 📝 Nota: Los botones de UI ya están presentes, solo falta la lógica

2. **Sistema de Comentarios**
   - ❌ Backend: Crear endpoints GET/POST `/api/publicaciones/:id/comentarios`
   - ❌ Frontend: Implementar `toggleComments()` function
   - ❌ UI: Crear componente de lista de comentarios y formulario
   - ❌ Mostrar/ocultar sección de comentarios al hacer clic
   - 📝 Nota: Probablemente ya existe tabla Comentarios en DB

3. **Subida de Imágenes en Publicaciones**
   - ❌ Backend: Endpoint para upload de imágenes
   - ❌ Decidir: ImageKit, almacenamiento local, o servicio cloud
   - ❌ Frontend: Preview de imágenes antes de publicar
   - ❌ Validación de tamaño y formato
   - 📝 Nota: Input file ya existe, muestra "próximamente"

### Media Prioridad
4. **Editar Publicaciones**
   - ❌ Backend: Endpoint PUT `/api/publicaciones/:id`
   - ❌ Frontend: Modal o formulario inline para edición
   - ❌ Validación de permisos (solo autor puede editar)

5. **Filtro "Mis Publicaciones"**
   - ❌ Endpoint GET `/api/publicaciones/usuario/:userId` (existe pero no está conectado)
   - ❌ Página o vista filtrada
   - ❌ Enlace funcional en menú de usuario

6. **Editar CV/Portafolio**
   - ❌ Crear página `/perfil/cv` o similar
   - ❌ Formulario para experiencia laboral
   - ❌ Formulario para formación académica
   - ❌ Sistema de upload de CV en PDF

### Baja Prioridad
7. **Notificaciones en Tiempo Real**
   - ❌ WebSockets o SSE para actualizaciones
   - ❌ Notificaciones de nuevos likes/comentarios
   - ❌ Badge de notificaciones en header

8. **Búsqueda y Filtros**
   - ❌ Buscar publicaciones por contenido
   - ❌ Filtrar por autor
   - ❌ Filtrar por fecha

9. **Compartir Publicaciones**
   - ❌ Botón de compartir
   - ❌ Generar enlace directo a publicación

---

## 🔗 Enlaces y Funcionalidades No Operativas

### En Sidebar - Card de Perfil
| Elemento | Estado | Enlace | Acción Necesaria |
|----------|--------|--------|------------------|
| Ver Currículum Vitae | ❌ No funcional | `href="#"` | Crear página `/perfil/cv` o vincular a archivo PDF |
| Ver Portafolio | ❌ No funcional | `href="#"` | Crear página `/perfil/portafolio` o vincular a URL externa |
| Estado laboral | ℹ️ Informativo | N/A | Solo muestra texto, sin funcionalidad adicional |

### En Sidebar - Card de Menú
| Elemento | Estado | Enlace | Acción Necesaria |
|----------|--------|--------|------------------|
| Editar mis datos personales | ✅ Funcional | `/perfil/editar` | **Ya funciona** |
| Editar mi CV o Portafolio | ❌ No funcional | `href="#"` | Crear sistema de edición de CV/Portafolio |
| Mis publicaciones | ❌ No funcional | `href="#"` | Implementar filtro de publicaciones propias |

### En Header (BaseLayout)
| Elemento | Estado | Enlace | Acción Necesaria |
|----------|--------|--------|------------------|
| Logo EgresadosIES | ✅ Funcional | `/dashboard` o `/` | **Funciona dinámicamente** |
| Admin | ✅ Funcional | `/admin` | **Ya funciona** (solo para admins) |
| Ver egresados | ✅ Funcional | `/perfiles` | **Ya funciona** |
| Mi Perfil (dropdown) | ✅ Funcional | `/dashboard` | **Ya funciona** |
| Cerrar Sesión | ✅ Funcional | `logout()` | **Ya funciona** |

### En Publicaciones (Dashboard)
| Elemento | Estado | Funcionalidad | Acción Necesaria |
|----------|--------|---------------|------------------|
| Botón Comentar | ❌ No funcional | `toggleComments(id)` | Implementar backend + frontend |
| Botón Like | ❌ No funcional | `toggleLike(id)` | Implementar backend + frontend |
| Botón Eliminar | ✅ Funcional | `deletePost(id)` | **Ya funciona** (solo autor) |
| Botón Subir Imagen | ⚠️ UI presente | Muestra "próximamente" | Implementar upload de imágenes |

### En Formulario de Crear Publicación
| Elemento | Estado | Funcionalidad | Acción Necesaria |
|----------|--------|---------------|------------------|
| Textarea | ✅ Funcional | Escribe contenido | **Ya funciona** |
| Botón Publicar | ✅ Funcional | POST a API | **Ya funciona** |
| Input Imagen | ⚠️ UI presente | Muestra notificación | Implementar upload completo |

---

## 🔧 Cambios Realizados en el Backend

### 1. **publicacionesController.js**
```javascript
// Se modificó listarPublicaciones() para incluir foto de perfil del autor
const autorQuery = `
    SELECT 
        u.nombre as nombreUsuario,
        u.apellido,
        p.tituloprofesional,
        p.urlFotoPerfil          // ← NUEVO
    FROM Usuario u
    LEFT JOIN Egresado e ON u.id = e.id
    LEFT JOIN Perfil p ON e.perfilId = p.id
    WHERE u.id = ${publicacion.autorId}
`;

// Retorna autor con estructura:
{
    id: autorId,
    nombre: "Nombre Completo",
    urlFotoPerfil: "https://..."  // ← NUEVO
}
```

**Prioridad de nombre:**
1. `nombre + apellido` (si ambos existen)
2. `nombre` solo
3. `tituloprofesional` (fallback)

### 2. **publicacionesRoutes.js**
```javascript
// Reorganización de rutas:

// PÚBLICAS (sin autenticación):
router.get('/publicaciones', listarPublicaciones);
router.get('/publicaciones/:id', obtenerPublicacionPorId);
router.get('/publicaciones/usuario/:userId', obtenerPublicacionesPorUsuario);

// PRIVADAS (requieren token + rol Egresado):
router.post('/publicaciones', authenticateToken, requireEgresado, crearPublicacion);
router.put('/publicaciones/:id', authenticateToken, requireEgresado, actualizarPublicacion);
router.delete('/publicaciones/:id', authenticateToken, requireEgresado, eliminarPublicacion);
```

**Antes:** Todas las rutas requerían autenticación
**Ahora:** GET públicos, write operations privadas

### 3. **Endpoints Disponibles**
| Método | Ruta | Autenticación | Función |
|--------|------|---------------|---------|
| GET | `/api/publicaciones` | No | Lista todas las publicaciones |
| GET | `/api/publicaciones/:id` | No | Obtiene una publicación específica |
| GET | `/api/publicaciones/usuario/:userId` | No | Publicaciones de un usuario |
| POST | `/api/publicaciones` | Sí (Egresado) | Crea nueva publicación |
| PUT | `/api/publicaciones/:id` | Sí (Egresado) | Actualiza publicación |
| DELETE | `/api/publicaciones/:id` | Sí (Egresado) | Elimina publicación |
| GET | `/api/perfil/mi-perfil` | Sí (Egresado) | Datos del perfil del usuario |

---

## 📝 Notas Técnicas

### Seguridad
- ✅ Tokens JWT almacenados en localStorage
- ✅ Middleware de autenticación en rutas privadas
- ✅ Verificación de tipo de usuario (Egresado vs Administrador)
- ✅ Verificación de propiedad para eliminar publicaciones
- ✅ Escapado de HTML para prevenir XSS
- ⚠️ Los console.logs de debugging deberían eliminarse en producción

### Performance
- ✅ Paginación implementada (10 publicaciones por página)
- ✅ Lazy loading con botón "Cargar más"
- ✅ Sticky sidebar para mejor UX
- ✅ LocalStorage para cache de datos de usuario
- ⚠️ Las imágenes de perfil se cargan cada vez (considerar cache)

### Responsive Design
- ✅ Grid layout adaptativo
- ✅ Sidebar oculto en móviles (< 768px)
- ✅ Ajustes de tamaños de fuente y padding
- ✅ Todos los componentes escalables

### Base de Datos
**Tablas Involucradas:**
- `Usuario` (id, nombre, apellido, email, tipo_usuario)
- `Egresado` (id, perfilId)
- `Perfil` (id, tituloprofesional, urlFotoPerfil)
- `Publicacion` (id, contenido, autorId, fechaCreacion)
- `formacionAcademica` (año de egreso)
- Posibles: `Comentarios`, `Likes` (pendiente implementar)

### Estilos CSS
- ✅ `<style is:global>` usado para permitir estilos dinámicos
- ✅ Variables CSS para consistencia de colores
- ✅ Transiciones suaves en hover
- ✅ Box-shadows consistentes: `0 4px 12px rgba(0,0,0,0.15)`
- ✅ Border-radius: 8px en todas las cards

### JavaScript
**Funciones Principales (dashboard.astro):**
```javascript
// Utilidades
getUserData()              // Obtiene usuario de localStorage
getAuthToken()             // Obtiene token JWT
formatearFechaRelativa()   // Convierte fechas a formato relativo

// Perfil
cargarDatosPerfil()        // Carga datos desde API

// Publicaciones
cargarPublicaciones(page)  // Fetch de publicaciones con paginación
crearPostCard(pub)         // Genera HTML de tarjeta de post
crearPublicacion()         // POST nueva publicación
deletePost(id)             // DELETE publicación propia

// Interacciones (pendiente implementar)
toggleLike(id)             // Dar/quitar like
toggleComments(id)         // Mostrar/ocultar comentarios

// Notificaciones
showNotification(msg, type) // Muestra notificación temporal
```

### Buenas Prácticas Aplicadas
- ✅ Separación de preocupaciones (layout, páginas, componentes)
- ✅ Nombres descriptivos de variables y funciones
- ✅ Validación de datos en frontend y backend
- ✅ Manejo de errores con try/catch
- ✅ Loading states (botones, spinners)
- ✅ Feedback al usuario (notificaciones)
- ✅ Código comentado para claridad

### Mejoras Sugeridas para el Futuro
1. **Optimización:**
   - Implementar React Query o similar para cache
   - Debounce en búsquedas
   - Virtual scrolling para feeds largos

2. **UX:**
   - Skeleton loaders en lugar de spinners
   - Animaciones de entrada/salida de posts
   - Confirmación antes de eliminar
   - Drag & drop para imágenes

3. **Código:**
   - Migrar a TypeScript completo
   - Crear componentes reutilizables (.astro o .tsx)
   - Tests unitarios y de integración
   - Documentación con JSDoc

4. **Backend:**
   - Rate limiting por usuario
   - Logs estructurados
   - Caché con Redis
   - Websockets para tiempo real

---

## 🎉 Conclusión

El feed social está **funcional y listo para uso** en su forma actual. Los usuarios pueden:
- Ver publicaciones (todos)
- Crear publicaciones (autenticados)
- Eliminar sus publicaciones (autenticados)
- Navegar con paginación
- Ver perfiles con fotos

Las funcionalidades pendientes (likes, comentarios, imágenes) requieren trabajo adicional en el backend primero, pero la infraestructura frontend ya está preparada para recibirlas.

**Estado del proyecto:** 🟢 **Producción-ready** para funcionalidades actuales
**Estado de funcionalidades extra:** 🟡 **Pendiente de desarrollo backend**

---

**Última actualización:** 2 de noviembre de 2025
**Branch:** `feature/social-feed-clean`
**Desarrollado por:** GitHub Copilot
