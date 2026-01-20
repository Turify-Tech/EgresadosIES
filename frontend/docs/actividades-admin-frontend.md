# Feature: Actividades Recientes - Frontend

## Descripción
Componente dinámico que reemplaza el apartado estático de "Actividades Recientes" en el panel de administración, mostrando en tiempo real las acciones realizadas por el administrador.

## Cambios en Frontend

### 1. Servicio API: `actividadesAdminApi.js`

**Ubicación:** `frontend/src/utils/actividadesAdminApi.js`

**Funciones exportadas:**

#### `obtenerActividadesRecientes(limite)`
Obtiene las actividades del administrador autenticado.

```javascript
const actividades = await obtenerActividadesRecientes(10);
```

**Parámetros:**
- `limite` (number): Cantidad de actividades (1-50, default: 10)

**Retorna:** Array de actividades con estructura:
```javascript
{
  id: number,
  tipoAccion: string,
  descripcion: string,
  detalles: object | null,
  fechaCreacion: string,
  nombreAdmin: string
}
```

#### `formatearFechaActividad(fechaISO)`
Formatea fechas SQLite/ISO a texto legible en español.

```javascript
formatearFechaActividad("2026-01-20 15:30:00")
// → "hace 5 minutos" | "hace 2 horas" | "hace 3 días"
```

**Características:**
- Convierte formato SQLite a ISO automáticamente
- Maneja fechas relativas (segundos, minutos, horas, días)
- Muestra fecha completa para antigüedades > 1 semana
- Locale español argentino

#### `obtenerIconoAccion(tipoAccion)`
Retorna el path SVG del ícono correspondiente a cada tipo de acción.

```javascript
obtenerIconoAccion('AGREGAR_DNI')
// → '<path d="M12 5v14m-7-7h14"></path>'
```

**Tipos soportados:**
- `AGREGAR_DNI`: Plus (agregar)
- `EDITAR_DNI`: Edit (editar)
- `ELIMINAR_DNI`: Trash (eliminar)
- `CARGAR_EXCEL`: Upload (cargar)
- `VER_ESTADISTICAS`: Activity (estadísticas)
- `ACCESO_PANEL`: Login (acceso)

#### `obtenerColorAccion(tipoAccion)`
Retorna la clase CSS para colorear el ícono según la acción.

```javascript
obtenerColorAccion('AGREGAR_DNI') // → "success" (verde)
obtenerColorAccion('ELIMINAR_DNI') // → "danger" (rojo)
```

### 2. Vista: `admin/index.astro`

**Ubicación:** `frontend/src/pages/admin/index.astro`

#### Estructura HTML

**Estados implementados:**

1. **Loading** (`#actividad-loading`)
   - Spinner animado
   - Mensaje "Cargando actividades..."

2. **Error** (`#actividad-error`)
   - Ícono de error
   - Mensaje de error personalizado
   - Botón "Reintentar"

3. **Vacío** (`#actividad-vacio`)
   - Ícono informativo
   - Mensaje "No hay actividades recientes"
   - Hint: "Las acciones que realices aparecerán aquí"

4. **Lista** (`#actividad-lista`)
   - Items de actividades
   - Controles de paginación

#### Componente de Actividad

```html
<div class="activity-item" data-tipo="AGREGAR_DNI">
    <div class="activity-icon success">
        <svg><!-- Ícono dinámico --></svg>
    </div>
    <div class="activity-content">
        <p>Descripción de la actividad</p>
        <span class="activity-time">hace 5 minutos</span>
    </div>
</div>
```

#### Paginación

**Configuración:**
- 5 actividades por página
- Botones "Anterior" y "Siguiente"
- Indicador "Página X de Y"
- Responsive para móviles

**Lógica:**
```javascript
const actividadesPorPagina = 5;
let paginaActual = 1;
let todasLasActividades = [];
```

**Navegación:**
- Botones se deshabilitan en primera/última página
- Re-renderizado eficiente sin consultas adicionales al servidor
- Mantiene todas las actividades en memoria

#### Script Principal

