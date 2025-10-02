# Sistema de Autenticación Unificada - Frontend

## 📋 Descripción General

Implementación completa del sistema de login/registro unificado para egresados y administradores del Sistema de Gestión de Egresados IES. Este sistema permite a los usuarios acceder de manera segura y automatizada según su rol.

**Issue:** #11 - Unified Auth Frontend  
**Fecha:** Octubre 2025  
**Estado:** ✅ Completado

> **⚠️ Nota sobre cambios en Backend:**  
> Aunque esta es una tarea de frontend, fue necesario realizar **cambios mínimos en el backend** para que el sistema funcione correctamente. Estos cambios son críticos para la integración y no afectan la lógica de negocio existente. Ver sección "Cambios en Backend" más abajo.

---

## 🎯 Características Implementadas

### 1. **Página de Acceso (`/acceso`)**
- Formulario minimalista con solo DNI y contraseña
- Validación de DNI argentino (7-8 dígitos)
- Toggle de visibilidad de contraseña (icono de ojo)
- Estados de loading y mensajes de error contextuales
- Diseño responsive y accesible

### 2. **Integración con Backend**
- Endpoint: `POST http://localhost:3000/api/auth/login`
- Validación automática de DNI en base de datos
- Registro automático para egresados con DNI válido
- Login directo para administradores
- Manejo de respuestas y errores

### 3. **Gestión de Sesión**
- Almacenamiento de token JWT en localStorage
- Almacenamiento de datos del usuario (DNI, email, tipo)
- Detección automática de usuario autenticado
- Redirección inteligente según rol y estado

### 4. **Navegación Inteligente**
- Botón "Acceder" en header con detección de autenticación
- Oculta botón automáticamente cuando el usuario está logueado
- Redirección según tipo de usuario:
  - Administrador → `/admin`
  - Egresado nuevo → `/completar-perfil`
  - Egresado existente → `/dashboard`

---

## 📂 Estructura de Archivos

```
frontend/
├── src/
│   ├── pages/
│   │   └── acceso.astro              # Página principal de login
│   ├── components/
│   │   └── AccesoForm.astro          # Componente del formulario (opcional)
│   ├── layouts/
│   │   └── BaseLayout.astro          # Layout con header y botón "Acceder"
│   └── utils/
│       └── api.js                    # Funciones de API (apiLogin)
├── public/
│   └── images/
│       ├── logo.png                  # Logo del sistema
│       └── Imagen de Fondo.jpg       # Fondo de la página de acceso
└── docs/
    └── UNIFIED_AUTH.md               # Este documento

backend/ (Cambios mínimos necesarios)
├── src/
│   └── controllers/
│       └── authController.js         # Validación DNI 7-8 dígitos
├── scripts/
│   └── add-valid-dni.js             # Script para agregar DNIs (testing)
└── package.json                      # Script add-dni agregado
```

---

## 🎨 Diseño y Estilo

### Tipografía
- **Título "Acceder":** Inter Bold, 36px, color #1437C3
- **Labels (DNI, Contraseña):** Pontano Sans Bold, 0.95rem
- **Botón "Ingresar":** Pontano Sans Bold, 1.1rem, font-weight 800
- **Inputs:** Sans-serif estándar, 0.95rem

