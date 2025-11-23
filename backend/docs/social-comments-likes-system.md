# 💬❤️ Sistema de Comentarios y Likes - Documentación

## 📋 Resumen

Sistema completo de interacción social para publicaciones en la plataforma EgresadosIES, permitiendo a los egresados comentar y dar "me gusta" a las publicaciones de otros usuarios.

## ✅ Funcionalidades Implementadas

### 🎯 Endpoints de Comentarios

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/comentarios` | POST | Crear nuevo comentario | Egresado |
| `/api/comentarios/publicacion/:publicacionId` | GET | Obtener comentarios de una publicación | Público |
| `/api/comentarios/:id` | PUT | Editar comentario propio | Egresado |
| `/api/comentarios/:id` | DELETE | Eliminar comentario propio | Egresado |

### 🎯 Endpoints de Likes

| Endpoint | Método | Descripción | Autenticación |
|----------|--------|-------------|---------------|
| `/api/likes/toggle/:publicacionId` | POST | Dar/quitar like a publicación | Egresado |
| `/api/likes/publicacion/:publicacionId` | GET | Contar likes de publicación | Público |
| `/api/likes/mi-estado/:publicacionId` | GET | Verificar estado de like del usuario | Egresado |

### 🔐 Seguridad y Validaciones

#### Comentarios
- ✅ **Autenticación JWT obligatoria** - Solo para crear, editar y eliminar
- ✅ **Autorización por rol** - Solo egresados pueden comentar
- ✅ **Validación de propiedad** - Solo el autor puede editar/eliminar su comentario
- ✅ **Validación de contenido** - Máximo 500 caracteres
- ✅ **Verificación de publicación** - La publicación debe existir
- ✅ **Indicador de edición** - Campo `fueEditado` se marca automáticamente

#### Likes
- ✅ **Autenticación JWT obligatoria** - Solo usuarios autenticados
- ✅ **Autorización por rol** - Solo egresados pueden dar like
- ✅ **Toggle inteligente** - Mismo endpoint para dar/quitar like
- ✅ **Prevención de duplicados** - Un usuario solo puede dar un like por publicación
- ✅ **Contadores automáticos** - Se actualizan al dar/quitar like

### 📊 Características Técnicas

#### Comentarios
- ✅ **Paginación configurable** - Default 50, máximo 100 comentarios por página
- ✅ **Ordenamiento por fecha** - Comentarios más recientes primero
- ✅ **Datos del autor incluidos** - Nombre, apellido e imagen de perfil
- ✅ **Timestamp de creación** - Fecha y hora del comentario
- ✅ **Estado de edición** - Indica si el comentario fue modificado
- ✅ **Manejo de BigInt** - Conversión correcta para respuestas JSON

#### Likes
- ✅ **Sistema de toggle** - Un solo endpoint para dar/quitar
- ✅ **Contadores en tiempo real** - Total actualizado en cada operación
- ✅ **Estado del usuario** - Verificar si ya dio like
- ✅ **Restricción única** - Clave primaria compuesta (egresadoId, publicacionId)

## 📁 Archivos del Sistema

### Archivos de Producción
- `src/controllers/comentariosController.js` - Controlador de comentarios
- `src/controllers/likesController.js` - Controlador de likes
- `src/routes/comentariosRoutes.js` - Definición de rutas de comentarios
- `src/routes/likesRoutes.js` - Definición de rutas de likes
- `src/app.js` - Integración en aplicación principal (actualizado)

## 🚀 Uso del Sistema

### 📝 Comentarios

#### Crear Comentario
```http
POST /api/comentarios
Authorization: Bearer <token_egresado>
Content-Type: application/json

