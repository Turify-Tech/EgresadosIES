# Guía de Desarrollo - Sistema de Gestión de Egresados IES

Documentación técnica para desarrolladores que trabajen en el proyecto.

## 🛠️ Setup del Entorno de Desarrollo

### Prerrequisitos

```bash
# Versiones requeridas
Node.js >= 18.0.0
npm >= 9.0.0
Git >= 2.30.0

# Herramientas recomendadas
Visual Studio Code
Postman o Insomnia (para testing API)
TablePlus o DBeaver (para base de datos)
```

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/Turify-Tech/EgresadosIES.git
cd EgresadosIES

# 2. Instalar dependencias backend
cd backend
npm install
cp .env.example .env
# Editar .env con configuraciones locales

# 3. Configurar base de datos
npm run migrate
npm run create-admin

# 4. Instalar dependencias frontend
cd ../frontend
npm install
cp .env.example .env
# Editar .env con configuraciones locales

# 5. Iniciar servicios en desarrollo
cd ../backend && npm run dev &
cd ../frontend && npm run dev &
```

### Variables de Entorno Desarrollo

#### Backend (.env)
```env
NODE_ENV=development
PORT=3000

# Base de datos local
DATABASE_URL=file:./dev.db
# Para Turso en desarrollo:
# DATABASE_URL=libsql://dev-database.turso.io
# DATABASE_AUTH_TOKEN=your-dev-token

# JWT
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:4321

# Email (opcional en desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=dev@example.com
SMTP_PASS=dev-password

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Frontend (.env)
```env
PUBLIC_API_URL=http://localhost:3000/api
PUBLIC_APP_NAME=Sistema de Gestión de Egresados IES (DEV)
PUBLIC_APP_VERSION=1.0.0-dev
PUBLIC_MAX_FILE_SIZE=10485760
PUBLIC_ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## 🏗️ Arquitectura del Sistema

### Arquitectura General

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│                 │ ◄────────────► │                 │
│    Frontend     │                 │     Backend     │
│   (Astro SPA)   │                 │  (Node.js API)  │
│                 │                 │                 │
└─────────────────┘                 └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   Database      │
                                    │ (SQLite/Turso)  │
                                    └─────────────────┘
```

### Stack Tecnológico

#### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de datos:** SQLite (desarrollo) / Turso (producción)
- **ORM:** @libsql/client (cliente nativo)
- **Autenticación:** JWT
- **Validación:** Custom validators
- **Upload de archivos:** Multer
- **Email:** Nodemailer
- **Seguridad:** Helmet, CORS
- **Testing:** Jest + Supertest

#### Frontend
- **Framework:** Astro
- **Styling:** Tailwind CSS
- **JavaScript:** Vanilla JS (ES6+)
- **Build:** Vite (integrado en Astro)
- **HTTP Client:** Fetch API

## 📁 Estructura del Proyecto

### Backend Structure

