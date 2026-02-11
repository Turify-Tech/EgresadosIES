# Fix: Modal de Imágenes y Preview de Publicaciones

**Fecha:** 11 de febrero de 2026  
**Branch:** `fix/linea-negra-imagenes-ampliadas`  
**Commits:** 
- `5c6407e` - fix: eliminar linea negra en imagenes ampliadas del modal
- `0b0ad4d` - fix: mejorar preview de imagenes - reducir tamaño y mostrar boton eliminar

## Problema 1: Línea Negra en Imágenes Ampliadas

### Descripción del Bug
Al hacer clic para ampliar una imagen de una publicación en el feed (index), aparecía una **línea gruesa negra transparente** en el medio de la imagen ampliada en el modal.

### Causa Raíz
El modal utilizaba `display: flex` con alineación centrada, y el elemento `.contador-imagenes` (que muestra "1/3", "2/3", etc.) estaba posicionado en la parte superior. Esto creaba un conflicto visual donde el contador aparecía como una banda oscura sobre la imagen.

### Solución Implementada

#### Cambios en CSS (`publicaciones-imagenes.css`)

1. **Estructura del modal cambiada de flex a block:**
```css
.imagen-modal {
    display: block; /* Antes era display: flex */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    padding: 2rem;
    box-sizing: border-box;
}
```

2. **Imagen posicionada absolutamente y centrada:**
```css
.imagen-modal-img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90%;
    max-height: 85%;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}
```

3. **Contador movido de top a bottom:**
```css
/* Antes */
.contador-imagenes {
    position: absolute;
    top: 1rem; /* ← Causaba la línea negra */
    left: 50%;
    transform: translateX(-50%);
}

/* Después */
.contador-imagenes {
    position: absolute;
    bottom: 1rem; /* ← Ahora en la parte inferior */
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 10002;
}
```

#### Cambios en HTML (`index.astro`)

Simplificación de la estructura del modal eliminando el wrapper `.imagen-modal-content`:

```html
<!-- Antes -->
<div id="imagen-modal" class="imagen-modal">
    <div class="imagen-modal-content">
        <img id="imagen-modal-img" class="imagen-modal-img" />
    </div>
    <div class="contador-imagenes"></div>
    <!-- botones -->
</div>

<!-- Después -->
<div id="imagen-modal" class="imagen-modal">
    <img id="imagen-modal-img" class="imagen-modal-img" />
    <div class="contador-imagenes"></div>
    <!-- botones -->
</div>
```

También se actualizaron los estilos legacy en `index.css` para mantener consistencia.

### Resultado
- ✅ La línea negra desapareció completamente
- ✅ Las imágenes se muestran centradas correctamente
- ✅ El contador de imágenes ahora aparece en la parte inferior, evitando obstrucción visual

---

## Problema 2: Preview de Imágenes Demasiado Grande

### Descripción del Bug
Al seleccionar imágenes para publicar, el preview mostraba las imágenes en un tamaño **"inmenso"** (100px × 100px). Además, aunque existía funcionalidad de botón eliminar en el código, **no era visible** debido a un error en los nombres de clases CSS.

### Causa Raíz
1. **Inconsistencia de nombres de clases:**
   - JavaScript usaba: `.preview-item` y `.remove-image`
   - CSS definía: `.image-preview-item` y `.remove-image-btn`
   - Resultado: Los estilos no se aplicaban

2. **Tamaño del preview muy grande:** 100px × 100px ocupaba mucho espacio

### Solución Implementada

#### Cambios en JavaScript (`index.astro`)

Corrección de nombres de clases en la función `renderImagePreview()`:

```typescript
function renderImagePreview() {
    if (!imagePreview) return;
    
    imagePreview.innerHTML = "";
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement("div");
            div.className = "image-preview-item"; // ← Era "preview-item"
            div.innerHTML = `
                <img src="${(e.target as FileReader)?.result}" alt="Preview ${index + 1}">
                <button type="button" class="remove-image-btn" data-index="${index}">
                    <!-- ↑ Era "remove-image" -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            imagePreview.appendChild(div);
            
            // Agregar evento de eliminar
            const removeBtn = div.querySelector(".remove-image-btn"); // ← Era ".remove-image"
            if (removeBtn) {
                removeBtn.addEventListener("click", () => {
                    const idx = parseInt(
                        removeBtn.getAttribute("data-index") || "0",
                    );
                    selectedImages.splice(idx, 1);
                    renderImagePreview();
                });
            }
        };
        reader.readAsDataURL(file);
    });
}
```

#### Cambios en CSS (`index.css`)

Reducción del tamaño del preview:

```css
.image-preview-item {
    position: relative;
    width: 80px;   /* ← Era 100px */
    height: 80px;  /* ← Era 100px */
    border-radius: 8px;
    overflow: hidden;
}
```

Los estilos del botón eliminar ya existían y estaban correctos:

```css
.remove-image-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    line-height: 1;
    transition: all 0.2s;
}

.remove-image-btn:hover {
    background: rgba(220, 38, 38, 0.9);
}
```

### Resultado
- ✅ El preview ahora muestra imágenes más pequeñas (80px × 80px)
- ✅ El botón **X** es visible en la esquina superior derecha de cada preview
- ✅ Al hacer clic en la X, la imagen se elimina del array antes de publicar
- ✅ Las clases CSS ahora coinciden correctamente con el JavaScript

---

## Archivos Modificados

### Frontend
1. **[frontend/src/pages/index.astro](../src/pages/index.astro)**
   - Simplificación de estructura HTML del modal
   - Corrección de nombres de clases en `renderImagePreview()`

2. **[frontend/src/styles/publicaciones-imagenes.css](../src/styles/publicaciones-imagenes.css)**
   - Cambio de layout del modal (flex → block)
   - Reposicionamiento del contador (top → bottom)
   - Posicionamiento absoluto de la imagen

3. **[frontend/src/styles/index.css](../src/styles/index.css)**
   - Reducción de tamaño de `.image-preview-item` (100px → 80px)
   - Sincronización de estilos legacy del modal

---

## Impacto y Beneficios

### Experiencia de Usuario
- **Modal de imágenes:** Visualización limpia sin artefactos visuales molestos
- **Preview de publicación:** Interfaz más compacta y funcional
- **Control de contenido:** Usuarios pueden revisar y eliminar imágenes antes de publicar

### Mantenibilidad del Código
- **Nomenclatura consistente:** Clases CSS alineadas entre JavaScript y hojas de estilo
- **Código más limpio:** Eliminación de estructura HTML innecesaria
- **CSS moderno:** Uso de positioning absoluto en lugar de flexbox para casos específicos

### Testing Manual Recomendado
1. ✅ Abrir una publicación con múltiples imágenes en el feed
2. ✅ Hacer clic para ampliar una imagen → verificar que no hay línea negra
3. ✅ Navegar entre imágenes con las flechas → verificar contador en bottom
4. ✅ Seleccionar imágenes para una nueva publicación
5. ✅ Verificar que el preview muestra miniaturas de 80px
6. ✅ Hacer clic en el botón X → verificar que elimina la imagen del preview
7. ✅ Publicar con las imágenes restantes → verificar funcionamiento normal

---

## Notas Técnicas

### Decisiones de Diseño

**¿Por qué display: block en lugar de flex?**
- El modal solo necesita centrar un elemento (la imagen)
- El posicionamiento absoluto es más predecible para overlays
- Evita conflictos con z-index de elementos secundarios

**¿Por qué 80px de tamaño en lugar de 100px?**
- Mejor aprovechamiento del espacio horizontal
- Permite ver más previews sin scroll en pantallas pequeñas
- Mantiene aspect ratio cuadrado para consistencia

**¿Por qué no usar grid para el preview?**
- Ya existe `.image-preview` con `display: flex; flex-wrap: wrap`
- No es necesario rediseñar toda la estructura
- Los cambios son mínimos y enfocados

### Compatibilidad
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (aspect-ratio, object-fit)
- ✅ Móviles (touch events funcionan correctamente)

---

## Referencias
- [MDN: CSS Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