### Colores
- **Fondo principal:** #E6E6E6 (imagen de fondo)
- **Card header:** Imagen "Fondo Azul card.jpg" (75px altura)
- **Card body:** Blanco (#FFFFFF) con border-radius 10px
- **Inputs fondo:** #D9D9D9 (gris claro)
- **Inputs border:** #000000 (1.5px solid)
- **Inputs border (focus):** #1565c0
- **Botón principal:** #5284e0
- **Botón hover:** #3d6fc7
- **Título "Acceder":** #1437C3

### Dimensiones y Espaciado
- **Card:**
  - Max-width: 480px
  - Border-radius: 10px
  - Shadow: 0 6px 20px rgba(0,0,0,0.15)
- **Card Body:**
  - Padding: 1.5rem 3rem 3rem (top, horizontal, bottom)
  - Form container: max-width 340px (centrado)
- **Card Header:**
  - Height: 75px
  - Background: Imagen "Fondo Azul card.jpg"
  - Position: bottom
- **Inputs:**
  - Border-radius: 13px
  - Padding: 0.65rem 0.9rem
- **Botón:**
  - Border-radius: 25px
  - Padding: 0.65rem 2.5rem
  - Min-width: 160px

### Layout
- **Sin scroll:** Página adaptada a 100vh sin necesidad de scroll vertical/horizontal
- **Responsive:** Diseño optimizado para desktop, tablet y móvil
- **Header compacto:** Padding 0.75rem, logo 45px, título 1.75rem
- **Footer compacto:** Padding 1.5rem, textos reducidos (0.875rem, 0.8rem)

---

## 🔧 Cambios en Backend (Justificación)

Aunque esta es una tarea de **frontend**, fue necesario realizar algunos ajustes en el backend para garantizar la correcta integración del sistema de autenticación. Estos cambios son **mínimos, no invasivos** y necesarios para que el frontend funcione correctamente.

### Archivos Modificados en Backend

#### 1. **`backend/src/controllers/authController.js`**
**Cambio:** Validación de DNI de 8 dígitos → 7 u 8 dígitos

**Razón:**
- DNIs argentinos antiguos tienen 7 dígitos
- DNIs argentinos modernos tienen 8 dígitos
- El frontend ya soportaba ambos formatos
- El backend solo aceptaba 8 dígitos, causando errores de validación

**Código modificado:**
```javascript
// ANTES
if (!/^\d{8}$/.test(sanitizedDni)) {
    return res.status(400).json({
        message: "El DNI debe tener exactamente 8 dígitos",
    });
}

// DESPUÉS
if (!/^\d{7,8}$/.test(sanitizedDni)) {
    return res.status(400).json({
        message: "El DNI debe tener 7 u 8 dígitos",
    });
}
```

**Impacto:** Mínimo - Solo amplía la validación, no rompe funcionalidad existente.

---

#### 2. **`backend/package.json`**
**Cambio:** Agregado script `add-dni`

**Razón:**
- Facilitar la gestión de DNIs válidos durante desarrollo y testing
- Permite a desarrolladores agregar DNIs de prueba fácilmente
- Mejora la experiencia de desarrollo del frontend

**Código agregado:**
```json
"scripts": {
  "add-dni": "node scripts/add-valid-dni.js"
}
```

**Impacto:** Ninguno - Solo agrega una herramienta de desarrollo, no afecta la API.

---

#### 3. **`backend/scripts/add-valid-dni.js`** (Nuevo archivo)
**Cambio:** Script interactivo para agregar DNIs válidos

**Razón:**
- Necesario para testing del frontend
- Permite agregar DNIs sin necesidad de SQL manual
- Mejora la experiencia de desarrollo y testing
- No modifica la lógica de negocio, solo es una herramienta

**Funcionalidad:**
```bash
npm run add-dni
# Solicita DNI y carrera interactivamente
# Inserta en tabla DniValido
```

**Impacto:** Ninguno - Herramienta auxiliar que no afecta el runtime de la aplicación.

---

### Justificación General

Estos cambios fueron **estrictamente necesarios** por las siguientes razones:

1. **Compatibilidad:** El frontend necesitaba que el backend acepte DNIs de 7-8 dígitos
2. **Testing:** Sin el script `add-dni`, sería imposible probar el registro de egresados
3. **Desarrollo:** Facilita el flujo de trabajo sin depender de acceso directo a la BD
4. **No invasivos:** No modifican la lógica de autenticación existente
5. **Compatibilidad retroactiva:** Los cambios mantienen la funcionalidad anterior

### Alternativas Consideradas

❌ **Rechazadas:**
- Modificar el frontend para aceptar solo 8 dígitos → DNIs de 7 dígitos son válidos en Argentina
- Usar SQL manual → Dificulta desarrollo y testing
- Crear endpoint API para agregar DNIs → Sobrecarga innecesaria

✅ **Elegida:**
- Cambios mínimos y localizados en backend
- Herramientas de desarrollo que no afectan producción
- Mantiene la separación de responsabilidades

---

## 🔧 Configuración y Uso

### Requisitos Previos
1. Backend corriendo en `http://localhost:3000`
2. Base de datos configurada con tabla `DniValido`
3. Frontend corriendo en `http://localhost:4321`

### Instalación
```bash
cd frontend
npm install
npm run dev
```

### Agregar DNIs Válidos
Para que un egresado pueda registrarse, su DNI debe estar en la tabla `DniValido`:

```bash
cd backend
npm run add-dni
```

O manualmente en SQL:
```sql
INSERT INTO DniValido (dni, carrera) VALUES ('12345678', 'Desarrollo de Software');
```

---

## ✨ Mejoras de UI/UX Implementadas

### Optimización del Layout
- **Eliminación de scroll:** Página adaptada para ocupar exactamente 100vh sin necesidad de scroll vertical/horizontal
- **Header compacto:** Reducido padding (0.75rem), logo (45px) y título (1.75rem) para optimizar espacio
- **Footer compacto:** Padding reducido a 1.5rem con textos más pequeños (0.875rem y 0.8rem)
- **Card responsiva:** Layout que se adapta perfectamente a cualquier tamaño de pantalla

### Mejoras Visuales de la Card
- **Card más ancha:** Max-width aumentado a 480px para mejor balance visual
- **Form container:** Campos limitados a 340px y centrados, creando espacios blancos laterales armoniosos
- **Border-radius optimizado:** 10px para un look más moderno y definido
- **Padding balanceado:** 
  - Superior: 1.5rem
  - Horizontal: 3rem (más espacio en los lados)
  - Inferior: 3rem (más espacio debajo del botón)

### Inputs Mejorados
- **Fondo gris claro:** #D9D9D9 para mejor contraste con el fondo blanco de la card
- **Border-radius:** 13px para bordes redondeados consistentes
- **Tamaño óptimo:** Padding 0.65rem y font-size 0.95rem para mejor legibilidad

### Card Header con Imagen Real
- **Imagen de fondo:** Reemplazado gradiente CSS por imagen real "Fondo Azul card.jpg"
- **Altura:** 75px para mostrar más contenido de la imagen
- **Posición:** background-position: bottom para mejor encuadre
- **Código simplificado:** Eliminado CSS complejo (.card-bg, pseudo-elementos)

### Botón de Acción Principal
- **Texto más grande:** Font-size aumentado a 1.1rem para mejor legibilidad
- **Font-weight:** 800 (Extra Bold) para mayor énfasis
- **Padding balanceado:** 0.65rem vertical y 2.5rem horizontal

### Accesibilidad
- **Focus states:** Indicadores visuales claros en inputs (border azul + shadow)
- **Toggle de contraseña:** Iconos SVG con aria-labels descriptivos
- **Validación de DNI:** Solo permite números, maxlength 8, pattern 7-8 dígitos
- **Mensajes de error:** Visibles, centrados, con fondo de contraste

---

## 🔐 Flujo de Autenticación

### 1. Usuario No Registrado (Egresado)
```
Usuario ingresa DNI + contraseña
    ↓
Backend valida DNI en tabla DniValido
    ↓
✅ DNI válido → Registra usuario automáticamente
    ↓
Genera token JWT
    ↓
Frontend guarda token y redirige a /completar-perfil
```

### 2. Usuario Registrado (Egresado o Admin)
```
Usuario ingresa DNI + contraseña
    ↓
Backend busca usuario en BD
    ↓
Valida contraseña con bcrypt
    ↓
✅ Contraseña correcta → Genera token JWT
    ↓
Frontend guarda token y redirige según rol:
  - Administrador → /admin
  - Egresado → /dashboard
```

### 3. Usuario No Autorizado
```
Usuario ingresa DNI + contraseña
    ↓
Backend valida DNI en tabla DniValido
    ↓
❌ DNI no válido → Rechaza registro
    ↓
Muestra mensaje: "DNI no autorizado para registrarse"
```

---

## 📡 API Reference

### Login Endpoint
```javascript
POST /api/auth/login
Content-Type: application/json

// Request
{
  "dni": "12345678",    // 7-8 dígitos
  "password": "miContraseña123"
}

// Response Success
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "dni": "12345678",
  "email": "usuario@email.com",
  "tipoUsuario": "egresado",  // o "administrador"
  "isNewUser": false           // true si es registro automático
}

// Response Error
{
  "success": false,
  "message": "DNI no autorizado para registrarse como egresado"
}
```

### Frontend API Integration (Centralizada)
```javascript
// frontend/src/utils/api.js
import { authService } from '../utils/api.js';

// Uso en componentes
const data = await authService.login(dni, password);

// Configuración base en api.js
const API_CONFIG = {
  baseURL: import.meta.env.PUBLIC_API_URL || "http://localhost:3000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" }
};

// Servicio de autenticación
export const authService = {
  async login(dni, password) {
    return apiClient.post("/auth/login", { dni, password });
  },
  async logout() { ... },
  async verifyToken() { ... },
  async refreshToken() { ... }
};
```

**✅ Mejora implementada:** Centralización de llamadas API
- ✅ Eliminadas URLs hardcodeadas (`http://localhost:3000/api/auth/login`)
- ✅ Uso de `authService.login()` de `api.js`
- ✅ Configuración centralizada con variables de entorno
- ✅ Manejo consistente de errores y timeouts
- ✅ Aplicado en `acceso.astro` y `AccesoForm.astro`

---

## 🔒 Seguridad

### Frontend
- ✅ Validación de formato de DNI (regex)
- ✅ Sanitización de inputs
- ✅ HTTPS en producción (recomendado)
- ✅ Token almacenado en localStorage (considerar httpOnly cookies en el futuro)
- ✅ Inputs con autocomplete para mejorar UX y seguridad

### Backend
- ✅ Rate limiting (5 intentos por 15 minutos)
- ✅ Hashing de contraseñas con bcrypt
- ✅ Validación y sanitización de inputs
- ✅ Tokens JWT con expiración
- ✅ CORS configurado
- ✅ Logs de seguridad

---

## 📱 Responsive Design

El diseño es completamente responsive:

- **Desktop (>768px):** Card de 440px con espaciado amplio
- **Mobile (<480px):** Card adaptable con padding reducido
- **Tablet (480px-768px):** Tamaños intermedios

---

## 🐛 Manejo de Errores

### Errores Comunes

1. **"DNI y contraseña son requeridos"**
   - Causa: Campos vacíos
   - Solución: Completar ambos campos

2. **"El DNI debe tener exactamente 7 u 8 dígitos"**
   - Causa: DNI con formato incorrecto
   - Solución: Ingresar solo números, 7 u 8 dígitos

3. **"DNI no autorizado para registrarse como egresado"**
   - Causa: DNI no está en tabla DniValido
   - Solución: Contactar al administrador para agregar el DNI

4. **"Contraseña incorrecta"**
   - Causa: Contraseña no coincide
   - Solución: Verificar contraseña o resetear (función futura)

5. **"Error de conexión con el servidor"**
   - Causa: Backend no disponible
   - Solución: Verificar que el backend esté corriendo

### Problema de Parpadeo del Botón (RESUELTO)

**Problema:** El botón "Acceder" aparecía y desaparecía (flickering) en el index.

**Causa:** El script JavaScript se ejecutaba después del renderizado, causando un flash visual cuando ocultaba el botón para usuarios autenticados.

**Solución implementada:**
```css
/* CSS - Ocultar inicialmente el botón */
#acceder-btn {
    visibility: hidden;
}
#acceder-btn.show {
    visibility: visible;
}
```

```javascript
// JavaScript - Mostrar solo si no hay token
if (!token) {
    accederBtn.classList.add('show');
}
```

Esto previene el **FOUC (Flash of Unstyled Content)** y garantiza que el botón se muestre de forma estable.

---

## 🚀 Mejoras Futuras

### Próximas Iteraciones
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Login con Google/OAuth
- [ ] Remember me (sesión persistente)
- [ ] Cambio de contraseña
- [ ] 2FA (autenticación de dos factores)
- [ ] Migrar token a httpOnly cookies
- [ ] Rate limiting visual (contador de intentos)
- [ ] Animaciones y transiciones mejoradas

---

## 👥 Roles y Permisos

### Egresado
- ✅ Puede registrarse si su DNI está autorizado
- ✅ Acceso a su perfil y dashboard
- ✅ No puede acceder a funciones de administrador

### Administrador
- ✅ No necesita DNI válido (ya registrado previamente)
- ✅ Acceso a panel de administración
- ✅ Puede gestionar egresados y contenido

---

## 📊 Datos Almacenados

### localStorage
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIs...",  // JWT token
  "user": {
    "dni": "12345678",
    "tipoUsuario": "egresado",
    "email": "usuario@email.com"
  }
}
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Registrar egresado con DNI válido
- [ ] Intentar registrar con DNI inválido
- [ ] Login con administrador
- [ ] Login con egresado existente
- [ ] Verificar redirecciones según rol
- [ ] Probar toggle de visibilidad de contraseña
- [ ] Verificar mensajes de error
- [ ] Probar en diferentes dispositivos
- [ ] Verificar que botón "Acceder" desaparece al loguearse

---

## 📞 Soporte

Para reportar problemas o sugerencias:
- Issue Tracker: GitHub Issues
- Documentación: `/frontend/docs/`

---

## 📝 Changelog

### Version 1.0.0 (Octubre 2025)
- ✅ Implementación inicial del sistema de login
- ✅ Página de acceso con formulario
- ✅ Integración con backend
- ✅ Navegación inteligente con detección de autenticación
- ✅ Diseño responsive y accesible
- ✅ Toggle de visibilidad de contraseña
- ✅ Prevención de FOUC (Flash of Unstyled Content) en botón "Acceder"
- ✅ Documentación completa

### Version 1.0.1 (Octubre 2025)
- 🐛 Fix: Parpadeo del botón "Acceder" resuelto con visibility CSS
- 📝 Documentación actualizada con solución de problemas

---

**Desarrollado para:** Sistema de Gestión de Egresados IES  
**Tecnologías:** Astro, JavaScript, HTML5, CSS3  
**Última actualización:** Octubre 2025
