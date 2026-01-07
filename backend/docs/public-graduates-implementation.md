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

## 🚀 FASE 2: Controlador Público - Lista (PENDIENTE)

### **Endpoint:** `GET /api/public/graduates`

**Características a implementar:**
- Paginación (page, limit)
- Filtro por carrera
- Filtro por ciudad
- Búsqueda por nombre/habilidades
- Ordenamiento configurable
- Verificación `perfilPublico = 1`

---

## 🚀 FASE 3: Controlador Público - Perfil Individual (PENDIENTE)

### **Endpoint:** `GET /api/public/graduates/:id`

**Características a implementar:**
- Perfil completo de egresado público
- Validación de ID
- Verificación `perfilPublico = 1`
- Inclusión de relaciones (experiencias, formación, cursos, proyectos, habilidades)

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
| **FASE 2** | ⏳ Pendiente | `publicController.js` | 0% |
| **FASE 3** | ⏳ Pendiente | `publicController.js` | 0% |
| **FASE 4** | ⏳ Pendiente | `publicRoutes.js` | 0% |
| **FASE 5** | ⏳ Pendiente | `app.js` | 0% |

**Progreso Total:** 20% (1/5 fases)

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
