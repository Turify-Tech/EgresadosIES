# 🎓 Implementación de API Pública de Egresados - Documentación Técnica

## 📋 Información General

**Feature:** Public Graduates API  
**Branch:** `feature/public-graduates-api`  
**Issue:** #14 - Perfiles Públicos de Egresados  
**Fecha:** Enero 2026  
**Autor:** Sistema de Gestión de Egresados IES

---

## 🎯 Objetivo

Implementar endpoints públicos que permitan a visitantes anónimos (empresas, reclutadores, público general) visualizar perfiles de egresados sin autenticación, respetando configuraciones de privacidad y excluyendo datos sensibles.

---

## 🔒 Principios de Seguridad

### **Datos Sensibles Excluidos**
Los siguientes campos **NUNCA** se exponen en endpoints públicos:
- ❌ `email` - Correo electrónico personal
- ❌ `telefono` - Número de teléfono
- ❌ `dni` - Documento Nacional de Identidad
- ❌ `password` - Contraseña (obviamente)

### **Control de Visibilidad**
- Solo se muestran perfiles con `Perfil.perfilPublico = 1`
- Los egresados deben activar explícitamente su visibilidad pública
- Por defecto, todos los perfiles son privados (`perfilPublico = 0`)

---

## 📁 Arquitectura de la Solución

### **Nuevos Componentes**

```
backend/src/
├── controllers/
│   └── publicController.js       # Controlador para endpoints públicos
├── routes/
│   └── publicRoutes.js           # Rutas bajo /api/public
└── middleware/
    └── publicData.js             # Sanitización de datos sensibles
```

### **Separación de Responsabilidades**

| Componente | Responsabilidad |
|------------|-----------------|
| `publicData.js` | Filtrado y sanitización de datos sensibles |
| `publicController.js` | Lógica de negocio para endpoints públicos |
| `publicRoutes.js` | Definición de rutas y rate limiting |

---

## 🔧 FASE 1: Middleware de Sanitización ✅ COMPLETADO

### **Archivo:** `backend/src/middleware/publicData.js`

### **Funciones Implementadas**

#### 1. `sanitizePublicProfile(profile)`
**Propósito:** Elimina campos sensibles de un objeto de perfil individual.

**Parámetros:**
- `profile` (Object): Perfil de egresado con todos los campos

**Retorna:**
- Object: Perfil sin campos sensibles

**Implementación:**
```javascript
export function sanitizePublicProfile(profile) {
    if (!profile) return null;
    
    const sanitized = { ...profile };
    
    // Elimina: email, telefono, dni, password
    SENSITIVE_FIELDS.forEach(field => {
        delete sanitized[field];
    });
    
    return sanitized;
}
```

**Complejidad:** O(1) - Eliminación de campos constantes

---

#### 2. `sanitizeGraduateList(graduates)`
**Propósito:** Sanitiza un array completo de perfiles.

**Parámetros:**
- `graduates` (Array): Lista de perfiles de egresados

**Retorna:**
- Array: Lista de perfiles sanitizados

**Complejidad:** O(n) donde n = número de perfiles

---

#### 3. `publicDataMiddleware(req, res, next)`
**Propósito:** Middleware Express que intercepta `res.json()` y sanitiza automáticamente.

**Uso:**
```javascript
router.use(publicDataMiddleware);
router.get('/graduates', controller.getPublicGraduates);
```

**Ventajas:**
- ✅ Sanitización automática transparente
- ✅ No requiere cambios en controladores
- ✅ Previene olvidos de sanitización manual

**Mecanismo:**
```javascript
// Sobrescribe res.json original
const originalJson = res.json.bind(res);
res.json = function(data) {
    // Sanitiza data.data si existe
    if (data && data.success && data.data) {
        data.data = Array.isArray(data.data) 
            ? sanitizeGraduateList(data.data)
            : sanitizePublicProfile(data.data);
    }
    return originalJson(data);
};
```

---

#### 4. `isPublicProfile(perfil)`
**Propósito:** Valida si un perfil está marcado como público.

**Retorna:**
- Boolean: `true` si `perfilPublico === 1`

---

#### 5. `filterPublicProfiles(profiles)`
**Propósito:** Filtra un array dejando solo perfiles públicos.

**Uso:**
```javascript
const allProfiles = await db.execute(query);
const publicOnly = filterPublicProfiles(allProfiles.rows);
```

---

### **Pruebas de Sanitización**

#### Test Case 1: Perfil con datos sensibles
```javascript
// Input
const profile = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan@example.com',  // sensible
    dni: '12345678',            // sensible
    telefono: '1122334455',     // sensible
    carrera: 'Desarrollo Web'
};

// Output después de sanitizePublicProfile()
{
    id: 1,
    nombre: 'Juan Pérez',
    carrera: 'Desarrollo Web'
    // email, dni, telefono removidos
}
```

---

## 🚀 FASE 2: Controlador Público - Lista ✅ COMPLETADO

### **Archivo:** `backend/src/controllers/publicController.js`

### **Endpoint:** `GET /api/public/graduates`

**Query Parameters:**
```javascript
{
    page: 1,              // Número de página (default: 1)
    limit: 20,            // Resultados por página (default: 20, max: 50)
    carrera: "string",    // Filtro por nombre exacto de carrera
    ciudad: "string",     // Filtro por ciudad (LIKE)
    search: "string",     // Búsqueda en nombre, apellido, habilidades, empresa
    orderBy: "nombre|carrera|ciudad",  // Campo de ordenamiento
    order: "asc|desc"     // Dirección de ordenamiento
}
```

### **Características Implementadas:**

#### ✅ 1. Paginación Robusta
```javascript
const pageNumber = Math.max(1, parseInt(page));
const limitNumber = Math.min(50, Math.max(1, parseInt(limit)));
const offset = (pageNumber - 1) * limitNumber;
```

**Validaciones:**
- Página mínima: 1
- Límite mínimo: 1
- Límite máximo: 50 (previene sobrecarga)

---

#### ✅ 2. Filtro Crítico de Privacidad
```sql
WHERE u.tipo_usuario = 'Egresado' 
  AND p.perfilPublico = 1  -- CRÍTICO: Solo públicos
```

**Garantiza:**
- Solo egresados con `perfilPublico = 1` son visibles
- Respeta configuración de privacidad del usuario

---

#### ✅ 3. Exclusión de Datos Sensibles en Query
```sql
SELECT 
    u.id,
    u.nombre,
    u.apellido,
    -- NO incluye: u.email, e.telefono, e.dni
    c.nombre as carrera,
    p.resumenProfesional,
    p.situacionLaboral,
    p.urlPortfolio,
    p.urlFotoPerfil,
    p.urlBanner,
    p.tituloprofesional,
    p.ciudad,
    p.provincia
```

**Campos excluidos desde la query:**
- ❌ `email`
- ❌ `telefono`
- ❌ `dni`

---

#### ✅ 4. Búsqueda Avanzada
```javascript
if (search && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    conditions.push(`(
        u.nombre LIKE ? OR 
        u.apellido LIKE ? OR
        EXISTS (SELECT 1 FROM Habilidades h 
                WHERE h.usuarioId = u.id 
                AND h.nombre LIKE ?)
        OR
        EXISTS (SELECT 1 FROM ExperienciaLaboral el 
                WHERE el.perfilId = p.id 
                AND (el.empresa LIKE ? OR el.puesto LIKE ?))
    )`);
}
```

**Busca en:**
- Nombre del egresado
- Apellido
- Habilidades (tabla Habilidades)
- Empresas (tabla ExperienciaLaboral)
- Puestos de trabajo

---

#### ✅ 5. Filtros Específicos

**Por Carrera:**
```javascript
if (carrera) {
    conditions.push("c.nombre = ?");
    params.push(carrera.trim());
}
```

**Por Ciudad:**
```javascript
if (ciudad) {
    conditions.push("p.ciudad LIKE ?");
    params.push(`%${ciudad.trim()}%`);
}
```

---

#### ✅ 6. Ordenamiento Configurable
```javascript
const validOrderBy = ["nombre", "carrera", "ciudad"].includes(orderBy) 
    ? orderBy : "nombre";
const validOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";
```

**Opciones:**
- Por nombre (default)
- Por carrera
- Por ciudad
- Dirección: ASC o DESC

---

