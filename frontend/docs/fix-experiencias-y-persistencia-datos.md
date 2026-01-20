# Corrección de Experiencias Laborales y Persistencia de Datos

**Fecha:** 20 de enero de 2026  
**Componentes afectados:** Editor de perfil, componentes de formulario, CV público

## Resumen

Se corrigieron múltiples problemas relacionados con la persistencia de datos en el editor de perfil, específicamente:
- Las experiencias laborales no se guardaban en la base de datos
- Los datos se borraban al cambiar entre secciones del editor
- El campo "Acerca de mí" se vaciaba al volver a editar
- Problemas de visibilidad y organización de habilidades en el CV

## Problemas Identificados

### 1. Experiencias Laborales No Se Guardaban

**Síntoma:** El usuario llenaba el formulario de experiencias laborales, pero al ver su CV público, las experiencias no aparecían.

**Causa raíz:**
- El método `saveExperiencias()` en `editar.astro` estaba reimplementando incorrectamente la lógica de guardado
- Los event listeners del botón "Siguiente" no se conectaban correctamente debido a un race condition
- El botón se renderizaba antes de que se ejecutara `bindSectionButtons()`

**Evidencia:** 
```bash
# Script de verificación mostró que solo 1 de 13 usuarios tenía experiencias guardadas
node scripts/check-experiencias.js
# Resultado: Total de experiencias: 1
```

### 2. Datos Se Borraban al Cambiar de Sección

**Síntoma:** Al navegar entre secciones del editor (Datos Personales → Formaciones → Experiencias), los campos se vaciaban.

**Causa raíz:**
- Flag `isInitialized` en todos los componentes de formulario impedía repoblar datos
- El flag se establecía en `true` la primera vez que se cargaban datos
- Las llamadas subsecuentes a `populateForm()` eran ignoradas

**Componentes afectados:**
- `DatosPersonales.astro`
- `ExperienciaForm.astro`
- `FormacionForm.astro`
- `CursoForm.astro`
- `ProyectoForm.astro`

### 3. Habilidades con Problemas de Visibilidad

**Síntoma:** El texto en la sección de habilidades del editor era ilegible (texto claro sobre fondo blanco).

**Causa raíz:** Falta de color explícito en los estilos CSS de los inputs de habilidades.

### 4. CV Mostraba Categorías Hardcodeadas

**Síntoma:** El CV público mostraba "Frontend:" en lugar de las categorías reales de habilidades técnicas.

**Causa raíz:** Lógica de renderizado usaba valores hardcodeados en lugar de leer el campo `categoria` de la base de datos.

## Soluciones Implementadas

### 1. Corrección del Guardado de Experiencias

**Archivo:** `frontend/src/pages/perfil/editar.astro`

**Cambios:**
```javascript
// ANTES - Lógica duplicada e incorrecta
async saveExperiencias() {
    const data = window.experienciasManager.getFormData();
    for (const experiencia of data.experiencias) {
        if (experiencia.id) {
            await profileService.updateExperiencia(experiencia.id, experienciaData);
        } else {
            await profileService.addExperiencia(experienciaData);
        }
    }
}

// DESPUÉS - Delega al manager
async saveExperiencias() {
    if (window.experienciasManager) {
        await window.experienciasManager.saveCurrentExperiencia();
        await window.experienciasManager.saveAllExperiencias();
        
        await this.loadUserProfile();
        window.experienciasManager.populateForm(this.profileData);
        return true;
    }
}
```

**Beneficios:**
- Elimina duplicación de código
- Usa la lógica validada del manager
- Maneja correctamente experiencias nuevas vs existentes

### 2. Re-binding de Event Listeners

**Archivo:** `frontend/src/pages/perfil/editar.astro`

**Cambios:**
```javascript
switchSection(sectionId) {
    // ... código existente de cambio de sección ...
    
    this.currentSection = sectionId;
    
    // NUEVO: Re-bind section buttons cada vez que cambiamos de sección
    setTimeout(() => {
        this.bindSectionButtons();
    }, 100);
    
    console.log(`✅ Section switch completed: ${sectionId}`);
}
```

**Beneficios:**
- Asegura que los event listeners estén siempre conectados
- Resuelve el race condition entre renderizado y binding
- Permite navegación fluida entre secciones

### 3. Eliminación de Flags `isInitialized`

**Archivos modificados:**
- `frontend/src/components/perfil/DatosPersonales.astro`
- `frontend/src/components/perfil/ExperienciaForm.astro`
- `frontend/src/components/perfil/FormacionForm.astro`
- `frontend/src/components/perfil/CursoForm.astro`
- `frontend/src/components/perfil/ProyectoForm.astro`

**Cambios:**
```javascript
// ANTES
class FormManager {
    constructor() {
        this.isInitialized = false;
    }
    
    populateForm(data) {
        if (this.isInitialized) return;
        // poblar datos...
        this.isInitialized = true;
    }
}

// DESPUÉS
class FormManager {
    constructor() {
        // isInitialized eliminado
    }
    
    populateForm(data) {
        // Siempre repobla los datos
        // poblar datos...
    }
}
```

