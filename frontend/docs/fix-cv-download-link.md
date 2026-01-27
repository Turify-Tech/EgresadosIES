# Fix: Sincronizar "Situación Laboral" del perfil con el Currículum Vitae

**Fecha:** 26 de enero de 2026  
**Rama:** `fix/sync-employment-status-profile-cv`

## 📝 Descripción del Problema

El usuario no podía acceder a su CV desde la página "Mi Perfil" por dos razones:

1. **Enlace incorrecto:** El botón "Mi currículum" apuntaba a `/perfil/mi-cv` (ruta inexistente en frontend)
2. **Falta de autenticación:** El enlace directo no incluía el token JWT necesario para acceder al endpoint protegido

Al intentar acceder, el usuario recibía el error: `{"success":false,"message":"Token de acceso requerido"}`

### Problema Secundario (No encontrado)

Se investigó si la información de "Situación Laboral" se sincronizaba correctamente entre el perfil y el CV. El análisis reveló que:

✅ El backend ya guarda y recupera `situacionLaboral` correctamente  
✅ El CV PDF ya incluye y muestra la situación laboral del perfil  
✅ El formulario de edición permite modificar la situación laboral  
✅ No hay duplicación de datos

## 🔧 Solución Implementada

### Cambios realizados

**Archivo modificado:** [frontend/src/pages/perfil/mi-perfil.astro](../src/pages/perfil/mi-perfil.astro)

#### 1. Cambio del enlace a botón con JavaScript (Línea 45)

```diff
- <a href="/perfil/mi-cv" class="btn-action">Mi currículum</a>
+ <button class="btn-action" onclick="descargarCV()">Mi currículum</button>
```

#### 2. Agregada función de descarga con autenticación (Líneas 1047-1077)

Se implementó una función JavaScript que:
- Obtiene el token JWT de localStorage
- Hace una petición autenticada al endpoint del backend
- Descarga el PDF como archivo
- Maneja errores y redirige al login si no hay sesión

```javascript
async function descargarCV() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debes iniciar sesión para descargar tu CV');
            window.location.href = '/login';
            return;
        }

        const response = await fetch('http://localhost:3000/api/perfil/mi-cv', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al descargar el CV');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mi_Curriculum.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error al descargar CV:', error);
        alert('Error al descargar el currículum. Por favor, intenta nuevamente.');
    }
}
```

**Beneficios de esta implementación:**
- ✅ Incluye el token JWT en los headers de la petición
- ✅ Maneja correctamente la respuesta binaria (PDF)
- ✅ Descarga automática con nombre personalizado
- ✅ Manejo robusto de errores
- ✅ Redirección al login si no hay sesión activa

## ✅ Resultado

Ahora al hacer clic en "Mi currículum" desde la página de perfil:

1. ✅ El sistema verifica que el usuario esté autenticado
2. ✅ Envía el token JWT en el header de autorización
3. ✅ Descarga automáticamente el CV en formato PDF con nombre `Mi_Curriculum.pdf`
4. ✅ El CV incluye la "Situación Laboral" actual del perfil
5. ✅ Maneja errores de red o falta de autenticación correctamente
6. ✅ La información del CV siempre está sincronizada con el perfil

## 🔍 Análisis Técnico Completado

### Backend (Ya funcionaba correctamente)

**Controlador CV:** [backend/src/controllers/cvController.js](../../backend/src/controllers/cvController.js)

La función `downloadMiCV` obtiene todos los datos del perfil incluyendo:
- Línea 31: `p.situacionLaboral` en la consulta SQL
- Líneas 379-392: Renderizado de "SITUACIÓN LABORAL ACTUAL" en el PDF

**Ruta del API:** [backend/src/routes/perfilRoutes.js](../../backend/src/routes/perfilRoutes.js#L103)
```javascript
router.get("/mi-cv", logValidation("Descargar mi CV"), downloadMiCV);
```

### Frontend

**Formulario de edición:** [frontend/src/components/perfil/DatosPersonales.astro](../src/components/perfil/DatosPersonales.astro)
- Líneas 176-187: Campo de selección para situación laboral
- Línea 885: Mapeo correcto al backend: `situacionLaboral: data["situacion-laboral"]`

**Visualización en perfil público:** [frontend/src/pages/perfil/[id].astro](../src/pages/perfil/[id].astro#L1009)
- Muestra correctamente la situación laboral del egresado

## 📊 Flujo de Datos Verificado

```
1. Usuario edita "Situación Laboral" en /perfil/editar
   ↓
2. DatosPersonales.astro mapea: situacionLaboral
   ↓
3. Backend: perfilController.updateMyProfile
   ↓
4. BD: UPDATE Perfil SET situacionLaboral = ?
   ↓
5. Usuario hace clic en "Mi currículum"
   ↓
6. Backend: cvController.downloadMiCV
   ↓
7. Consulta incluye: p.situacionLaboral
   ↓
8. PDF generado con sección "SITUACIÓN LABORAL ACTUAL"
   ↓
9. Descarga/visualización del PDF
```

## 🎯 Alcance del Fix

✅ **Incluido:**
- Corrección del enlace roto del botón "Mi currículum"
- Verificación de sincronización de datos perfil-CV
- Confirmación de funcionamiento correcto del backend
- Documentación completa del flujo de datos

❌ **No incluido (no era necesario):**
- Cambios en backend (ya funcionaba correctamente)
- Cambios en modelo de datos (no hay duplicación)
- Modificación de formularios (ya mapeaban correctamente)

## 🧪 Testing

Para probar la corrección:

1. Iniciar sesión en la aplicación
2. Ir a "Mi Perfil"
3. Hacer clic en el botón "Mi currículum"
4. Verificar que se descarga/abre el PDF correctamente
5. Confirmar que el PDF incluye la sección "SITUACIÓN LABORAL ACTUAL" con el valor del perfil

### Verificación de Sincronización

1. Editar el perfil y cambiar la "Situación Laboral"
2. Guardar los cambios
3. Descargar el CV nuevamente
4. Verificar que el CV muestra el nuevo valor actualizado

## 📚 Notas Técnicas

### Estructura del CV PDF

El PDF generado incluye las siguientes secciones (en orden):
1. Encabezado con nombre y datos de contacto
2. Resumen profesional / Acerca de mí
3. Experiencias laborales
4. Formación académica
5. Cursos y certificaciones
6. **Situación Laboral Actual** ← Sincronizada con el perfil
7. Footer con fecha de generación

### Formato del Endpoint

```
GET /api/perfil/mi-cv
Headers: Authorization: Bearer {token}
Response: application/pdf
```

El endpoint requiere autenticación y retorna directamente el archivo PDF con headers para descarga.

---

**Estado:** ✅ Completado  
**Archivos modificados:** 1  
**Líneas modificadas:** ~35  
**Issue resuelta:** Sincronización situación laboral perfil-CV + acceso autenticado a CV desde mi perfil
