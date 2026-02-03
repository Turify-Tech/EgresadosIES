# Búsqueda Global Simplificada

## Descripción General
Se simplificó el sistema de búsqueda global para enfocarse únicamente en personas y publicaciones, eliminando las categorías de carreras y tecnologías que no aportaban valor significativo a la experiencia de usuario.

## Cambios Realizados

### 1. Controller - busquedaController.js

#### Eliminación de búsquedas de carreras y tecnologías
- Se removieron las funciones `buscarCarreras()` y `buscarTecnologias()`
- El endpoint `/api/buscar/global` ahora solo retorna:
  - `personas`: Egresados que coinciden con el término de búsqueda
  - `publicaciones`: Publicaciones que coinciden con el término de búsqueda

#### Fix en query de publicaciones
Se corrigió el JOIN para obtener correctamente la foto de perfil del autor:

**Antes:**
```sql
LEFT JOIN Perfil p ON e.id = p.id
```

**Después:**
```sql
LEFT JOIN Perfil p ON e.perfilId = p.id
```

Este cambio corrige la relación entre Egresado y Perfil, permitiendo que las fotos de perfil se muestren correctamente en los resultados de búsqueda.

### 2. Routes - busquedaRoutes.js

No se realizaron cambios en las rutas, ya que el endpoint `/api/buscar/global` mantiene la misma interfaz pero con una respuesta simplificada.

## Estructura de Respuesta

### Endpoint: GET /api/buscar/global?query={término}

**Respuesta:**
```json
{
  "success": true,
  "query": "término de búsqueda",
  "resultados": {
    "personas": [
      {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "carrera": "Desarrollo de Software",
        "situacionLaboral": "Empleado",
        "urlFotoPerfil": "https://...",
        "tituloprofesional": "Desarrollador Full Stack"
      }
    ],
    "publicaciones": [
      {
        "id": 7,
        "contenido": "Contenido de la publicación",
        "fechaCreacion": "2024-11-03T...",
        "autorId": 1,
        "nombreCompleto": "Juan Pérez",
        "urlFotoPerfil": "https://...",
        "totalLikes": 5,
        "totalComentarios": 2,
        "imagenes": "url1||url2||url3"
      }
    ]
  }
}
```

## Beneficios

1. **Simplicidad**: Interfaz más limpia y enfocada en contenido relevante
2. **Performance**: Menos queries a la base de datos
3. **UX mejorada**: Los usuarios encuentran rápidamente lo que buscan sin categorías irrelevantes
4. **Mantenibilidad**: Menos código que mantener y testear

## Acceso Público

El endpoint de búsqueda global es completamente público y no requiere autenticación, permitiendo que visitantes exploren el contenido de la plataforma.

## Notas Técnicas

- Las imágenes de publicaciones se retornan como string concatenado con separador `||`
- El frontend debe separar este string para renderizar múltiples imágenes
- La columna correcta en la tabla ImagenPublicacion es `url`, no `urlImagen`
