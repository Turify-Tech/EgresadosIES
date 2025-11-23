# Organización de CSS y Mejoras de UI - Feed Social

## 📋 Descripción General

Reorganización completa del código CSS del sistema de feed social, extrayendo estilos inline a archivos separados y implementando mejoras de UI/UX para la consistencia visual entre páginas públicas y autenticadas.

**Fecha:** Noviembre 2025  
**Branch:** `feature/social-comments-likes-backend`  
**Estado:** ✅ Completado

---

## 🎯 Objetivos Cumplidos

### 1. **Organización de Código CSS**
- ✅ Extracción de estilos inline a archivos separados
- ✅ Estructura de carpetas `frontend/src/styles/` con archivos específicos por página/componente
- ✅ Importación de CSS desde frontmatter de componentes Astro
- ✅ Eliminación de duplicación de código

### 2. **Consistencia Visual**
- ✅ UI unificada entre `index.astro` y `dashboard.astro`
- ✅ Indicadores de carga consistentes
- ✅ Sistema de likes con contador numérico (0, 1, 2k, etc.)
- ✅ Sistema de comentarios modal compartido

### 3. **Control de Acceso por Roles**
- ✅ Visualización de comentarios para usuarios no autenticados
- ✅ Formulario de comentarios oculto para no-egresados
- ✅ Botones de like sin hover effect para usuarios no autenticados

---

## 📂 Estructura de Archivos CSS Creada

```
frontend/
├── src/
│   ├── styles/
│   │   ├── dashboard.css              # Estilos del dashboard (735 líneas)
│   │   ├── comentarios-modal.css      # Estilos del modal de comentarios
│   │   └── index.css                  # Estilos de la página pública
│   ├── pages/
│   │   ├── dashboard.astro            # Importa dashboard.css
│   │   └── index.astro                # Importa index.css
│   └── components/
│       └── ComentariosModal.astro     # Importa comentarios-modal.css
└── docs/
    └── CSS_ORGANIZATION_AND_UI_IMPROVEMENTS.md  # Este documento
```

---

## 🔧 Cambios Implementados

### 1. Extracción de CSS - Dashboard

**Archivo:** `frontend/src/styles/dashboard.css`

**Contenido extraído:**
- Layout del feed (.feed-page, .feed-container)
- Sidebar izquierdo (.sidebar-left, .profile-card, .menu-card)
- Sidebar derecho (.sidebar-right, .tech-list)
- Cards de publicaciones (.post-card, .post-header, .post-content)
- Formulario de nueva publicación (.new-post-form)
- Botones de acción (.action-btn, .like-btn, .comment-btn)
- Estado vacío de comentarios (.no-comentarios)
- Animaciones (@keyframes spin, @keyframes like-pop)
- Responsive design (breakpoints: 768px, 480px)

**Cambios en dashboard.astro:**
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ComentariosModal from "../components/ComentariosModal.astro";
import "../styles/dashboard.css";  // ← Importación agregada
---
```

**Eliminado:**
- Bloque `<style is:global>` con ~920 líneas de CSS inline

---

### 2. Extracción de CSS - Modal de Comentarios

**Archivo:** `frontend/src/styles/comentarios-modal.css`

**Contenido extraído:**
- Overlay del modal (.modal-overlay)
- Container del modal (.modal-container)
- Header con imagen de fondo (.modal-header)
- Lista de comentarios (.comentarios-lista, .comentario-item)
- Avatar de usuario (.comentario-avatar)
- Formulario de comentario (.comentario-form)
- Botones de enviar y cerrar
- Responsive design (breakpoints: 768px, 480px)

**Estilos clave:**
```css
.modal-header {
    background-image: url('/images/Fondo Azul card.jpg');
    background-size: cover;
    background-position: center;
    height: 80px;
    border-radius: 20px 20px 0 0;
}