{
  "contenido": "¡Excelente publicación! Me identifico mucho con esto.",
  "publicacionId": 1
}
```

**Respuesta exitosa (201)**:
```json
{
  "success": true,
  "message": "Comentario creado exitosamente",
  "data": {
    "id": 1,
    "contenido": "¡Excelente publicación! Me identifico mucho con esto.",
    "fechaCreacion": "2025-11-19T15:30:00.000Z",
    "fueEditado": false,
    "autor": {
      "id": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "imagenPerfil": "https://imagekit.io/..."
    },
    "publicacionId": 1
  }
}
```

#### Obtener Comentarios de una Publicación
```http
GET /api/comentarios/publicacion/1?page=1&limit=20
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "contenido": "¡Excelente publicación!",
      "fechaCreacion": "2025-11-19T15:30:00.000Z",
      "fueEditado": false,
      "autor": {
        "id": 5,
        "nombre": "Juan",
        "apellido": "Pérez",
        "imagenPerfil": "https://imagekit.io/..."
      },
      "publicacionId": 1
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 3,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

#### Editar Comentario Propio
```http
PUT /api/comentarios/1
Authorization: Bearer <token_egresado>
Content-Type: application/json

{
  "contenido": "¡Excelente publicación! Me identifico mucho con esto. EDITADO"
}
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "message": "Comentario actualizado exitosamente",
  "data": {
    "id": 1,
    "contenido": "¡Excelente publicación! Me identifico mucho con esto. EDITADO",
    "fechaCreacion": "2025-11-19T15:30:00.000Z",
    "fueEditado": true,
    "autor": {
      "id": 5,
      "nombre": "Juan",
      "apellido": "Pérez",
      "imagenPerfil": "https://imagekit.io/..."
    },
    "publicacionId": 1
  }
}
```

#### Eliminar Comentario Propio
```http
DELETE /api/comentarios/1
Authorization: Bearer <token_egresado>
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "message": "Comentario eliminado exitosamente"
}
```

### ❤️ Likes

#### Dar/Quitar Like (Toggle)
```http
POST /api/likes/toggle/1
Authorization: Bearer <token_egresado>
```

**Respuesta exitosa - Like agregado (200)**:
```json
{
  "success": true,
  "message": "Like agregado exitosamente",
  "data": {
    "publicacionId": 1,
    "liked": true,
    "totalLikes": 15
  }
}
```

**Respuesta exitosa - Like removido (200)**:
```json
{
  "success": true,
  "message": "Like removido exitosamente",
  "data": {
    "publicacionId": 1,
    "liked": false,
    "totalLikes": 14
  }
}
```

#### Contar Likes de una Publicación
```http
GET /api/likes/publicacion/1
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "publicacionId": 1,
    "totalLikes": 14
  }
}
```

#### Verificar Estado de Like del Usuario
```http
GET /api/likes/mi-estado/1
Authorization: Bearer <token_egresado>
```

**Respuesta exitosa (200)**:
```json
{
  "success": true,
  "data": {
    "publicacionId": 1,
    "liked": true
  }
}
```

## ⚠️ Manejo de Errores

### Comentarios

#### Error 400 - Contenido vacío
```json
{
  "success": false,
  "message": "El contenido es obligatorio"
}
```

#### Error 400 - Contenido muy largo
```json
{
  "success": false,
  "message": "El comentario no puede exceder 500 caracteres"
}
```

#### Error 403 - Sin permisos
```json
{
  "success": false,
  "message": "No tienes permiso para editar este comentario"
}
```

#### Error 404 - Comentario no existe
```json
{
  "success": false,
  "message": "El comentario no existe"
}
```

#### Error 404 - Publicación no existe
```json
{
  "success": false,
  "message": "La publicación no existe"
}
```

### Likes

#### Error 404 - Publicación no existe
```json
{
  "success": false,
  "message": "La publicación no existe"
}
```

#### Error 401 - No autenticado
```json
{
  "success": false,
  "message": "Token no proporcionado"
}
```

## 🗄️ Estructura de Base de Datos