**Funciones implementadas:**

1. `verificarAdmin()`
   - Valida autenticación y permisos
   - Carga paralela de estadísticas y actividades

2. `cargarActividadesRecientes()`
   - Consulta al backend (hasta 50 actividades)
   - Manejo de estados (loading, error, vacío, success)
   - Inicializa la paginación

3. `renderizarActividades()`
   - Renderiza página actual (5 actividades)
   - Genera controles de paginación
   - Event listeners para botones

### 3. Estilos: `admin.css`

**Ubicación:** `frontend/src/styles/admin.css`

#### Clases CSS agregadas

**Lista de actividades:**
```css
.activity-list          /* Contenedor flex */
.activity-item          /* Item individual con hover */
.activity-icon          /* Contenedor del ícono circular */
.activity-content       /* Contenedor de texto */
.activity-time          /* Timestamp */
```

**Colores de íconos:**
```css
.activity-icon.success    /* Verde - AGREGAR_DNI */
.activity-icon.danger     /* Rojo - ELIMINAR_DNI */
.activity-icon.info       /* Azul - EDITAR_DNI */
.activity-icon.primary    /* Azul primario - CARGAR_EXCEL */
.activity-icon.secondary  /* Gris - VER_ESTADISTICAS */
.activity-icon.default    /* Gris claro - ACCESO_PANEL */
```

**Estados:**
```css
.activity-loading    /* Centro con spinner */
.activity-error      /* Centro con error */
.activity-empty      /* Centro con mensaje vacío */
.activity-hint       /* Texto secundario */
```

**Paginación:**
```css
.activity-pagination  /* Contenedor flex */
.pagination-btn       /* Botones anterior/siguiente */
.pagination-info      /* Texto "Página X de Y" */
```

**Animaciones:**
```css
@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 4. Arquitectura de Componentes

```
frontend/src/
├── pages/
│   └── admin/
│       └── index.astro              (Modificado)
├── utils/
│   └── actividadesAdminApi.js       (Nuevo)
├── styles/
│   └── admin.css                    (Modificado)
└── docs/
    └── actividades-admin-frontend.md (Este archivo)
```

## Flujo de Datos

```
Usuario realiza acción en admin
         ↓
Backend registra en ActividadAdmin
         ↓
Frontend consulta /api/admin/actividades-recientes
         ↓
actividadesAdminApi.js procesa respuesta
         ↓
Renderiza en admin/index.astro
         ↓
Usuario ve actividad en tiempo real
```

## Características Técnicas

### Separación de Responsabilidades
✅ **Servicio API** - Lógica de comunicación con backend  
✅ **Vista** - Presentación y estructura HTML  
✅ **Script** - Lógica de negocio y manejo de estado  
✅ **Estilos** - Presentación visual separada  

### Manejo de Estados
✅ Loading - Con spinner animado  
✅ Error - Con retry automático  
✅ Vacío - Mensaje informativo  
✅ Success - Lista paginada  

### UX/UI
✅ Feedback visual inmediato  
✅ Íconos diferenciados por acción  
✅ Colores semánticos (verde=crear, rojo=eliminar)  
✅ Fechas humanizadas en español  
✅ Paginación intuitiva  
✅ Responsive design  

## Testing

### Casos de prueba recomendados

1. **Sin actividades**
   - Verificar estado vacío
   - Mensaje correcto

2. **Con actividades**
   - Verificar renderizado
   - Fechas correctas
   - Íconos apropiados

3. **Paginación**
   - Navegación entre páginas
   - Botones habilitados/deshabilitados
   - Contador correcto

4. **Error de red**
   - Mostrar estado de error
   - Botón reintentar funcional

5. **Diferentes tipos de acciones**
   - Todos los tipos renderizan correctamente
   - Colores e íconos apropiados

## Próximas Mejoras

- [ ] Auto-refresh cada X segundos
- [ ] Filtrado por tipo de acción
- [ ] Búsqueda de actividades
- [ ] Exportar historial
- [ ] Notificaciones push de nuevas actividades
- [ ] Vista de detalles expandida
