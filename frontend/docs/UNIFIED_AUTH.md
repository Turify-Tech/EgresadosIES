# Sistema de Autenticación Unificada - Frontend

## 📋 Descripción General

Implementación completa del sistema de login/registro unificado para egresados y administradores del Sistema de Gestión de Egresados IES. Este sistema permite a los usuarios acceder de manera segura y automatizada según su rol.

**Issue:** #11 - Unified Auth Frontend  
**Fecha:** Octubre 2025  
**Estado:** ✅ Completado

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
```

---

## 🎨 Diseño y Estilo

### Tipografía
- **Header y títulos:** Inter (Bold, 56px)
- **Labels y botones:** Pontano Sans (Bold)
- **Inputs:** Sans-serif estándar

### Colores
- **Fondo principal:** #E6E6E6
- **Card header:** Gradiente azul (#2196F3 → #1976D2 → #0D47A1)
- **Botón principal:** #5284e0
- **Botón hover:** #3d6fc7
- **Bordes inputs:** #000000
- **Título:** #1565c0

### Componentes
- Card blanca con sombra y bordes redondeados
- Header azul con efectos decorativos
- Inputs con bordes redondeados (20px)
- Botón compacto con bordes redondeados (25px)
- Toggle de contraseña con iconos SVG

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
  "dni": "12345678",
  "password": "miContraseña123"
}

// Response Success
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "dni": "12345678",
  "email": "usuario@email.com",
  "tipoUsuario": "egresado",
  "isNewUser": false
}

// Response Error
{
  "success": false,
  "message": "DNI no autorizado para registrarse como egresado"
}
```

### Frontend API Function
```javascript
// frontend/src/utils/api.js
export async function apiLogin(dni, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password })
    });
    return await res.json();
  } catch (err) {
    return { message: 'No se pudo conectar al servidor' };
  }
}
```

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
- ✅ Documentación completa

---

**Desarrollado para:** Sistema de Gestión de Egresados IES  
**Tecnologías:** Astro, JavaScript, HTML5, CSS3  
**Última actualización:** Octubre 2025