```
backend/
├── src/
│   ├── app.js                 # Aplicación Express principal
│   ├── auth/                  # Sistema de autenticación
│   │   ├── index.js          # Exportaciones centrales
│   │   ├── middleware/       # Middleware de auth
│   │   │   ├── auth.js       # Verificación de tokens
│   │   │   └── roles.js      # Manejo de permisos
│   │   └── utils/            # Utilidades de auth
│   │       ├── jwt.js        # Manejo de JWT
│   │       └── bcrypt.js     # Hash de contraseñas
│   ├── config/               # Configuración
│   │   └── database.js       # Configuración de BD
│   ├── middleware/           # Middleware general
│   │   ├── error.js          # Manejo de errores
│   │   ├── validation.js     # Validación de datos
│   │   └── upload.js         # Upload de archivos
│   └── utils/                # Utilidades generales
│       ├── validators.js     # Validadores personalizados
│       ├── constants.js      # Constantes del sistema
│       └── helpers.js        # Funciones auxiliares
├── scripts/                  # Scripts de utilidad
│   ├── migrate.js           # Migración de BD
│   └── create-admin.js      # Crear administrador
├── uploads/                 # Archivos subidos (git ignored)
├── tests/                   # Tests
│   ├── auth.test.js
│   ├── profile.test.js
│   └── utils.test.js
├── package.json
├── .env.example
└── README.md
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── common/          # Componentes comunes
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── Navigation.astro
│   │   ├── forms/           # Componentes de formularios
│   │   │   ├── LoginForm.astro
│   │   │   ├── ProfileForm.astro
│   │   │   └── SearchForm.astro
│   │   └── ui/              # Componentes de UI
│   │       ├── Button.astro
│   │       ├── Modal.astro
│   │       └── Card.astro
│   ├── layouts/             # Layouts de página
│   │   ├── BaseLayout.astro # Layout base
│   │   ├── AuthLayout.astro # Layout para auth
│   │   └── AdminLayout.astro # Layout admin
│   ├── pages/               # Páginas de la aplicación
│   │   ├── index.astro      # Página principal
│   │   ├── login.astro      # Login
│   │   ├── profile/         # Páginas de perfil
│   │   └── admin/           # Páginas de admin
│   ├── styles/              # Estilos globales
│   │   ├── global.css       # Estilos base
│   │   └── components.css   # Estilos de componentes
│   └── utils/               # Utilidades frontend
│       ├── api.js           # Cliente HTTP
│       ├── constants.js     # Constantes
│       ├── auth.js          # Manejo de autenticación
│       └── validators.js    # Validaciones cliente
├── public/                  # Assets estáticos
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── astro.config.mjs        # Configuración Astro
├── tailwind.config.mjs     # Configuración Tailwind
├── package.json
└── README.md
```

## 🔧 Convenciones de Código

### JavaScript/Node.js

#### Estilo General
```javascript
// ✅ Usar const/let, no var
const userName = 'Juan Pérez';
let isActive = true;

// ✅ Arrow functions para funciones simples
const getUserById = (id) => users.find(user => user.id === id);

// ✅ Template literals
const message = `Bienvenido, ${userName}!`;

// ✅ Destructuring
const { name, email } = user;
const [first, second] = array;

// ✅ Async/await sobre promises
async function fetchUser(id) {
    try {
        const user = await userService.getById(id);
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}
```

#### Nomenclatura
```javascript
// ✅ camelCase para variables y funciones
const userName = 'Juan';
const getUserProfile = () => {};

// ✅ PascalCase para clases y constructores
class UserService {
    constructor() {}
}

// ✅ UPPER_SNAKE_CASE para constantes
const MAX_FILE_SIZE = 10485760;
const API_ENDPOINTS = {
    USERS: '/api/users',
    PROFILES: '/api/profiles'
};

// ✅ Prefijos is/has/can para booleans
const isActive = true;
const hasPermission = false;
const canEdit = user.type === 'admin';
```

#### Estructura de Funciones
```javascript
// ✅ Funciones con documentación JSDoc
/**
 * Obtiene el perfil de un usuario por ID
 * @param {number} userId - ID del usuario
 * @param {boolean} includePrivate - Incluir datos privados
 * @returns {Promise<Object>} Perfil del usuario
 */
async function getUserProfile(userId, includePrivate = false) {
    // Validación de entrada
    if (!userId || typeof userId !== 'number') {
        throw new Error('userId debe ser un número válido');
    }

    // Lógica principal
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    // Procesamiento de datos
    const profile = {
        id: user.id,
        name: user.name,
        email: includePrivate ? user.email : undefined
    };

    return profile;
}
```

### CSS/Tailwind

#### Convenciones Tailwind
```html
<!-- ✅ Orden lógico de clases -->
<div class="
    flex items-center justify-between
    w-full max-w-4xl mx-auto
    p-4 rounded-lg
    bg-white shadow-md
    text-gray-900
    hover:shadow-lg
    transition-shadow duration-200
">
    <!-- Contenido -->
</div>

<!-- ✅ Responsive classes -->
<div class="
    grid grid-cols-1 gap-4
    md:grid-cols-2 md:gap-6
    lg:grid-cols-3 lg:gap-8
">
    <!-- Grid responsivo -->
</div>
```

