# Filtros de Perfiles - Implementación Frontend

## Fecha: 7 de febrero de 2026
## Rama: `feature/filtros-perfiles-funcionales`

## 📋 Resumen

Se implementó y corrigió la interfaz de usuario de los filtros en la página `/perfiles` (Ver Egresados), garantizando funcionalidad completa tanto en dispositivos de escritorio como móviles.

## 🔧 Problemas Resueltos

### 1. Modal de Filtros No Abría
**Problema**: Al hacer clic en el botón "Filtros", no sucedía nada.

**Causa**: Event listeners duplicados en `advancedSearchSidebar.js` que bloqueaban el comportamiento.

**Solución**: Eliminados event listeners duplicados, manteniendo solo la lógica en `bindEvents()`.

---

### 2. Overlay Bloqueaba Interacciones
**Problema**: El overlay oscuro (`.sidebar-overlay`) bloqueaba los clics en checkboxes y el dropdown se cerraba inmediatamente.

**Causa**: El overlay capturaba todos los eventos de clic antes de que llegaran a los elementos del dropdown.

**Solución**:
- Eliminado overlay completamente para modo desktop
- Implementado detección de clics fuera del dropdown usando `document.contains()`
- Agregado `setTimeout(0)` para permitir que los checkboxes procesen eventos nativos antes de verificar cierre

**Código clave** (`advancedSearchSidebar.js`):
```javascript
bindEvents() {
    // ... otros event listeners ...
    
    // Cerrar dropdown al hacer clic fuera (con delay para permitir eventos de checkbox)
    document.addEventListener('click', (e) => {
        setTimeout(() => {
            if (this.filtersDropdown && 
                !this.filtersDropdown.contains(e.target) && 
                !this.filtersButton.contains(e.target)) {
                this.hideFilters();
            }
        }, 0);
    });
}
```

---

### 3. Valores de Filtros Incorrectos
**Problema**: Los checkboxes tenían valores que no coincidían con la base de datos:
- ❌ "Empleado", "Desempleado", "Emprendedor", "Freelancer"

**Solución**: Actualizados a los valores reales de la BD:
- ✅ "Trabajando"
- ✅ "Freelance"  
- ✅ "Buscando empleo"
- ✅ "Estudiando"
- ✅ "Estudiando y Trabajando"

**Archivo modificado**: `frontend/src/pages/perfiles/index.astro` (líneas 72-116)

---

### 4. Mapeo de Campos Incorrecto
**Problema**: Las tarjetas de perfil mostraban `perfil.situacion_laboral` (con underscore) en lugar de la situación laboral real.

**Causa**: La base de datos usa campo `situacionLaboral` (camelCase), no `situacion_laboral`.

**Solución**: Corregido en función `renderPerfilCard()` de `advancedSearchSidebar.js`.

**Antes**:
```javascript
<p class="card__info"><strong>Situación:</strong> ${perfil.situacion_laboral || 'No especificada'}</p>
```

**Después**:
```javascript
<p class="card__info"><strong>Situación:</strong> ${perfil.situacionLaboral || 'No especificada'}</p>
```

---

### 5. Checkboxes No Clicables (Desktop)
**Problema**: Al hacer clic en "Todas" o en carreras específicas, no se podía marcar/desmarcar.

**Causa**: `stopPropagation()` bloqueaba eventos nativos de checkboxes, y el dropdown se cerraba antes de procesar el cambio.

**Solución**: Implementado `setTimeout(0)` para permitir que el checkbox procese su evento nativo antes de ejecutar lógica de cierre del dropdown.

---

### 6. Filtros No Responsive (Móvil)
**Problema**: En pantallas móviles (<768px), el dropdown se salía de la pantalla y no se podía interactuar.

**Solución**: Implementado sistema dual:
- **Desktop (>768px)**: Dropdown posicionado cerca del botón
- **Móvil (≤768px)**: Modal centrado con overlay oscuro

#### Características del Modal Móvil
- ✅ **Posicionamiento**: `position: fixed` con centrado vertical y horizontal
- ✅ **Overlay**: Fondo oscuro semi-transparente (`rgba(0,0,0,0.5)`) con z-index: 999
- ✅ **Modal**: z-index: 1001 para aparecer sobre el overlay
- ✅ **Botón cerrar**: Ícono "✕" en la esquina superior derecha (visible solo en móvil)
- ✅ **Cierre múltiple**: Clic en overlay, botón cerrar, o tecla Escape

---

## 🎨 Implementación de Diseño Responsive

### Media Queries Implementadas

#### 1. Tablet y Móvil (≤768px)
```css
@media (max-width: 768px) {
    .filters-dropdown {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        z-index: 1001;
        max-height: 80vh;
        overflow-y: auto;
    }
    
    .filters-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    }
    
    .close-filters-btn {
        display: flex;
    }
}
```

#### 2. Móviles Pequeños (≤480px)
```css
@media (max-width: 480px) {
    .filters-button {
        width: 100%;
        justify-content: center;
        padding: 12px 16px;
    }
    
    .filters-dropdown {
        width: 95%;
        padding: 16px;
    }
    
    .checkbox-group {
        gap: 10px;
    }
}
```

---

## 📱 Gestión del Overlay (JavaScript)

### Detección de Móvil
```javascript
showFilters() {
    this.filtersDropdown.classList.add('show');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && this.filtersOverlay) {
        this.filtersOverlay.style.display = 'block';
    }
}

hideFilters() {
    this.filtersDropdown.classList.remove('show');
    
    if (this.filtersOverlay) {
        this.filtersOverlay.style.display = 'none';
    }
}
```