#### ✅ 7. Enriquecimiento de Datos
```javascript
const enrichedProfiles = await Promise.all(
    profiles.map(async (profile) => {
        const [experiencias, formacion, cursos] = await Promise.all([
            PublicController.getExperienciasLaborales(profile.perfilId),
            PublicController.getFormacionAcademica(profile.perfilId),
            PublicController.getCursos(profile.perfilId),
        ]);

        return {
            ...profile,
            experienciasLaborales: experiencias,
            formacionAcademica: formacion,
            cursos: cursos,
        };
    })
);
```

**Incluye:**
- Experiencias laborales (ordenadas por actual primero)
- Formación académica (ordenada por año)
- Cursos (ordenados alfabéticamente)

---

#### ✅ 8. Metadata de Paginación Completa
```javascript
{
    pagination: {
        currentPage: 1,
        totalPages: 5,
        totalRecords: 42,
        limit: 20,
        hasNextPage: true,
        hasPrevPage: false
    }
}
```

---

### **Métodos Auxiliares Implementados**

#### `getExperienciasLaborales(perfilId)`
- Obtiene experiencias ordenadas (actuales primero)
- `ORDER BY CASE WHEN fechaFin IS NULL THEN 0 ELSE 1 END`

#### `getFormacionAcademica(perfilId)`
- Obtiene formación ordenada por año descendente

#### `getCursos(perfilId)`
- Obtiene cursos ordenados alfabéticamente

---

### **Ejemplo de Respuesta**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "nombre": "Juan",
            "apellido": "Pérez",
            "carrera": "Desarrollo Web",
            "resumenProfesional": "Desarrollador Full Stack...",
            "situacionLaboral": "Empleado",
            "ciudad": "Buenos Aires",
            "provincia": "Buenos Aires",
            "urlFotoPerfil": "https://...",
            "experienciasLaborales": [
                {
                    "puesto": "Desarrollador Senior",
                    "empresa": "Tech Corp",
                    "fechaInicio": "2023-01-15",
                    "fechaFin": null
                }
            ],
            "formacionAcademica": [...],
            "cursos": [...]
        }
    ],
    "pagination": {
        "currentPage": 1,
        "totalPages": 3,
        "totalRecords": 42,
        "limit": 20,
        "hasNextPage": true,
        "hasPrevPage": false
    }
}
```

---

### **Validaciones de Seguridad**

| Aspecto | Validación |
|---------|------------|
| ✅ Filtro público | `perfilPublico = 1` en WHERE |
| ✅ Sin email | NO en SELECT |
| ✅ Sin DNI | NO en SELECT |
| ✅ Sin teléfono | NO en SELECT |
| ✅ Límite paginación | Max 50 por request |
| ✅ Validación orden | Solo valores permitidos |

---

### **Performance**

**Optimizaciones:**
- ✅ Query con índices en `perfilPublico`, `tipo_usuario`
- ✅ Queries paralelas (profiles + count)
- ✅ Enriquecimiento paralelo con `Promise.all()`
- ✅ Límite máximo de 50 registros por request

**Complejidad:**
- Query principal: O(n log n) por ORDER BY
- Enriquecimiento: O(n * m) donde m = promedio de relaciones

---

## 🚀 FASE 3: Controlador Público - Perfil Individual ✅ COMPLETADO

### **Endpoint:** `GET /api/public/graduates/:id`

**URL Parameters:**
- `id` (number, required): ID del egresado

### **Características Implementadas:**

#### ✅ 1. Validación de ID
```javascript
if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
        success: false,
        message: "ID de egresado inválido"
    });
}
```

**Validaciones:**
- ID debe ser numérico
- ID no puede ser null/undefined
- Retorna 400 si es inválido

---

#### ✅ 2. Verificación Doble de Privacidad
```javascript
// 1. Verificar que existe el egresado
if (result.rows.length === 0) {
    return res.status(404).json({
        message: "Egresado no encontrado"
    });
}

