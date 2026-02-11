# Persistencia Visual de Likes - Frontend

## Fecha
11 de febrero de 2026

## Problema
Los botones de like funcionaban correctamente (se guardaban en la base de datos), pero al recargar la página, los corazones volvían a mostrarse sin relleno (outline) en lugar de rellenos en rojo. El estado visual no persistía entre sesiones.

## Solución Implementada

### 1. Renderizado con Estado de Like
**Archivo:** `frontend/src/pages/index.astro`

La función `crearPostCard()` ya estaba preparada para recibir el estado de like y renderizar el corazón correctamente:

```typescript
function crearPostCard(publicacion, userLiked = false) {
    // ... código anterior ...
    
    // Renderiza el botón de like con clases condicionales
    <button class="action-btn like-btn ${userLiked ? "liked" : ""}" data-post-id="${id}">
        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" 
             fill="${userLiked ? "currentColor" : "none"}"  // ← Relleno condicional
             stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <span class="count">${totalLikes}</span>
    </button>
}
```

### 2. Uso del Campo userLiked del Backend
La función `renderPublicaciones()` ya pasaba correctamente el campo `userLiked` recibido del backend:

```typescript
function renderPublicaciones(data, page) {
    data.publicaciones.forEach((publicacion) => {
        const cardHTML = crearPostCard(
            publicacion,
            publicacion.userLiked || false  // ← Usa el campo del backend
        );
        tempContainer.innerHTML = cardHTML;
        fragment.appendChild(tempContainer.firstElementChild);
    });
    
    feedList.appendChild(fragment);
}
```

### 3. Envío de Token de Autenticación
La función `cargarPublicaciones()` ya estaba enviando el token JWT cuando el usuario está autenticado:

```typescript
async function cargarPublicaciones(page = 1) {
    const token = getAuthToken();
    const headers: any = {};

    // Agregar token solo si existe (usuario autenticado)
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_URL}/publicaciones?page=${page}&limit=10`,
        { headers }
    );
    
    const result = await response.json();
    renderPublicaciones(result.data, page);
}
```

## Detalles de Implementación

### Estilos CSS
El estado visual del like se controla mediante la clase `liked`:

```css
.like-btn.liked {
    color: #ef4444; /* Rojo */
}

.like-btn.liked svg {
    fill: currentColor;
}
```

### Flujo de Trabajo Completo

1. **Carga Inicial:**
   - Frontend solicita publicaciones con token JWT
   - Backend consulta qué publicaciones tienen like del usuario
   - Backend devuelve `userLiked: true/false` en cada publicación

2. **Renderizado:**
   - `crearPostCard()` recibe el flag `userLiked`
   - Agrega clase `liked` si es `true`
   - SVG se renderiza con `fill="currentColor"` para corazones liked

3. **Interacción del Usuario:**
   - Click en botón like ejecuta `toggleLike()`
   - Se actualiza la UI inmediatamente (optimistic update)
   - Se envía petición al backend
   - Si falla, se revierte el cambio visual

4. **Recarga de Página:**
   - El estado se mantiene porque el backend lo recuerda
   - No se requiere localStorage ni caché del lado del cliente

## Archivos Modificados
- ✅ `frontend/src/pages/index.astro` - Ya tenía la lógica implementada correctamente

## Bug Fixes Relacionados
Durante la implementación se descubrió y corrigió:
- ❌ Backend usaba columna `usuarioId` (incorrecta)
- ✅ Backend ahora usa columna `egresadoId` (correcta según schema)

## Testing Realizado
- ✅ Usuario da like → corazón se pone rojo
- ✅ Usuario recarga la página → corazón permanece rojo
- ✅ Usuario quita like → corazón vuelve a outline
- ✅ Usuario recarga la página → corazón permanece sin relleno
- ✅ Usuario no autenticado → puede ver publicaciones normalmente
- ✅ Múltiples likes en diferentes publicaciones persisten correctamente

## Conclusión
El frontend ya estaba correctamente implementado. El problema estaba en el backend que no estaba enviando el campo `userLiked`. Una vez corregido el backend, la persistencia visual funcionó automáticamente sin necesidad de cambios adicionales en el frontend.

## Lecciones Aprendidas
1. Siempre verificar los nombres de columnas en el schema antes de escribir queries
2. El patrón de pasar estado desde el backend es más confiable que cachear en el cliente
3. La separación de responsabilidades (backend maneja estado, frontend lo renderiza) simplifica el debugging