### Event Listeners para Cierre
```javascript
bindEvents() {
    // Botón cerrar (móvil)
    const closeButton = document.getElementById('close-filters-mobile');
    if (closeButton) {
        closeButton.addEventListener('click', () => this.hideFilters());
    }
    
    // Overlay
    if (this.filtersOverlay) {
        this.filtersOverlay.addEventListener('click', () => this.hideFilters());
    }
    
    // Tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.filtersDropdown.classList.contains('show')) {
            this.hideFilters();
        }
    });
}
```

---

## 📂 Archivos Modificados

```
frontend/
├── src/
│   ├── pages/
│   │   └── perfiles/
│   │       └── index.astro                    ✅ Modificado
│   │                                             - Líneas 33-48: Botón cerrar móvil
│   │                                             - Líneas 72-116: Checkboxes actualizados
│   │                                             - Líneas 807-920: Media query tablet/móvil
│   │                                             - Líneas 922-1015: Media query móvil pequeño
│   │
│   └── utils/
│       └── advancedSearchSidebar.js           ✅ Modificado
│                                                 - bindEvents(): setTimeout(0) para checkboxes
│                                                 - showFilters(): Detección móvil + overlay
│                                                 - hideFilters(): Ocultar overlay
│                                                 - renderPerfilCard(): Campo situacionLaboral
└── docs/
    └── filtros-perfiles-frontend.md           ✅ Creado
                                                  - Documentación completa frontend
```

---

## 🔍 Flujo de Interacción

### Desktop (>768px)
```
Usuario hace clic en "Filtros"
    ↓
showFilters() agrega clase 'show'
    ↓
Dropdown aparece posicionado cerca del botón
    ↓
Usuario selecciona filtros (checkboxes)
    ↓
Usuario hace clic fuera del dropdown
    ↓
setTimeout(0) permite eventos de checkbox
    ↓
document.contains() detecta clic externo
    ↓
hideFilters() quita clase 'show'
```

### Móvil (≤768px)
```
Usuario hace clic en "Filtros"
    ↓
showFilters() detecta isMobile = true
    ↓
Modal aparece centrado + overlay visible
    ↓
Usuario selecciona filtros
    ↓
Usuario hace clic en:
    - Overlay ➞ hideFilters()
    - Botón "✕" ➞ hideFilters()
    - Tecla Escape ➞ hideFilters()
    ↓
Overlay se oculta + modal desaparece
```

---

## 🎯 Características Clave

### 1. Checkboxes "Todas"
- Marca/desmarca todas las opciones de su categoría
- Estado sincronizado automáticamente
- Funcional tanto para "Situación Laboral" como "Carrera"

### 2. Contador de Filtros
- Muestra número de filtros activos en el botón
- Se actualiza dinámicamente al cambiar selecciones
- Ayuda al usuario a identificar filtros aplicados

### 3. Persistencia de Estado
- Los filtros seleccionados se mantienen al abrir/cerrar el dropdown
- Reset de filtros limpia todas las selecciones
- Estado sincronizado con URL de búsqueda

### 4. Accesibilidad
- **Desktop**: Tecla Escape cierra el dropdown
- **Móvil**: Múltiples formas de cerrar (overlay, botón, Escape)
- Touch-friendly: Espaciado adecuado para dedos (44px mínimo)
- Scrollable: Modal móvil con scroll si contenido excede altura

---

## 🧪 Casos de Prueba UI

### Caso 1: Interacción con Checkboxes (Desktop)
1. Abrir dropdown de filtros
2. Hacer clic en "Todas" de Situación Laboral
3. **Resultado esperado**: Todos los checkboxes se marcan
4. Hacer clic nuevamente en "Todas"
5. **Resultado esperado**: Todos los checkboxes se desmarcan
6. El dropdown NO debe cerrarse durante estas interacciones

### Caso 2: Modal Móvil
1. Cambiar a vista móvil (≤768px)
2. Hacer clic en botón "Filtros"
3. **Resultado esperado**: Modal centrado + overlay oscuro
4. Hacer clic en overlay
5. **Resultado esperado**: Modal se cierra
6. Reabrir modal
7. Hacer clic en botón "✕"
8. **Resultado esperado**: Modal se cierra

### Caso 3: Responsive Breakpoints
1. Desktop (>768px): Dropdown posicionado relativo al botón
2. Tablet (≤768px): Modal centrado con overlay
3. Móvil (≤480px): Botón full-width, modal 95% ancho

---

## 🚀 Mejoras Futuras

### 1. Animaciones
- Fade in/out para modal móvil
- Slide down para dropdown desktop
- Smooth transitions con `transition: all 0.2s ease`

### 2. Guardar Preferencias
- LocalStorage para filtros preferidos
- Restaurar filtros al recargar página

### 3. Filtro de Búsqueda Rápida
- Input de texto en checkboxes para buscar opciones
- Útil cuando hay muchas carreras

### 4. Indicadores Visuales
- Badge con número de resultados por cada filtro
- Preview de cuántos egresados coinciden antes de aplicar

---

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ Safari iOS (iOS 12+)
- ✅ Chrome Android (últimas 2 versiones)

### Dispositivos Probados
- ✅ Desktop 1920x1080
- ✅ Laptop 1366x768
- ✅ Tablet 768x1024
- ✅ Móvil 375x667 (iPhone SE)
- ✅ Móvil 414x896 (iPhone 11)

---

## 🔗 Referencias

- **Documentación Backend**: `backend/docs/filtros-perfiles-funcionales.md`
- **API Endpoint**: `/api/buscar?situacionLaboral=...&carrera=...`
- **Componente Principal**: `frontend/src/utils/advancedSearchSidebar.js`

---

**Estado**: ✅ Completado y funcional en desktop y móvil
**Versión**: 1.0
**Rama**: `feature/filtros-perfiles-funcionales`
