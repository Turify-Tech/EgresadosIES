# Sistema de Notificaciones - Frontend

## Descripción General
Interfaz completa de notificaciones con modal popup, badges en tiempo real y página de preferencias con diseño personalizado.

## Componentes

### NotificacionesModal.astro
Modal principal para visualizar notificaciones.

**Características:**
- Header con imagen de fondo (Fondo Azul card.jpg)
- Título "Notificaciones" en blanco
- Botón de configuración (icono de engranaje)
- Botón de cerrar (X)
- Acciones: "Marcar todas leídas" y "Limpiar leídas"
- Contenido con imagen de fondo (imgen_de_fondo.jpg)
- Se cierra con ESC o click fuera

**Ubicación:**
```
frontend/src/components/NotificacionesModal.astro
```

### NotificacionesList.astro
Lista de notificaciones con patrón "cargar más".

**Características:**
- Carga inicial: 5 notificaciones
- Botón "Cargar más" que añade 5 adicionales
- Avatares con badge de tipo (💬 📝 ❤️ @)
- Avatar: 48px circular
- Badge: 22px en esquina inferior derecha
- Timestamps relativos que se actualizan cada 10 segundos
- Filtros por tipo (todas, comentarios, likes, menciones)
- Click en notificación la marca como leída y navega

**Script:**
```javascript
window.cargarNotificacionesModal() // Función global para recargar
```

### Integración en BaseLayout.astro

**Badge contador:**
```javascript
// Polling cada 30 segundos
setInterval(actualizarContadorNotificaciones, 30000);
```

**Botón de notificaciones:**
- Icono de campana con badge
- Click abre el modal
- Badge muestra contador de no leídas

## Páginas

### notificaciones/preferencias.astro
Página de configuración de preferencias.

**Diseño:**
- Fondo: imagen imgen_de_fondo.jpg con overlay blanco 15%
- Header: Fondo Azul card.jpg con overlay negro 10%
- Texto en blanco con sombras
- Botón back translúcido con glassmorphism
- Tres cards de preferencias (Comentarios, Me gusta, Menciones)
- Toggle switches con gradiente cuando activos
- Botón "Guardar cambios" con gradiente morado

**Funcionalidad:**
- Carga preferencias del usuario
- Actualiza con PUT a `/api/notificaciones/preferencias`
- Toast de éxito/error
- Campos: `email_comentarios`, `email_likes`, `email_menciones`

## Estilos

### notificaciones.css
Archivo CSS centralizado con todos los estilos del sistema.

**Secciones:**
1. **Modal** - Overlay, container, header, content
2. **Lista** - Items, avatares, badges, contenido
3. **Iconos** - Colores por tipo (azul, rojo, naranja)
4. **Botones** - Actions, load more
5. **Estados** - No leída, hover, vacío
6. **Responsive** - Mobile, tablet

**Colores de badges:**
- Comentario: `#3b82f6` (azul)
- Like: Gradiente `#ff6b6b → #ee5a6f` (rojo)
- Mención: `#f59e0b` (naranja)

## Funcionalidades JavaScript

### Actualización de timestamps
```javascript
// Se ejecuta cada 10 segundos
setInterval(actualizarFechasRelativas, 10000);
```

**Formato:**
- Menos de 1 min: "Ahora"
- Menos de 1 hora: "X min"
- Menos de 24 horas: "X h"
- Más de 24 horas: "X d"

### Polling de contador
```javascript
// Actualiza badge cada 30 segundos
setInterval(actualizarContadorNotificaciones, 30000);
```

### Patrón "Cargar más"
- Initial load: 5 items (limit=5, offset=0)
- Click "Cargar más": +5 items (offset incrementa)
- Botón se deshabilita si no hay más

## API Endpoints Utilizados

```
GET  /api/notificaciones?limit=5&offset=0&tipo=&leida=
GET  /api/notificaciones/no-leidas/count
PUT  /api/notificaciones/:id/leer
PUT  /api/notificaciones/leer-todas
DELETE /api/notificaciones/limpiar-leidas
GET  /api/notificaciones/preferencias
PUT  /api/notificaciones/preferencias
```

## Imágenes Utilizadas

### Modal y Preferencias
- **Header:** `/images/Fondo%20Azul%20card.jpg`
- **Background:** `/images/imgen_de_fondo.jpg`

### Avatares
- Fallback: Iniciales del usuario en círculo de color

## Responsive

### Mobile (≤768px)
- Modal a pantalla completa
- Header compacto (1rem padding)
- Acciones en columna
- Avatares más pequeños (36px)

### Tablet (≤480px)
- Botones a ancho completo
- Toast notifications ocupan todo el ancho

## Notas Técnicas

### IIFE Pattern
Scripts usan Immediately Invoked Function Expression para evitar conflictos:
```javascript
(function() {
  // código aislado
  window.functionName = () => {}; // exponer globalmente
})();
```

### Token Authentication
```javascript
const token = localStorage.getItem('auth_token');
```

### API URL
```javascript
const API_URL = 'http://localhost:3000/api';
```

## Estados de Notificación

### Visual
- **No leída:** Fondo azul claro (#eff6ff)
- **Leída:** Fondo blanco
- **Hover:** Fondo gris claro (#f9fafb)

### Badge en Navbar
- **Sin notificaciones:** Badge oculto
- **Con notificaciones:** Badge rojo con número

## Convenciones

### Nombres de clases CSS
- `.notificaciones-modal-*` - Componentes del modal
- `.notificacion-*` - Items de notificación
- `.btn-*` - Botones específicos

### IDs importantes
- `notificaciones-modal-overlay` - Overlay del modal
- `btn-close-modal` - Botón cerrar
- `btn-modal-marcar-todas` - Marcar todas leídas
- `btn-modal-limpiar` - Limpiar leídas
