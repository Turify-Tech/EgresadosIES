# Paginación en Búsqueda de Egresados - Frontend

## Descripción
Implementación completa del sistema de paginación en la interfaz de búsqueda de egresados, con controles de navegación y gestión de estado.

## Cambios Realizados

### 1. `src/utils/advancedSearchSidebar.js`

#### Estado de Paginación
Se agregaron nuevas propiedades para manejar la paginación:

```javascript
this.currentPage = 1;
this.itemsPerPage = 10;
this.totalPages = 1;
this.totalResults = 0;
```

#### Elementos DOM
Se registraron los controles de paginación:

```javascript
this.elements = {
    ...existingElements,
    paginationContainer: document.getElementById("pagination-container"),
    prevPageBtn: document.getElementById("prev-page-btn"),
    nextPageBtn: document.getElementById("next-page-btn"),
    pageInfo: document.getElementById("page-info")
};
```

#### Métodos de Navegación

**nextPage()**
```javascript
nextPage() {
    if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.search();
        this.scrollToTop();
    }
}
```

**previousPage()**
```javascript
previousPage() {
    if (this.currentPage > 1) {
        this.currentPage--;
        this.search();
        this.scrollToTop();
    }
}
```

**updatePagination()**
- Actualiza texto de información de página
- Habilita/deshabilita botones según posición
- Oculta controles si solo hay 1 página

#### Integración con Búsqueda
Se modificó `buildSearchParams()` para incluir parámetros de paginación:

```javascript
buildSearchParams() {
    const params = {};
    // ...otros parámetros
    params.pagina = this.currentPage;
    params.limite = this.itemsPerPage;
    return params;
}
```

Se actualizó el método `search()` para procesar metadatos de paginación:

```javascript
if (response.success) {
    this.results = response.data.perfiles || [];
    this.totalResults = response.data.total || 0;
    this.totalPages = response.data.totalPaginas || Math.ceil(this.totalResults / this.itemsPerPage);
    this.renderResults();
    this.updateResultsCount();
    this.updatePagination();
}
```

### 2. `src/utils/api.js`

#### Envío de Parámetros de Paginación
Se modificó `searchService.searchProfiles()` para enviar parámetros de paginación al backend:

```javascript
if (filters.pagina) params.set("pagina", filters.pagina);
if (filters.limite) params.set("limite", filters.limite);
```

Esto genera URLs como:
```
http://localhost:3000/api/buscar?orderBy=nombre_asc&pagina=2&limite=10
```

### 3. `src/pages/perfiles/index.astro`

#### HTML de Controles
Se agregó el contenedor de paginación después del contenedor de resultados:

```html
<div id="pagination-container">
    <button id="prev-page-btn" class="pagination-btn">
        ← Anterior
    </button>
    <span id="page-info">Página 1 de 1</span>
    <button id="next-page-btn" class="pagination-btn">
        Siguiente →
    </button>
</div>
```

#### Estilos CSS
Diseño responsive y accesible:

```css
#pagination-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
}

.pagination-btn {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.pagination-btn:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    opacity: 0.6;
}
```

## Flujo de Paginación

1. **Carga Inicial**: Se cargan los primeros 10 resultados (página 1)
2. **Click en "Siguiente"**: 
   - Incrementa `currentPage`
   - Llama a `search()` con nueva página
   - Backend devuelve siguientes 10 resultados
3. **Actualización UI**:
   - Renderiza nuevos resultados
   - Actualiza info de página (ej: "Página 2 de 2")
   - Habilita/deshabilita botones según posición
4. **Scroll automático**: Vuelve al inicio de resultados tras cambiar página

## Características

- ✅ Navegación intuitiva con botones Anterior/Siguiente
- ✅ Indicador visual de página actual
- ✅ Botones deshabilitados en límites (primera/última página)
- ✅ Scroll automático al cambiar de página
- ✅ Oculta controles si solo hay 1 página
- ✅ Diseño responsive y accesible
- ✅ Integración completa con sistema de búsqueda y filtros

## Resultados

Total de egresados: 13
- Página 1: 10 perfiles
- Página 2: 3 perfiles (incluyendo Santiago Suarez)

Problema resuelto: Todos los egresados ahora son visibles mediante navegación paginada.
