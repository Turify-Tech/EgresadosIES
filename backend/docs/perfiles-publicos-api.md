# 👥 API de Perfiles Públicos - Documentación

## 📋 Descripción General

Esta API proporciona endpoints públicos para visualizar perfiles de egresados del IES sin necesidad de autenticación. Todos los datos sensibles como email, teléfono y DNI están excluidos para proteger la privacidad.

## 🚀 Endpoints Disponibles

### 1. Lista Paginada de Perfiles
```
GET /api/perfiles
```

**Descripción**: Obtiene una lista paginada de perfiles públicos de egresados.

**Parámetros de Query (opcionales)**:
- `page` (number): Número de página (default: 1)
- `limit` (number): Resultados por página (default: 10, máximo: 50)
- `carrera` (string): Filtrar por nombre exacto de carrera

**Ejemplo de Request**:
```
GET /api/perfiles?page=1&limit=5&carrera=Desarrollo%20Web
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "carrera": "Desarrollo Web",
      "resumenProfesional": "Desarrollador Full Stack con 3 años de experiencia...",
      "situacionLaboral": "Empleado",
      "urlPortfolio": "https://juanperez.dev",
      "urlFotoPerfil": "https://example.com/foto1.jpg",
      "urlBanner": "https://example.com/banner1.jpg",
      "experienciasLaborales": [
        {
          "id": 1,
          "puesto": "Desarrollador Senior",
          "empresa": "Tech Corp",
          "fechaInicio": "2023-01-15",
          "fechaFin": null,
          "descripcion": "Desarrollo de aplicaciones web con React y Node.js"
        }
      ],
      "formacionAcademica": [
        {
          "id": 1,
          "titulo": "Técnico Superior en Desarrollo Web",
          "institucion": "IES",
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
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 12,
    "limit": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Perfil Específico
```
GET /api/perfiles/:id
```

**Descripción**: Obtiene el perfil detallado de un egresado específico.

**Parámetros de URL**:
- `id` (number, requerido): ID del egresado

**Ejemplo de Request**:
```
GET /api/perfiles/1
```

**Ejemplo de Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    "carrera": "Desarrollo Web",
    "resumenProfesional": "Desarrollador Full Stack con 3 años de experiencia...",
    "situacionLaboral": "Empleado",
    "urlPortfolio": "https://juanperez.dev",
    "urlFotoPerfil": "https://example.com/foto1.jpg",
    "urlBanner": "https://example.com/banner1.jpg",
    "experienciasLaborales": [...],
    "formacionAcademica": [...],
    "cursos": [...]
  }
}
```

### 3. Lista de Carreras
```
GET /api/carreras
```

**Descripción**: Obtiene la lista completa de carreras disponibles en el IES.

**Ejemplo de Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Desarrollo Web"
    },
    {
      "id": 2,
      "nombre": "Diseño Gráfico"
    },
    {
      "id": 3,
      "nombre": "Marketing Digital"
    }
  ]
}
```

## 🛡️ Seguridad y Privacidad

### Datos Excluidos
Por seguridad y privacidad, los siguientes datos **NO** están disponibles en la API pública:
- Email del egresado
- Número de teléfono
- DNI
- Contraseña (obviamente)
- Cualquier información personal identificable sensible

### Datos Incluidos
- Nombre completo
- Carrera
- Información profesional pública (resumen, situación laboral)
- Portfolio y URLs públicas
- Experiencias laborales (sin datos de contacto)
- Formación académica
- Cursos realizados

## 📊 Paginación

### Parámetros
- **page**: Número de página (mínimo: 1)
- **limit**: Resultados por página (mínimo: 1, máximo: 50)

### Metadata de Respuesta
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 42,
    "limit": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🔍 Filtros

### Por Carrera
Para filtrar perfiles por carrera, usa el parámetro `carrera` con el nombre exacto:
```
GET /api/perfiles?carrera=Desarrollo%20Web
```

## ❌ Manejo de Errores

### Errores Comunes

**Perfil no encontrado (404)**:
```json
{
  "success": false,
  "message": "Perfil no encontrado"
}
```

**ID inválido (400)**:
```json
{
  "success": false,
  "message": "ID de perfil inválido"
}
```

**Error del servidor (500)**:
```json
{
  "success": false,
  "message": "Error interno del servidor al obtener perfiles"
}
```

## 🧪 Testing

### Endpoints para Testing
1. **Lista de perfiles**: `GET http://localhost:3000/api/perfiles`
2. **Perfil específico**: `GET http://localhost:3000/api/perfiles/1`
3. **Lista de carreras**: `GET http://localhost:3000/api/carreras`

### Ejemplos con cURL

```bash
# Obtener primera página de perfiles
curl -X GET "http://localhost:3000/api/perfiles?page=1&limit=5"

# Obtener perfiles de una carrera específica
curl -X GET "http://localhost:3000/api/perfiles?carrera=Desarrollo%20Web"

# Obtener perfil específico
curl -X GET "http://localhost:3000/api/perfiles/1"

# Obtener carreras
curl -X GET "http://localhost:3000/api/carreras"
```

## 🔄 Estados de la Aplicación

### Sin Perfiles
Si no hay perfiles en la base de datos:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalRecords": 0,
    "limit": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Perfiles sin Datos Adicionales
Si un egresado no tiene experiencias, formación o cursos:
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "carrera": "Desarrollo Web",
  "resumenProfesional": null,
  "situacionLaboral": null,
  "urlPortfolio": null,
  "urlFotoPerfil": null,
  "urlBanner": null,
  "experienciasLaborales": [],
  "formacionAcademica": [],
  "cursos": []
}
```

## 📈 Performance

### Optimizaciones Implementadas
- **Paginación**: Evita cargar todos los registros
- **Límite de resultados**: Máximo 50 por página
- **Consultas optimizadas**: JOINs eficientes con índices
- **Datos mínimos**: Solo información necesaria

### Recomendaciones de Uso
- Usa paginación para listas grandes
- Implementa caché en el frontend para perfiles visitados
- Considera implementar búsqueda por texto en el futuro

---

**Notas Técnicas**:
- Todos los endpoints son públicos (no requieren autenticación)
- Respuestas siempre en formato JSON
- Soporte para CORS configurado
- Rate limiting podría implementarse en el futuro