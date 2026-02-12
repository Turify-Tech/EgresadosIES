# Sistema de Menciones con @ - Documentación

## 📝 Descripción

Sistema completo de menciones para publicaciones y comentarios que permite a los egresados mencionar a otros usuarios con `@` y genera notificaciones automáticas integradas al sistema existente.

## ✅ Funcionalidades Implementadas

### Backend

#### 1. **Endpoint de Búsqueda de Egresados**
- **Ruta:** `GET /api/egresados/buscar`
- **Descripción:** Busca egresados por nombre para el autocomplete
- **Parámetros:**
  - `query` (string): Texto de búsqueda
  - `limit` (number, opcional): Límite de resultados (default: 10)
- **Respuesta:**
```json
{
  "egresados": [
    {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "nombreCompleto": "Juan Pérez",
      "email": "juan@example.com",
      "carrera": "Desarrollo de Software",
      "fotoPerfil": "url..."
    }
  ],
  "total": 1
}
```

#### 2. **Endpoint de Información de Egresados**
- **Ruta:** `POST /api/egresados/info`
- **Descripción:** Obtiene información de múltiples egresados por IDs
- **Body:**
```json
{
  "ids": [1, 2, 3]
}
```

#### 3. **Procesamiento de Menciones**
- **Servicio:** `notificationService.detectarMenciones(texto)`
- **Formato:** Las menciones se almacenan como `@[id:123]`
- **Validación:** Solo egresados válidos pueden ser mencionados
- **Integración:** Se integra automáticamente en:
  - Creación de publicaciones
  - Creación de comentarios
  - Respuestas a comentarios

#### 4. **Sistema de Notificaciones**
- **Método:** `notificationService.notificarMencion()`
- **Características:**
  - Notificación interna en la base de datos
  - Email opcional según preferencias del usuario
  - No duplica notificaciones
  - No notifica si el usuario se menciona a sí mismo
- **Tipo:** `'mencion'` en la tabla de notificaciones

### Frontend

#### 1. **Componente MentionSystem**
- **Ubicación:** `/frontend/src/utils/mentionSystem.js`
- **Funcionalidades:**
  - Detección automática del carácter `@`
  - Autocomplete en tiempo real con debounce
  - Navegación por teclado (flechas, Enter, Escape)
  - Filtrado por coincidencia parcial
  - Inserción automática de menciones
  - Posicionamiento inteligente del dropdown

**Uso:**
```javascript
import MentionSystem from '../utils/mentionSystem.js';

const mentionSystem = new MentionSystem('textarea-id', {
    minChars: 0,
    maxResults: 10,
    debounceMs: 300,
    onSelect: (egresado) => {
        console.log('Usuario seleccionado:', egresado);
    }
});
```

#### 2. **Helper de Formateo**
- **Ubicación:** `/frontend/src/utils/mentionHelper.js`
- **Funciones:**
  - `formatearMenciones(texto, egresados)`: Convierte `@[id:123]` a HTML visual
  - `extraerMencionesIds(texto)`: Extrae IDs de menciones
  - `obtenerInfoEgresados(ids)`: Obtiene info desde la API
  - `procesarTextoConMenciones(texto)`: Proceso completo de formateo

**Uso:**
```javascript
import { procesarTextoConMenciones } from '../utils/mentionHelper.js';

const textoHTML = await procesarTextoConMenciones(comentario.contenido);
```

#### 3. **Estilos CSS**
- **Ubicación:** `/frontend/src/styles/mentions.css`
- **Componentes estilizados:**
  - `.mention-autocomplete-container`: Dropdown de sugerencias
  - `.mention-autocomplete-item`: Cada sugerencia
  - `.mention-avatar`: Avatar del usuario
  - `.mention-name` y `.mention-career`: Info del usuario
  - `.mention`: Mención en texto (formato visual)

## 🎯 Formato de Menciones

### Almacenamiento (Backend)
```
@[id:123]
```
- Formato técnico usado internamente
- Permite validación y procesamiento confiable
- No depende de cambios en nombres de usuario

### Visualización (Frontend)
```html
<span class="mention" data-user-id="123">@NombreUsuario</span>
```
- Formato amigable para el usuario
- Con estilos destacados (fondo azul, negrita)
- Interactivo (hover, click)

## 🔧 Integración en el Sistema

### En Publicaciones
1. Usuario escribe `@` en el textarea
2. Aparece el autocomplete
3. Usuario selecciona un egresado
4. Se inserta como `@[id:123]`
5. Al publicar, el backend detecta y notifica

### En Comentarios
1. Mismo flujo que publicaciones
2. Funciona tanto en comentarios principales como respuestas
3. Sistema de menciones se inicializa al abrir el modal

## 📊 Flujo Completo

