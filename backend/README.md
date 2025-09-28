# Sistema de Gestión de Egresados IES - Backend

API REST desarrollada con Node.js y Express para el sistema de gestión de egresados del Instituto de Educación Superior.

## 🚀 Inicio Rápido

### Prerrequisitos

-   Node.js 18+
-   npm o yarn

### Instalación

1. **Instalar dependencias**

```bash
npm install
```

2. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Ejecutar migraciones de base de datos**

```bash
npm run migrate
```

4. **Crear primer administrador**

```bash
npm run create-admin
```

5. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📊 Endpoints Principales

-   `GET /api/health` - Health check del servidor
-   `POST /api/auth/login` - Login unificado (egresados y admin)
-   Más endpoints se agregarán en próximas issues...

## 🗂️ Estructura del Proyecto

```
backend/
├── src/
│   ├── controllers/     # Controladores de rutas
│   ├── middleware/      # Middleware personalizado
│   ├── models/         # Modelos de datos
│   ├── routes/         # Definición de rutas
│   ├── utils/          # Utilidades y helpers
│   ├── config/         # Configuración (DB, etc.)
│   └── app.js          # Aplicación Express principal
├── scripts/            # Scripts de utilidad
├── package.json
└── .env.example
```

## 🔧 Comandos Disponibles

-   `npm start` - Producción
-   `npm run dev` - Desarrollo con nodemon
-   `npm run migrate` - Ejecutar migraciones
-   `npm run create-admin` - Crear administrador
-   `npm test` - Ejecutar tests

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables requeridas.

Principales:

-   `PORT` - Puerto del servidor (default: 3000)
-   `DATABASE_URL` - URL de la base de datos
-   `JWT_SECRET` - Secreto para JWT tokens
-   `FRONTEND_URL` - URL del frontend para CORS

## 🛠️ Desarrollo

Este proyecto sigue las mejores prácticas de Node.js y está diseñado para ser escalable y mantenible.

Para contribuir, consulta las issues del proyecto y sigue las convenciones establecidas.
