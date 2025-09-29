# Documentación API - Sistema de Gestión de Egresados IES

API REST para el Sistema de Gestión de Egresados del Instituto de Educación Superior.

## 📋 Información General

- **Base URL:** `http://localhost:3000/api` (desarrollo)
- **Versión:** 1.0.0
- **Autenticación:** JWT Bearer Token
- **Formato:** JSON
- **Rate Limiting:** 100 requests por 15 minutos

## 🔐 Autenticación

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Tipos de Usuario

- `egresado` - Usuarios graduados del IES
- `administrador` - Administradores del sistema

## 📊 Endpoints

### 🏥 Sistema

#### Health Check

```http
GET /api/health
```

Verifica el estado del servidor.

**Respuesta:**
```json
{
  "status": "OK",
  "message": "Sistema de Gestión de Egresados IES - API funcionando",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 🔑 Autenticación

#### Login

```http
POST /api/auth/login
```

Autentica un usuario (egresado o administrador).

**Body:**
```json
{
  "email": "usuario@ies.edu.ar",
  "password": "password123",
  "userType": "egresado" // o "administrador"
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@ies.edu.ar",
      "tipo_usuario": "egresado"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errores:**
- `400` - Datos inválidos
- `401` - Credenciales incorrectas
- `404` - Usuario no encontrado

#### Logout

```http
POST /api/auth/logout
```

Cierra la sesión del usuario actual.

**Headers:** Authorization requerido

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

#### Verificar Token

```http
GET /api/auth/verify
```

Verifica si el token JWT es válido.

**Headers:** Authorization requerido

**Respuesta (200):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ies.edu.ar",
    "tipo_usuario": "egresado"
  }
}
```

#### Refrescar Token

```http
POST /api/auth/refresh
```

Genera un nuevo token JWT usando el refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Reset Password

```http
POST /api/auth/reset-password
```

Solicita reset de contraseña.

**Body:**
```json
{
  "email": "usuario@ies.edu.ar"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Se ha enviado un email con las instrucciones"
}
```

### 👤 Perfil

#### Obtener Mi Perfil

```http
GET /api/profile/me
```

Obtiene el perfil del usuario autenticado.

**Headers:** Authorization requerido

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "email": "juan@ies.edu.ar",
    "telefono": "+5491234567890",
    "fechaNacimiento": "1995-05-15",
    "direccion": "Av. Corrientes 1234, CABA",
    "carrera": "Desarrollo de Software",
    "anioEgreso": 2020,
    "cv_url": "/uploads/cv/123.pdf",
    "estado": "completo",
    "experienciaLaboral": [
      {
        "id": 1,
        "puesto": "Desarrollador Full Stack",
        "empresa": "Tech Company",
        "fechaInicio": "2020-06-01",
        "fechaFin": null,
        "descripcion": "Desarrollo de aplicaciones web"
      }
    ],
    "formacionAcademica": [
      {
        "id": 1,
        "titulo": "Tecnicatura en Desarrollo de Software",
        "institucion": "Instituto de Educación Superior",
        "anioFinalizacion": 2020
      }
    ],
    "cursos": [
      {
        "id": 1,
        "nombre": "React Avanzado",
        "institucion": "Online Academy",
        "horasDuracion": 40
      }
    ]
  }
}
```

#### Obtener Perfil por ID

```http
GET /api/profile/{id}
```

Obtiene el perfil de un usuario específico.

**Parámetros:**
- `id` (path) - ID del usuario

**Headers:** Authorization requerido

**Respuesta:** Similar a "Obtener Mi Perfil"

#### Actualizar Perfil

```http
PUT /api/profile/{id}
```

Actualiza los datos del perfil.

**Parámetros:**
- `id` (path) - ID del perfil a actualizar

**Headers:** Authorization requerido