### Tabla Comentario
```sql
CREATE TABLE Comentario (
  id INTEGER PRIMARY KEY,
  contenido TEXT NOT NULL,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fueEditado BOOLEAN NOT NULL DEFAULT 0,
  autorId INTEGER NOT NULL,
  publicacionId INTEGER NOT NULL,
  FOREIGN KEY (autorId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);
```

### Tabla LikePublicacion
```sql
CREATE TABLE LikePublicacion (
  egresadoId INTEGER NOT NULL,
  publicacionId INTEGER NOT NULL,
  PRIMARY KEY (egresadoId, publicacionId),
  FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);
```

## 📊 Límites de Seguridad

### Comentarios
- **Contenido máximo**: 500 caracteres
- **Paginación por defecto**: 50 comentarios
- **Paginación máxima**: 100 comentarios por página

### Likes
- **Un like por usuario por publicación**: Clave primaria compuesta
- **Toggle automático**: No requiere verificación manual

## 🔄 Flujo de Trabajo Recomendado

### Crear Publicación con Interacciones
1. Usuario autenticado crea publicación
2. Otros usuarios pueden dar like inmediatamente
3. Otros usuarios pueden comentar
4. El autor del comentario puede editar/eliminar su propio comentario
5. Cualquier usuario puede quitar su like cuando quiera

### Visualización de Feed
1. Obtener publicaciones con `/api/publicaciones`
2. Para cada publicación, obtener:
   - Contador de likes: `GET /api/likes/publicacion/:id`
   - Estado de like del usuario: `GET /api/likes/mi-estado/:id`
   - Comentarios: `GET /api/comentarios/publicacion/:id`

## 🎯 Casos de Uso Cubiertos

### ✅ Comentarios
- [x] Solo egresados pueden comentar
- [x] Comentarios ordenados por fecha (más recientes primero)
- [x] Edición de comentarios marca como editado
- [x] Solo el autor puede editar/eliminar su comentario
- [x] Validación de longitud de contenido
- [x] Paginación para comentarios largos
- [x] Incluye datos completos del autor

### ✅ Likes
- [x] Solo egresados pueden dar like
- [x] Toggle funciona correctamente (dar/quitar)
- [x] No se pueden likes duplicados
- [x] Contadores se actualizan automáticamente
- [x] Endpoint público para contar likes
- [x] Endpoint privado para verificar estado del usuario

## 🚀 Integración con Frontend

### Ejemplo: Componente de Comentarios
```javascript
// Obtener comentarios
const response = await fetch(`/api/comentarios/publicacion/${publicacionId}?page=1&limit=10`);
const { data: comentarios, pagination } = await response.json();

// Crear comentario
const nuevoComentario = await fetch('/api/comentarios', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contenido: 'Mi comentario',
    publicacionId: 1
  })
});

// Editar comentario
const editado = await fetch(`/api/comentarios/${comentarioId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contenido: 'Comentario editado'
  })
});
```

### Ejemplo: Componente de Likes
```javascript
// Toggle like
const toggleResponse = await fetch(`/api/likes/toggle/${publicacionId}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data } = await toggleResponse.json();
// data.liked = true/false
// data.totalLikes = número actual

// Verificar estado
const estadoResponse = await fetch(`/api/likes/mi-estado/${publicacionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { data: estado } = await estadoResponse.json();
// estado.liked = true/false
```

## 📈 Próximas Mejoras Sugeridas

- [ ] Notificaciones en tiempo real para nuevos comentarios
- [ ] Respuestas a comentarios (threading)
- [ ] Reacciones múltiples (no solo like)
- [ ] Búsqueda de comentarios
- [ ] Ordenamiento de comentarios (relevancia, fecha)
- [ ] Mención de usuarios en comentarios
- [ ] Moderación de comentarios
- [ ] Reportar comentarios inapropiados

## 📞 Soporte

Para reportar problemas o sugerir mejoras, contactar al equipo de desarrollo de EgresadosIES.

---

**Última actualización**: 19 de noviembre de 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
