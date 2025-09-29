# Sistema de Gestión de Egresados IES

Un sistema completo para la gestión y seguimiento de egresados del Instituto de Educación Superior, desarrollado con Node.js, Express, Astro y SQLite/Turso.

## 🎯 Descripción General

El Sistema de Gestión de Egresados IES es una plataforma web que permite:

- **Para Egresados:**
  - Crear y mantener perfiles profesionales
  - Subir y gestionar CVs
  - Conectar con otros egresados
  - Recibir notificaciones de oportunidades laborales

- **Para Administradores:**
  - Gestionar usuarios y perfiles
  - Generar reportes y estadísticas
  - Administrar contenido del sistema
  - Monitorear la actividad de la plataforma

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- Cuenta en Turso (para base de datos en producción)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/Turify-Tech/EgresadosIES.git
cd EgresadosIES
```

2. **Configurar el Backend**
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run migrate
npm run create-admin
npm run dev
```

3. **Configurar el Frontend** (en otra terminal)
```bash
cd frontend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run dev
```

4. **Acceder a la aplicación**
- Frontend: http://localhost:4321
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

## 📚 Documentación

### Guías de Usuario
- [📖 Manual de Usuario](docs/USER.md) - Guía completa para egresados
- [⚙️ Manual de Administrador](docs/ADMIN.md) - Gestión del sistema

### Documentación Técnica
- [🛠 Guía de Instalación](docs/INSTALACION.md) - Instalación detallada paso a paso
- [📡 Documentación de API](docs/API.md) - Endpoints y ejemplos
- [🚀 Guía de Deployment](docs/DEPLOYMENT.md) - Despliegue en producción

### Desarrollo
- [🔧 Configuración de Desarrollo](docs/DEVELOPMENT.md) - Setup del entorno de desarrollo
- [📋 Changelog](CHANGELOG.md) - Historial de versiones y cambios

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend:**
- Node.js + Express
- SQLite/Turso (base de datos)
- JWT (autenticación)
- Multer (subida de archivos)
- Nodemailer (emails)

**Frontend:**
- Astro (framework)
- Tailwind CSS (estilos)
- JavaScript vanilla (interactividad)

### Estructura del Proyecto

```
EgresadosIES/
├── backend/           # API REST en Node.js/Express
│   ├── src/          # Código fuente del backend
│   ├── scripts/      # Scripts de utilidad
│   └── package.json
├── frontend/         # Interfaz de usuario en Astro
│   ├── src/         # Código fuente del frontend
│   └── package.json
├── docs/            # Documentación del proyecto
├── schema.sql       # Esquema de base de datos
└── README.md        # Este archivo
```

## 🔧 Características Principales

### ✅ Funcionalidades Implementadas

- **Autenticación y Autorización**
  - Login unificado para egresados y administradores
  - Gestión de tokens JWT
  - Middleware de autenticación

- **Gestión de Perfiles**
  - Creación y edición de perfiles profesionales
  - Subida de CVs en formato PDF
  - Validación de datos

- **Panel Administrativo**
  - Gestión de usuarios
  - Reportes y estadísticas
  - Configuración del sistema

- **Base de Datos**
  - Esquema optimizado para SQLite/Turso
  - Migraciones automáticas
  - Soporte para claves foráneas

### 🔄 En Desarrollo

- Sistema de mensajería entre egresados
- Feed social con publicaciones
- Notificaciones por email
- Integración con APIs externas de empleo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convenciones de Código

- Usar ESLint y Prettier para formateo
- Seguir las convenciones de JavaScript ES6+
- Documentar funciones complejas
- Escribir tests para nuevas funcionalidades

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/Turify-Tech/EgresadosIES/issues)
- **Documentación:** [Documentación Técnica](docs/)
- **Email:** soporte@ies.edu.ar

## 🏆 Créditos

Desarrollado por el equipo de Turify Tech para el Instituto de Educación Superior.

### Tecnologías Utilizadas

- [Node.js](https://nodejs.org/) - Runtime de JavaScript
- [Express](https://expressjs.com/) - Framework web para Node.js
- [Astro](https://astro.build/) - Framework frontend
- [Turso](https://turso.tech/) - Base de datos SQLite distribuida
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS