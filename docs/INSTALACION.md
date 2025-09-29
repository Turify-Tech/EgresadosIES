# Guía de Instalación - Sistema de Gestión de Egresados IES

Esta guía te llevará paso a paso a través del proceso de instalación del Sistema de Gestión de Egresados IES en tu entorno local.

## 📋 Prerrequisitos

### Software Requerido

- **Node.js 18 o superior** - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js) o **yarn**
- **Git** - [Descargar aquí](https://git-scm.com/)

### Cuentas de Servicios (Opcional para desarrollo)

- **Turso** - Para base de datos en la nube ([turso.tech](https://turso.tech))
- **SMTP Provider** - Para envío de emails (Gmail, SendGrid, etc.)

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version
# Debe mostrar v18.x.x o superior

# Verificar npm
npm --version

# Verificar Git
git --version
```

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
# Clonar desde GitHub
git clone https://github.com/Turify-Tech/EgresadosIES.git

# Navegar al directorio
cd EgresadosIES

# Verificar la estructura
ls -la
```

### 2. Configurar el Backend

#### 2.1 Instalar Dependencias

```bash
cd backend
npm install
```

#### 2.2 Configurar Variables de Entorno

```bash
# Crear archivo de configuración
cp .env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Base de datos Turso
DATABASE_URL=libsql://your-database-url.turso.io
DATABASE_AUTH_TOKEN=your-auth-token-here

# Para desarrollo local (alternativa a Turso)
# DATABASE_URL=file:./local.db

# JWT
JWT_SECRET=tu-secreto-jwt-muy-seguro-aqui
JWT_REFRESH_SECRET=tu-secreto-refresh-jwt-aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:4321

# Email (opcional para desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

#### 2.3 Configurar Base de Datos

```bash
# Ejecutar migraciones
npm run migrate

# El script creará todas las tablas necesarias
```

#### 2.4 Crear Administrador Inicial

```bash
# Ejecutar script interactivo
npm run create-admin
```

El script te pedirá:
- Nombre completo del administrador
- DNI (sin puntos ni espacios)
- Email único
- Contraseña segura

O puedes usar valores por defecto para desarrollo:
- Nombre: "Administrador Sistema"
- DNI: "12345678"
- Email: "admin@ies.edu.ar"
- Contraseña: "Admin123!"

#### 2.5 Iniciar el Servidor

```bash
# Modo desarrollo (con auto-recarga)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: http://localhost:3000

### 3. Configurar el Frontend

#### 3.1 Instalar Dependencias

```bash
# En una nueva terminal
cd frontend
npm install
```

#### 3.2 Configurar Variables de Entorno

```bash
# Crear archivo de configuración
cp .env.example .env
```

Editar el archivo `.env`:

```env
# URL de la API del backend
PUBLIC_API_URL=http://localhost:3000/api

# Configuración de la aplicación
PUBLIC_APP_NAME="Sistema de Gestión de Egresados IES"
PUBLIC_APP_VERSION=1.0.0

# Configuración de archivos
PUBLIC_MAX_FILE_SIZE=10485760
PUBLIC_ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

#### 3.3 Iniciar el Servidor

```bash
# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

La aplicación estará disponible en: http://localhost:4321

## 🔍 Verificación de la Instalación

### 1. Verificar Backend

```bash
# Health check
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "message": "Sistema de Gestión de Egresados IES - API funcionando",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 2. Verificar Frontend

Navegar a http://localhost:4321 y verificar que:
- ✅ La página de inicio carga correctamente
- ✅ El formulario de login está disponible
- ✅ No hay errores en la consola del navegador

### 3. Verificar Autenticación

1. Ir a http://localhost:4321/login
2. Usar las credenciales del administrador creado
3. Verificar acceso al panel administrativo

## 🗃️ Configuración de Base de Datos

### Opción 1: Turso (Recomendado para Producción)

1. Crear cuenta en [turso.tech](https://turso.tech)
2. Crear nueva base de datos:
```bash
turso db create egresados-ies
```
3. Obtener URL y token:
```bash
turso db show egresados-ies
turso db tokens create egresados-ies
```
4. Configurar en `.env`:
```env
DATABASE_URL=libsql://your-database-url.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

### Opción 2: SQLite Local (Desarrollo)

```env
DATABASE_URL=file:./database.db
# No necesita DATABASE_AUTH_TOKEN
```

## 📧 Configuración de Email (Opcional)

### Gmail

1. Habilitar verificación en 2 pasos
2. Generar contraseña de aplicación
3. Configurar en `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key-de-sendgrid
```

## 🔧 Comandos Útiles

### Backend

```bash
# Desarrollo con auto-recarga
npm run dev

# Producción
npm start

# Ejecutar migraciones
npm run migrate

# Crear administrador
npm run create-admin

# Tests
npm test

# Tests en modo watch
npm run test:watch
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# CLI de Astro
npm run astro
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

1. Verificar variables de entorno en `.env`
2. Para Turso: verificar URL y token
3. Para SQLite: verificar permisos de escritura

### Error: "Port already in use"

```bash
# Encontrar proceso en el puerto
lsof -i :3000

# Terminar proceso
kill -9 PID
```

### Error: "Module not found"

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error en migraciones

```bash
# Verificar permisos de base de datos
ls -la *.db

# Re-ejecutar migraciones
npm run migrate
```

## 📚 Próximos Pasos

Una vez completada la instalación:

1. **Leer la documentación de usuario:** [Manual de Usuario](USER.md)
2. **Configurar administración:** [Manual de Administrador](ADMIN.md)
3. **Revisar la API:** [Documentación de API](API.md)
4. **Preparar deployment:** [Guía de Deployment](DEPLOYMENT.md)

## 🆘 Obtener Ayuda

- **Documentación:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/Turify-Tech/EgresadosIES/issues)
- **Email:** soporte@ies.edu.ar