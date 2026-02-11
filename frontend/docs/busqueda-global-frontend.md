# Búsqueda Global - Interfaz de Usuario

## Descripción General
Implementación del sistema de búsqueda global simplificado con enfoque en personas y publicaciones, incluyendo navegación inteligente basada en el estado de autenticación del usuario.

## Cambios Realizados

### 1. Página de Resultados (resultados.astro)

#### Simplificación de categorías
- **Eliminadas**: Carreras y Tecnologías
- **Mantenidas**: Personas y Publicaciones
- Se actualizaron los filtros de categoría para mostrar solo "Todos", "Personas" y "Publicaciones"

#### Título dinámico de búsqueda
El título ahora muestra el término buscado dinámicamente:

```javascript
// Antes
<h1>Resultados para: <span>{query || ''}</span></h1>

// Después
<h1 id="search-title">Resultados de búsqueda</h1>

// En JavaScript
searchTitleEl.innerHTML = `Resultados para: <span class="search-query">"${query}"</span>`;
```

#### Publicaciones clickeables
Las publicaciones ahora son totalmente clickeables y redirigen a la página principal con la publicación específica:

**Todos los usuarios** → `/?publicacion={id}`

```javascript
const redirectUrl = `/?publicacion=${id}`;
```

**Características visuales:**
- Cursor pointer en toda la tarjeta
- Estilo hover con elevación (box-shadow)
- Transición suave

#### Eliminación de interacciones sociales
Se removieron de la vista de búsqueda:
- Botones de like
- Botones de comentarios
- Contadores de interacciones

Las publicaciones muestran únicamente:
- Avatar del autor
- Nombre del autor
- Fecha de publicación
- Contenido de la publicación
- Imágenes adjuntas (si las tiene)

### 2. Página de Inicio (index.astro)

#### Navegación desde búsqueda
Se agregó funcionalidad para detectar el parámetro `publicacion` en la URL y hacer scroll automático:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    cargarPublicaciones(1).then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const publicacionId = urlParams.get('publicacion');
        
        if (publicacionId) {
            setTimeout(() => {
                const postElement = document.querySelector(`[data-post-id="${publicacionId}"]`);
                if (postElement) {
                    postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Resaltar brevemente la publicación
                    postElement.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
                    setTimeout(() => {
                        postElement.style.boxShadow = '';
                    }, 2000);
                }
            }, 500);
        }
    });
});
```

**Características:**
- Scroll suave hasta la publicación
- Resaltado visual temporal (2 segundos)
- Centrado de la publicación en la pantalla

### 3. Estilos CSS (search-results.css)

#### Publicaciones clickeables
```css
.post-card-clickable {
    cursor: pointer;
    transition: all 0.2s ease;
}

.post-card-clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Flujo de Usuario

### Escenario 1: Usuario NO autenticado

1. Usuario busca un término en la barra de búsqueda global
2. Ve resultados de personas y publicaciones
3. Hace click en una publicación
4. Es redirigido a la página de inicio (`/`)
5. La página hace scroll automático a la publicación
6. La publicación se resalta temporalmente
7. El usuario puede ver la publicación completa con comentarios y likes

### Escenario 2: Usuario autenticado

1. Usuario busca un término en la barra de búsqueda global
2. Ve resultados de personas y publicaciones
3. Hace click en una publicación
4. Es redirigido al dashboard (`/dashboard`)
5. El dashboard hace scroll automático a la publicación
6. El usuario puede interactuar completamente (like, comentar, compartir)

## Componentes Eliminados

### Backend
- `buscarCarreras()`
- `buscarTecnologias()`

### Frontend
- Botón de filtro "Carreras"
- Botón de filtro "Tecnologías"
- Sección de resultados de carreras
- Sección de resultados de tecnologías
- Funciones `renderCarreras()`
- Funciones `renderTecnologias()`
- Botones de like en resultados de búsqueda
- Botones de comentarios en resultados de búsqueda
- Modal de comentarios en resultados de búsqueda

## Archivos Modificados

```
frontend/src/pages/busqueda/resultados.astro
frontend/src/pages/index.astro
frontend/src/styles/search-results.css
```

## Mejoras Futuras

- [ ] Lazy loading de publicaciones en la página de inicio
- [ ] Caché de resultados de búsqueda
- [ ] Destacar el término buscado en los resultados
- [ ] Búsqueda por voz
- [ ] Sugerencias de búsqueda basadas en historial

## Notas Técnicas

- Se mantiene compatibilidad con el sistema de notificaciones que ya usa `?publicacion={id}`
- El scroll se ejecuta 500ms después de cargar para asegurar que el DOM esté actualizado
- El resaltado visual usa el color primario del sistema (azul #3b82f6)
- Todas las búsquedas son públicas y no requieren autenticación
