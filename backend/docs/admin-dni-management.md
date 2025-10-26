# ⚙️ Sistema de Gestión de DNIs Válidos - Documentación

## 📋 Descripción General

Sistema administrativo para gestionar la lista de DNIs válidos que pueden registrarse en el sistema. Permite a los administradores realizar operaciones CRUD sobre DNIs válidos, incluyendo carga masiva desde archivos Excel.

## 🎯 Funcionalidades Implementadas

- ✅ **CRUD completo** para gestión de DNIs válidos
- ✅ **Carga masiva** desde archivos Excel (.xlsx, .xls)
- ✅ **Validación** de formato DNI argentino (7-8 dígitos)
- ✅ **Prevención** de DNIs duplicados
- ✅ **Validación** de carreras existentes
- ✅ **Paginación y filtros** en listados
- ✅ **Rate limiting** específico para administradores
- ✅ **Logs** de operaciones administrativas
- ✅ **Estadísticas** de DNIs por carrera

## 🚀 Endpoints Disponibles

### 1. Agregar DNI Individual
```
POST /api/admin/dnis/agregar
```

**Descripción**: Agrega un DNI individual a la lista de válidos.

**Autenticación**: Requerida (Administrador)

**Rate Limiting**: 100 requests por 15 minutos por IP

**Request Body**:
```json
{
  "dni": "12345678",
  "carrera": "Desarrollo de Software"
}
```

**Validaciones**:
- DNI: 7-8 dígitos numéricos
- Carrera: Debe existir en la base de datos
- No permitir DNIs duplicados

**Ejemplo de Response Exitoso**:
```json
{
  "success": true,
  "message": "DNI agregado exitosamente",
  "data": {
    "dni": "12345678",
    "carrera": "Desarrollo de Software"
  }
}
```

**Errores Posibles**:
- `400`: Datos inválidos (formato DNI, carrera inexistente)
- `409`: DNI ya existe
- `401`: No autenticado
- `403`: Sin permisos de administrador

### 2. Listar DNIs Válidos
```
GET /api/admin/dnis
```

**Descripción**: Obtiene lista paginada de DNIs válidos con filtros.

**Autenticación**: Requerida (Administrador)

**Parámetros de Query (opcionales)**:
- `page` (number): Número de página (default: 1)
- `limit` (number): Resultados por página (default: 50, máximo: 100)
- `search` (string): Buscar por DNI (búsqueda parcial)
- `carrera` (string): Filtrar por carrera exacta

**Ejemplo de Request**:
```
GET /api/admin/dnis?page=1&limit=10&search=123&carrera=Desarrollo%20de%20Software
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "data": {
    "dnis": [
      {
        "dni": "12345678",
        "carrera": "Desarrollo de Software"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "carreras": ["Desarrollo de Software", "Diseño Gráfico"]
    }
  }
}
```

### 3. Carga Masiva desde Excel
```
POST /api/admin/dnis/cargar-excel
```

**Descripción**: Carga múltiples DNIs desde un archivo Excel.

**Autenticación**: Requerida (Administrador)

**Rate Limiting**: 10 cargas por hora por IP (más restrictivo)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `archivo`: Archivo Excel (.xlsx o .xls)

**Estructura requerida del Excel**:
- Debe contener columnas "DNI" y "Carrera" (case insensitive)
- Primera fila como header
- Máximo 10MB por archivo

**Ejemplo de estructura Excel**:
| DNI      | Carrera              |
|----------|----------------------|
| 12345678 | Desarrollo de Software |
| 87654321 | Desarrollo de Software |
| 11111111 | Diseño Gráfico       |

**Ejemplo de Response**:
```json
{
  "success": true,
  "message": "Carga masiva completada",
  "data": {
    "procesados": 100,
    "exitosos": 85,
    "duplicados": 10,
    "errores": [
      "Fila 15: DNI \"1234\" tiene formato inválido",
      "Fila 32: Carrera \"Inexistente\" no existe"
    ]
  }
}
```

### 4. Editar DNI
```
PUT /api/admin/dnis/:dni
```

**Descripción**: Actualiza la carrera de un DNI existente.

**Autenticación**: Requerida (Administrador)

**Parámetros de URL**:
- `dni`: DNI a editar (7-8 dígitos)

**Request Body**:
```json
{
  "carrera": "Nueva Carrera"
}
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "message": "DNI actualizado exitosamente",
  "data": {
    "dni": "12345678",
    "carrera": "Nueva Carrera",
    "carreraAnterior": "Carrera Anterior"
  }
}
```

