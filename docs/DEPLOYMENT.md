# Guía de Deployment - Sistema de Gestión de Egresados IES

Esta guía cubre el despliegue del Sistema de Gestión de Egresados IES en diferentes entornos de producción.

## 🎯 Opciones de Deployment

### 🌟 Recomendado: Vercel + Railway

- **Frontend:** Vercel (gratis con dominio personalizado)
- **Backend:** Railway (plan gratuito disponible)
- **Base de Datos:** Turso (gratis hasta 10GB)

### 🐳 Alternativa: Docker

- **Contenerización:** Docker + Docker Compose
- **Orquestación:** Docker Swarm o Kubernetes
- **Hosting:** AWS, Google Cloud, Azure, DigitalOcean

### 🖥️ VPS Tradicional

- **Servidor:** Ubuntu/CentOS con Nginx
- **Process Manager:** PM2
- **SSL:** Let's Encrypt (Certbot)

## 🌟 Deployment con Vercel + Railway

### Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Railway](https://railway.app)
- Cuenta en [Turso](https://turso.tech)
- Repositorio en GitHub

### 1. Configurar Base de Datos (Turso)

```bash
# Instalar Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Crear base de datos
turso db create egresados-ies-prod

# Obtener URL de conexión
turso db show egresados-ies-prod

# Crear token de autenticación
turso db tokens create egresados-ies-prod

# Importar esquema
turso db shell egresados-ies-prod < schema.sql
```

### 2. Configurar Backend (Railway)

1. **Conectar repositorio en Railway:**
   - Ir a [railway.app](https://railway.app)
   - Nuevo proyecto → Deploy from GitHub
   - Seleccionar repositorio

2. **Configurar variables de entorno:**
```env
NODE_ENV=production
PORT=3000

# Base de datos Turso
DATABASE_URL=libsql://your-database-url.turso.io
DATABASE_AUTH_TOKEN=your-turso-token

# JWT
JWT_SECRET=super-secure-jwt-secret-production
JWT_REFRESH_SECRET=super-secure-refresh-secret-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://your-app.vercel.app

# Email (configurar con tu proveedor)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Archivos
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Configurar build settings:**
```json
{
  "buildCommand": "cd backend && npm install && npm run build",
  "startCommand": "cd backend && npm start",
  "rootDirectory": "/",
  "environmentPath": "backend/.env"
}
```

4. **Desplegar:**
   - Railway detectará automáticamente el proyecto Node.js
   - Configurar el directorio raíz en `/backend`
   - Deploy automático en cada push

### 3. Configurar Frontend (Vercel)

1. **Conectar repositorio en Vercel:**
   - Ir a [vercel.com](https://vercel.com)
   - Nuevo proyecto → Import from Git
   - Seleccionar repositorio

2. **Configurar build settings:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rootDirectory": "frontend",
  "framework": "astro"
}
```

3. **Variables de entorno:**
```env
PUBLIC_API_URL=https://your-backend.railway.app/api
PUBLIC_APP_NAME=Sistema de Gestión de Egresados IES
PUBLIC_APP_VERSION=1.0.0
PUBLIC_MAX_FILE_SIZE=10485760
PUBLIC_ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

4. **Configurar dominio personalizado:**
   - Settings → Domains
   - Agregar dominio personalizado
   - Configurar DNS según instrucciones

### 4. Configurar HTTPS y Dominio

**En Vercel (Frontend):**
- SSL automático con certificados Let's Encrypt
- Configuración automática de redirects HTTP → HTTPS

**En Railway (Backend):**
- SSL automático incluido
- URLs seguras por defecto

### 5. Post-Deployment

```bash
# Crear administrador inicial
railway run npm run create-admin

# Verificar deployment
curl https://your-backend.railway.app/api/health
```

## 🐳 Deployment con Docker

### 1. Dockerfiles

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Imagen final con servidor nginx
FROM nginx:alpine

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - DATABASE_AUTH_TOKEN=${DATABASE_AUTH_TOKEN}
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://localhost:4321
    volumes:
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "4321:80"
    environment:
      - PUBLIC_API_URL=http://localhost:3000/api
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
```

### 3. Configuración Nginx

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:80;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. Deployment Commands

```bash
# Crear archivo .env
cp .env.example .env
# Editar variables de producción

# Build y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Actualizar
git pull
docker-compose down
docker-compose up -d --build

# Backup de base de datos
docker exec -t container_name turso db dump database_name > backup.sql
```

## 🖥️ VPS Deployment (Ubuntu)

### 1. Preparar Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx
sudo apt install nginx -y

# Instalar PM2
sudo npm install -g pm2

# Instalar certbot para SSL
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Configurar Aplicación

```bash
# Clonar repositorio
git clone https://github.com/Turify-Tech/EgresadosIES.git
cd EgresadosIES

# Configurar backend
cd backend
npm install --production
cp .env.example .env
# Editar .env con variables de producción

# Build si es necesario
npm run build

# Configurar frontend
cd ../frontend
npm install
npm run build
```

### 3. Configurar PM2

```bash
# Crear archivo de configuración PM2
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'egresados-backend',
    script: './backend/src/app.js',
    cwd: '/path/to/EgresadosIES',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G'
  }]
};

# Iniciar aplicación
pm2 start ecosystem.config.js

# Configurar startup
pm2 startup
pm2 save
```

### 4. Configurar Nginx

```bash
# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/egresados
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/EgresadosIES/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Archivos estáticos
    location /uploads/ {
        alias /path/to/EgresadosIES/backend/uploads/;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/egresados /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Configurar SSL

```bash
# Obtener certificado SSL
sudo certbot --nginx -d your-domain.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

## 🔧 Variables de Entorno por Ambiente

### Desarrollo
```env
NODE_ENV=development
DATABASE_URL=file:./dev.db
FRONTEND_URL=http://localhost:4321
JWT_SECRET=dev-secret
```

### Staging
```env
NODE_ENV=staging
DATABASE_URL=libsql://staging-db.turso.io
DATABASE_AUTH_TOKEN=staging-token
FRONTEND_URL=https://staging-app.vercel.app
JWT_SECRET=staging-secure-secret
```

### Producción
```env
NODE_ENV=production
DATABASE_URL=libsql://prod-db.turso.io
DATABASE_AUTH_TOKEN=prod-token
FRONTEND_URL=https://egresados.ies.edu.ar
JWT_SECRET=super-secure-production-secret
```

## 📊 Monitoreo y Logging

### Health Checks

```bash
# Script de health check
#!/bin/bash
# health_check.sh

BACKEND_URL="https://your-backend.railway.app/api/health"
FRONTEND_URL="https://your-app.vercel.app"

# Check backend
if curl -f $BACKEND_URL > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is down"
fi

# Check frontend
if curl -f $FRONTEND_URL > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down"
fi
```

### Logs

**Railway:**
- Ver logs en tiempo real desde el dashboard
- Configurar alertas para errores

**Docker:**
```bash
# Ver logs de contenedores
docker-compose logs -f

# Logs específicos
docker logs container_name -f
```

**PM2:**
```bash
# Ver logs
pm2 logs

# Monitoreo en tiempo real
pm2 monit
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run tests
        run: |
          cd backend && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway auto-deployment configured via webhook

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deployment configured via GitHub integration
```

## 🔐 Seguridad en Producción

### Checklist de Seguridad

- [ ] HTTPS configurado correctamente
- [ ] Secretos JWT seguros y únicos
- [ ] Variables de entorno no expuestas
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente
- [ ] Headers de seguridad (helmet)
- [ ] Validación de inputs en backend
- [ ] Sanitización de datos
- [ ] Backups de base de datos programados
- [ ] Monitoreo de logs de errores
- [ ] Actualizaciones de seguridad aplicadas

### Backup Strategy

```bash
# Script de backup diario
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup de base de datos Turso
turso db dump egresados-ies-prod > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos subidos
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./backend/uploads/

# Limpiar backups antiguos (mantener 30 días)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

## 🔍 Troubleshooting

### Problemas Comunes

**Error 502 Bad Gateway:**
- Verificar que el backend esté ejecutándose
- Revisar configuración de proxy en Nginx
- Verificar conectividad entre servicios

**Base de datos no conecta:**
- Verificar URL y token de Turso
- Revisar firewall y conectividad
- Verificar variables de entorno

**Archivos no se suben:**
- Verificar permisos de directorio uploads
- Revisar límites de tamaño de archivo
- Verificar configuración de multer

**JWT tokens inválidos:**
- Verificar secretos JWT
- Revisar expiración de tokens
- Verificar sincronización de tiempo

### Logs Útiles

```bash
# Backend logs
tail -f /var/log/nginx/error.log
pm2 logs egresados-backend

# Sistema
journalctl -u nginx -f
dmesg | tail
```

## 📞 Soporte Post-Deployment

- **Documentación:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/Turify-Tech/EgresadosIES/issues)
- **Email:** soporte@ies.edu.ar
- **Monitoreo:** Configurar alertas según proveedor elegido