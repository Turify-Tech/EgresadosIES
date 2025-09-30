# 🔐 Autenticación Unificada - Issue #9

## 📋 Resumen

Se implementó un sistema de autenticación unificada que maneja tanto **egresados** como **administradores** en un único endpoint, con registro automático para egresados válidos.

## 🚀 Funcionalidades Implementadas

### ✅ Endpoint Principal
- **`POST /api/auth/login`** - Autenticación unificada

### ✅ Características Principales

1. **Login de Administradores**
   - Busca en tabla `Administrador` por DNI
   - Valida contraseña encriptada
   - Retorna JWT token

2. **Login/Registro de Egresados**
   - Busca en tabla `Egresado` por DNI
   - Si existe: valida contraseña y hace login
   - Si NO existe: **registro automático**

3. **Registro Automático**
   - Valida DNI contra tabla `DniValido`
   - Crea automáticamente:
     - Registro en `Usuario`
     - Registro en `Egresado`
     - `Perfil` vacío asociado
   - Email temporal: `{dni}@temp.ies.edu.ar`

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
DNI: 00000000 (configurado en .env)
Password: temporal123
→ Login exitoso, tipo_usuario: "Administrador"
```

### Caso 2: Egresado Existente
```
DNI: 12345678 (ya registrado)
Password: su_password
→ Login exitoso, tipo_usuario: "Egresado", isNewUser: false
```

### Caso 3: Egresado Nuevo (Registro Automático)
```
DNI: 87654321 (existe en DniValido)
Password: nueva_password
→ Registro automático + Login, isNewUser: true
```

### Caso 4: DNI No Válido
```
DNI: 99999999 (NO existe en DniValido)
→ Error: "DNI no está autorizado para registrarse"
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