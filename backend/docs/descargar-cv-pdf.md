# Funcionalidad: Descargar CV en PDF

## 📋 Descripción General

Se ha implementado la funcionalidad completa para que los egresados puedan descargar su Curriculum Vitae en formato PDF desde el sistema. Esta característica permite generar un documento profesional con toda la información del perfil del usuario.

## 🎯 Alcance

### Contenido del PDF

El CV generado incluye las siguientes secciones:

1. **Datos Personales**
   - Nombre completo
   - Email y teléfono
   - DNI
   - Ubicación (ciudad, provincia, país)
   - URL del portfolio (si está disponible)

2. **Resumen Profesional**
   - Descripción profesional del egresado

3. **Experiencia Laboral**
   - Puesto y empresa
   - Fechas (inicio - fin o "Actualidad")
   - Descripción de las responsabilidades

4. **Formación Académica**
   - Título obtenido
   - Institución educativa
   - Año de finalización

5. **Cursos y Certificaciones**
   - Nombre del curso
   - Institución que lo otorga
   - Duración en horas

6. **Habilidades** ✨ (NUEVA)
   - Listado de todas las habilidades registradas

7. **Situación Laboral Actual**
   - Estado actual del egresado en el mercado laboral

## 🔧 Implementación Técnica

### Backend

**Archivo:** `backend/src/controllers/cvController.js`

**Endpoint:** `GET /api/perfil/mi-cv`

**Cambios realizados:**

1. Se agregó la consulta para obtener las habilidades del perfil:
```javascript
// Obtener habilidades
let habilidades = [];
if (perfilId) {
    const habilidadesResult = await client.execute({
        sql: "SELECT * FROM Habilidad WHERE perfilId = ? ORDER BY nombre ASC",
        args: [perfilId],
    });
    habilidades = habilidadesResult.rows;
}
```

2. Se actualizó la función `generarContenidoPDF()` para incluir habilidades:
```javascript
function generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos, habilidades)
```

3. Se agregó una nueva sección "HABILIDADES" en el PDF:
   - Las habilidades se muestran en formato de lista separada por bullets (•)
   - Se respeta el diseño y formato del resto del documento
   - Se maneja el paginado automático si el contenido excede el espacio disponible

**Tecnologías utilizadas:**
- `pdfkit`: Biblioteca para generar PDFs
- `@libsql/client`: Cliente para consultas a la base de datos

### Frontend

**Archivo:** `frontend/src/pages/perfil/mi-perfil.astro`

**Cambios realizados:**

1. **Actualización del botón de descarga:**
   - Texto cambiado de "Mi Currículum" a "Descargar CV en PDF"
   - Se agregó un icono de descarga para mejor UX
   - Se aplicaron estilos visuales con gradiente distintivo

2. **Mejoras en la función `descargarCV()`:**
   - Mensaje informativo al iniciar la descarga
   - Mejor manejo de errores con mensajes descriptivos
   - Validación del tamaño del archivo generado
   - Nombre de archivo dinámico con fecha: `CV_YYYY-MM-DD.pdf`
   - Limpieza mejorada de recursos (URL.revokeObjectURL)

3. **Estilos CSS agregados:**
```css
.btn-download-cv {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;
}

.btn-download-cv:hover {
    background: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}
```

## 🔐 Seguridad

- **Autenticación requerida:** Solo los usuarios autenticados pueden descargar su CV
- **Token Bearer:** Se utiliza autenticación JWT para validar la identidad del usuario
- **Datos privados:** Cada usuario solo puede descargar su propio CV (validado por `req.user.id`)

## 📱 Experiencia de Usuario

### Flujo de descarga:

1. El usuario navega a "Mi Perfil"
2. Hace clic en el botón "Descargar CV en PDF"
3. Se muestra el mensaje: "Generando tu CV en PDF..."
4. El backend genera el PDF con toda la información actualizada
5. El archivo se descarga automáticamente con el nombre `CV_YYYY-MM-DD.pdf`
6. Se muestra la confirmación: "✓ CV descargado correctamente"

### Manejo de errores:

- Si no hay sesión activa: Redirección a login
- Si hay error en el servidor: Mensaje descriptivo del error
- Si el PDF está vacío: Mensaje de validación

## ✅ Criterios de Aceptación Cumplidos

- ✅ El egresado puede descargar su CV en PDF
- ✅ El PDF contiene solo su curriculum (no incluye publicaciones ni portfolio)
- ✅ La información coincide con el CV visible en la plataforma
- ✅ El archivo se descarga correctamente
- ✅ No hay errores visuales ni de datos
- ✅ El contenido está actualizado según la información cargada
- ✅ Se respeta la estructura visual del CV con formato profesional
- ✅ Funcionalidad disponible solo para el egresado en su propio perfil

## 🎨 Diseño del PDF

El PDF generado utiliza:

- **Colores corporativos:**
  - Primario: `#2563eb` (azul)
  - Secundario: `#64748b` (gris)
  - Texto: `#1e293b` (negro suave)

- **Tipografía:**
  - Helvetica-Bold para títulos
  - Helvetica para contenido
  - Helvetica-Oblique para fechas

- **Estructura:**
  - Márgenes de 50px
  - Espaciado consistente entre secciones
  - Líneas separadoras para mejor organización
  - Manejo automático de paginación

## 🧪 Testing

### Casos de prueba recomendados:

1. **Usuario con perfil completo:**
   - Verificar que todas las secciones aparezcan correctamente
   - Validar formato de fechas
   - Confirmar que las habilidades se muestren en el orden correcto

2. **Usuario con perfil incompleto:**
   - Verificar que solo aparezcan las secciones con datos
   - Confirmar que no hay espacios vacíos innecesarios

3. **Usuario sin habilidades:**
   - Validar que la sección de habilidades no aparezca
   - Verificar que el resto del CV se muestre correctamente

4. **Usuario con muchas experiencias/formaciones:**
   - Confirmar que el paginado funcione correctamente
   - Validar que no haya cortes de información a mitad de sección

5. **Seguridad:**
   - Intentar descargar sin estar autenticado
   - Verificar que cada usuario solo descargue su propio CV

## 📝 Notas Adicionales

- El PDF se genera en tiempo real con los datos más actuales del usuario
- No se almacenan archivos PDF en el servidor (se genera on-demand)
- El diseño es responsive dentro del formato PDF
- El footer incluye la fecha de generación del documento

## 🔄 Mejoras Futuras Sugeridas

1. Permitir personalización del diseño del CV (plantillas)
2. Opción de incluir/excluir secciones específicas
3. Generar CV en diferentes idiomas
4. Agregar foto de perfil en el CV
5. Compartir CV mediante link público temporal
6. Estadísticas de descargas del CV

---

**Issue:** #127 - Nueva funcionalidad: Descargar CV a PDF  
**Branch:** `feature/descargar-cv-pdf`  
**Fecha:** 3 de febrero de 2026
