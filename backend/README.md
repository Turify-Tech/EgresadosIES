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
# verificar la existencia del .env
```

3. **Ejecutar migraciones de base de datos**

```bash
npm run migrate
```

4. **Configurar datos de prueba (opcional)**

```bash
node scripts/setup-test-data.js
```

   Este script crea:
   - Un administrador (DNI: 00000000, password: temporal123)
   - Una carrera de prueba (Desarrollo de Software)
   - DNIs válidos para registro de egresados

5. **Iniciar servidor de desarrollo**

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📊 Endpoints Principales

### Autenticación
-   `POST /api/auth/login` - Login unificado (egresados y admin con registro automático)

### Gestión de Perfiles (Egresados)
-   `GET /api/perfil/mi-perfil` - Obtener perfil completo
-   `PUT /api/perfil/mi-perfil` - Actualizar perfil personal

### Experiencia Laboral
-   `POST /api/perfil/experiencia` - Agregar experiencia laboral
-   `PUT /api/perfil/experiencia/:id` - Actualizar experiencia laboral
-   `DELETE /api/perfil/experiencia/:id` - Eliminar experiencia laboral

### Formación Académica
-   `POST /api/perfil/formacion` - Agregar formación académica
-   `PUT /api/perfil/formacion/:id` - Actualizar formación académica
-   `DELETE /api/perfil/formacion/:id` - Eliminar formación académica

### Cursos
-   `POST /api/perfil/curso` - Agregar curso
-   `PUT /api/perfil/curso/:id` - Actualizar curso
-   `DELETE /api/perfil/curso/:id` - Eliminar curso

### Utilidad
-   `GET /api/health` - Health check del servidor

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
└── .env
```

## 🔧 Comandos Disponibles

-   `npm start` - Servidor en producción
-   `npm run dev` - Servidor en desarrollo con nodemon
-   `npm run migrate` - Ejecutar migraciones de base de datos
-   `npm test` - Ejecutar tests (cuando se implementen)

### Scripts Disponibles

-   `node scripts/migrate.js` - Migrar esquema de base de datos
-   `node scripts/setup-test-data.js` - Configurar datos de prueba

## 📝 Variables de Entorno

Ver `.env` para todas las variables requeridas.

Principales:

-   `PORT` - Puerto del servidor (default: 3000)
-   `DATABASE_URL` - URL de la base de datos
-   `JWT_SECRET` - Secreto para JWT tokens
-   `FRONTEND_URL` - URL del frontend para CORS

## 🛠️ Desarrollo

Este proyecto sigue las mejores prácticas de Node.js y está diseñado para ser escalable y mantenible.

Para contribuir, consulta las issues del proyecto y sigue las convenciones establecidas.