**Beneficios:**
- Los datos se recargan correctamente al navegar entre secciones
- Sincronización automática con cambios del servidor
- Experiencia de usuario más consistente

### 4. Mejora de Visibilidad de Habilidades

**Archivo:** `frontend/src/components/perfil/CursoForm.astro`

**Cambios CSS:**
```css
.form-input, .form-select, .form-textarea {
    color: #1f2937; /* Texto oscuro explícito */
}

.habilidades-list {
    color: #1f2937;
}

.habilidad-item.tecnica {
    color: #0c4a6e; /* Azul más oscuro */
}

.habilidad-item.blanda {
    color: #14532d; /* Verde más oscuro */
}
```

**Beneficios:**
- Texto legible en todos los campos
- Mejor contraste visual
- Accesibilidad mejorada

### 5. Corrección de Categorías en CV

**Archivo:** `frontend/src/pages/perfil/[id].astro`

**Cambios:**
```javascript
// ANTES - Categorías hardcodeadas
const habilidadesTecnicas = profile.habilidades.filter(h => h.tipo === 'tecnica');
// Mostraba siempre "Frontend:"

// DESPUÉS - Categorías dinámicas
const categoriaMap = {
    lenguajes: "Lenguajes de Programación",
    frameworks: "Frameworks y Librerías",
    herramientas: "Herramientas y Tecnologías",
    bases_datos: "Bases de Datos",
    metodologias: "Metodologías",
    otras: "Habilidades Técnicas"
};

// Agrupa por categoria real desde BD
const habilidadesPorCategoria = {};
habilidadesTecnicas.forEach(h => {
    const cat = h.categoria || 'otras';
    if (!habilidadesPorCategoria[cat]) {
        habilidadesPorCategoria[cat] = [];
    }
    habilidadesPorCategoria[cat].push(h);
});
```

**Beneficios:**
- Muestra categorías reales del usuario
- Elimina valores hardcodeados
- Más flexible y escalable

### 6. Limpieza de Labels

**Archivo:** `frontend/src/components/perfil/DatosPersonales.astro`

**Cambios:**
```html
<!-- ANTES -->
<label for="descripcion">Acerca de mí (CV)</label>

<!-- DESPUÉS -->
<label for="descripcion">Acerca de mí</label>
```

**Beneficios:**
- Interfaz más limpia
- Menos redundancia visual
- Mejor UX

## Mejoras de Cropper de Imágenes (Contexto)

Aunque no fue parte del problema principal, se realizaron mejoras previas:

**Archivo:** `frontend/src/components/perfil/ProyectoForm.astro`

**Cambios:**
- Reemplazó implementación canvas custom por Cropper.js
- Aspect ratio 16:9 para imágenes de proyectos
- Output: 800x450px JPEG a 0.9 de calidad
- Resolvió error CORS "Tainted canvas"

## Script de Diagnóstico

**Archivo creado:** `backend/scripts/check-experiencias.js`

Herramienta de diagnóstico para verificar estado de experiencias en BD:

```javascript
import database from "../src/config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function checkExperiencias() {
    await database.connect();
    const client = database.getClient();
    
    // Lista todos los usuarios y sus experiencias
    // Muestra estadísticas de la BD
}
```

**Uso:**
```bash
cd backend
node scripts/check-experiencias.js
```

## Estructura de Datos

### API Response - Mi Perfil (`/api/perfil/mi-perfil`)

```javascript
{
    success: true,
    data: {
        usuario: {
            id: number,
            nombre: string,
            apellido: string,
            email: string,
            dni: string,
            telefono: string
        },
        perfil: {
            id: number,
            resumenProfesional: string,
            urlPortfolio: string,
            situacionLaboral: string,
            urlFotoPerfil: string,
            urlBanner: string
        },
        experienciasLaborales: [
            {
                id: number,
                puesto: string,
                empresa: string,
                fechaInicio: string,
                fechaFin: string | null,
                descripcion: string
            }
        ],
        habilidades: [
            {
                id: number,
                nombre: string,
                tipo: 'tecnica' | 'blanda' | 'idioma',
                categoria: string,
                nivel: string
            }
        ],
        // ... otros arrays
    }
}
```

### API Response - Perfil Público (`/api/perfiles/:id`)

```javascript
{
    success: true,
    data: {
        id: number,
        nombre: string,
        apellido: string,
        email: string,
        carrera: string,
        resumenProfesional: string,
        // ... campos de perfil ...
        experienciasLaborales: [ /* mismo formato */ ],
        habilidades: [ /* mismo formato */ ],
        // ... otros arrays
    }
}
```

**Nota importante:** Ambos endpoints retornan `experienciasLaborales` en la raíz del objeto `data`, manteniendo consistencia.

## Testing Manual Realizado

### 1. Flujo de Experiencias Laborales

