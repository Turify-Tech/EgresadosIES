# 🔐 Autenticación Unificada - Issue #9

## 📋 Resumen

Sistema de autenticación unificada que maneja tanto **egresados** como **administradores**. Los egresados deben registrarse primero con sus datos completos antes de poder iniciar sesión (similar a Facebook/Instagram).

## 🚀 Funcionalidades Implementadas

### ✅ Endpoints Principales
- **`POST /api/auth/login`** - Login para usuarios registrados
- **`POST /api/auth/register`** - Registro completo de nuevos egresados

### ✅ Características Principales

1. **Login de Administradores**
   - Busca en tabla `Administrador` por DNI
   - Valida contraseña encriptada
   - Retorna JWT token

2. **Login de Egresados**
   - Busca en tabla `Egresado` por DNI
   - Si existe: valida contraseña y hace login
   - Si NO existe: retorna error indicando que debe registrarse

3. **Registro Completo de Egresados**
   - Requiere: nombre, apellido, email, DNI y contraseña
   - Valida DNI contra tabla `DniValido`
   - Crea:
     - Registro en `Usuario` con datos completos
     - Registro en `Egresado`
     - `Perfil` vacío asociado
     - `PreferenciasNotificacion` con valores por defecto

## 📁 Archivos Creados/Modificados

### 🆕 Archivos Nuevos
- `src/controllers/authController.js` - Controlador principal
- `src/routes/authRoutes.js` - Rutas de autenticación

### ✏️ Archivos Modificados
- `src/app.js` - Agregadas rutas auth y conexión BD
- `src/utils/bcrypt.js` - Corregido import a bcryptjs
- `scripts/create-admin.js` - Corregido para ES modules

## 🔧 Uso del Endpoint

### Request
```http
POST /api/auth/login
Content-Type: application/json

{
    "dni": "12345678",
    "password": "mipassword123"
}
```

### Response Exitosa
```json
{
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "nombre": "Usuario Nombre",
        "email": "usuario@email.com",
        "tipo_usuario": "Egresado|Administrador",
        "isNewUser": true  // Solo para egresados nuevos
    }
}
```

### Response de Error
```json
{
    "success": false,
    "message": "DNI o contraseña incorrectos"
}
```

## 🛡️ Validaciones Implementadas

1. **DNI**: Debe tener exactamente 8 dígitos
2. **Campos requeridos**: dni y password obligatorios
3. **DNI válido**: Debe existir en tabla `DniValido` para registro
4. **Contraseña**: Encriptada con bcryptjs (12 rounds)
5. **Transacciones**: Registro atómico para consistencia

## 🗂️ Casos de Uso

### Caso 1: Administrador Existente
```
POST /api/auth/login
DNI: 00000000 (configurado en .env)
Password: temporal123
→ Login exitoso, tipo_usuario: "Administrador"
```

### Caso 2: Egresado Existente
```
POST /api/auth/login
DNI: 12345678 (ya registrado)
Password: su_password
→ Login exitoso, tipo_usuario: "Egresado"
```

### Caso 3: Egresado Nuevo (Debe Registrarse)
```
POST /api/auth/login
DNI: 87654321 (existe en DniValido pero no en Egresado)
Password: cualquiera
→ Error 401: "El DNI no está registrado. Por favor, regístrate primero."
   requiresRegistration: true
```

### Caso 4: Registro de Nuevo Egresado
```
POST /api/auth/register
Body: {
  nombre: "Juan",
  apellido: "Pérez",
  dni: "87654321",
  email: "juan.perez@email.com",
  password: "mipassword123"
}
→ Validaciones:
  1. DNI existe en DniValido ✅
  2. Email no está registrado ✅
  3. DNI no está registrado ✅
→ Registro exitoso + token JWT
```

### Caso 5: DNI No Autorizado
```
POST /api/auth/register
DNI: 99999999 (NO existe en DniValido)
→ Error 400: "DNI no está autorizado para registrarse. Contacte al administrador."
```

## 🧪 Testing

### Health Check
```bash
GET http://localhost:3000/api/health
```

### Servidor de Desarrollo
```bash
cd backend
npm run dev
```

## 📊 Datos de Prueba Necesarios

Para testing completo, asegúrate de tener:

1. **Carrera en BD**:
   ```sql
   INSERT INTO Carrera (nombre) VALUES ('Desarrollo de Software');
   ```

2. **DNI Válido**:
   ```sql
   INSERT INTO DniValido (dni, carrera) VALUES ('12345678', 'Desarrollo de Software');
   ```

3. **Administrador** (usar script):
   ```bash
   npm run create-admin
   ```

## 🔄 Flujo de Autenticación

```
POST /api/auth/login
    ↓
Validar formato DNI (8 dígitos)
    ↓
Buscar en tabla Egresado
    ↓ (no encontrado)
Buscar en tabla Administrador  
    ↓ (no encontrado)
Validar en DniValido
    ↓ (válido)
Crear Usuario + Egresado + Perfil
    ↓
Generar JWT + Respuesta exitosa
```

## 🚨 Notas Importantes

- **JWT Secret**: Configurado en `.env` como `JWT_SECRET`
- **Conexión BD**: Turso con autenticación por token
- **Email temporal**: Se genera automáticamente para nuevos egresados
- **Transacciones**: Todo el registro es atómico (rollback en error)
- **Tipos de usuario**: "Egresado" | "Administrador" (case-sensitive)

---

**Implementado por**: Equipo de Desarrollo  
**Fecha**: 30/Septiembre/2025  
**Issue**: #9 - Unified Auth Backend