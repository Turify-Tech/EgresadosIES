# Feature: Imágenes en Publicaciones - Frontend

## 📋 Descripción

Implementación del frontend para permitir que los egresados agreguen imágenes a sus publicaciones. Los usuarios pueden seleccionar hasta 5 imágenes, ver un preview antes de publicar, y visualizar las imágenes en formato galería en las publicaciones.

## 🎨 Componentes

### 1. CrearPublicacion.astro

**Ubicación**: `frontend/src/components/feed/CrearPublicacion.astro`

**Funcionalidad**: Formulario para crear publicaciones con soporte para imágenes

#### Estructura HTML

```astro
<form id="crear-publicacion-form">
  <textarea id="crear-contenido" placeholder="¿Qué estás pensando?" />
  
  <!-- Preview de imágenes -->
  <div id="imagenes-preview" class="imagenes-preview"></div>
  
  <div class="actions">
    <label for="crear-imagenes" class="btn-imagen">
      <svg>...</svg>
      <span>Agregar imágenes</span>
    </label>
    <input id="crear-imagenes" type="file" accept="image/*" multiple />
    <button id="crear-submit">Publicar</button>
  </div>
</form>
```

#### JavaScript

**Variables:**
```javascript
let imagenesSeleccionadas = [];  // Array de archivos File
```

**Event Handler - Selección de archivos:**
```javascript
fileInput.addEventListener('change', function(e) {
  const files = Array.from(e.target.files);
  const maxFiles = 5;
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Validar cantidad
  if (imagenesSeleccionadas.length + files.length > maxFiles) {
    alert(`Máximo ${maxFiles} imágenes permitidas`);
    return;
  }

  // Validar cada archivo
  files.forEach(file => {
    if (file.size > maxSize) {
      alert(`${file.name} es demasiado grande`);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(`${file.name} no es una imagen válida`);
      return;
    }
    imagenesSeleccionadas.push(file);
  });

  mostrarPreview();
  e.target.value = ''; // Limpiar input
});
```

**Función Preview:**
```javascript
function mostrarPreview() {
  const preview = document.getElementById('imagenes-preview');
  preview.innerHTML = '';

  imagenesSeleccionadas.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const container = document.createElement('div');
      container.className = 'preview-item';
      container.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}">
        <button class="btn-eliminar-preview" data-index="${index}">
          <svg>...</svg>
        </button>
      `;
      preview.appendChild(container);
    };
    reader.readAsDataURL(file);
  });
}
```

**Envío del formulario:**
```javascript
form.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('contenido', contenido);
  
  imagenesSeleccionadas.forEach(file => {
    formData.append('imagenes', file);
  });

  const response = await fetch('http://localhost:3000/api/publicaciones', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  if (data.success) {
    textarea.value = '';
    imagenesSeleccionadas = [];
    mostrarPreview();
    window.cargarPublicaciones(true);
  }
});
```

### 2. PublicacionCard.astro

**Ubicación**: `frontend/src/components/feed/PublicacionCard.astro`

**Funcionalidad**: Muestra una publicación con sus imágenes en formato galería

#### Renderizado de Imágenes

```astro
{post?.imagenes && post.imagenes.length > 0 && (
  <div class={`publicacion-imagenes imagenes-${Math.min(post.imagenes.length, 5)}`}>
    {post.imagenes.slice(0, post.imagenes.length === 5 ? 4 : post.imagenes.length).map((url, index) => (
      <div class={`imagen-container${post.imagenes.length === 5 && index === 3 ? ' imagen-con-indicador' : ''}`}>
        <img 
          src={`http://localhost:3000${url}`} 
          alt={`Imagen ${index + 1}`} 
          loading="lazy" 
        />
      </div>
    ))}
  </div>
)}
```

**Clases dinámicas:**
- `imagenes-1`: Una sola imagen
- `imagenes-2`: Dos imágenes
- `imagenes-3`: Tres imágenes
- `imagenes-4`: Cuatro imágenes
- `imagenes-5`: Cinco imágenes (solo se muestran 4, con +1 en la 4ta)

## 📄 Páginas

### dashboard.astro

**Modificaciones principales:**

1. **Variable global para imágenes:**
```javascript
let selectedImages = [];  // Declarada al inicio del script
```

2. **Renderizado de galería en `crearPostCard`:**
```javascript
let imagenesHTML = '';
if (imagenes && imagenes.length > 0) {
    const numImagenes = Math.min(imagenes.length, 5);
    imagenesHTML = `<div class="publicacion-imagenes imagenes-${numImagenes}">`;
    
    for (let i = 0; i < Math.min(4, imagenes.length); i++) {
        const imgUrl = imagenes[i].startsWith('http') 
            ? imagenes[i] 
            : `http://localhost:3000${imagenes[i]}`;
        imagenesHTML += `
            <div class="imagen-container">
                <img src="${imgUrl}" alt="Imagen ${i + 1}" loading="lazy" />
            </div>
        `;
    }
    
    imagenesHTML += '</div>';
}
```

3. **Función crearPublicacion con FormData:**
```javascript
async function crearPublicacion(contenido, imageFiles = []) {
    const formData = new FormData();
    formData.append('contenido', contenido);
    
    imageFiles.forEach(file => {
        formData.append('imagenes', file);
    });

    const response = await fetch(`${API_URL}/publicaciones`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
}
```

4. **Manejo de selección de archivos:**
```javascript
const postImages = document.getElementById('post-images');
postImages.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    // Validaciones
    if (selectedImages.length + files.length > 5) {
        showNotification('Máximo 5 imágenes permitidas', 'error');
        return;
    }
    
    files.forEach(file => {
        if (file.size > 5 * 1024 * 1024) {
            showNotification(`${file.name} es demasiado grande`, 'error');
            return;
        }
        selectedImages.push(file);
    });
    
    renderImagePreview();
    e.target.value = '';
});
```

5. **Limpieza después de publicar:**
```javascript
if (result.success) {
    const postContent = document.getElementById('post-content');
    const imagePreview = document.getElementById('image-preview');
    const postImagesInput = document.getElementById('post-images');
    
    if (postContent) postContent.value = '';
    if (imagePreview) imagePreview.innerHTML = '';
    if (postImagesInput) postImagesInput.value = '';
    selectedImages = [];
}
```

### mis-publicaciones.astro

**Importación de estilos:**
```astro
import "../styles/publicaciones-imagenes.css";
```

## 🎨 Estilos

### publicaciones-imagenes.css

**Ubicación**: `frontend/src/styles/publicaciones-imagenes.css`

#### Preview de Imágenes (Formulario)

```css
.imagenes-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
    margin-top: 0.75rem;
}

