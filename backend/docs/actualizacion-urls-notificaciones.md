# Actualización de URLs de Notificaciones

**Fecha:** 11 de febrero de 2026  
**Rama:** `feature/actualizar-urls-notificaciones`

## Resumen

Se actualizaron todas las URLs de notificaciones para redirigir a la página principal (`/`) en lugar del dashboard (`/dashboard`), ya que ambas funcionalidades se unificaron en el index.

## Cambios Realizados

### 1. Servicio de Notificaciones (`src/services/notificationService.js`)

Se actualizaron todas las funciones que generan URLs de notificaciones:

#### Función `notificarComentario()`
```javascript
// Antes
const urlDestino = `/dashboard?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;

// Después
const urlDestino = `/?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;
```

#### Función `notificarLike()`
```javascript
// Antes
const urlDestino = `/dashboard?publicacion=${publicacionId}`;

// Después
const urlDestino = `/?publicacion=${publicacionId}`;
```

#### Función `notificarMencion()`
```javascript
// Antes
const urlDestino = `/dashboard?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;

// Después
const urlDestino = `/?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;
```

#### Función `notificarLikeComentario()`
```javascript
// Antes
const urlDestino = `/dashboard?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;

// Después
const urlDestino = `/?publicacion=${publicacionId}${comentarioId ? `&comentario=${comentarioId}` : ''}`;
```

#### Función `notificarRespuesta()`
```javascript
// Antes
const urlDestino = `/dashboard?publicacion=${publicacionId}${respuestaId ? `&comentario=${respuestaId}` : ''}`;

// Después
const urlDestino = `/?publicacion=${publicacionId}${respuestaId ? `&comentario=${respuestaId}` : ''}`;
```

### 2. Scripts de Migración

#### `scripts/migrate-notificaciones-urls.js`
- Actualizado el comentario de documentación para reflejar las nuevas URLs
- Modificada la URL generada de `/dashboard?publicacion=X` a `/?publicacion=X`

#### `scripts/fix-notificaciones-comentarios.js`
- Actualizada la consulta SQL para buscar notificaciones con el nuevo formato
- Modificada la URL generada para incluir `/?` en lugar de `/dashboard?`

#### `scripts/actualizar-urls-notificaciones.js` (NUEVO)
- Script creado para actualizar todas las notificaciones existentes en la base de datos
- Convierte URLs antiguas (`/dashboard?publicacion=X`) a nuevas (`/?publicacion=X`)
- Detecta y actualiza automáticamente parámetros de publicación y comentario
- Proporciona estadísticas completas de la migración

## Impacto

### Notificaciones Nuevas
Todas las notificaciones generadas después de este cambio ya apuntarán automáticamente a `/?publicacion=X` en lugar de `/dashboard?publicacion=X`.

### Notificaciones Existentes
Se proporcionó un script de migración (`actualizar-urls-notificaciones.js`) para actualizar las notificaciones existentes en la base de datos.

## Ejecución del Script de Migración

```bash
cd backend
node scripts/actualizar-urls-notificaciones.js
```

El script:
- ✅ Actualiza todas las URLs de `/dashboard?` a `/?`
- ✅ Mantiene todos los parámetros (publicacion, comentario)
- ✅ Proporciona reporte detallado de cambios
- ✅ Es seguro ejecutar múltiples veces (idempotente)

## Archivos Modificados

- `src/services/notificationService.js` - 5 funciones actualizadas
- `scripts/migrate-notificaciones-urls.js` - Documentación y URLs actualizadas
- `scripts/fix-notificaciones-comentarios.js` - Consultas SQL actualizadas
- `scripts/actualizar-urls-notificaciones.js` - Script de migración nuevo

## Beneficios

1. **Consistencia:** Todas las notificaciones ahora redirigen a la página principal unificada
2. **Simplificación:** Se elimina la confusión entre dashboard e index
3. **Mantenibilidad:** Código centralizado y más fácil de mantener
4. **Experiencia de usuario:** Navegación más coherente y predecible
