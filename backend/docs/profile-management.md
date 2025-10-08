# 📋 Profile Management Backend - Issue #13

## 🎯 Resumen

Se implementó el sistema completo de gestión de perfiles para egresados, incluyendo CRUD para perfil principal, experiencias laborales, formación académica y cursos.

## 🚀 Funcionalidades Implementadas

### ✅ Endpoints Principales

#### **Perfil Principal**
- `GET /api/perfil/mi-perfil` - Obtener perfil completo del usuario logueado
- `PUT /api/perfil/mi-perfil` - Actualizar perfil del usuario logueado

#### **Experiencia Laboral**
- `POST /api/perfil/experiencia` - Agregar experiencia laboral
- `PUT /api/perfil/experiencia/:id` - Actualizar experiencia laboral
- `DELETE /api/perfil/experiencia/:id` - Eliminar experiencia laboral

#### **Formación Académica**
- `POST /api/perfil/formacion` - Agregar formación académica
- `PUT /api/perfil/formacion/:id` - Actualizar formación académica
- `DELETE /api/perfil/formacion/:id` - Eliminar formación académica

#### **Cursos**
- `POST /api/perfil/curso` - Agregar curso
- `PUT /api/perfil/curso/:id` - Actualizar curso
- `DELETE /api/perfil/curso/:id` - Eliminar curso

### ✅ Características de Seguridad
- **Autenticación obligatoria** en todas las rutas
- **Autorización por rol** (solo egresados)
- **Propiedad de datos** (solo puede editar sus propios datos)
- **Validación exhaustiva** de todos los campos
- **Sanitización automática** de strings
- **Logging detallado** de actividades

## 📁 Archivos Creados

```
backend/src/
├── controllers/
│   ├── perfilController.js         # Controlador principal de perfil
│   ├── experienciaController.js    # CRUD experiencia laboral
│   ├── formacionController.js      # CRUD formación académica
│   └── cursosController.js         # CRUD cursos
├── validators/
│   └── perfilValidators.js         # Validaciones específicas
├── routes/
│   └── perfilRoutes.js            # Rutas del perfil
└── app.js                         # (modificado) Integración de rutas
```

## 📊 Estructura de Datos

### **Perfil Principal**
```json
{
  "resumenProfesional": "string (max 1000)",
  "urlPortfolio": "string (URL válida)",
  "situacionLaboral": "string (max 200)",
  "urlFotoPerfil": "string (URL válida)",
  "urlBanner": "string (URL válida)"
}
```

### **Experiencia Laboral**
```json
{
  "puesto": "string (requerido, max 100)",
  "empresa": "string (requerido, max 100)",
  "fechaInicio": "date (opcional, formato ISO)",
  "fechaFin": "date (opcional, formato ISO)",
  "descripcion": "string (opcional, max 500)"
}
```

### **Formación Académica**
```json
{
  "titulo": "string (requerido, max 150)",
  "institucion": "string (requerido, max 150)",
  "anioFinalizacion": "integer (opcional, 1950-2030)"
}
```

### **Curso**
```json
{
  "nombre": "string (requerido, max 150)",
  "institucion": "string (requerido, max 150)",
  "horasDuracion": "integer (opcional, 1-10000)"
}
```

## 🔧 Ejemplos de Uso

### **1. Obtener Perfil Completo**
```http
GET /api/perfil/mi-perfil
Authorization: Bearer <jwt-token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@example.com",
      "dni": "12345678",
      "telefono": "1123456789"
    },
    "carrera": {
      "id": 1,
      "nombre": "Desarrollo de Software"
    },
    "perfil": {
      "id": 1,
      "resumenProfesional": "Desarrollador Full Stack...",
      "urlPortfolio": "https://juan-portfolio.com",
      "situacionLaboral": "Empleado",
      "urlFotoPerfil": "https://cdn.com/foto.jpg",
      "urlBanner": "https://cdn.com/banner.jpg"
    },
    "experienciasLaborales": [
      {
        "id": 1,
        "puesto": "Desarrollador Frontend",
        "empresa": "Tech Corp",
        "fechaInicio": "2023-01-15",
        "fechaFin": null,
        "descripcion": "Desarrollo de interfaces..."
      }
    ],
    "formacionAcademica": [
      {
        "id": 1,
        "titulo": "Tecnicatura en Programación",
        "institucion": "IES Digital",
        "anioFinalizacion": 2022
      }
    ],
    "cursos": [
      {
        "id": 1,
        "nombre": "React Avanzado",
        "institucion": "Platzi",
        "horasDuracion": 40
      }
    ]
  }
}
```

### **2. Actualizar Perfil**
```http
PUT /api/perfil/mi-perfil
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "resumenProfesional": "Desarrollador Full Stack con 3 años de experiencia...",
  "urlPortfolio": "https://mi-nuevo-portfolio.com",
  "situacionLaboral": "Empleado",
  "urlFotoPerfil": "https://nueva-foto.jpg"
}
```

### **3. Agregar Experiencia Laboral**
```http
POST /api/perfil/experiencia
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "puesto": "Desarrollador Backend",
  "empresa": "Startup XYZ",
  "fechaInicio": "2023-06-01",
  "descripcion": "Desarrollo de APIs REST con Node.js y Express"
}
```

### **4. Actualizar Formación**
```http
PUT /api/perfil/formacion/1
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "titulo": "Tecnicatura Superior en Programación",
  "institucion": "IES Digital",
  "anioFinalizacion": 2022
}
```