.comentario-form input {
    height: 44px;
    border-radius: 20px;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
}
```

**Cambios en ComentariosModal.astro:**
```astro
---
import "../styles/comentarios-modal.css";  // ← Importación agregada
---
```

---

### 3. Extracción de CSS - Index (Página Pública)

**Archivo:** `frontend/src/styles/index.css`

**Contenido extraído:**
- Layout del feed público
- Sidebar con lista de tecnicaturas (.sidebar-left, .tecnicaturas-list)
- Cards de publicaciones (igual que dashboard)
- Botones de acción SIN efecto scale en like-btn
- Loading spinner (.loading-posts, .loading-spinner)
- Menu móvil (.tecnicaturas-mobile)

**Diferencias con dashboard.css:**
```css
/* index.css - NO tiene efecto scale en hover */
.like-btn:hover {
    background-color: #f0f0f0;
    /* NO incluye: transform: scale(1.2); */
}

/* dashboard.css - SÍ tiene efecto scale */
.like-btn:hover span:first-child {
    transform: scale(1.2);
}
```

---

### 4. Sistema de Likes - Contador Numérico

**Implementación anterior:**
- 0 likes → texto vacío ""
- 1+ likes → número (1, 2, 50, 2.5k)

**Nueva implementación:**
```javascript
// dashboard.astro - Línea 283
<span class="count">${totalLikes >= 1000 ? (totalLikes / 1000).toFixed(1) + 'k' : totalLikes}</span>

// Ejemplos:
// 0 likes    → "0"
// 5 likes    → "5"
// 150 likes  → "150"
// 2500 likes → "2.5k"
```

**Actualización dinámica al hacer toggle:**
```javascript
// dashboard.astro - Línea 539
if (countSpan) {
    const totalLikes = result.data.totalLikes;
    countSpan.textContent = totalLikes >= 1000 
        ? (totalLikes / 1000).toFixed(1) + 'k' 
        : totalLikes.toString();
}
```

**Beneficios:**
- ✅ Siempre muestra información numérica clara
- ✅ Formato consistente (0, 1, 2k, 5.3k)
- ✅ No hay confusión con textos como "Likes"
- ✅ Actualización en tiempo real al dar/quitar like

---

### 5. Indicador de Carga - Consistencia Visual

**Implementación:**
```html
<!-- Ambas páginas (dashboard.astro e index.astro) -->
<div class="loading-posts">
    <div class="loading-spinner"></div>
    <p>Cargando publicaciones...</p>
