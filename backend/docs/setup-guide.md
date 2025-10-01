# 🚀 Guía de Configuración Inicial - Sistema de Gestión de Egresados IES

## 📋 Pasos para Configuración Inicial

### 1. **Instalar Dependencias**
```bash
cd backend
npm install
```

### 2. **Configurar Variables de Entorno**
Verificar que existe el archivo `.env` con todas las variables necesarias.

### 3. **Crear Base de Datos y Tablas**
```bash
npm run migrate
```

### 4. **Configurar Datos de Prueba (Opcional pero Recomendado)**
```bash
node scripts/setup-test-data.js
```

Este script creará:
- ✅ **Administrador**: DNI `00000000`, password `temporal123`
- ✅ **Carrera**: "Desarrollo de Software"
- ✅ **DNIs Válidos**: `12345678`, `87654321`, `11111111` para registro de egresados

### 5. **Iniciar Servidor**
```bash
npm run dev
```

Servidor disponible en: `http://localhost:3000`

---

## 🔐 Credentials de Acceso

### Administrador
- **DNI**: `00000000`
- **Password**: `temporal123`

### Egresados (Registro Automático)
Los egresados pueden registrarse automáticamente usando cualquiera de estos DNIs válidos:
- **DNI**: `12345678` (usar cualquier contraseña)
- **DNI**: `87654321` (usar cualquier contraseña)  
- **DNI**: `11111111` (usar cualquier contraseña)

---

## 🧪 Testing de Endpoints

### 1. **Login de Administrador**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"00000000","password":"temporal123"}'
```

### 2. **Registro Automático de Egresado**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"dni":"12345678","password":"mipassword"}'
```

### 3. **Obtener Perfil (usar token del paso anterior)**
```bash
curl -X GET http://localhost:3000/api/perfil/mi-perfil \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. **Actualizar Perfil**
```bash
curl -X PUT http://localhost:3000/api/perfil/mi-perfil \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "email": "juan@email.com",
    "telefono": "1234567890",
    "resumenProfesional": "Desarrollador Full Stack",
    "situacionLaboral": "Empleado"
  }'
```

---

## 📊 Endpoints Disponibles

### **Autenticación**
- `POST /api/auth/login` - Login unificado con registro automático

### **Gestión de Perfiles**
- `GET /api/perfil/mi-perfil` - Obtener perfil completo
- `PUT /api/perfil/mi-perfil` - Actualizar información personal

### **Experiencia Laboral**
- `POST /api/perfil/experiencia` - Agregar experiencia
- `PUT /api/perfil/experiencia/:id` - Actualizar experiencia
- `DELETE /api/perfil/experiencia/:id` - Eliminar experiencia

### **Formación Académica**
- `POST /api/perfil/formacion` - Agregar formación
- `PUT /api/perfil/formacion/:id` - Actualizar formación
- `DELETE /api/perfil/formacion/:id` - Eliminar formación

### **Cursos**
- `POST /api/perfil/curso` - Agregar curso
- `PUT /api/perfil/curso/:id` - Actualizar curso
- `DELETE /api/perfil/curso/:id` - Eliminar curso

---

## 🛡️ Características de Seguridad Implementadas

- ✅ **Autenticación JWT**: Tokens seguros para todas las rutas protegidas
- ✅ **Autorización por Roles**: Separación entre Administradores y Egresados
- ✅ **Rate Limiting Global**: Protección contra ataques de fuerza bruta (login)
- ✅ **Rate Limiting por Usuario**: 50 requests por usuario cada 15 minutos (rutas de perfil)
- ✅ **Validación de Inputs**: Sanitización automática de datos
- ✅ **Hash de Contraseñas**: bcryptjs con salt rounds seguros
- ✅ **Middleware de Seguridad**: Helmet, CORS configurado

### **🔒 Configuración de Rate Limiting**

**Rutas de Autenticación (`/api/auth/login`):**
- **Límite**: 5 intentos por IP cada 15 minutos
- **Propósito**: Prevenir ataques de fuerza bruta
- **Scope**: Por dirección IP

**Rutas de Perfil (`/api/perfil/*`):**
- **Límite**: 50 requests por usuario cada 15 minutos
- **Propósito**: Prevenir abuso de API por usuarios autenticados
- **Scope**: Por usuario autenticado (JWT)
- **Error**: HTTP 429 "Too Many Requests"

---

## 📁 Estructura de Archivos Importante

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js          # ✅ Autenticación unificada
│   │   ├── perfilController.js        # ✅ Gestión de perfiles
│   │   ├── experienciaController.js   # ✅ CRUD experiencias
│   │   ├── formacionController.js     # ✅ CRUD formación
│   │   └── cursosController.js        # ✅ CRUD cursos
│   ├── routes/
│   │   ├── authRoutes.js             # ✅ Rutas de autenticación
│   │   └── perfilRoutes.js           # ✅ Rutas de perfil completo + Rate limiting
│   ├── validators/
│   │   └── perfilValidators.js       # ✅ Validaciones completas
│   └── middleware/
│       ├── auth.js                   # ✅ Autenticación, autorización y rate limiting
│       └── roles.js                  # ✅ Control de roles
├── scripts/
│   ├── migrate.js                    # ✅ Migración de base de datos
│   └── setup-test-data.js           # ✅ Datos de prueba
└── docs/
    └── testing-report.md            # ✅ Reporte de testing completo
```

---

## ✅ Estado de Implementación

**Profile Management Backend Issue #13** - **COMPLETADO** ✅

- ✅ Sistema de autenticación unificado
- ✅ Registro automático de egresados con validación de DNI
- ✅ CRUD completo de perfiles profesionales
- ✅ CRUD completo de experiencias laborales
- ✅ CRUD completo de formación académica
- ✅ CRUD completo de cursos
- ✅ Sistema de seguridad y validaciones robusto
- ✅ **Rate limiting por usuario en rutas de perfil** (50 req/15min)
- ✅ Base de datos con Turso funcionando perfectamente
- ✅ Documentación y testing completo

🎉 **El sistema está listo para uso y desarrollo!**