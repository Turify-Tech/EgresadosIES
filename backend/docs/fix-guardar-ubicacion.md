# Fix Backend: Campo `ciudad` No Incluido en Respuesta

## Problema Identificado

El endpoint `GET /api/perfil/me` (método `getMiPerfil()` en perfilController.js) tenía una inconsistencia crítica:

- ✅ La query SQL **SÍ incluía** el campo `ciudad` en el SELECT
- ❌ El objeto JSON de respuesta **NO incluía** el campo `ciudad`

### Síntomas

- El frontend enviaba el campo `ciudad` al guardar → ✅ Se guardaba correctamente en BD
- El frontend solicitaba el perfil → ❌ No recibía el campo `ciudad`
- Resultado: El formulario aparecía vacío aunque el dato existía en la base de datos

### Logs de Depuración del Frontend

```javascript
🌍 [DEBUG] perfil.ciudad: undefined
🌍 [DEBUG] Tipo de perfil.ciudad: undefined
✏️ Campo ubicacion - Anterior: "" → Nuevo: "" (input: undefined)
```

## Causa Raíz

**Archivo**: `backend/src/controllers/perfilController.js`  
**Método**: `getMiPerfil()`

### Código Problemático

```javascript
// ✅ Query SQL incluye ciudad (LÍNEA 35)
const perfilQuery = `
    SELECT 
        u.id as userId,
        u.nombre,
        u.apellido,
        u.email,
        e.dni,
        e.telefono,
        p.id as perfilId,
        p.resumenProfesional,
        p.urlPortfolio,
        p.situacionLaboral,
        p.urlFotoPerfil,
        p.urlBanner,
        p.fechaNacimiento,
        p.direccion,
        p.ciudad,          // ✅ Campo incluido en SELECT
        p.provincia,
        p.pais,
        c.id as carreraId,
        c.nombre as carreraNombre
    FROM Usuario u
    INNER JOIN Egresado e ON u.id = e.id
    LEFT JOIN Perfil p ON e.perfilId = p.id
    LEFT JOIN Carrera c ON e.carreraId = c.id
    WHERE u.id = ?
`;

// ... más código ...

// ❌ Objeto de respuesta NO incluye ciudad (LÍNEA 169)
perfil: {
    id: perfilId,
    resumenProfesional: perfil.resumenProfesional,
    urlPortfolio: perfil.urlPortfolio,
    situacionLaboral: perfil.situacionLaboral,
    urlFotoPerfil: perfil.urlFotoPerfil,
    urlBanner: perfil.urlBanner,
    // ❌ FALTA: ciudad, provincia, pais, fechaNacimiento, direccion
}
```

**Problema**: La query SQL lee el campo `ciudad` de la base de datos, pero al construir el objeto de respuesta JSON, este campo se omite.

## Solución Implementada

### Cambio en `getMiPerfil()`

**Línea**: ~173  
**Archivo**: `backend/src/controllers/perfilController.js`

```javascript
// ✅ DESPUÉS - Campo ciudad agregado
perfil: {
    id: perfilId,
    resumenProfesional: perfil.resumenProfesional,
    urlPortfolio: perfil.urlPortfolio,
    situacionLaboral: perfil.situacionLaboral,
    ciudad: perfil.ciudad, // ✅ AGREGADO
    urlFotoPerfil: perfil.urlFotoPerfil,
    urlBanner: perfil.urlBanner,
}
```

### Impacto

- El campo `ciudad` ahora se incluye en la respuesta JSON
- El frontend puede acceder a `response.data.perfil.ciudad`
- El formulario en `/perfil/editar` se puebla correctamente con la ubicación guardada
- Consistencia entre la query SQL y el objeto de respuesta

## Estructura de Respuesta (Después del Fix)

```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 14,
      "nombre": "Ana Paula",
      "apellido": "Toledo",
      "email": "anapaulatoledo2003@gmail.com",
      "dni": "45141972",
      "telefono": "2604553966"
    },
    "carrera": {
      "id": 1,
      "nombre": "Desarrollo de Software"
    },
    "perfil": {
      "id": 16,
      "resumenProfesional": "...",
      "urlPortfolio": "",
      "situacionLaboral": "Freelance",
      "ciudad": "Montevideo", // ✅ Campo ahora incluido
      "urlFotoPerfil": "...",
      "urlBanner": null
    },
    "experienciasLaborales": [...],
    "formacionAcademica": [...],
    "cursos": [...],
    "habilidades": [...],
    "proyectos": [...]
  }
}
```

## Archivos Modificados

- ✅ `backend/src/controllers/perfilController.js`
  - Método: `getMiPerfil()` (línea ~173)
  - Cambio: Agregado campo `ciudad` al objeto perfil en respuesta

## Testing

### Verificación Manual

1. **Guardar ubicación**: 
   ```bash
   POST /api/perfil
   Body: { ciudad: "Montevideo" }
   Response: 200 OK
   ```

2. **Obtener perfil**:
   ```bash
   GET /api/perfil/me
   Response: {
     "perfil": {
       "ciudad": "Montevideo",  // ✅ Campo presente
       ...
     }
   }
   ```

3. **Frontend**:
   - Campo `ubicacion` se puebla correctamente
   - Valor persiste visualmente después de guardar
   - Usuario puede modificar y volver a guardar

## Campos Relacionados

**Nota**: Los siguientes campos también están en la query SQL pero no se incluyen en la respuesta:
- `fechaNacimiento`
- `direccion`
- `provincia`
- `pais`

Si en el futuro se necesitan estos campos en el frontend, seguir el mismo patrón:
```javascript
perfil: {
    // ... campos existentes ...
    ciudad: perfil.ciudad,
    provincia: perfil.provincia,
    pais: perfil.pais,
    fechaNacimiento: perfil.fechaNacimiento,
    direccion: perfil.direccion,
}
```

## Relación con Frontend

Este fix es parte de una solución más amplia documentada en:
- `frontend/docs/fix-guardar-ubicacion.md`

El problema completo involucró:
1. **Backend**: Campo `ciudad` no incluido en respuesta (este fix)
2. **Frontend**: Falta de recarga de datos después de guardar
3. **Frontend**: Race condition en navegación de secciones

## Estado

✅ **Resuelto**  
**Branch**: `fix/guardar-ubicacion`  
**Fecha**: Febrero 2026