</div>
```

**CSS compartido:**
```css
.loading-posts {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e0e0e0;
    border-top: 4px solid #5284e0;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

**Cambios realizados:**
1. Inicialmente agregado spinner + texto
2. Usuario solicitó remover texto → Removido
3. Usuario solicitó mantener texto → Restaurado
4. Resultado final: Spinner + "Cargando publicaciones..." en ambas páginas

---

### 6. Botón "Cargar más" - Visibilidad Controlada

**Problema inicial:**
Botón "Cargar más" visible al cargar la página, mostrando "Cargando..." antes de tener publicaciones.

**Solución:**
```html
<!-- index.astro - Línea 76 -->
<div class="load-more" style="display: none;">
    <button id="load-more-btn">Cargar más</button>
</div>
```

**Lógica de visibilidad:**
```javascript
// Solo se muestra cuando:
// 1. Las publicaciones han cargado
// 2. Hay más páginas disponibles (hasMorePages === true)

loadMoreSection.style.display = hasMorePages ? 'block' : 'none';
```

---

### 7. Modal de Comentarios - Acceso por Roles

**Funcionalidad para usuarios NO autenticados:**

```javascript
// index.astro - Función toggleComments()
function toggleComments(postId) {
    currentPublicacionId = postId;
    const modal = document.getElementById('comentarios-modal');
    modal?.classList.add('active');
    cargarComentarios(postId);
}

// Ocultar formulario si no es egresado
function isEgresado() {
    const userData = localStorage.getItem('user_data');
    if (!userData) return false;
    const user = JSON.parse(userData);
    return user.tipo_usuario === 'Egresado';
}

// Al cargar comentarios
const comentarioForm = document.getElementById('comentario-form');
if (!isEgresado() && comentarioForm) {
    comentarioForm.style.display = 'none';
}
```

**Comportamiento:**
- ✅ Usuarios NO autenticados → Ven comentarios, NO pueden comentar
- ✅ Usuarios autenticados (Egresados) → Ven y pueden comentar
- ✅ Modal accesible desde index.astro (página pública)

---

## 🎨 Patrones de Diseño Establecidos

### Colores Consistentes
```css
/* Botones primarios */
--primary-blue: #5284e0;
--primary-blue-hover: #3d6fc7;

/* Fondos */
--background-gray: #f5f5f5;
--card-background: #ffffff;

/* Bordes */
--border-gray: #e0e0e0;
--border-radius: 20px;

/* Textos */
--text-primary: #333333;
--text-secondary: #666666;
--text-muted: #999999;
```

### Iconos y Emojis
```javascript
// Sistema de likes
liked: '❤️' (corazón rojo)
notLiked: '🤍' (corazón blanco)

// Iconos SVG para comentarios
<svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
</svg>
```

### Responsive Breakpoints
```css
/* Tablet */
@media (max-width: 768px) {
    .feed-container { grid-template-columns: 1fr; }
    .sidebar-left, .sidebar-right { display: none; }
}

/* Mobile */
@media (max-width: 480px) {
    .post-card { border-radius: 15px; }
    .modal-container { width: 95%; }
}
```

---

## 📊 Métricas de Mejora

### Reducción de Código
| Archivo | Antes (líneas) | Después (líneas) | Reducción |
|---------|---------------|------------------|-----------|
| dashboard.astro | 1166 | ~920 | ~21% |
| ComentariosModal.astro | ~550 | ~60 | ~89% |
| index.astro | ~480 | ~392 | ~18% |

### Archivos CSS Creados
| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| dashboard.css | 735 | Estilos completos del dashboard |
| comentarios-modal.css | ~490 | Estilos del modal de comentarios |
| index.css | ~220 | Estilos de la página pública |

**Total de CSS organizado:** ~1445 líneas

---

## 🔍 Casos de Uso Cubiertos

### Usuario No Autenticado (Visitante)
1. ✅ Ve el feed de publicaciones en `/`
2. ✅ Ve indicador de carga consistente
3. ✅ Puede abrir modal de comentarios
4. ✅ Lee comentarios existentes
5. ❌ NO ve formulario para comentar
6. ✅ Ve contador de likes (0, 5, 2.5k)
7. ❌ NO puede dar like (botón no funcional, sin hover effect)

### Usuario Egresado Autenticado
1. ✅ Ve el dashboard en `/dashboard`
2. ✅ Puede crear publicaciones
3. ✅ Puede dar/quitar likes
4. ✅ Ve actualización en tiempo real del contador
5. ✅ Puede abrir modal de comentarios
6. ✅ Puede escribir comentarios
7. ✅ Puede editar/eliminar sus propios comentarios
8. ✅ Ve mensaje "No hay comentarios" cuando corresponde

### Consistencia Visual
1. ✅ Mismos colores en ambas páginas
2. ✅ Mismo layout de cards
3. ✅ Mismo modal de comentarios
4. ✅ Mismo indicador de carga
5. ✅ Mismo sistema de contador de likes

---

## 🧪 Testing Realizado

### Pruebas de Visualización
- ✅ Carga inicial sin publicaciones → Muestra "Cargando publicaciones..."
- ✅ Carga de publicaciones → Spinner desaparece, cards se muestran
- ✅ Botón "Cargar más" → Solo visible cuando hasMorePages = true
- ✅ Contador de likes → 0, 1, 100, 1.5k formatos correctos

### Pruebas de Interacción
- ✅ Click en comentarios (index) → Modal abre, comentarios cargan
- ✅ Usuario no autenticado → Formulario oculto
- ✅ Usuario egresado → Formulario visible
- ✅ Toggle like (dashboard) → Contador actualiza (0 ↔ 1)
- ✅ Eliminar último comentario → "No hay comentarios" aparece

### Pruebas Responsive
- ✅ Desktop (1920px) → Layout 3 columnas (sidebar-left | main | sidebar-right)
- ✅ Tablet (768px) → Layout 1 columna, sidebars ocultos
- ✅ Mobile (480px) → Layout optimizado, modal ocupa 95% ancho

---

## 📝 Notas de Implementación

### Importaciones en Frontmatter
```astro
---
// dashboard.astro
import BaseLayout from "../layouts/BaseLayout.astro";
import ComentariosModal from "../components/ComentariosModal.astro";
import "../styles/dashboard.css";
---

// ComentariosModal.astro
---
import "../styles/comentarios-modal.css";
---

// index.astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ComentariosModal from "../components/ComentariosModal.astro";
import "../styles/index.css";
---
```

### IDs y Clases Importantes
```javascript
// IDs
#feed-list            // Container de publicaciones
#comentarios-modal    // Modal de comentarios
#comentarios-list     // Lista de comentarios dentro del modal
#comentario-form      // Formulario de nuevo comentario
#load-more-btn        // Botón cargar más

// Clases
.post-card            // Card individual de publicación
.action-btn           // Botón genérico de acción
.like-btn             // Botón de like
.comment-btn          // Botón de comentarios
.loading-posts        // Container del spinner
.loading-spinner      // Spinner animado
.no-comentarios       // Mensaje cuando no hay comentarios
```

### Funciones JavaScript Clave
```javascript
// dashboard.astro e index.astro
toggleComments(postId)           // Abre/cierra modal de comentarios
cargarComentarios(postId)        // Carga comentarios desde API
isEgresado()                     // Verifica si usuario es egresado
crearComentarioHTML(comentario)  // Genera HTML de comentario
toggleLike(postId)               // Toggle like (solo dashboard)
```

---

## 🚀 Próximos Pasos Sugeridos

### Mejoras Futuras
1. **Accesibilidad:**
   - Agregar atributos ARIA a modales
   - Mejorar navegación por teclado
   - Agregar roles semánticos

2. **Performance:**
   - Lazy loading de imágenes de publicaciones
   - Virtual scrolling para feeds largos
   - Cache de comentarios cargados

3. **Funcionalidad:**
   - Sistema de notificaciones de nuevos comentarios
   - Likes en comentarios
   - Respuestas a comentarios (hilos)
   - Compartir publicaciones

4. **Testing:**
   - Tests unitarios para funciones de like/comentarios
   - Tests E2E con Playwright
   - Tests de accesibilidad con axe

---

## 🐛 Problemas Conocidos y Soluciones

### Problema: CSS Inline vs External
**Síntoma:** Estilos duplicados entre archivo CSS y inline  
**Solución:** Eliminar completamente bloques `<style>` después de extracción

### Problema: ID Mismatch en Comentarios
**Síntoma:** `comentarios-lista` vs `comentarios-list`  
**Solución:** Unificado a `comentarios-list` en todo el código

### Problema: Botón "Cargar más" visible al inicio
**Síntoma:** Muestra "Cargando..." antes de cargar publicaciones  
**Solución:** `style="display: none;"` inicial, mostrar solo con hasMorePages

### Problema: Formulario visible para no-egresados
**Síntoma:** Usuarios no autenticados ven formulario de comentario  
**Solución:** Check `isEgresado()` y `comentarioForm.style.display = 'none'`

---

## 📚 Referencias

### Archivos Relacionados
- `frontend/src/styles/dashboard.css` - CSS del dashboard
- `frontend/src/styles/comentarios-modal.css` - CSS del modal
- `frontend/src/styles/index.css` - CSS de index
- `frontend/src/pages/dashboard.astro` - Dashboard de egresados
- `frontend/src/pages/index.astro` - Página pública
- `frontend/src/components/ComentariosModal.astro` - Modal compartido

### Documentación Backend
- `backend/docs/social-comments-likes-system.md` - Sistema de comentarios y likes
- `backend/docs/unified-auth.md` - Sistema de autenticación

---

## ✅ Checklist de Implementación

- [x] Crear `frontend/src/styles/dashboard.css`
- [x] Crear `frontend/src/styles/comentarios-modal.css`
- [x] Crear `frontend/src/styles/index.css`
- [x] Importar CSS en `dashboard.astro`
- [x] Importar CSS en `ComentariosModal.astro`
- [x] Importar CSS en `index.astro`
- [x] Eliminar bloques `<style>` inline
- [x] Implementar contador numérico de likes (0, 1, 2k)
- [x] Actualizar toggle de likes para mostrar 0
- [x] Unificar indicador de carga
- [x] Ocultar botón "Cargar más" inicialmente
- [x] Implementar modal de comentarios en index
- [x] Ocultar formulario para no-egresados
- [x] Testing en desktop, tablet y mobile
- [x] Crear documentación (este archivo)

---

**Documento creado:** Noviembre 2025  
**Última actualización:** Noviembre 2025  
**Autor:** Sistema de Gestión de Egresados IES