### **5. Eliminar Curso**
```http
DELETE /api/perfil/curso/1
Authorization: Bearer <jwt-token>
```

## 🛡️ Validaciones Implementadas

### **Perfil Principal**
- ✅ Resumen profesional: máximo 1000 caracteres
- ✅ URLs: formato válido de URL (http/https)
- ✅ Situación laboral: máximo 200 caracteres
- ✅ Todos los campos opcionales

### **Experiencia Laboral**
- ✅ Puesto y empresa: requeridos, máximo 100 caracteres
- ✅ Fechas: formato válido, entre 1950 y próximo año
- ✅ Fecha fin posterior a fecha inicio
- ✅ Descripción: máximo 500 caracteres

### **Formación Académica**
- ✅ Título e institución: requeridos, máximo 150 caracteres
- ✅ Año finalización: entre 1950 y 2030
- ✅ Año opcional

### **Cursos**
- ✅ Nombre e institución: requeridos, máximo 150 caracteres
- ✅ Horas duración: número positivo, máximo 10,000
- ✅ Horas opcionales

## 🔐 Middleware de Seguridad

### **Cadena de Middleware**
1. `authenticateToken` - Verificar JWT válido
2. `requireUserType('Egresado')` - Solo egresados
3. `sanitizeStrings` - Limpiar strings automáticamente
4. `validateXXX` - Validación específica por endpoint
5. `logValidation` - Logging de actividad

### **Verificación de Propiedad**
Todos los endpoints de modificación verifican que el usuario solo puede editar sus propios datos mediante consultas que incluyen el ID del usuario en la condición WHERE.

## 📈 Logs y Monitoreo

### **Tipos de Logs**
```
[PERFIL] Usuario 1 actualizó su perfil - ID: 1
[EXPERIENCIA] Usuario 1 agregó experiencia laboral - ID: 5
[FORMACION] Usuario 1 eliminó formación académica - ID: 2 (Título en Institución)
[VALIDATION] Usuario 1 - Actualizar mi perfil - PUT /api/perfil/mi-perfil
```

### **Levels de Log**
- `console.info` - Operaciones exitosas
- `console.warn` - Validaciones fallidas
- `console.error` - Errores internos

## 🚨 Manejo de Errores

### **Códigos de Estado**
- `200` - Operación exitosa
- `201` - Recurso creado
- `400` - Error de validación / datos inválidos
- `401` - No autenticado
- `403` - Sin permisos
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

### **Formato de Error Consistente**
```json
{
  "success": false,
  "error": "Mensaje de error principal",
  "details": ["Error específico 1", "Error específico 2"]
}
```

## 🧪 Testing Manual

### **Prerrequisitos**
1. Usuario egresado logueado con JWT válido
2. Base de datos con estructura completa
3. Al menos una carrera y DNI válido configurados

### **Secuencia de Testing**
```bash
# 1. Obtener perfil inicial (debe crear perfil vacío si no existe)
GET /api/perfil/mi-perfil

# 2. Actualizar perfil
PUT /api/perfil/mi-perfil + datos

# 3. Agregar experiencia
POST /api/perfil/experiencia + datos

# 4. Agregar formación
POST /api/perfil/formacion + datos

# 5. Agregar curso
POST /api/perfil/curso + datos

# 6. Verificar perfil completo
GET /api/perfil/mi-perfil

# 7. Actualizar elementos
PUT /api/perfil/experiencia/1 + datos
PUT /api/perfil/formacion/1 + datos
PUT /api/perfil/curso/1 + datos

# 8. Eliminar elementos
DELETE /api/perfil/experiencia/1
DELETE /api/perfil/formacion/1
DELETE /api/perfil/curso/1
```

## 🔄 Base de Datos

### **Relaciones**
- `Usuario` → `Egresado` → `Perfil` (1:1:1)
- `Perfil` → `ExperienciaLaboral` (1:N)
- `Perfil` → `FormacionAcademica` (1:N)
- `Perfil` → `Curso` (1:N)

### **Auto-creación de Perfil**
Si un egresado no tiene perfil asociado, se crea automáticamente uno vacío en la primera consulta o actualización.

## 🎯 Criterios de Aceptación Cumplidos

- ✅ **Autenticación obligatoria** en todas las rutas
- ✅ **Solo propietario puede editar** sus datos
- ✅ **Validación de campos requeridos** y formatos
- ✅ **CRUD completo funcionando** para todos los elementos
- ✅ **Manejo apropiado de errores** (404, 401, 403, 500)
- ✅ **Respuestas JSON consistentes** con formato estándar
- ✅ **Controlador principal** en `/src/controllers/perfilController.js`
- ✅ **Código modularizado** en archivos separados
- ✅ **Documentación completa** en `backend/docs/`

## 🚀 Próximos Pasos

### **Mejoras Sugeridas**
1. **Upload de archivos** para CV y certificados
2. **Validación de URLs** con verificación real
3. **Soft delete** en lugar de eliminación completa
4. **Versioning** de cambios en el perfil
5. **Búsqueda y filtros** de perfiles públicos
6. **Exportación** de perfil a PDF
7. **Notificaciones** de cambios importantes

---

**Implementado por**: Equipo de Desarrollo  
**Issue**: #13 - Profile Management Backend  
**Fecha**: 30/Septiembre/2025  
**Estado**: ✅ Completado y Listo para Testing