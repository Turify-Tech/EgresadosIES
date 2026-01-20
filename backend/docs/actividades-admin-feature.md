# Feature: Sistema de Actividades Administrativas

## Descripción
Sistema dinámico para registrar y visualizar las actividades realizadas por los administradores en el panel de administración.

## Cambios en Backend

### 1. Base de Datos

**Nueva tabla: `ActividadAdmin`**
```sql
CREATE TABLE ActividadAdmin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  adminId INTEGER NOT NULL,
  tipoAccion TEXT NOT NULL CHECK (tipoAccion IN (
    'AGREGAR_DNI',
    'EDITAR_DNI',
    'ELIMINAR_DNI',
    'CARGAR_EXCEL',
    'VER_ESTADISTICAS',
    'ACCESO_PANEL'
  )),
  descripcion TEXT NOT NULL,
  detalles TEXT,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES Administrador (id) ON DELETE CASCADE
);
```

**Índice de rendimiento:**
```sql
CREATE INDEX idx_actividad_admin 
ON ActividadAdmin(adminId, fechaCreacion DESC);
```

### 2. Servicio: `actividadAdminService.js`

**Ubicación:** `backend/src/services/actividadAdminService.js`

**Funciones exportadas:**

- `registrarActividad(adminId, tipoAccion, descripcion, detalles)`
  - Registra una nueva actividad administrativa
  - Valida el tipo de acción
  - Almacena detalles en formato JSON

- `obtenerActividadesRecientes(adminId, limite)`
  - Obtiene las últimas N actividades de un administrador
  - Ordenadas por fecha descendente
  - Incluye información del administrador

- `obtenerTodasLasActividades(limite)`
  - Obtiene actividades de todos los administradores
  - Para uso futuro de super administradores

- `limpiarActividadesAntiguas(diasAntiguedad)`
  - Función de mantenimiento
  - Elimina actividades antiguas (default: 90 días)

**Tipos de acciones:**
```javascript
export const TIPOS_ACCION = {
    AGREGAR_DNI: 'AGREGAR_DNI',
    EDITAR_DNI: 'EDITAR_DNI',
    ELIMINAR_DNI: 'ELIMINAR_DNI',
    CARGAR_EXCEL: 'CARGAR_EXCEL',
    VER_ESTADISTICAS: 'VER_ESTADISTICAS',
    ACCESO_PANEL: 'ACCESO_PANEL'
};
```

### 3. Controlador: `adminController.js`

**Cambios realizados:**

- Importación del servicio de actividades
- Nueva función: `obtenerActividadesRecientesController`
- Registro automático de actividades en:
  - `agregarDNI()` - al agregar DNI individual
  - `editarDNI()` - al editar carrera de DNI
  - `eliminarDNI()` - al eliminar DNI
  - `cargarExcel()` - al cargar archivo masivo
  - `obtenerEstadisticas()` - al consultar estadísticas

**Ejemplo de integración:**
```javascript
await registrarActividad(
    req.user.id,
    TIPOS_ACCION.AGREGAR_DNI,
    `Agregó DNI ${dni} para ${carrera}`,
    { dni, carrera }
);
```

### 4. Rutas: `adminRoutes.js`

**Nueva ruta:**
```javascript
GET /api/admin/actividades-recientes?limite=10
```

**Seguridad:**
- Protegida con autenticación (`authenticateToken`)
- Requiere permisos de administrador (`requirePermission(PERMISSIONS.ADMIN_PANEL)`)
- Rate limiting aplicado (100 requests/15min)

**Parámetros query:**
- `limite` (opcional): 1-50, default: 10

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tipoAccion": "AGREGAR_DNI",
      "descripcion": "Agregó DNI 12345678 para Ingeniería en Sistemas",
      "detalles": { "dni": "12345678", "carrera": "Ingeniería en Sistemas" },
      "fechaCreacion": "2026-01-20 15:30:00",
      "nombreAdmin": "Juan Pérez"
    }
  ]
}
```

### 5. Script de Migración

**Ubicación:** `backend/scripts/migrate-actividades-admin.js`

**Uso:**
```bash
cd backend
node scripts/migrate-actividades-admin.js
```

**Acciones:**
- Crea la tabla `ActividadAdmin`
- Crea el índice de rendimiento
- Verifica la creación exitosa
- Inserta actividad de prueba inicial

## Arquitectura

```
backend/
├── src/
│   ├── services/
│   │   └── actividadAdminService.js    (Nueva)
│   ├── controllers/
│   │   └── adminController.js          (Modificado)
│   └── routes/
│       └── adminRoutes.js              (Modificado)
├── scripts/
│   └── migrate-actividades-admin.js    (Nuevo)
└── docs/
    └── actividades-admin-feature.md    (Este archivo)
```

## Consideraciones de Seguridad

1. **Validación de entrada:** Tipos de acción validados con CHECK constraint
2. **Rate limiting:** Protección contra abuso de consultas
3. **Autenticación:** Solo administradores autenticados
4. **Foreign keys:** Cascada en eliminación de administrador
5. **Detalles JSON:** Almacenamiento seguro de información adicional

## Mantenimiento

**Limpieza automática recomendada:**
```javascript
// Ejecutar mensualmente
await limpiarActividadesAntiguas(90); // Eliminar actividades mayores a 90 días
```

## Próximas Mejoras

- [ ] Notificaciones en tiempo real con WebSockets
- [ ] Filtrado por tipo de acción
- [ ] Exportación de actividades a PDF/Excel
- [ ] Dashboard de métricas de actividad
- [ ] Sistema de auditoría completo