**Body:**
```json
{
  "nombre": "Juan Carlos Pérez",
  "telefono": "+5491234567890",
  "fechaNacimiento": "1995-05-15",
  "direccion": "Nueva dirección 456",
  "experienciaLaboral": [
    {
      "puesto": "Senior Developer",
      "empresa": "New Company",
      "fechaInicio": "2023-01-01",
      "fechaFin": null,
      "descripcion": "Desarrollo de aplicaciones enterprise"
    }
  ],
  "formacionAcademica": [
    {
      "titulo": "Tecnicatura en Desarrollo de Software",
      "institucion": "Instituto de Educación Superior",
      "anioFinalizacion": 2020
    }
  ],
  "cursos": [
    {
      "nombre": "React Avanzado",
      "institucion": "Online Academy", 
      "horasDuracion": 40
    }
  ]
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado correctamente",
  "data": {
    // Datos actualizados del perfil
  }
}
```

#### Completar Perfil (Wizard)

```http
POST /api/profile/complete
```

Completa el perfil inicial del egresado.

**Headers:** Authorization requerido

**Body:** Similar a "Actualizar Perfil"

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Perfil completado exitosamente",
  "data": {
    // Datos del perfil completado
  }
}
```

#### Subir CV

```http
POST /api/profile/upload-cv
```

Sube el archivo CV del usuario.

**Headers:** 
- Authorization requerido
- Content-Type: multipart/form-data

**Body (FormData):**
- `cv` (file) - Archivo PDF del CV (máximo 10MB)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "CV subido correctamente",
  "data": {
    "cv_url": "/uploads/cv/123.pdf",
    "file_size": 1048576,
    "uploaded_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Descargar CV

```http
GET /api/profile/{id}/cv
```

Descarga el CV de un usuario.

**Parámetros:**
- `id` (path) - ID del usuario

**Headers:** Authorization requerido

**Respuesta:** Archivo PDF del CV

### 👥 Usuarios (Solo Administradores)

#### Listar Usuarios

```http
GET /api/users
```

Lista todos los usuarios del sistema.

**Headers:** Authorization requerido (administrador)

**Query Parameters:**
- `page` (optional) - Número de página (default: 1)
- `limit` (optional) - Elementos por página (default: 20, max: 100)
- `search` (optional) - Buscar por nombre o email
- `type` (optional) - Filtrar por tipo (egresado/administrador)
- `status` (optional) - Filtrar por estado (activo/inactivo)

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "nombre": "Juan Pérez",
        "email": "juan@ies.edu.ar",
        "tipo_usuario": "egresado",
        "activo": true,
        "fecha_creacion": "2024-01-01T00:00:00.000Z",
        "ultimo_acceso": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_users": 100,
      "per_page": 20
    }
  }
}
```

#### Crear Usuario

```http
POST /api/users
```

Crea un nuevo usuario.

**Headers:** Authorization requerido (administrador)

**Body:**
```json
{
  "nombre": "María García",
  "email": "maria@ies.edu.ar",
  "dni": "12345678",
  "tipo_usuario": "egresado",
  "carrera": "Desarrollo de Software",
  "anio_egreso": 2023,
  "password": "temporal123"
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 25,
    "nombre": "María García",
    "email": "maria@ies.edu.ar",
    "tipo_usuario": "egresado"
  }
}
```

#### Activar/Desactivar Usuario

```http
PATCH /api/users/{id}/status
```

Cambia el estado activo/inactivo de un usuario.

**Parámetros:**
- `id` (path) - ID del usuario

**Headers:** Authorization requerido (administrador)

**Body:**
```json
{
  "active": false
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Estado del usuario actualizado",
  "data": {
    "id": 25,
    "active": false
  }
}
```

#### Eliminar Usuario

```http
DELETE /api/users/{id}
```

Elimina un usuario del sistema.

**Parámetros:**
- `id` (path) - ID del usuario

**Headers:** Authorization requerido (administrador)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

### 📊 Estadísticas (Solo Administradores)

#### Estadísticas Generales

```http
GET /api/stats/general
```

Obtiene estadísticas generales del sistema.

