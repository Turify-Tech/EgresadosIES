# Admin Panel Frontend - Issue #26

## Descripción General

Implementación completa del panel de administración para la gestión de DNIs válidos en el sistema de egresados del IES. El panel incluye un dashboard con estadísticas, carga masiva de DNIs desde Excel, y operaciones CRUD individuales.

## Fecha de Implementación

5 de enero de 2026

## Estructura de Archivos Creados

### Páginas

#### `/src/pages/admin/index.astro`
Dashboard principal del panel de administración.

**Características:**
- Header con título y botón de retorno al dashboard de usuario
- Sección de estadísticas (DNIs válidos, egresados registrados, pendientes de validación)
- Tarjetas de acceso rápido a funcionalidades
- Sección de actividad reciente
- Protección de ruta para administradores únicamente

**Endpoints consumidos:**
- `GET /api/admin/dnis?limit=1` - Total de DNIs válidos
- `GET /api/perfiles/?limit=100` - Total de egresados registrados

#### `/src/pages/admin/dnis.astro`
Página de gestión completa de DNIs válidos.

**Características:**
- Layout de dos columnas (formularios + tabla principal)
- Header con navegación de retorno
- Integración de componentes CargaExcel, AgregarDni y TablaDnis
- Responsive design con colapso en móviles

### Componentes

#### `/src/components/admin/EstadisticasAdmin.astro`
Componente de tarjetas de estadísticas con iconos SVG.

**Métricas mostradas:**
- DNIs Válidos (icono: tarjeta ID)
- Egresados Registrados (icono: usuario con check)
- Pendientes de Validación (icono: reloj)

**Características:**
- Iconos SVG únicos y personalizados
- Colores distintivos por métrica (azul, verde, naranja)
- Actualización automática mediante función `cargarEstadisticas()`

#### `/src/components/admin/AgregarDni.astro`
Formulario para agregar DNIs individuales.

**Funcionalidades:**
- Input de DNI con validación de patrón `[0-9]{7,8}`
- Select de carreras cargado dinámicamente desde `/api/carreras`
- Validación de formulario en frontend
- Feedback visual (mensajes de éxito/error)
- Dispara evento `dni-agregado` para actualizar estadísticas y tabla

**Endpoint:**
- `POST /api/admin/dnis/agregar`
  - Body: `{ dni: string, carrera: string }`
  - Headers: `Authorization: Bearer <token>`

#### `/src/components/admin/CargaExcel.astro`
Componente de carga masiva mediante archivo Excel.

**Funcionalidades:**
- Drag & drop de archivos
- Validación de tipo de archivo (.xlsx, .xls)
- Límite de tamaño: 10MB
- Barra de progreso animada durante la carga
- Reporte detallado de resultados:
  - Total procesados
  - Exitosos
  - Duplicados
  - Lista de errores específicos
- Información de formato requerido (columnas DNI y Carrera)

**Endpoint:**
- `POST /api/admin/dnis/cargar-excel`
  - Body: `FormData` con archivo Excel
  - Headers: `Authorization: Bearer <token>`

#### `/src/components/admin/TablaDnis.astro`
Tabla completa con operaciones CRUD.

**Funcionalidades:**
- Paginación (20 items por página)
- Búsqueda por DNI
- Filtro por carrera
- Botones de acción:
  - Editar (abre modal)
  - Eliminar (con confirmación)
- Modal de edición:
  - DNI deshabilitado (no editable)
  - Carrera editable con select dinámico
  - Botones Cancelar y Guardar

**Endpoints:**
- `GET /api/admin/dnis?page=X&limit=20&search=Y&carrera=Z` - Listar con filtros
- `PUT /api/admin/dnis/:id` - Editar DNI
  - Body: `{ carrera: string }`
- `DELETE /api/admin/dnis/:id` - Eliminar DNI

## Estilos

### `/src/styles/admin.css`
Archivo centralizado de estilos para todo el panel de administración.

**Tamaño:** 1064 líneas

**Secciones principales:**
1. **Layout base** (`.admin-page`, `.page-container`)
2. **Headers** (`.admin-header`, `.page-header`)
3. **Botones** (`.btn-primary`, `.btn-secondary`, `.btn-back`)
4. **Estadísticas** (`.stat-card`, `.stat-icon`, `.stat-value`)
5. **Tarjetas** (`.access-card`, `.agregar-dni-card`, `.carga-excel-card`, `.tabla-dnis-card`)
6. **Formularios** (`.form-group`, inputs, selects)
7. **Dropzone** (`.dropzone`, estados hover/dragover)
8. **Tabla** (`.tabla-dnis`, thead, tbody, paginación)
9. **Modal** (`.modal`, `.modal-content`, `.modal-actions`)
10. **Actividad** (`.activity-card`, `.activity-item`)
11. **Media queries** (responsive breakpoints)

**Sistema de colores implementado:**
- Primario: `#5372EF` (azul)
- Primario hover: `#3B5BCF` (azul oscuro)
- Fondo claro: `#F9FAFB`
- Bordes: `#E5E7EB`
- Texto principal: `#1a1a1a` (negro)
- Texto secundario: `#374151`, `#6B7280`
- Éxito: `#10b981` (verde)
- Advertencia: `#f59e0b` (naranja)
- Error: `#ef4444` (rojo)