.preview-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    aspect-ratio: 1;
    background: #f3f4f6;
    border: 2px solid #e5e7eb;
}

.preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-eliminar-preview {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}
```

#### Galería de Imágenes (Publicaciones)

**Una imagen:**
```css
.publicacion-imagenes.imagenes-1 {
    max-height: 500px;
}

.publicacion-imagenes.imagenes-1 img {
    width: 100%;
    height: auto;
    max-height: 500px;
    object-fit: contain;
}
```

**Dos imágenes:**
```css
.publicacion-imagenes.imagenes-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    max-height: 400px;
}
```

**Tres imágenes:**
```css
.publicacion-imagenes.imagenes-3 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 4px;
    max-height: 400px;
}

.publicacion-imagenes.imagenes-3 img:first-child {
    grid-row: 1 / 3;  /* Ocupa ambas filas */
}
```

**Cuatro o cinco imágenes:**
```css
.publicacion-imagenes.imagenes-4,
.publicacion-imagenes.imagenes-5 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 4px;
    max-height: 400px;
}
```

**Indicador +1 para quinta imagen (se muestra en la 4ta):**
```css
/* Todos los contenedores necesitan position relative */
.publicacion-imagenes .imagen-container {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
}

/* Indicador +1 superpuesto */
.publicacion-imagenes .imagen-container.imagen-con-indicador::after {
    content: '+1' !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    color: white !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 2rem !important;
    font-weight: 700 !important;
    cursor: pointer !important;
    z-index: 10 !important;
}
```

**Nota**: Se usa `!important` para asegurar que el pseudo-elemento no sea sobrescrito por otros estilos.

### dashboard.css (modificaciones)

```css
.preview-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
    border: 2px solid #e5e7eb;
}

