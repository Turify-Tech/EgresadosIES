# Filtros de Perfiles - Implementación Completa

## Fecha: 7 de febrero de 2026
## Rama: `feature/filtros-perfiles-funcionales`

## 📋 Resumen

Se ha corregido y mejorado la funcionalidad de filtros en la página de "Ver Egresados" (`/perfiles`). Ahora los usuarios pueden filtrar egresados por:
- **Carrera** (múltiples selecciones)
- **Situación Laboral** (múltiples selecciones)

## 🐛 Problema Identificado

El botón "Filtros" en la página de perfiles existía pero **no era funcional** debido a un problema en el backend:

1. **Frontend** enviaba múltiples valores separados por comas (ej: `"Trabajando,Freelance"`)
2. **Backend** buscaba con igualdad exacta (`WHERE situacionLaboral = "Trabajando,Freelance"`)
3. Esto causaba que **ningún resultado coincidiera** porque en la BD los valores son individuales
4. Además, no se consideraban diferencias de mayúsculas/minúsculas en las búsquedas

## ✅ Solución Implementada

### Backend

Se modificaron **dos controladores** para soportar múltiples valores usando el operador SQL `OR` con `COLLATE NOCASE` para comparaciones case-insensitive. 

**Nota Técnica**: No se usó `IN` porque SQLite no soporta `COLLATE NOCASE` dentro del operador `IN()`, por lo que la solución fue construir múltiples comparaciones unidas con `OR`.

#### 1. `busquedaController.js` (líneas 74-91)

**Antes:**
```javascript
if (carrera && carrera.trim()) {
    condiciones.push("c.nombre = ?");
    parametros.push(carrera.trim());
}

if (situacionLaboral && situacionLaboral.trim()) {
    condiciones.push("p.situacionLaboral = ?");
    parametros.push(situacionLaboral.trim());
}
```

**Después:**
```javascript
// Filtro por carrera - soporta múltiples valores separados por coma
if (carrera && carrera.trim()) {
    const carreras = carrera.split(',').map(c => c.trim()).filter(c => c);
    if (carreras.length > 0) {
        // Usar COLLATE NOCASE para comparación case-insensitive
        const placeholders = carreras.map(() => 'c.nombre = ? COLLATE NOCASE').join(' OR ');
        condiciones.push(`(${placeholders})`);
        parametros.push(...carreras);
    }
}

// Filtro por situación laboral - soporta múltiples valores separados por coma
if (situacionLaboral && situacionLaboral.trim()) {
    const situaciones = situacionLaboral.split(',').map(s => s.trim()).filter(s => s);
    if (situaciones.length > 0) {
        // Usar COLLATE NOCASE para comparación case-insensitive
        const placeholders = situaciones.map(() => 'p.situacionLaboral = ? COLLATE NOCASE').join(' OR ');
        condiciones.push(`(${placeholders})`);
        parametros.push(...situaciones);
    }
}
```

#### 2. `perfilesController.js` (líneas 28-43)

**Antes:**
```javascript
if (carrera) {
    conditions.push("c.nombre = ?");
    params.push(carrera);
}
```

**Después:**
```javascript
// Filtro por carrera - soporta múltiples valores separados por coma
if (carrera) {
    const carreras = carrera.split(',').map(c => c.trim()).filter(c => c);
    if (carreras.length > 0) {
        // Usar COLLATE NOCASE para comparación case-insensitive
        const placeholders = carreras.map(() => 'c.nombre = ? COLLATE NOCASE').join(' OR ');
        conditions.push(`(${placeholders})`);
        params.push(...carreras);
    }
}
```Seed Data

Se actualizó el archivo `backend/scripts/seed-data.js`:

- **Array `datosSituacionLaboral`** (líneas 19-25): Actualizado con los 5 valores correctos que coinciden con el frontend
- **Perfiles de prueba**: Los 6 usuarios de prueba fueron actualizados con valores válidos de `situacionLaboral`
- **Consistencia**: Garantiza que los datos de prueba coincidan con los valores esperados por el frontend