```
Usuario escribe @ → MentionSystem detecta
                  ↓
         API: GET /api/egresados/buscar
                  ↓
         Muestra autocomplete
                  ↓
         Usuario selecciona
                  ↓
         Inserta @[id:123]
                  ↓
         Usuario publica/comenta
                  ↓
    Backend: detectarMenciones(texto)
                  ↓
    Backend: notificarMencion() para cada ID
                  ↓
    Crea notificación en BD
                  ↓
    Envía email (si está habilitado)
```

## 🛠️ Archivos Modificados/Creados

### Backend
- ✅ `backend/src/controllers/egresadosController.js` - NUEVO
- ✅ `backend/src/routes/egresadosRoutes.js` - NUEVO
- ✅ `backend/src/app.js` - Agregada ruta de egresados
- ✅ `backend/src/controllers/publicacionesController.js` - Integración de menciones
- ✅ `backend/src/controllers/comentariosController.js` - Ajuste de parámetros
- ✅ `backend/src/services/notificationService.js` - Mejorado método de menciones

### Frontend
- ✅ `frontend/src/utils/mentionSystem.js` - NUEVO
- ✅ `frontend/src/utils/mentionHelper.js` - NUEVO
- ✅ `frontend/src/styles/mentions.css` - NUEVO
- ✅ `frontend/src/pages/index.astro` - Integración en publicaciones y comentarios
- ✅ `frontend/src/components/ComentariosModal.astro` - Actualizado a textarea
- ✅ `frontend/src/styles/comentarios-modal.css` - Soporte para textarea

## 🎨 Características de UX

1. **Autocomplete Inteligente**
   - Aparece inmediatamente al escribir `@`
   - Filtrado en tiempo real
   - Muestra avatar, nombre y carrera
   - Navegación por teclado completa

2. **Feedback Visual**
   - Menciones destacadas con fondo azul
   - Hover effect en el autocomplete
   - Indicador de selección activa
   - Scroll automático en lista larga

3. **Responsividad**
   - Funciona en móviles y tablets
   - Ajuste automático de tamaño
   - Touch-friendly

## 🔒 Seguridad

- ✅ Solo usuarios autenticados pueden buscar
- ✅ Solo egresados pueden ser mencionados (no admins)
- ✅ Validación de IDs en backend
- ✅ Protección contra auto-menciones
- ✅ Rate limiting en búsquedas
- ✅ Sanitización de entrada

## 📝 Uso para Desarrolladores

### Agregar Menciones a un Nuevo Componente

```javascript
// 1. Importar el sistema
import MentionSystem from '../utils/mentionSystem.js';

// 2. Inicializar en textarea
const mentionSystem = new MentionSystem('mi-textarea-id');

// 3. Limpiar al destruir componente
mentionSystem.destroy();
```

### Formatear Texto con Menciones

```javascript
import { procesarTextoConMenciones } from '../utils/mentionHelper.js';

// Texto con @[id:123]
const textoConMenciones = comentario.contenido;

// HTML con menciones formateadas
const html = await procesarTextoConMenciones(textoConMenciones);
element.innerHTML = html;
```

## ✅ Criterios de Aceptación Cumplidos

- [x] Se puede mencionar usuarios egresados con `@` en publicaciones
- [x] Se puede mencionar usuarios egresados con `@` en comentarios
- [x] El autocomplete solo muestra egresados
- [x] El filtrado funciona por coincidencia parcial
- [x] Al mencionar a un egresado, este recibe una notificación
- [x] Se reutiliza el sistema de notificaciones existente
- [x] No hay lógica inline
- [x] No hay errores en consola ni en la API
- [x] La solución es reutilizable y escalable
- [x] Código limpio, desacoplado y mantenible

## 🚀 Próximos Pasos (Opcional)

1. **Click en Menciones**: Navegar al perfil del usuario mencionado
2. **Notificaciones en Tiempo Real**: WebSockets para notificaciones instantáneas
3. **Historial de Menciones**: Ver quién te ha mencionado
4. **Preferencias de Menciones**: Permitir/bloquear menciones
5. **Analytics**: Estadísticas de menciones más frecuentes

## 🐛 Troubleshooting

### El autocomplete no aparece
- Verificar que el token esté en localStorage
- Verificar que el textarea tenga el ID correcto
- Revisar consola para errores de red

### Las menciones no se formatean
- Verificar que mentionHelper.js esté importado
- Verificar que los IDs sean válidos
- Verificar conexión con API

### No se envían notificaciones
- Verificar que el usuario mencionado sea egresado
- Verificar que no haya auto-menciones
- Revisar logs del backend

## 📞 Contacto y Soporte

Para preguntas o issues, contactar al equipo de desarrollo.

---

**Versión:** 1.0.0  
**Fecha:** 11 de febrero de 2026  
**Estado:** ✅ Completado e implementado