**Principios de diseño:**
- Bordes sutiles en lugar de sombras pesadas
- Fondos blancos y grises muy claros
- Botón primario con fondo azul sólido
- Botón secundario con borde y fondo blanco
- Hover states con cambios de color suaves
- Transiciones CSS de 0.2s para interactividad

## Arquitectura y Patrones

### Autenticación
- JWT almacenado en `localStorage` con clave `auth_token`
- Verificación en cada página mediante `authenticateToken` middleware
- Permisos de administrador mediante `requirePermission(PERMISSIONS.ADMIN_PANEL)`
- Redirección automática si no hay token o permisos insuficientes

### Comunicación Frontend-Backend
- API base: `http://localhost:3000/api`
- Headers estándar:
  ```javascript
  {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  ```
- Manejo de respuestas:
  - Status 200: Operación exitosa
  - Status 400: Error de validación
  - Status 401/403: Error de autenticación/autorización
  - Status 500: Error interno del servidor

### Eventos Personalizados
```javascript
// Disparar actualización de datos
window.dispatchEvent(new Event('dni-agregado'));

// Escuchar actualizaciones
window.addEventListener('dni-agregado', () => {
  cargarEstadisticas();
  cargarDnis(1);
});
```

### Validaciones

#### Frontend
- DNI: Patrón `[0-9]{7,8}`, longitud máxima 8, requerido
- Carrera: Selección obligatoria desde lista existente
- Archivo Excel: Tipo MIME validado, tamaño máximo 10MB

#### Backend (ya implementado)
- DNI: Formato 7-8 dígitos numéricos
- Carrera: Existe en tabla `Carrera`
- Duplicados: No permite DNIs repetidos
- Rate limiting:
  - Operaciones admin: 100 requests/15min
  - Carga Excel: 10 requests/hora

## Funcionalidades Implementadas

### ✅ Dashboard Principal
- [x] Estadísticas en tiempo real
- [x] Tarjetas de acceso rápido
- [x] Navegación a gestión de DNIs
- [x] Botón de retorno al inicio (home)
- [x] Sección de actividad reciente (estática)

### ✅ Gestión de DNIs
- [x] Carga masiva desde Excel con drag & drop
- [x] Feedback visual de progreso
- [x] Reporte detallado de errores
- [x] Agregar DNI individual
- [x] Editar DNI existente
- [x] Eliminar DNI con confirmación
- [x] Búsqueda por DNI
- [x] Filtro por carrera
- [x] Paginación de resultados

### ✅ Interfaz de Usuario
- [x] Diseño responsive (móvil, tablet, desktop)
- [x] Sistema de colores consistente
- [x] Iconos SVG personalizados
- [x] Estados de carga y feedback
- [x] Animaciones suaves
- [x] Accesibilidad (roles ARIA, tabindex)

## Formato de Archivo Excel

El archivo Excel debe cumplir con el siguiente formato:

### Estructura Requerida
| DNI | Carrera |
|---------|---------------------------|
| 12345678 | Desarrollo de Software |
| 23456789 | Análisis y Programación de Sistemas |

### Requisitos
1. **Primera fila (header):**
   - Columna 1: `DNI` (exacto, case-insensitive)
   - Columna 2: `Carrera` (exacto, case-insensitive)

2. **Datos:**
   - DNI: 7-8 dígitos numéricos
   - Carrera: Nombre exacto de carrera existente en BD

3. **Formato de archivo:**
   - Extensión: `.xlsx` o `.xls`
   - Tamaño máximo: 10MB

### Ejemplo de Procesamiento

**Archivo cargado:**
```
DNI       | Carrera
12345678  | Desarrollo de Software
99999999  | Carrera Inexistente
12345678  | Logística (duplicado)
abcd1234  | Formato inválido
```

**Resultado:**
```json
{
  "procesados": 4,
  "exitosos": 1,
  "duplicados": 1,
  "errores": [
    "Fila 2: Carrera 'Carrera Inexistente' no existe",
    "Fila 4: DNI 'abcd1234' tiene formato inválido"
  ]
}
```

## Navegación del Panel

```
/admin (Dashboard)
  ├── Estadísticas (EstadisticasAdmin)
  ├── Acceso Rápido
  │   └── Gestión de DNIs → /admin/dnis
  └── Actividad Reciente

/admin/dnis (Gestión de DNIs)
  ├── Sidebar (Formularios)
  │   ├── Carga Masiva Excel (CargaExcel)
  │   └── Agregar DNI Individual (AgregarDni)
  └── Contenido Principal
      └── Tabla de DNIs (TablaDnis)
          ├── Búsqueda
          ├── Filtros
          ├── Paginación
          └── Acciones (Editar/Eliminar)
```

## Responsive Design

### Breakpoints Implementados

#### Desktop (> 992px)
- Layout de dos columnas en `/admin/dnis`
- Sidebar fijo de 400px
- Tabla con todas las columnas visibles
- Cards en grid de 3 columnas