**Headers:** Authorization requerido (administrador)

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "total_egresados": 150,
    "egresados_activos": 142,
    "perfiles_completos": 138,
    "cvs_subidos": 120,
    "registros_ultimo_mes": 8,
    "carreras": [
      {
        "nombre": "Desarrollo de Software",
        "total_egresados": 75
      },
      {
        "nombre": "Diseño Gráfico",
        "total_egresados": 45
      }
    ],
    "egresados_por_año": [
      {
        "año": 2024,
        "cantidad": 25
      },
      {
        "año": 2023,
        "cantidad": 30
      }
    ]
  }
}
```

#### Estadísticas de Egresados

```http
GET /api/stats/graduates
```

Obtiene estadísticas detalladas de egresados.

**Headers:** Authorization requerido (administrador)

**Query Parameters:**
- `year` (optional) - Filtrar por año de egreso
- `career` (optional) - Filtrar por carrera
- `employment_status` (optional) - Filtrar por estado laboral

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "empleabilidad": {
      "empleados": 85,
      "desempleados": 12,
      "no_especificado": 53
    },
    "sectores_laborales": [
      {
        "sector": "Tecnología",
        "cantidad": 45
      },
      {
        "sector": "Educación",
        "cantidad": 20
      }
    ],
    "salarios_promedio": {
      "junior": 150000,
      "semi_senior": 250000,
      "senior": 400000
    },
    "ubicacion_geografica": [
      {
        "provincia": "Buenos Aires",
        "cantidad": 90
      },
      {
        "provincia": "Córdoba",
        "cantidad": 35
      }
    ]
  }
}
```

#### Generar Reporte

```http
GET /api/stats/reports/{type}
```

Genera reportes específicos en formato PDF o Excel.

**Parámetros:**
- `type` (path) - Tipo de reporte (employment, graduates, careers)

**Headers:** Authorization requerido (administrador)

**Query Parameters:**
- `format` (optional) - Formato del reporte (pdf/excel, default: pdf)
- `year` (optional) - Año para filtrar
- `career` (optional) - Carrera para filtrar

**Respuesta:** Archivo PDF o Excel del reporte

## 🔒 Códigos de Error

### Códigos HTTP

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

### Formato de Error

```json
{
  "success": false,
  "message": "Mensaje descriptivo del error",
  "errors": [
    {
      "field": "email",
      "message": "El email ya está registrado"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Códigos de Error Personalizados

- `VALIDATION_ERROR` - Error de validación de datos
- `AUTH_ERROR` - Error de autenticación
- `PERMISSION_ERROR` - Error de permisos
- `NOT_FOUND` - Recurso no encontrado
- `DUPLICATE_ENTRY` - Entrada duplicada
- `FILE_TOO_LARGE` - Archivo demasiado grande
- `INVALID_FILE_TYPE` - Tipo de archivo inválido

## 📝 Ejemplos de Uso

### Autenticación Completa

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@ies.edu.ar',
    password: 'password123',
    userType: 'egresado'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Usar token en requests
const profileResponse = await fetch('/api/profile/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const profile = await profileResponse.json();
```

### Subir CV

```javascript
const formData = new FormData();
formData.append('cv', fileInput.files[0]);

const response = await fetch('/api/profile/upload-cv', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Paginación

```javascript
const response = await fetch('/api/users?page=2&limit=10&search=juan', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔄 Rate Limiting

- **Límite:** 100 requests por 15 minutos por IP
- **Headers de respuesta:**
  - `X-RateLimit-Limit` - Límite total
  - `X-RateLimit-Remaining` - Requests restantes
  - `X-RateLimit-Reset` - Timestamp de reset

## 🛡️ Seguridad

### Validaciones

- Todos los inputs son validados y sanitizados
- Protección contra inyección SQL
- Validación de tipos de archivo permitidos
- Límites de tamaño de archivo

### Headers de Seguridad

- `helmet` - Configuraciones de seguridad
- `CORS` - Control de acceso de origen cruzado
- `Rate Limiting` - Protección contra ataques de fuerza bruta

### Tokens JWT

- **Expiración:** 24 horas (configurable)
- **Refresh Token:** 7 días (configurable)
- **Algoritmo:** HS256
- **Secreto:** Variable de entorno

## 📞 Soporte

Para dudas sobre la API:
- **Documentación completa:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/Turify-Tech/EgresadosIES/issues)
- **Email:** soporte@ies.edu.ar