// 2. CRÍTICO: Verificar que sea público
if (profile.perfilPublico !== 1) {
    return res.status(404).json({
        message: "Perfil no disponible públicamente"
    });
}
```

**Seguridad:**
- Si el perfil es privado (`perfilPublico = 0`), retorna **404** (no 403)
- Oculta existencia de perfiles privados
- Previene enumeration attacks

---

#### ✅ 3. Datos Completos del Perfil
```sql
SELECT 
    u.id, u.nombre, u.apellido,
    c.nombre as carrera,
    p.resumenProfesional,
    p.situacionLaboral,
    p.tituloprofesional,
    p.areaInteres,
    p.ciudad, p.provincia, p.pais,
    p.urlPortfolio,
    p.urlFotoPerfil,
    p.urlBanner
    -- SIN: email, telefono, dni
WHERE u.id = ? AND u.tipo_usuario = 'Egresado'
```

---

#### ✅ 4. Enriquecimiento Completo con 5 Relaciones
```javascript
const [experiencias, formacion, cursos, proyectos, habilidades] = 
    await Promise.all([
        PublicController.getExperienciasLaborales(profile.perfilId),
        PublicController.getFormacionAcademica(profile.perfilId),
        PublicController.getCursos(profile.perfilId),
        PublicController.getProyectos(graduateId),
        PublicController.getHabilidades(graduateId),
    ]);