.remove-image {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    background: rgba(239, 68, 68, 0.9);
    color: white;
    border: none;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
```

## 📱 Responsive Design

### Mobile (< 640px)

```css
@media (max-width: 640px) {
    .imagenes-preview {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 0.5rem;
    }

    .btn-imagen span {
        display: none;  /* Ocultar texto, solo mostrar ícono */
    }

    .publicacion-imagenes.imagenes-1 {
        max-height: 350px;
    }

    .publicacion-imagenes.imagenes-2,
    .publicacion-imagenes.imagenes-3,
    .publicacion-imagenes.imagenes-4,
    .publicacion-imagenes.imagenes-5 {
        max-height: 300px;
    }
}
```

## 🔄 Flujo de Usuario

### Crear Publicación con Imágenes

1. **Usuario navega a Dashboard**
2. **Escribe contenido en el textarea**
3. **Click en "Agregar imágenes"**
4. **Selecciona hasta 5 imágenes del sistema**
5. **Ve preview de las imágenes seleccionadas**
6. **Opcionalmente elimina alguna imagen del preview**
7. **Click en "Publicar"**
8. **Sistema:**
   - Valida archivos
   - Crea FormData
   - Envía request multipart/form-data
   - Muestra loading
   - Recarga feed con nueva publicación
   - Limpia formulario y preview

### Visualizar Publicaciones

1. **Feed carga publicaciones**
2. **Para cada publicación con imágenes:**
   - Renderiza galería según cantidad
   - Aplica layout CSS apropiado
   - Lazy load de imágenes
3. **Usuario puede:**
   - Ver imágenes en la galería
   - (Futuro) Click para ver en tamaño completo

## ✅ Validaciones Cliente

### Antes de agregar al preview

```javascript
// Cantidad máxima
if (imagenesSeleccionadas.length + files.length > 5) {
    alert('Máximo 5 imágenes permitidas');
    return;
}

// Tamaño de archivo
if (file.size > 5 * 1024 * 1024) {
    alert(`${file.name} es demasiado grande. Máximo 5MB`);
    return;
}

// Tipo de archivo
if (!file.type.startsWith('image/')) {
    alert(`${file.name} no es una imagen válida`);
    return;
}
```

### Antes de enviar

```javascript
if (!contenido.trim()) {
    alert('El contenido es obligatorio');
    return;
}
```

## 🐛 Solución de Problemas Comunes

### Problema: Las imágenes no se muestran en el preview

**Causa**: FileReader no está funcionando correctamente

**Solución**:
```javascript
const reader = new FileReader();
reader.onload = function(e) {
    // Usar e.target.result que contiene data URL
    img.src = e.target.result;
};
reader.readAsDataURL(file);
```

### Problema: FormData no incluye las imágenes

**Causa**: Nombre del campo no coincide con el backend

**Solución**:
```javascript
// Backend espera 'imagenes'
formData.append('imagenes', file);  // ✅ Correcto
formData.append('images', file);    // ❌ Incorrecto
```

### Problema: Las imágenes previas no se limpian

**Causa**: Array no se está reiniciando correctamente

**Solución**:
```javascript
// Limpiar TODOS los elementos
selectedImages = [];                    // Limpiar array
imagePreview.innerHTML = '';            // Limpiar DOM
postImagesInput.value = '';            // Limpiar input
```

### Problema: URL de imágenes no se construye correctamente

**Causa**: Falta el prefijo del servidor

**Solución**:
```javascript
const imgUrl = url.startsWith('http') 
    ? url 
    : `http://localhost:3000${url}`;
```

## 🎯 Layouts de Galería Visuales

### 1 Imagen
```
┌────────────────────────┐
│                        │
│                        │
│       Imagen 1         │
│     (Contenida)        │
│                        │
│                        │
└────────────────────────┘
```

### 2 Imágenes
```
┌───────────┬───────────┐
│           │           │
│  Imagen 1 │  Imagen 2 │
│           │           │
└───────────┴───────────┘
```

### 3 Imágenes
```
┌───────────┬───────────┐
│           │  Imagen 2 │
│  Imagen 1 ├───────────┤
│           │  Imagen 3 │
└───────────┴───────────┘
```

### 4 Imágenes
```
┌───────────┬───────────┐
│  Imagen 1 │  Imagen 2 │
├───────────┼───────────┤
│  Imagen 3 │  Imagen 4 │
└───────────┴───────────┘
```

### 5 Imágenes
```
┌───────────┬───────────┐
│  Imagen 1 │  Imagen 2 │
├───────────┼───────────┤
│  Imagen 3 │ Imagen 4  │
│           │   [+1]    │ ← Solo se muestran 4, la 4ta tiene indicador +1
└───────────┴───────────┘
Nota: La 5ta imagen está disponible en el modal al hacer clic
```

## �️ Modal de Visualización de Imágenes

### Funcionalidad

Modal estilo LinkedIn para visualizar imágenes en tamaño completo con navegación entre múltiples imágenes.

### Estructura HTML

```astro
<div id="imagen-modal" class="imagen-modal">
    <button id="modal-cerrar" class="btn-cerrar">×</button>
    <button id="modal-prev" class="btn-nav btn-prev">‹</button>
    <div class="imagen-modal-content">
        <img id="modal-imagen" src="" alt="Imagen de publicación" />
        <div id="modal-contador" class="contador-imagenes">1 / 5</div>
    </div>
    <button id="modal-next" class="btn-nav btn-next">›</button>
</div>
```

### JavaScript

**Variables:**
```javascript
let modalImagenes = [];      // Array de URLs de imágenes
let modalImagenIndex = 0;    // Índice actual de la imagen mostrada
```

**Funciones del Modal:**

```javascript
// Abrir modal con un array de imágenes y el índice seleccionado
function abrirModalImagen(imagenes, index) {
    modalImagenes = imagenes;
    modalImagenIndex = index;
    
    const modal = document.getElementById('imagen-modal');
    if (modal) {
        modal.style.display = 'flex';
        actualizarImagenModal();
    }
}

// Cerrar el modal
function cerrarModalImagen() {
    const modal = document.getElementById('imagen-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Actualizar la imagen mostrada y los controles
function actualizarImagenModal() {
    const imgElement = document.getElementById('modal-imagen');
    const contador = document.getElementById('modal-contador');
    const btnPrev = document.getElementById('modal-prev');
    const btnNext = document.getElementById('modal-next');
    
    if (imgElement && modalImagenes.length > 0) {
        imgElement.src = modalImagenes[modalImagenIndex];
    }
    
    if (contador) {
        contador.textContent = `${modalImagenIndex + 1} / ${modalImagenes.length}`;
        contador.style.display = modalImagenes.length > 1 ? 'block' : 'none';
    }
    
    if (btnPrev) {
        btnPrev.style.display = modalImagenes.length > 1 ? 'flex' : 'none';
    }
    
    if (btnNext) {
        btnNext.style.display = modalImagenes.length > 1 ? 'flex' : 'none';
    }
}

// Navegar entre imágenes (circular)
function navegarImagenModal(direccion) {
    if (direccion === 'prev') {
        modalImagenIndex = (modalImagenIndex - 1 + modalImagenes.length) % modalImagenes.length;
    } else if (direccion === 'next') {
        modalImagenIndex = (modalImagenIndex + 1) % modalImagenes.length;
    }
    actualizarImagenModal();
}
```

**Data Attributes en HTML:**

```javascript
// Agregar data attributes a las imágenes al renderizar
const imagenesJSON = JSON.stringify(imagenes).replace(/'/g, "&apos;");

imagenesHTML = `<div class="post-images" data-imagenes='${imagenesJSON}'>`;

for (let i = 0; i < imagenes.length; i++) {
    imagenesHTML += `
        <div class="publicacion-imagenes-container" data-imagen-index="${i}">
            <img src="${imgUrl}" alt="Imagen ${i + 1}" loading="lazy" />
        </div>
    `;
}
```

**Event Listeners:**

```javascript
document.addEventListener('DOMContentLoaded', () => {
    const imagenModal = document.getElementById('imagen-modal');
    const modalCerrar = document.getElementById('modal-cerrar');
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');
    
    // Botón cerrar
    if (modalCerrar) {
        modalCerrar.addEventListener('click', cerrarModalImagen);
    }
    
    // Botones de navegación
    if (modalPrev) {
        modalPrev.addEventListener('click', () => navegarImagenModal('prev'));
    }
    if (modalNext) {
        modalNext.addEventListener('click', () => navegarImagenModal('next'));
    }
    
    // Cerrar al hacer clic en el fondo
    if (imagenModal) {
        imagenModal.addEventListener('click', (e) => {
            if (e.target === imagenModal) {
                cerrarModalImagen();
            }
        });
    }
    
    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        if (imagenModal && imagenModal.style.display === 'flex') {
            if (e.key === 'Escape') {
                cerrarModalImagen();
            } else if (e.key === 'ArrowLeft') {
                navegarImagenModal('prev');
            } else if (e.key === 'ArrowRight') {
                navegarImagenModal('next');
            }
        }
    });
    
    // Event delegation para clicks en imágenes (contenido dinámico)
    document.addEventListener('click', (e) => {
        const container = e.target.closest('.publicacion-imagenes-container');
        if (container) {
            const postImages = container.closest('.post-images');
            if (postImages) {
                const imagenesJSON = postImages.getAttribute('data-imagenes');
                if (imagenesJSON) {
                    try {
                        const imagenes = JSON.parse(imagenesJSON);
                        const index = parseInt(container.getAttribute('data-imagen-index')) || 0;
                        abrirModalImagen(imagenes, index);
                    } catch (error) {
                        console.error('Error parseando imágenes:', error);
                    }
                }
            }
        }
    });
});
```

### Estilos del Modal

```css
/* Modal overlay */
.imagen-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    justify-content: center;
    align-items: center;
}

/* Contenedor de la imagen */
.imagen-modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.imagen-modal-content img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 4px;
}