### Valores Válidos de Situación Laboral

Los valores aceptados en el sistema son:
- `"Trabajando"`
- `"Freelance"`
- `"Buscando empleo"`
- `"Estudiando"`
- `"Estudiando y Trabajando"`

**Nota**: Todos los valores son case-insensitive gracias al uso de `COLLATE NOCASE`. scripts/
    └── seed-data.js                  ✅ Valores de prueba actualizados
```

## 🔍 Arquitectura del Sistema

### Flujo de Datos

```
┌─────────────────────────────────────────┐
│  Frontend: /perfiles (index.astro)     │
│  - Checkboxes de filtros                │
│  - advancedSearchSidebar.js             │
└────────────────┬────────────────────────┘
                 │
                 │ API Call: GET /buscar?
                 │ situacionLaboral=Trabajando,Freelance
                 │ carrera=Ingeniería+en+Sistemas
                 ▼
┌─────────────────────────────────────────┐
│  Backend: busquedaRoutes.js             │
│  Route: GET /buscar                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  busquedaController.js                  │
│  - Split valores por coma               │
│  - Construir SQL con OR + COLLATE      │
│  - Ejecutar query con parámetros        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Database (Turso/SQLite)               │
│  Query:                                 │
│  WHERE (p.situacionLaboral = ?         │
│         COLLATE NOCASE OR              │
│         p.situacionLaboral = ?         │
│         COLLATE NOCASE)                 │
│  AND (c.nombre = ? COLLATE NOCASE)     │
└─────────────────────────────────────────┘
```

### Archivos Modificados

```
backend/
├── src/
│   └── controllers/
│       ├── busquedaController.js       ✅ Modificado (OR + COLLATE NOCASE)
│       └── perfilesController.js       ✅ Modificado (OR + COLLATE NOCASE)
├── scripts/
│   └── seed-data.js                    ✅ Modificado (valores actualizados)
└── docs/
    └── filtros-perfiles-funcionales.md ✅ Nuevo

frontend/
└── src/
    ├── pages/
    │   └── perfiles/
    │       └── index.astro              ✅ Modificado (checkboxes)
    └── utils/
        └── advancedSearchSidebar.js     ✅ Modificado (overlay, mapeo)
```

## 🔒 Seguridad

- ✅ **Prevención de SQL Injection**: Se usan parámetros preparados (`?`) en lugar de concatenación de strings
- ✅ **Validación de entrada**: Se filtran valores vacíos con `.filter(c => c)`
- ✅ **Rate limiting**: El endpoint ya tiene implementado rate limiting

## 📊 Base de Datos (Backend)

```
backend/
├── src/
│   └── controllers/
│       ├── busquedaController.js       ✅ Modificado (líneas 74-91)
│       │                                  - Split de valores por coma
│       │                                  - OR + COLLATE NOCASE para múltiples valores
│       │                                  - Prevención de SQL injection
│       │
│       └── perfilesController.js       ✅ Modificado (líneas 28-43)
│                                          - Misma implementación que busquedaController
│                                          - Consistencia en filtros
├── scripts/
│   └── seed-data.js                    ✅ Modificado
│                                          - Array datosSituacionLaboral actualizado
│                                          - 6 perfiles de usuarios actualizados
└── docs/
    └── filtros-perfiles-funcionales.md ✅ Creado
                                           - Documentación completa de la implementación
```

**Ver documentación del frontend**: `frontend/docs/filtros-perfiles-frontend.mdNota**: Los filtros usan `COLLATE NOCASE` para comparaciones case-insensitive, lo que permite flexibilidad en la entrada del usuario.

## 🧪 Casos de Prueba

### Caso 1: Filtro simple (una situación laboral)
```
GET /buscar?situacionLaboral=Trabajando
```
**Resultado esperado**: Todos los egresados con situación "Trabajando"