#### Clases Personalizadas
```css
/* ✅ Componentes reutilizables */
@layer components {
    .btn-primary {
        @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors;
    }
    
    .card {
        @apply p-6 bg-white rounded-lg shadow-md border border-gray-200;
    }
    
    .form-input {
        @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
    }
}
```

### Astro Components

```astro
---
// ✅ Estructura típica de componente Astro
export interface Props {
    title: string;
    description?: string;
    isActive?: boolean;
}

const { title, description = '', isActive = false } = Astro.props;

// Lógica del componente
const classes = `card ${isActive ? 'card--active' : ''}`;
---

<!-- ✅ Template con estructura semántica -->
<article class={classes}>
    <header>
        <h2 class="text-xl font-semibold">{title}</h2>
    </header>
    
    {description && (
        <p class="text-gray-600 mt-2">{description}</p>
    )}
    
    <slot />
</article>

<style>
    /* ✅ Estilos scoped del componente */
    .card {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1.5rem;
    }
    
    .card--active {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
    }
</style>
```

## 🗃️ Base de Datos

### Esquema Principal

```sql
-- Tabla principal de usuarios
CREATE TABLE Usuario (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('Egresado', 'Administrador')),
    activo BOOLEAN DEFAULT 1,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME
);

-- Tabla de egresados (hereda de Usuario)
CREATE TABLE Egresado (
    id INTEGER PRIMARY KEY,
    dni TEXT NOT NULL UNIQUE,
    telefono TEXT,
    fecha_nacimiento DATE,
    direccion TEXT,
    carreraId INTEGER NOT NULL,
    anio_egreso INTEGER NOT NULL,
    cv_url TEXT,
    estado_perfil TEXT DEFAULT 'incompleto',
    FOREIGN KEY (id) REFERENCES Usuario (id) ON DELETE CASCADE,
    FOREIGN KEY (carreraId) REFERENCES Carrera (id)
);

-- Tabla de perfiles (información adicional)
CREATE TABLE Perfil (
    id INTEGER PRIMARY KEY,
    imagen_perfil TEXT,
    imagen_banner TEXT,
    biografia TEXT,
    habilidades TEXT,
    idiomas TEXT,
    ubicacion_actual TEXT,
    disponible_trabajo BOOLEAN DEFAULT 1,
    salario_esperado INTEGER,
    egresadoId INTEGER NOT NULL UNIQUE,
    FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE
);
```

### Migraciones

Las migraciones se ejecutan automáticamente con:

```bash
npm run migrate
```

El sistema utiliza un esquema versionado donde cada migración se registra:

```javascript
// scripts/migrate.js
const migrations = [
    {
        version: 1,
        description: 'Schema inicial',
        sql: `-- SQL de creación inicial --`
    },
    {
        version: 2,
        description: 'Agregar tabla de mensajes',
        sql: `-- SQL para mensajes --`
    }
];
```

### Conexión a Base de Datos

```javascript
// src/config/database.js
import { createClient } from '@libsql/client';

class Database {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            const config = {
                url: process.env.DATABASE_URL,
                authToken: process.env.DATABASE_AUTH_TOKEN
            };

            this.client = createClient(config);
            await this.client.execute('PRAGMA foreign_keys = ON');
            this.isConnected = true;
            
            console.log('✅ Base de datos conectada');
        } catch (error) {
            console.error('❌ Error conectando BD:', error);
            throw error;
        }
    }

    getClient() {
        if (!this.isConnected || !this.client) {
            throw new Error('Base de datos no conectada');
        }
        return this.client;
    }
}

export default new Database();
```

## 🔐 Autenticación y Autorización

### Sistema JWT

```javascript
// src/auth/utils/jwt.js
import jwt from 'jsonwebtoken';

export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

export const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token inválido');
    }
};

export const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};
```

### Middleware de Autenticación

```javascript
// src/auth/middleware/auth.js
import { verifyToken, extractToken } from '../utils/jwt.js';

export const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

export const requireUserType = (userType) => {
    return (req, res, next) => {
        if (req.user.tipo_usuario !== userType) {
            return res.status(403).json({
                success: false,
                message: 'Permisos insuficientes'
            });
        }
        next();
    };
};
```

