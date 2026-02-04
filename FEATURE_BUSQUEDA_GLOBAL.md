# Búsqueda Global en Navbar - Feature Implementation

## 📋 Descripción

Implementación de la barra de búsqueda global en el navbar del sistema EgresadosIES, permitiendo a los usuarios buscar contenido en todo el sistema desde un único punto de acceso.

## 🎯 Funcionalidades Implementadas

### Backend

✅ **Endpoint de búsqueda global** (`GET /api/busqueda/global`)
- Busca en múltiples entidades: personas, publicaciones, habilidades, carreras, instituciones, estados laborales
- Retorna resultados agrupados por categoría
- Límite de 10 resultados por categoría

✅ **Endpoint de sugerencias** (`GET /api/busqueda/sugerencias`)
- Autocompletado mientras el usuario escribe
- Búsqueda en personas, carreras, habilidades técnicas y estados laborales
- Límite de 10 sugerencias totales (5 por categoría)
- Incluye tipo de sugerencia para diferenciación visual

### Frontend

✅ **Componente SearchBar**
- Ubicado en: `frontend/src/components/busqueda/SearchBar.astro`
- Autocompletado con dropdown de sugerencias
- Debounce de 300ms para optimizar peticiones
- Botón de limpieza de búsqueda
- Loader visual durante peticiones
- Navegación con teclado (Enter para buscar, Escape para cerrar)
- Cierre de sugerencias al hacer click fuera

✅ **Página de Resultados**
- Ubicada en: `frontend/src/pages/busqueda/resultados.astro`
- Filtros por categoría (Todos, Personas, Publicaciones, Carreras, Tecnologías)
- Contadores de resultados por categoría
- Diseño de cards diferenciado por tipo de resultado
- Estados: loading, sin resultados, resultados
- Responsive design

✅ **Integración en Navbar**
- Barra de búsqueda visible para todos los usuarios (autenticados y no autenticados)
- Posicionada entre el logo y los íconos de usuario
- Responsive: oculta en móvil para mantener el header limpio
- Anchos adaptativos según tamaño de pantalla

## 📁 Archivos Creados

### Backend
- `backend/src/controllers/busquedaController.js` - Funciones `busquedaGlobal` y `obtenerSugerencias` agregadas
- `backend/src/routes/busquedaRoutes.js` - Rutas `/global` y `/sugerencias` agregadas

### Frontend
- `frontend/src/components/busqueda/SearchBar.astro` - Componente de barra de búsqueda
- `frontend/src/pages/busqueda/resultados.astro` - Página de resultados
- `frontend/src/styles/search-bar.css` - Estilos del componente SearchBar
- `frontend/src/styles/search-results.css` - Estilos de la página de resultados

### Modificados
- `frontend/src/layouts/BaseLayout.astro` - Integración del SearchBar en el header

## 🔍 Endpoints API

### Búsqueda Global
```
GET /api/buscar/global?query=texto
```

**Respuesta:**
```json
{
  "success": true,
  "query": "desarrollo",
  "resultados": {
    "personas": [...],
    "publicaciones": [...],
    "lenguajes": [...],
    "carreras": [...],
    "instituciones": [...],
    "estadosLaborales": [...]
  },
  "timestamp": "2026-01-27T..."
}
```

### Sugerencias
```
GET /api/buscar/sugerencias?query=des
```

**Respuesta:**
```json
{
  "success": true,
  "query": "des",
  "sugerencias": [
    {
      "sugerencia": "Desarrollo de Software",
      "tipo": "carrera"
    },
    {
      "sugerencia": "JavaScript",
      "tipo": "habilidad"
    }
  ],
  "timestamp": "2026-01-27T..."
}
```

## 🎨 Características de UX/UI

- **Iconos visuales**: Cada tipo de sugerencia tiene su propio emoji (👤 persona, 🎓 carrera, 💻 habilidad, 💼 estado laboral)
- **Etiquetas de tipo**: Tags de colores para identificar rápidamente el tipo de resultado
- **Animaciones**: Transiciones suaves en hover, slide-in de sugerencias
- **Feedback visual**: Loader durante búsquedas, mensajes informativos
- **Responsive**: Adaptación a diferentes tamaños de pantalla

## ✅ Criterios de Aceptación Cumplidos

- ✅ La barra de búsqueda funciona desde cualquier vista (para todos los usuarios)
- ✅ Se muestran sugerencias mientras el usuario escribe (mínimo 2 caracteres)
- ✅ La búsqueda filtra información de todo el sistema (personas, publicaciones, carreras, habilidades, etc.)
- ✅ La búsqueda encuentra personas por: nombre, apellido, carrera, habilidades, proyectos, experiencia laboral
- ✅ Los resultados se agrupan y pueden filtrarse por categoría
- ✅ El diseño es coherente con el sistema existente
- ✅ No hay errores en consola ni en la API
- ✅ Los estilos están en archivos CSS separados (no inline)

## 🚀 Cómo Usar

1. **Cualquier usuario**: La barra de búsqueda está siempre visible en el navbar
2. **Escribir consulta**: Ingresar al menos 2 caracteres para ver sugerencias
3. **Seleccionar sugerencia**: Click en una sugerencia para buscar
4. **Ver resultados**: Los resultados se muestran en `/busqueda/resultados`
5. **Filtrar**: Usar los botones de categoría para filtrar resultados

## 🔍 Alcance de Búsqueda

La búsqueda en personas incluye:
- Nombre y apellido
- Título profesional
- Área de interés
- Carrera
- Situación laboral
- **Habilidades técnicas** (ej: Python, JavaScript, Java)
- Experiencia laboral (puesto y empresa)
- Proyectos (nombre y tecnologías)

## 📱 Responsive Behavior

- **Desktop (>1025px)**: Barra de búsqueda con ancho máximo de 400px
- **Tablet (769-1024px)**: Ancho máximo de 300px
- **Mobile (<768px)**: Barra de búsqueda oculta para mantener el header limpio

## 🔧 Configuración

La URL de la API se puede configurar mediante la variable de entorno:
```
PUBLIC_API_URL=http://localhost:3000
```

Por defecto usa `http://localhost:3000` si no está configurada.

## 📝 Notas Técnicas

- Los resultados están limitados a perfiles públicos (`perfilPublico = 1`)
- La búsqueda usa LIKE parcial para búsquedas flexibles
- Debounce de 300ms para optimizar peticiones al backend
- Sugerencias limitadas a 10 resultados totales
- Resultados de búsqueda global limitados a 10 por categoría
