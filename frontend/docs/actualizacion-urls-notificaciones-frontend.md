# Actualización de URLs de Notificaciones - Frontend

**Fecha:** 11 de febrero de 2026  
**Rama:** `feature/actualizar-urls-notificaciones`

## Resumen

Se simplificaron las URLs de redirección en los resultados de búsqueda, eliminando la distinción entre usuarios autenticados y no autenticados, ya que el dashboard se unificó con el index.

## Cambios Realizados

### 1. Página de Resultados de Búsqueda (`src/pages/busqueda/resultados.astro`)

#### Simplificación de Redirección de Publicaciones

**Antes:**
```javascript
// Determinar a dónde redirigir según autenticación
const token = getAuthToken();
const redirectUrl = token
    ? `/dashboard?publicacion=${id}`
    : `/?publicacion=${id}`;
```

**Después:**
```javascript
// Determinar a dónde redirigir
const token = getAuthToken();
const redirectUrl = `/?publicacion=${id}`;
```

**Cambios:**
- ✅ Se eliminó la lógica condicional basada en autenticación
- ✅ Todas las publicaciones ahora redirigen a `/?publicacion={id}`
- ✅ Simplificación del código (menos complejidad)

### 2. Documentación (`docs/busqueda-global-frontend.md`)

Se actualizó la documentación para reflejar el nuevo comportamiento:

**Antes:**
```markdown
#### Publicaciones clickeables
Las publicaciones ahora son totalmente clickeables y redirigen según el estado de autenticación:

**Usuario autenticado** → `/dashboard?publicacion={id}`
**Usuario NO autenticado** → `/?publicacion={id}`
```

**Después:**
```markdown
#### Publicaciones clickeables
Las publicaciones ahora son totalmente clickeables y redirigen a la página principal con la publicación específica:

**Todos los usuarios** → `/?publicacion={id}`
```

## Comportamiento del Sistema

### Notificaciones
Las notificaciones ahora usan el campo `urlDestino` que viene del backend, el cual ya fue actualizado para generar URLs con el formato `/?publicacion=X` en lugar de `/dashboard?publicacion=X`.

**Componente:** `src/components/Notificaciones.astro`
```javascript
// El componente usa directamente notif.urlDestino del backend
<a href={notif.urlDestino}>
```

### Búsqueda de Publicaciones
Cuando un usuario hace clic en una publicación desde los resultados de búsqueda:
- Se redirige a `/?publicacion={id}`
- La página principal detecta el parámetro y muestra la publicación específica
- Funciona igual para usuarios autenticados y no autenticados

## Archivos Modificados

- `src/pages/busqueda/resultados.astro` - Simplificación de lógica de redirección
- `docs/busqueda-global-frontend.md` - Actualización de documentación

## Impacto en la Experiencia de Usuario

### Antes
- Usuario autenticado → `/dashboard?publicacion=7`
- Usuario no autenticado → `/?publicacion=7`
- Inconsistencia en las URLs según autenticación

### Después
- Todos los usuarios → `/?publicacion=7`
- Experiencia consistente y predecible
- URLs más simples y limpias

## Beneficios

1. **Consistencia:** Misma URL para todos los usuarios
2. **Simplicidad:** Menos lógica condicional en el código
3. **Mantenibilidad:** Código más fácil de entender y mantener
4. **SEO:** URLs más limpias y consistentes
5. **Compartibilidad:** Las URLs son las mismas independientemente del estado de autenticación

## Compatibilidad

### URLs Antiguas
Las URLs antiguas con `/dashboard?publicacion=X` seguirán funcionando si existen en la base de datos gracias a que:
- El backend actualizó todas las URL en notificaciones existentes
- Se proporcionó un script de migración para actualizar la base de datos

### Navegación
- El componente de notificaciones usa `urlDestino` del backend
- No requiere cambios adicionales en el frontend
- Las nuevas notificaciones ya llevarán las URLs actualizadas
