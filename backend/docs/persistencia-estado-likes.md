# Persistencia de Estado de Likes en Publicaciones

## Fecha
11 de febrero de 2026

## Problema
Los likes en las publicaciones se guardaban correctamente en la base de datos, pero al recargar la página, los corazones no se mostraban en rojo para indicar que el usuario ya había dado like a esa publicación. El estado visual no persistía.

## Solución Implementada

### 1. Modificación del Controlador de Publicaciones
**Archivo:** `backend/src/controllers/publicacionesController.js`

Se agregó lógica para:
- Detectar si hay un usuario autenticado mediante el token JWT en el header
- Consultar la tabla `LikePublicacion` para obtener las publicaciones que el usuario ha marcado con like
- Agregar el campo `userLiked: true/false` a cada publicación en la respuesta

#### Implementación Técnica

```javascript
// Importar utilidades JWT
import { verifyToken, extractToken } from "../utils/jwt.js";

// En la función listarPublicaciones, después de obtener las publicaciones:
let likesMap = {};
try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (token && publicacionIds.length > 0) {
        const decoded = verifyToken(token);
        const usuarioId = decoded.id;
        
        // Query individual por cada publicación
        const promises = publicacionIds.map(async (pubId) => {
            const result = await client.execute({
                sql: 'SELECT publicacionId FROM LikePublicacion WHERE egresadoId = ? AND publicacionId = ?',
                args: [usuarioId, pubId]
            });
            if (result.rows.length > 0) {
                likesMap[pubId] = true;
            }
        });
        
        await Promise.all(promises);
    }
} catch (error) {
    // Si falla, continuamos sin marcar likes (no rompe la carga de publicaciones)
    likesMap = {};
}

// Al procesar cada publicación:
publicacion.userLiked = likesMap[publicacion.id] || false;
```

### 2. Manejo de Errores
La implementación usa un bloque `try-catch` robusto que garantiza:
- ✅ Si no hay token de autenticación → las publicaciones cargan normalmente
- ✅ Si el token es inválido → las publicaciones cargan sin estado de likes
- ✅ Si falla la query de likes → las publicaciones cargan sin estado de likes
- ✅ La ruta sigue siendo pública y accesible sin autenticación

### 3. Consideraciones Importantes

#### Nombre de Columnas en Base de Datos
**IMPORTANTE:** La tabla `LikePublicacion` usa `egresadoId`, no `usuarioId`:

```sql
CREATE TABLE LikePublicacion (
  egresadoId INTEGER NOT NULL,
  publicacionId INTEGER NOT NULL,
  PRIMARY KEY (egresadoId, publicacionId),
  FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);
```

#### Estrategia de Queries
Se optó por **queries individuales en paralelo** (`Promise.all`) en lugar de una sola query con `IN (...)` debido a problemas con placeholders dinámicos en algunas versiones de libSQL/Turso.

### 4. Respuesta de la API
La respuesta de `GET /api/publicaciones` ahora incluye:

```json
{
  "success": true,
  "data": {
    "publicaciones": [
      {
        "id": 11,
        "contenido": "...",
        "totalLikes": 2,
        "userLiked": true,  // ← Nuevo campo
        "autor": {...},
        "imagenes": [...]
      }
    ]
  }
}
```

## Archivos Modificados
- `backend/src/controllers/publicacionesController.js` - Lógica de likes del usuario
- `backend/src/routes/publicacionesRoutes.js` - Sin cambios (ruta sigue siendo pública)

## Testing
- ✅ Usuario autenticado ve corazones rojos en publicaciones con like
- ✅ Usuario no autenticado carga publicaciones normalmente
- ✅ Token inválido no rompe la carga de publicaciones
- ✅ Estado de like persiste tras recargar la página

## Impacto
- **Performance:** Mínimo - Solo agrega queries cuando hay usuario autenticado
- **Compatibilidad:** Total - Ruta pública sigue funcionando igual
- **UX:** Mejora significativa - Los usuarios ven su interacción persistida

## Próximas Mejoras Posibles
- [ ] Optimizar queries con una sola consulta con placeholders dinámicos (cuando se resuelvan problemas con Turso)
- [ ] Cachear estado de likes en el cliente para reducir queries
- [ ] Agregar índices en `LikePublicacion` si el volumen de datos crece