#### Tablet (768px - 992px)
- Layout de dos columnas ajustado
- Sidebar de 350px
- Cards en grid de 2 columnas

#### Mobile (< 768px)
- Layout de una sola columna (stack vertical)
- Sidebar ocupa ancho completo
- Cards en columna única
- Tabla con scroll horizontal
- Headers reducidos
- Padding ajustado

## Seguridad

### Implementada
- ✅ Autenticación JWT obligatoria
- ✅ Verificación de rol de administrador
- ✅ Rate limiting en backend
- ✅ Validación de entrada en frontend
- ✅ Validación de entrada en backend
- ✅ Sanitización de datos en backend
- ✅ CORS configurado
- ✅ Headers de seguridad

### Consideraciones
- Los tokens se almacenan en `localStorage` (considerar `httpOnly cookies` para mayor seguridad)
- No hay sistema de refresh tokens implementado
- No hay logging de actividades admin (pendiente para auditoría)

## Testing Manual

### Checklist de Pruebas

#### Autenticación
- [x] Acceso denegado sin token
- [x] Acceso denegado con token de egresado
- [x] Acceso permitido con token de administrador
- [x] Redirección correcta en cada caso

#### Dashboard
- [x] Estadísticas se cargan correctamente
- [x] Navegación a gestión de DNIs funciona
- [x] Botón de retorno funciona

#### Agregar DNI Individual
- [x] Validación de formato de DNI
- [x] Carga dinámica de carreras
- [x] Mensaje de éxito al agregar
- [x] Mensaje de error en duplicados
- [x] Actualización automática de tabla

#### Carga Excel
- [x] Drag & drop funciona
- [x] Click para seleccionar funciona
- [x] Validación de tipo de archivo
- [x] Validación de tamaño
- [x] Progreso se muestra correctamente
- [x] Reporte de resultados es claro
- [x] Manejo de errores detallado

#### Tabla de DNIs
- [x] Paginación funciona
- [x] Búsqueda por DNI funciona
- [x] Filtro por carrera funciona
- [x] Editar DNI abre modal
- [x] Modal guarda cambios correctamente
- [x] Eliminar solicita confirmación
- [x] Eliminar funciona correctamente

#### Responsive
- [x] Layout se adapta en móvil
- [x] Formularios usables en móvil
- [x] Tabla scrolleable en móvil
- [x] Botones táctiles adecuados

## Mejoras Futuras (Opcional)

### Sistema de Actividades
Implementar logging de actividades admin:
1. Crear tabla `actividad_admin` en backend
2. Endpoint `GET /api/admin/actividades`
3. Registrar automáticamente cada operación CRUD
4. Mostrar en dashboard con timestamps

### Exportación de Datos
Agregar funcionalidad de exportar DNIs a Excel

### Notificaciones en Tiempo Real
WebSocket para notificar cambios entre múltiples administradores conectados

### Filtros Avanzados
- Rango de fechas de creación
- Ordenamiento por columna
- Búsqueda combinada (DNI + carrera)

### Estadísticas Avanzadas
- Gráficos de tendencias
- DNIs agregados por período
- Distribución por carrera

## Comandos Git

### Commit
```bash
git add .
git commit -m "feat(admin): implementar panel de administración frontend completo

- Agregar dashboard con estadísticas en tiempo real
- Implementar carga masiva de DNIs desde Excel con drag & drop
- Crear CRUD completo para gestión individual de DNIs
- Agregar tabla paginada con búsqueda y filtros
- Implementar sistema de diseño consistente
- Agregar validaciones frontend y feedback visual
- Crear componentes admin reutilizables
- Implementar diseño responsive para móviles

Resolves #26"
```

### Push
```bash
git push origin feature/admin-panel-frontend
```

## Referencias

### Archivos Relacionados
- Backend: `/backend/src/routes/adminRoutes.js`
- Backend: `/backend/src/controllers/adminController.js`
- Backend: `/backend/src/middleware/roles.js`
- Frontend Layout: `/frontend/src/layouts/BaseLayout.astro`

### Issues Relacionadas
- #21: Backend Admin Endpoints (dependencia)
- #03: Frontend Astro Setup (dependencia)

### Endpoints Backend Utilizados
```
GET    /api/admin/dnis              - Listar DNIs (paginado, filtros)
POST   /api/admin/dnis/agregar      - Agregar DNI individual
POST   /api/admin/dnis/cargar-excel - Carga masiva Excel
PUT    /api/admin/dnis/:id          - Editar DNI
DELETE /api/admin/dnis/:id          - Eliminar DNI
GET    /api/carreras                - Lista de carreras disponibles
GET    /api/perfiles/               - Lista de perfiles (para stats)
```

## Conclusión

El panel de administración frontend está **completamente implementado** y cumple con todos los criterios de aceptación de la Issue #26. La implementación incluye un sistema robusto de gestión de DNIs con carga masiva, CRUD individual, búsqueda, filtros, paginación y un diseño responsive que sigue un sistema de colores consistente.

El código está organizado de manera modular con componentes reutilizables, estilos centralizados en un archivo CSS externo, y una arquitectura clara que facilita el mantenimiento y futuras extensiones.
