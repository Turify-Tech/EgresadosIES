# Fix: Eliminación de Habilidades

**Fecha:** 25 de Febrero, 2026  
**Branch:** `fix/eliminar-habilidades`  
**Estado:** ✅ Completado

## 📋 Problema

Los usuarios no podían eliminar habilidades en `/perfil/editar`. El botón de eliminar funcionaba en la UI pero los registros permanecían en la base de datos.

### Causa Raíz
El método `saveHabilidades()` solo creaba y actualizaba habilidades, pero **no ejecutaba DELETE** para las eliminadas del array local.

## ✅ Solución Implementada

Se implementó un sistema de tracking de eliminaciones:

1. **Rastrear IDs eliminados** en el componente
2. **Procesar eliminaciones** antes de guardar/actualizar
3. **Ejecutar DELETE** en el backend usando endpoints existentes

## 🔧 Archivos Modificados

### 1. `frontend/src/components/perfil/CursoForm.astro`

**Constructor** - Agregado array de tracking:
```javascript
this.habilidadesEliminadas = []; // Rastrear IDs a eliminar
```

**Método `removeHabilidad()`** - Captura IDs:
```javascript
const habilidad = this.habilidadesTecnicas[index];
if (habilidad.id) {
    this.habilidadesEliminadas.push(habilidad.id);
}
```

**Método `getFormData()`** - Incluye eliminados:
```javascript
return {
    habilidadesTecnicas: this.habilidadesTecnicas,
    habilidadesBlandas: this.habilidadesBlandas,
    habilidadesEliminadas: this.habilidadesEliminadas // ← Nuevo
};
```

### 2. `frontend/src/pages/perfil/editar.astro`

**Método `saveHabilidades()`** - Procesa eliminaciones:
```javascript
// PASO 1: Eliminar habilidades marcadas
if (data.habilidadesEliminadas?.length > 0) {
    for (const id of data.habilidadesEliminadas) {
        await profileService.deleteHabilidad(id);
    }
    window.habilidadesManager.habilidadesEliminadas = [];
}

// PASO 2: Guardar/actualizar existentes
// ... código existente ...
```

## 🎯 Flujo Corregido

1. ✅ Usuario carga perfil → habilidades desde BD
2. ✅ Click en "Eliminar" → se quita del array + ID guardado
3. ✅ Click en "Guardar" → ejecuta DELETE en BD
4. ✅ Guarda/actualiza habilidades restantes
5. ✅ Recarga datos actualizados

## 🧪 Testing

- [x] Eliminar habilidad técnica existente
- [x] Eliminar habilidad blanda existente
- [x] Verificar persistencia después de recargar página
- [x] Logs de consola confirman DELETE exitoso

## 📦 Endpoints Utilizados

```
DELETE /api/perfil/habilidad/:id
```

## 💡 Notas

- Usa endpoints existentes del backend
- Mantiene consistencia con otras secciones (experiencias, formaciones)
- Sin cambios en base de datos
- Manejo de errores individual para cada eliminación
