# Sistema de Notificaciones - Backend

## Descripción General
Sistema completo de notificaciones internas con envío automático de emails para comentarios, likes y menciones en publicaciones.

## Base de Datos

### Tabla: Notificacion
```sql
CREATE TABLE Notificacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('comentario', 'like', 'mencion')),
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    url_destino TEXT NOT NULL,
    leida INTEGER DEFAULT 0,
    enviada_email INTEGER DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    origen_usuario_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id),
    FOREIGN KEY (origen_usuario_id) REFERENCES Usuario(id)
);
```

### Tabla: PreferenciasNotificacion
```sql
CREATE TABLE PreferenciasNotificacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER UNIQUE NOT NULL,
    email_comentarios INTEGER DEFAULT 1,
    email_likes INTEGER DEFAULT 1,
    email_menciones INTEGER DEFAULT 1,
    email_resumen_diario INTEGER DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES Usuario(id)
);
```

## Servicios

### notificationService.js
Servicio singleton para gestión de notificaciones y envío de emails.

**Funcionalidades:**
- Inicialización lazy de SMTP transportador
- Creación de notificaciones en BD
- Envío de emails con templates HTML personalizados
- Generación de templates por tipo (comentario, like, mencion)

**Métodos principales:**
- `crearNotificacion(usuarioId, tipo, titulo, mensaje, urlDestino, origenUsuarioId)`
- `notificarComentario(publicacionAutorId, comentadorId, comentadorNombre, comentario, publicacionId)`
- `notificarLike(publicacionAutorId, likerId, likerNombre, publicacionId)`
- `notificarMencion(mencionadoId, comentadorId, comentadorNombre, comentario, publicacionId)`
- `enviarEmail(destinatario, asunto, html)`
- `generarEmailHTML(tipo, datos)`

**Configuración SMTP:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=institutoies9012@gmail.com
SMTP_PASS=wrqqvtvkwzcewiux
```

## Controladores

### notificacionesController.js
8 endpoints para gestión completa de notificaciones.

**Endpoints:**
1. `GET /api/notificaciones` - Lista con paginación, filtros por tipo y estado
2. `GET /api/notificaciones/no-leidas/count` - Contador para badge
3. `PUT /api/notificaciones/:id/leer` - Marcar individual como leída
4. `PUT /api/notificaciones/leer-todas` - Marcar todas como leídas
5. `DELETE /api/notificaciones/:id` - Eliminar individual
6. `DELETE /api/notificaciones/limpiar-leidas` - Eliminar todas leídas
7. `GET /api/notificaciones/preferencias` - Obtener preferencias
8. `PUT /api/notificaciones/preferencias` - Actualizar preferencias

## Integración

### comentariosController.js
- Al crear comentario: notifica al autor de la publicación
- Al crear comentario: detecta menciones (@usuario) y notifica

### likesController.js
- Al dar like: notifica al autor de la publicación

## Migración

### migrate-notificaciones.js
Script que crea las tablas y añade preferencias por defecto para 14 usuarios existentes.

**Ejecución:**
```bash
node scripts/migrate-notificaciones.js
```

## Templates de Email

Tres templates HTML con diseño moderno:

1. **Comentario:** Gradiente morado (#667eea → #764ba2)
2. **Like:** Gradiente rojo (#ff6b6b → #ee5a6f)
3. **Mención:** Gradiente naranja (#f59e0b → #f97316)

**Características:**
- Diseño responsivo con tablas HTML
- Emojis grandes en header
- Botones con gradientes
- Compatible con todos los clientes de email
- Link a preferencias en footer

## Notas Técnicas

### Lazy Loading SMTP
El transportador de nodemailer se inicializa en el primer uso (no en la importación) para garantizar que las variables de entorno estén cargadas.

### Variables de Entorno
`dotenv.config()` se ejecuta al inicio de `app.js` antes de cualquier importación.

### Tipos de Notificación
- `comentario`: Alguien comenta en tu publicación
- `like`: Alguien reacciona a tu publicación
- `mencion`: Alguien te menciona en un comentario

### Estados
- `leida`: 0 = no leída, 1 = leída
- `enviada_email`: 0 = no enviada, 1 = enviada