### Hash de Contraseñas

```javascript
// src/auth/utils/bcrypt.js
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

export const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
};
```

## 🌐 API Development

### Estructura de Respuestas

```javascript
// ✅ Respuesta exitosa estándar
{
    "success": true,
    "message": "Operación exitosa",
    "data": {
        // Datos relevantes
    }
}

// ✅ Respuesta de error estándar
{
    "success": false,
    "message": "Descripción del error",
    "errors": [
        {
            "field": "email",
            "message": "Email ya está registrado"
        }
    ],
    "code": "VALIDATION_ERROR"
}

// ✅ Respuesta con paginación
{
    "success": true,
    "data": {
        "items": [...],
        "pagination": {
            "current_page": 1,
            "total_pages": 10,
            "total_items": 200,
            "per_page": 20
        }
    }
}
```

### Manejo de Errores

```javascript
// src/middleware/error.js
export const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Error de validación JSON
    if (err instanceof SyntaxError && err.status === 400) {
        return res.status(400).json({
            success: false,
            message: 'JSON inválido en la solicitud',
            code: 'INVALID_JSON'
        });
    }

    // Error de validación personalizado
    if (err.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: err.errors,
            code: 'VALIDATION_ERROR'
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : err.message,
        code: err.code || 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
};
```

### Validación de Datos

```javascript
// src/utils/validators.js
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateDNI = (dni) => {
    const dniRegex = /^\d{7,8}$/;
    return dniRegex.test(dni);
};

export const validatePassword = (password) => {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
};

export const validateProfileData = (data) => {
    const errors = [];

    if (!data.nombre || data.nombre.trim().length < 2) {
        errors.push({
            field: 'nombre',
            message: 'Nombre debe tener al menos 2 caracteres'
        });
    }

    if (!validateEmail(data.email)) {
        errors.push({
            field: 'email',
            message: 'Email inválido'
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
```

## 🧪 Testing

### Configuración Jest

```javascript
// jest.config.js
export default {
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    globals: {
        'ts-jest': {
            useESM: true
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Tests de API

```javascript
// tests/auth.test.js
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication', () => {
    beforeEach(async () => {
        // Setup antes de cada test
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@ies.edu.ar',
                    password: 'password123',
                    userType: 'egresado'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
        });

        it('should fail with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@ies.edu.ar',
                    password: 'wrongpassword',
                    userType: 'egresado'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});
```

### Tests Unitarios

```javascript
// tests/utils/validators.test.js
import { validateEmail, validateDNI, validatePassword } from '../src/utils/validators.js';

describe('Validators', () => {
    describe('validateEmail', () => {
        it('should validate correct emails', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name@domain.org')).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validateEmail('invalid')).toBe(false);
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('@domain.com')).toBe(false);
        });
    });

    describe('validateDNI', () => {
        it('should validate correct DNIs', () => {
            expect(validateDNI('12345678')).toBe(true);
            expect(validateDNI('1234567')).toBe(true);
        });

        it('should reject invalid DNIs', () => {
            expect(validateDNI('123')).toBe(false);
            expect(validateDNI('123456789')).toBe(false);
            expect(validateDNI('12.345.678')).toBe(false);
        });
    });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage

# Tests específicos
npm test -- --testNamePattern="Authentication"
```

## 🚀 Build y Deployment

### Scripts de Build

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "build": "echo 'Backend no requiere build específico'",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "migrate": "node scripts/migrate.js",
    "create-admin": "node scripts/create-admin.js",
    "lint": "eslint src/ --ext .js",
    "lint:fix": "eslint src/ --ext .js --fix"
  }
}
```

### Configuración ESLint

```javascript
// .eslintrc.js
module.exports = {
    env: {
        es2021: true,
        node: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
};
```

### Variables de Entorno por Ambiente

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=file:./dev.db
JWT_SECRET=dev-secret
FRONTEND_URL=http://localhost:4321