```

**Incluye:**
- 📋 Experiencias laborales
- 🎓 Formación académica
- 📚 Cursos realizados
- 💻 Proyectos personales
- 🛠️ Habilidades técnicas y blandas

---

#### ✅ 5. Nuevos Métodos Auxiliares

**`getProyectos(usuarioId)`**
```javascript
SELECT id, nombre, descripcion, enlace, tecnologias, fechaProyecto, imagen
FROM Proyectos
WHERE usuarioId = ?
ORDER BY fechaProyecto DESC
```

- Ordenados por fecha (más recientes primero)
- Incluye imagen y enlace del proyecto
- Lista de tecnologías usadas

**`getHabilidades(usuarioId)`**
```javascript
SELECT id, nombre, tipo, nivel
FROM Habilidades
WHERE usuarioId = ?
ORDER BY tipo, nombre
```

- Agrupadas por tipo (técnica, blanda, idioma)
- Incluye nivel de experticia
- Ordenadas alfabéticamente dentro de cada tipo

---

### **Ejemplo de Respuesta Completa**

```json
{
    "success": true,
    "data": {
        "id": 1,
        "nombre": "Juan",
        "apellido": "Pérez",
        "carrera": "Desarrollo Web",
        "resumenProfesional": "Desarrollador Full Stack con 3 años...",
        "situacionLaboral": "Empleado",
        "tituloprofesional": "Técnico Superior en Desarrollo Web",
        "areaInteres": "Desarrollo Backend",
        "ciudad": "Buenos Aires",
        "provincia": "Buenos Aires",
        "pais": "Argentina",
        "urlPortfolio": "https://juanperez.dev",
        "urlFotoPerfil": "https://...",
        "urlBanner": "https://...",
        
        "experienciasLaborales": [
            {
                "id": 1,
                "puesto": "Desarrollador Senior",
                "empresa": "Tech Corp",
                "fechaInicio": "2023-01-15",
                "fechaFin": null,
                "descripcion": "Desarrollo de aplicaciones..."
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
        ],
        
        "proyectos": [
            {
                "id": 1,
                "nombre": "E-commerce Platform",
                "descripcion": "Plataforma de ventas online...",
                "enlace": "https://github.com/juan/ecommerce",
                "tecnologias": "React, Node.js, MongoDB",
                "fechaProyecto": "2023-06-15",
                "imagen": "https://..."
            }
        ],
        
        "habilidades": [
            {
                "id": 1,
                "nombre": "JavaScript",
                "tipo": "tecnica",
                "nivel": "avanzado"
            },
            {
                "id": 2,
                "nombre": "Trabajo en equipo",
                "tipo": "blanda",
                "nivel": "avanzado"
            },
            {
                "id": 3,
                "nombre": "Inglés",
                "tipo": "idioma",
                "nivel": "intermedio"
            }
        ]
    }
}
```

---

### **Manejo de Errores**

| Status | Caso | Respuesta |
|--------|------|-----------|
| 400 | ID inválido | `"ID de egresado inválido"` |
| 404 | Egresado no existe | `"Egresado no encontrado"` |
| 404 | Perfil privado | `"Perfil no disponible públicamente"` |
| 500 | Error servidor | `"Error interno del servidor"` |

**Nota:** Perfiles privados retornan 404 (no 403) para no revelar su existencia.

---

### **Validaciones de Seguridad**

| Aspecto | Implementación |
|---------|----------------|
| ✅ ID numérico | Validación con `isNaN()` |
| ✅ Perfil público | Verifica `perfilPublico = 1` |
| ✅ Sin datos sensibles | No en SELECT |
| ✅ Oculta privados | 404 en vez de 403 |
| ✅ Datos completos | 5 relaciones cargadas |

---

## 🚀 FASE 4: Rutas Públicas (PENDIENTE)

### **Archivo:** `backend/src/routes/publicRoutes.js`

**Rate Limiting:**
- 50 requests por IP cada 15 minutos
- Headers de rate limit en respuestas

---

## 🚀 FASE 5: Registro en App.js (PENDIENTE)

**Cambios en:** `backend/src/app.js`
- Import de publicRoutes
- Registro bajo `/api/public`

---

## 📊 Estado de Implementación

| Fase | Estado | Archivos | Progreso |
|------|--------|----------|----------|
| **FASE 1** | ✅ Completado | `publicData.js` | 100% |
| **FASE 2** | ✅ Completado | `publicController.js` | 100% |
| **FASE 3** | ✅ Completado | `publicController.js` | 100% |
| **FASE 4** | ⏳ Pendiente | `publicRoutes.js` | 0% |
| **FASE 5** | ⏳ Pendiente | `app.js` | 0% |

**Progreso Total:** 60% (3/5 fases)

---

## 🔍 Comparación con Código Existente

### **Endpoint Actual:** `/api/perfiles`

**Problemas:**
- ❌ No verifica `perfilPublico = 1`
- ❌ Muestra todos los egresados (públicos y privados)
- ⚠️ No sanitiza datos en algunos casos

### **Endpoint Nuevo:** `/api/public/graduates`

**Mejoras:**
- ✅ Verifica `perfilPublico = 1` en query SQL
- ✅ Sanitización automática mediante middleware
- ✅ Filtros avanzados (ciudad, búsqueda)
- ✅ Rate limiting más restrictivo
- ✅ Documentación completa

---

## 🧪 Plan de Testing

### **Tests Unitarios**
- [ ] `publicData.js` - Sanitización de campos
- [ ] `publicController.js` - Lógica de negocio

### **Tests de Integración**
- [ ] `GET /api/public/graduates` - Lista paginada
- [ ] `GET /api/public/graduates/:id` - Perfil individual
- [ ] Verificar exclusión de datos sensibles
- [ ] Verificar filtro `perfilPublico = 1`

### **Tests de Seguridad**
- [ ] No se expone email en ninguna respuesta
- [ ] No se expone dni en ninguna respuesta
- [ ] No se expone telefono en ninguna respuesta
- [ ] Solo perfiles públicos son accesibles

### **Tests de Rate Limiting**
- [ ] Request 51 retorna 429
- [ ] Headers de rate limit presentes

---

## 📝 Commits Realizados

### FASE 1
```bash
git commit -m "feat: add public data sanitization middleware"
```

**Archivos modificados:**
- `backend/src/middleware/publicData.js` (nuevo)

**Líneas agregadas:** ~100

---

### FASE 2
```bash
git commit -m "feat: implement public graduates list controller"
```

**Archivos modificados:**
- `backend/src/controllers/publicController.js` (nuevo)

**Líneas agregadas:** ~300

**Funcionalidades:**
- Lista paginada de egresados públicos
- Filtros por carrera, ciudad, búsqueda
- Ordenamiento configurable
- Enriquecimiento con relaciones
- Validación `perfilPublico = 1`

---

## 🔗 Referencias

- **Issue:** #14 - Perfiles Públicos de Egresados
- **Branch:** `feature/public-graduates-api`
- **Base:** `develop`
- **Schema:** `schema.sql` - Campo `Perfil.perfilPublico`

---

## 📅 Historial de Cambios

| Fecha | Fase | Descripción |
|-------|------|-------------|
| 2026-01-07 | FASE 1 | Implementación de middleware de sanitización |

---

**Última actualización:** 2026-01-07  
**Estado:** 🟡 En progreso (20% completado)