### Caso 2: Filtro múltiple (situación laboral)
```
GET /buscar?situacionLaboral=Trabajando,Freelance
```
**Resultado esperado**: Egresados que sean "Trabajando" O "Freelance"

### Caso 3: Filtro combinado
```
GET /buscar?carrera=Ingeniería en Sistemas&situacionLaboral=Trabajando,Estudiando
```
**Resultado esperado**: Egresados de "Ingeniería en Sistemas" que estén "Trabajando" O "Estudiando"

### Caso 4: Sin filtros
```
GET /buscar
```
**Resultado esperado**: Todos los egresados

## 📝 Notas Técnicas

### Construcción de Placeholders SQL

Para evitar SQL injection y soportar múltiples valores con comparación case-insensitive, se usa esta técnica:

```javascript
const valores = "Trabajando,Freelance".split(',').map(s => s.trim());
// valores = ["Trabajando", "Freelance"]

const placeholders = valores.map(() => 'p.situacionLaboral = ? COLLATE NOCASE').join(' OR ');
// placeholders = "p.situacionLaboral = ? COLLATE NOCASE OR p.situacionLaboral = ? COLLATE NOCASE"

const sql = `WHERE (${placeholders})`;
// sql = "WHERE (p.situacionLaboral = ? COLLATE NOCASE OR p.situacionLaboral = ? COLLATE NOCASE)"

// Se pasa con spread operator
parametros.push(...valores);
// parametros = ["Trabajando", "Freelance"]
```

Esto genera SQL seguro con comparación case-insensitive: `WHERE (p.situacionLaboral = ? COLLATE NOCASE OR p.situacionLaboral = ? COLLATE NOCASE)` con parámetros separados.

**Ventaja de OR + COLLATE NOCASE sobre IN**: SQLite no soporta `COLLATE NOCASE` directamente dentro de `IN()`, por lo que usamos múltiples comparaciones `OR` para lograr búsquedas case-insensitive.

## 🚀 Despliegue

### Cambios Requeridos
- ✅ **Backend**: Reiniciar servidor Node.js para cargar nuevos controladores
- ⚠️ **Frontend**: No requiere rebuild (JavaScript del lado del cliente)
- ⚠️ **Base de Datos**: No requiere migraciones

### Comandos
```bash
# Backend
cd backend
npm restart  # o pm2 restart

# Frontend (si se despliega estático)
cd frontend
npm run build
```

## ✨ Mejoras Futuras

1. **Agregar más filtros**:
   - Por ciudad/provincia
   - Por rango de años de experiencia
   - Por tecnologías/habilidades

2. **Optimización de rendimiento**:
  ¿Por qué OR + COLLATE NOCASE en lugar de IN?**

SQLite tiene una limitación con `COLLATE NOCASE` dentro del operador `IN()`:
- ❌ **No funciona**: `WHERE p.situacionLaboral IN (?, ?) COLLATE NOCASE`
- ✅ **Solución**: `WHERE (p.situacionLaboral = ? COLLATE NOCASE OR p.situacionLaboral = ? COLLATE NOCASE)`

Esta técnica garantiza:
1. **Seguridad**: Prevención de SQL injection mediante parámetros preparados
2. **Case-insensitive**: Los valores "Trabajando", "trabajando", "TRABAJANDO" son equivalentes
3. **Múltiples valores**: Soporte para filtrar por varios valores simultáneamente
   - Implementar caché de resultados frecuentes

3. **UX Mejorada**:
   - Indicador visual de filtros activos
   - Contador de resultados por filtro
   - Guardar preferencias de filtros del usuario

## 📞 Contacto y Soporte

Para preguntas sobre esta implementación, contactar al equipo de desarrollo.

---

**Estado**: ✅ Completado y probado
**Versión**: 1.0
**Rama**: `feature/filtros-perfiles-funcionales`