✅ **Pasos verificados:**
1. Login como usuario de prueba
2. Ir a "Editar Perfil"
3. Navegar a sección "Experiencias"
4. Agregar nueva experiencia:
   - Puesto: "Desarrollador Full Stack"
   - Empresa: "Tech Solutions"
   - Fechas: 2024-01 a 2025-12
   - Descripción: "Desarrollo de aplicaciones web..."
5. Click en "Siguiente"
6. Verificar en consola: "✅ Experiencias guardadas exitosamente"
7. Ir a `/perfil/[mi-id]` (CV público)
8. ✅ Verificar que la experiencia aparece correctamente

### 2. Persistencia de Datos

✅ **Pasos verificados:**
1. Editar "Acerca de mí" en Datos Personales
2. Guardar y navegar a Formaciones
3. Volver a Datos Personales
4. ✅ Verificar que "Acerca de mí" mantiene el texto
5. Refrescar página completa
6. Ir de nuevo a Editar Perfil
7. ✅ Verificar que todos los datos persisten

### 3. Habilidades en CV

✅ **Pasos verificados:**
1. Agregar habilidades técnicas con diferentes categorías
2. Agregar habilidades blandas
3. Ver CV público
4. ✅ Verificar que se agrupan por categoría real
5. ✅ Verificar que "Habilidades Técnicas" tiene fondo gris

## Impacto en la Base de Datos

**Antes de los cambios:**
```
Total usuarios: 13
Usuarios con experiencias: 1 (7.7%)
Total experiencias: 1
```

**Después de los cambios:**
```
Funcionalidad restaurada - nuevas experiencias se guardan correctamente
```

## Archivos Modificados

### Frontend
1. `frontend/src/pages/perfil/editar.astro` - Lógica de guardado y event binding
2. `frontend/src/pages/perfil/[id].astro` - Renderizado de CV público
3. `frontend/src/components/perfil/DatosPersonales.astro` - Eliminado isInitialized, label limpio
4. `frontend/src/components/perfil/ExperienciaForm.astro` - Eliminado isInitialized
5. `frontend/src/components/perfil/FormacionForm.astro` - Eliminado isInitialized
6. `frontend/src/components/perfil/CursoForm.astro` - Eliminado isInitialized, estilos mejorados
7. `frontend/src/components/perfil/ProyectoForm.astro` - Eliminado isInitialized

### Backend
8. `backend/scripts/check-experiencias.js` - Script de diagnóstico (NUEVO)

## Lecciones Aprendidas

### 1. Anti-patrón: Flags de Estado Innecesarios
Los flags como `isInitialized` crean más problemas que soluciones:
- Rompen la sincronización con el servidor
- Dificultan el debugging
- Asumen un estado estático que no siempre es real

**Mejor práctica:** Confiar en el servidor como fuente de verdad y repoblar siempre.

### 2. Event Listeners en Aplicaciones Dinámicas
En aplicaciones con navegación tipo SPA, los event listeners deben:
- Re-conectarse cuando cambia el contenido del DOM
- Usar delays cuando sea necesario para race conditions
- Limpiarse adecuadamente para evitar memory leaks

### 3. Separación de Responsabilidades
Los componentes manager deben encapsular su lógica:
- No duplicar lógica de guardado en el orquestador
- Delegar operaciones a los managers especializados
- Mantener interfaces claras entre componentes

### 4. Consistencia en Estructuras de Datos
Mantener la misma estructura entre diferentes endpoints:
- Facilita el consumo en el frontend
- Reduce bugs por asunciones incorrectas
- Mejora la mantenibilidad

## Recomendaciones Futuras

### 1. Testing Automatizado
Implementar tests para prevenir regresiones:
```javascript
describe('ProfileEditor', () => {
    it('should persist data when switching sections', async () => {
        // Test automatizado
    });
    
    it('should save experiences to database', async () => {
        // Test automatizado
    });
});
```

### 2. Validación de Datos
Agregar validación más robusta:
- Validación en tiempo real en formularios
- Mensajes de error más descriptivos
- Confirmación visual de guardado exitoso

### 3. Estado Global
Considerar implementar un sistema de estado global:
- Redux, Zustand, o similar
- Evitar prop drilling
- Sincronización más predecible

### 4. Logs Estructurados
Mejorar el sistema de logging:
- Niveles de log (debug, info, warn, error)
- Timestamps consistentes
- Contexto adicional en cada log

## Conclusión

Esta actualización corrige problemas críticos de persistencia de datos que afectaban la experiencia del usuario al editar su perfil. Los cambios garantizan que:

✅ Las experiencias laborales se guarden correctamente en la base de datos  
✅ Los datos persistan al navegar entre secciones del editor  
✅ El CV público muestre información actualizada y precisa  
✅ La interfaz sea más clara y legible  
✅ El código sea más mantenible y menos propenso a bugs  

Todos los componentes del editor ahora funcionan de manera consistente y confiable.