# .env.staging
NODE_ENV=staging
DATABASE_URL=libsql://staging-db.turso.io
DATABASE_AUTH_TOKEN=staging-token
JWT_SECRET=staging-secret
FRONTEND_URL=https://staging-app.vercel.app

# .env.production
NODE_ENV=production
DATABASE_URL=libsql://prod-db.turso.io
DATABASE_AUTH_TOKEN=prod-token
JWT_SECRET=super-secure-production-secret
FRONTEND_URL=https://egresados.ies.edu.ar
```

## 🐛 Debugging

### Logs de Desarrollo

```javascript
// src/utils/logger.js
const logger = {
    info: (message, data = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`ℹ️ ${message}`, data);
        }
    },
    
    error: (message, error = {}) => {
        console.error(`❌ ${message}`, error);
    },
    
    warn: (message, data = {}) => {
        console.warn(`⚠️ ${message}`, data);
    },
    
    debug: (message, data = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`🐛 ${message}`, data);
        }
    }
};

export default logger;
```

### Debugging con VS Code

```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/backend/src/app.js",
            "env": {
                "NODE_ENV": "development"
            },
            "console": "integratedTerminal",
            "cwd": "${workspaceFolder}/backend"
        }
    ]
}
```

## 📋 Contribuir al Proyecto

### Flujo de Trabajo Git

```bash
# 1. Crear rama para nueva feature
git checkout -b feature/nueva-funcionalidad

# 2. Realizar cambios y commits
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Push y crear PR
git push origin feature/nueva-funcionalidad
# Crear Pull Request en GitHub

# 4. Después del merge, limpiar
git checkout main
git pull origin main
git branch -d feature/nueva-funcionalidad
```

### Convenciones de Commits

```bash
# Tipos de commits
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato/estilo
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Tareas de mantenimiento

# Ejemplos
git commit -m "feat: agregar sistema de mensajería entre egresados"
git commit -m "fix: corregir validación de email en registro"
git commit -m "docs: actualizar documentación de API"
git commit -m "test: agregar tests para autenticación JWT"
```

### Code Review Checklist

```markdown
## Checklist para Code Review

### Funcionalidad
- [ ] El código funciona como se espera
- [ ] Se manejan casos edge correctamente
- [ ] No hay regresiones en funcionalidad existente

### Código
- [ ] Sigue las convenciones de estilo establecidas
- [ ] Nombres de variables/funciones son descriptivos
- [ ] Código es legible y está bien comentado
- [ ] No hay código duplicado

### Testing
- [ ] Tests agregados para nueva funcionalidad
- [ ] Todos los tests pasan
- [ ] Coverage de tests es adecuado

### Seguridad
- [ ] No hay vulnerabilidades evidentes
- [ ] Datos sensibles están protegidos
- [ ] Validaciones de entrada implementadas

### Performance
- [ ] No hay problemas evidentes de rendimiento
- [ ] Consultas de BD están optimizadas
- [ ] Recursos se liberan apropiadamente
```

## 📚 Recursos Adicionales

### Documentación Relacionada

- [Manual de Usuario](USER.md)
- [Manual de Administrador](ADMIN.md)
- [Documentación de API](API.md)
- [Guía de Deployment](DEPLOYMENT.md)

### Herramientas Recomendadas

#### Editores/IDEs
- Visual Studio Code (con extensiones para Node.js)
- WebStorm
- Sublime Text

#### Extensiones VS Code
```json
{
    "recommendations": [
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-eslint",
        "astro-build.astro-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-json"
    ]
}
```

#### Testing y Debugging
- Postman/Insomnia (API testing)
- Chrome DevTools
- Node.js debugger

### Recursos de Aprendizaje

#### Node.js/Express
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

#### Astro
- [Astro Documentation](https://docs.astro.build/)
- [Astro Tutorial](https://docs.astro.build/en/tutorial/0-introduction/)

#### SQLite/Turso
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Turso Documentation](https://docs.turso.tech/)

---

*Para más información o dudas, consultar la documentación completa o abrir un issue en GitHub.*