### 5. Eliminar DNI
```
DELETE /api/admin/dnis/:dni
```

**Descripción**: Elimina un DNI de la lista de válidos.

**Autenticación**: Requerida (Administrador)

**Parámetros de URL**:
- `dni`: DNI a eliminar

**Ejemplo de Response**:
```json
{
  "success": true,
  "message": "DNI eliminado exitosamente",
  "data": {
    "dni": "12345678",
    "carrera": "Desarrollo de Software"
  }
}
```

### 6. Estadísticas de DNIs
```
GET /api/admin/dnis/estadisticas
```

**Descripción**: Obtiene estadísticas de DNIs válidos por carrera.

**Autenticación**: Requerida (Administrador)

**Ejemplo de Response**:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "porCarrera": [
      {
        "carrera": "Desarrollo de Software",
        "cantidad": 85
      },
      {
        "carrera": "Diseño Gráfico",
        "cantidad": 40
      },
      {
        "carrera": "Marketing Digital",
        "cantidad": 25
      }
    ]
  }
}
```

## 🔒 Seguridad Implementada

### Rate Limiting
- **General**: 100 requests por 15 minutos por IP
- **Carga Excel**: 10 cargas por hora por IP
- Headers informativos: `RateLimit-Limit`, `RateLimit-Remaining`

### Validaciones
```javascript
// Validación DNI argentino
const dniRegex = /^\d{7,8}$/;

// Sanitización de inputs
function sanitizeInput(input) {
    return input
        .trim()
        .replace(/[<>\"'&]/g, '')
        .substring(0, 1000);
}
```

### Autorización
- Solo usuarios con rol "Administrador"
- Verificación de permisos `ADMIN_PANEL`
- Tokens JWT obligatorios

## 📊 Logs y Auditoría

Todas las operaciones administrativas se registran:

```javascript
await logAdminOperation(req.user.id, 'Agregar DNI individual', {
    dni: '12345678',
    carrera: 'Desarrollo de Software'
});
```

**Operaciones registradas**:
- Agregar DNI individual
- Carga masiva de DNIs (con estadísticas)
- Editar DNI (carrera anterior y nueva)
- Eliminar DNI

## 🗂️ Estructura de Archivos

```
backend/src/
├── controllers/
│   └── adminController.js      # Lógica de negocio para DNIs
├── routes/
│   └── adminRoutes.js          # Definición de endpoints
├── validators/
│   └── adminValidators.js      # Validaciones de entrada
└── middleware/
    └── roles.js               # Permisos ADMIN_PANEL
```

## 🧪 Testing Realizado

### Casos de Prueba Exitosos
- ✅ Agregar DNI individual válido
- ✅ Listar DNIs con paginación
- ✅ Filtrar DNIs por búsqueda parcial
- ✅ Editar carrera de DNI existente
- ✅ Eliminar DNI válido
- ✅ Obtener estadísticas
- ✅ Rate limiting funcional

### Casos de Error Validados
- ✅ DNI con formato inválido (menos de 7 dígitos)
- ✅ DNI duplicado (error 409)
- ✅ Carrera inexistente
- ✅ Acceso sin autenticación (error 401)
- ✅ Acceso sin permisos admin (error 403)
- ✅ Parámetros de paginación inválidos

## 📝 Ejemplo de Uso Completo

```bash
# 1. Login como administrador
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"00000000","password":"temporal123"}'

# 2. Agregar DNI individual
curl -X POST http://localhost:3000/api/admin/dnis/agregar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dni":"12345678","carrera":"Desarrollo de Software"}'

# 3. Listar DNIs con filtros
curl -X GET "http://localhost:3000/api/admin/dnis?page=1&limit=10&search=123" \
  -H "Authorization: Bearer <token>"

# 4. Obtener estadísticas
curl -X GET http://localhost:3000/api/admin/dnis/estadisticas \
  -H "Authorization: Bearer <token>"
```

## 🚀 Mejoras Futuras Sugeridas

1. **Logs en Base de Datos**: Crear tabla `AdminLog` para auditoría completa
2. **Validación de Excel Avanzada**: Detectar tipos de dato y rangos
3. **Cache de Carreras**: Reducir consultas repetidas a BD
4. **Exportación**: Endpoint para descargar lista de DNIs en Excel
5. **Notificaciones**: Alertas por email en cargas masivas grandes
6. **Respaldo**: Sistema de backup antes de eliminaciones masivas

---

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**Autor**: Sistema de Gestión de Egresados IES