/* Botón cerrar */
.btn-cerrar {
    position: absolute;
    top: 20px;
    right: 30px;
    font-size: 40px;
    color: white;
    background: none;
    border: none;
    cursor: pointer;
    z-index: 10001;
    transition: transform 0.2s ease;
}

.btn-cerrar:hover {
    transform: scale(1.1);
}

/* Botones de navegación */
.btn-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 60px;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    cursor: pointer;
    padding: 20px 25px;
    border-radius: 4px;
    transition: all 0.2s ease;
    z-index: 10000;
}

.btn-nav:hover {
    background: rgba(255, 255, 255, 0.2);
}

.btn-prev {
    left: 20px;
}

.btn-next {
    right: 20px;
}

/* Contador de imágenes */
.contador-imagenes {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
    .btn-cerrar {
        font-size: 30px;
        top: 10px;
        right: 15px;
    }
    
    .btn-nav {
        font-size: 40px;
        padding: 15px 20px;
    }
    
    .btn-prev {
        left: 10px;
    }
    
    .btn-next {
        right: 10px;
    }
}
```

### Características

- ✅ **Click para ampliar**: Hacer clic en cualquier imagen abre el modal
- ✅ **Navegación con botones**: Flechas laterales para moverse entre imágenes
- ✅ **Navegación con teclado**: 
  - `←` Imagen anterior
  - `→` Imagen siguiente
  - `ESC` Cerrar modal
- ✅ **Contador**: Muestra la posición actual (ej: "3 / 5")
- ✅ **Navegación circular**: Al llegar al final vuelve al inicio
- ✅ **Cerrar haciendo clic fuera**: Click en el fondo negro cierra el modal
- ✅ **Responsive**: Se adapta a dispositivos móviles
- ✅ **Event delegation**: Funciona con contenido dinámico (AJAX)

### Páginas Implementadas

- ✅ `dashboard.astro` - Feed principal
- ✅ `mis-publicaciones.astro` - Publicaciones del usuario

## 🚀 Optimizaciones Futuras

### Performance
1. **Compresión cliente**: Reducir tamaño antes de enviar
2. **Progressive loading**: Cargar imágenes de menor a mayor calidad
3. **Virtual scrolling**: Para feeds con muchas publicaciones
4. **Image caching**: Cachear imágenes en el navegador
5. **Preload next image**: Precargar siguiente imagen en el modal

### UX
1. ~~**Modal de zoom**: Ver imagen en tamaño completo~~ ✅ Implementado
2. **Swipe gallery**: Navegación táctil entre imágenes
3. **Crop tool**: Recortar imágenes antes de subir
4. **Filtros**: Aplicar filtros a las imágenes
5. **Drag & drop**: Arrastrar para ordenar imágenes
6. **Pinch to zoom**: Zoom con gestos táctiles en el modal
7. **Download button**: Botón para descargar imagen

### Accesibilidad
1. **Alt text personalizado**: Permitir agregar descripción
2. ~~**Keyboard navigation**: Navegación con teclado~~ ✅ Implementado
3. **Screen reader support**: Mejor soporte para lectores
4. **High contrast mode**: Modo de alto contraste
5. **Focus trap**: Mantener foco dentro del modal

## 📚 Referencias

- [FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Lazy Loading Images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading)
