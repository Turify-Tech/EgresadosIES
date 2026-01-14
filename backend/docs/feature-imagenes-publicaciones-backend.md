# Feature: Imágenes en Publicaciones - Backend

## 📋 Descripción

Implementación del backend para permitir que los egresados agreguen imágenes a sus publicaciones. El sistema permite subir hasta 5 imágenes por publicación con un tamaño máximo de 5MB cada una.

## 🗄️ Base de Datos

### Tabla: ImagenPublicacion

```sql
CREATE TABLE ImagenPublicacion (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  publicacionId INTEGER NOT NULL,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);

CREATE INDEX idx_imagen_publicacion_id ON ImagenPublicacion(publicacionId);
```

**Campos:**
- `id`: Identificador único de la imagen
- `url`: Ruta relativa de la imagen (ej: `/uploads/publicaciones/pub-1234567890-123456789.jpg`)
- `publicacionId`: ID de la publicación a la que pertenece la imagen

**Relaciones:**
- Una publicación puede tener múltiples imágenes (1:N)
- Las imágenes se eliminan en cascada cuando se elimina la publicación

### Migración

**Script**: `backend/scripts/migrate-imagenes-publicacion.js`

```bash
cd backend
node scripts/migrate-imagenes-publicacion.js
```

El script:
- Verifica si la tabla ya existe
- Crea la tabla `ImagenPublicacion`
- Crea índice sobre `publicacionId` para optimizar queries
- Es idempotente (se puede ejecutar múltiples veces sin problemas)

## 🔧 Middleware

### uploadImages.js

**Ubicación**: `backend/src/middleware/uploadImages.js`

**Función**: Maneja la subida de archivos usando `multer`

**Configuración:**

```javascript
const storage = multer.diskStorage({
    destination: 'backend/uploads/publicaciones',
    filename: 'pub-{timestamp}-{random}.{extension}'
});

const upload = multer({
    storage: storage,
    fileFilter: allowedMimes,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5                    // Máximo 5 archivos
    }
});
```

**Validaciones:**
- **Tipos MIME permitidos**: `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`
- **Tamaño máximo**: 5MB por imagen
- **Cantidad máxima**: 5 imágenes por request

**Exports:**
- `uploadPublicacionImages`: Middleware configurado para múltiples archivos
- `handleMulterError`: Middleware para manejar errores de multer

**Manejo de Errores:**
- `LIMIT_FILE_SIZE`: Archivo demasiado grande
- `LIMIT_FILE_COUNT`: Demasiados archivos
- Tipo de archivo no permitido

## 🎮 Controlador

### publicacionesController.js

**Modificación**: Función `crearPublicacion`

**Flujo:**

1. **Validar contenido**
   ```javascript
   if (!contenido || contenido.trim() === '') {
       return res.status(400).json({ message: "El contenido es obligatorio" });
   }
   ```

2. **Crear publicación**
   ```javascript
   const insertResult = await client.execute({
       sql: `INSERT INTO Publicacion (contenido, autorId) VALUES (?, ?)`,
       args: [contenido.trim(), usuarioId]
   });
   ```

3. **Procesar imágenes subidas**
   ```javascript
   if (req.files && req.files.length > 0) {
       for (const file of req.files) {
           const imageUrl = `/uploads/publicaciones/${file.filename}`;
           await client.execute({
               sql: `INSERT INTO ImagenPublicacion (url, publicacionId) VALUES (?, ?)`,
               args: [imageUrl, publicacionId]
           });
       }
   }
   ```

4. **Retornar respuesta**
   ```javascript
   res.status(201).json({
       success: true,
       data: {
           id: Number(publicacionId),
           contenido: contenido.trim(),
           imagenes: imagenesUrls
       }
   });
   ```

**Modificación**: Función `listarPublicaciones`

Ya incluye el query para obtener las imágenes asociadas:

```javascript
const imagenesQuery = `
    SELECT url FROM ImagenPublicacion 
    WHERE publicacionId = ${publicacion.id}
    ORDER BY id
`;
```

## 🛣️ Rutas

### publicacionesRoutes.js

**Endpoint modificado**: `POST /api/publicaciones`

```javascript
router.post(
    "/", 
    authenticateToken,              // Verificar autenticación
    requireEgresado,                // Verificar rol de egresado
    crearPublicacionLimiter,        // Rate limiting
    uploadPublicacionImages,        // Subir imágenes
    handleMulterError,              // Manejar errores
    publicacionesController.crearPublicacion
);
```

**Request:**
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer {token}`
- **Body**:
  - `contenido` (string, required): Texto de la publicación
  - `imagenes` (files, optional): Array de hasta 5 imágenes

**Response (Success - 201):**
```json
{
    "success": true,
    "message": "Publicación creada exitosamente",
    "data": {
        "id": 123,
        "contenido": "Mi publicación",
        "imagenes": [
            "/uploads/publicaciones/pub-1234567890-123456789.jpg",
            "/uploads/publicaciones/pub-1234567890-987654321.png"
        ]
    }
}
```

**Response (Error - 400):**
```json
{
    "success": false,
    "message": "El archivo es demasiado grande. Máximo 5MB por imagen."
}
```

## 📁 Archivos Estáticos

### Configuración en app.js

```javascript
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(uploadsPath));
```

**Estructura de directorios:**
```
backend/
└── uploads/
    ├── profiles/          (existente)
    │   └── .gitkeep
    └── publicaciones/     (nuevo)
        ├── .gitkeep
        ├── pub-1234567890-123456789.jpg
        ├── pub-1234567890-987654321.png
        └── ...
```

**URL de acceso**: `http://localhost:3000/uploads/publicaciones/{filename}`

### Gestión de Archivos

**Almacenamiento:**
- **Filesystem**: Archivos físicos en `backend/uploads/publicaciones/`
- **Base de datos**: Solo la URL/ruta relativa (ej: `/uploads/publicaciones/imagen.jpg`)

**¿Por qué no guardar en la BD?**
- ❌ Las BD no están optimizadas para archivos binarios grandes
- ❌ Degrada el rendimiento de queries
- ❌ Aumenta exponencialmente el tamaño de la BD
- ✅ El filesystem está diseñado para archivos
- ✅ Más fácil de escalar (CDN, object storage)
- ✅ Mejor performance al servir imágenes

**Limpieza automática:**
Cuando se elimina una publicación, el controlador:
1. Consulta las URLs de las imágenes asociadas
2. Elimina la publicación (CASCADE elimina registros de ImagenPublicacion)
3. Elimina los archivos físicos del filesystem

```javascript
// En eliminarPublicacion()
const imagenesQuery = `SELECT url FROM ImagenPublicacion WHERE publicacionId = ?`;
const imagenesResult = await client.execute({ sql: imagenesQuery, args: [publicacionId] });

// Eliminar archivos físicos
imagenesResult.rows.forEach(row => {
    const filePath = path.join(__dirname, '../../', row.url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
});
```

### .gitignore

Las imágenes de prueba/desarrollo NO se suben al repositorio:

```gitignore
# Uploads - archivos de usuario
backend/uploads/publicaciones/*
backend/uploads/profiles/*
# Mantener las carpetas vacías
!backend/uploads/publicaciones/.gitkeep
!backend/uploads/profiles/.gitkeep
```

## 🔒 Seguridad

### Validaciones

1. **Autenticación**: Solo usuarios autenticados
2. **Autorización**: Solo egresados pueden crear publicaciones
3. **Validación de archivos**:
   - Tipo MIME verificado por multer
   - Extensión de archivo verificada
   - Tamaño de archivo limitado
4. **Rate Limiting**: Máximo 10 publicaciones cada 5 minutos
5. **Nombres únicos**: `timestamp + random` para evitar colisiones

### Prevención de Ataques

- **DoS**: Límite de tamaño y cantidad de archivos
- **Path Traversal**: Nombres de archivo generados por el servidor
- **XSS**: Contenido sanitizado antes de almacenar
- **Injection**: Queries parametrizadas

## 🧪 Testing

### Pruebas Manuales con cURL

**Crear publicación con imágenes:**

```bash
curl -X POST http://localhost:3000/api/publicaciones \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "contenido=Mi publicación con imágenes" \
  -F "imagenes=@/path/to/image1.jpg" \
  -F "imagenes=@/path/to/image2.png"
```

**Listar publicaciones (incluye imágenes):**

```bash
curl http://localhost:3000/api/publicaciones \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Casos de Prueba

1. ✅ Crear publicación sin imágenes
2. ✅ Crear publicación con 1 imagen
3. ✅ Crear publicación con 5 imágenes (máximo)
4. ❌ Intentar subir más de 5 imágenes (debe fallar)
5. ❌ Intentar subir archivo > 5MB (debe fallar)
6. ❌ Intentar subir archivo que no es imagen (debe fallar)
7. ✅ Listar publicaciones y verificar que incluyan las imágenes
8. ✅ Eliminar publicación y verificar que se eliminan las imágenes

## 📊 Performance

### Optimizaciones

1. **Índice en publicacionId**: Acelera queries de imágenes por publicación
2. **Lazy loading**: Las imágenes se cargan bajo demanda
3. **Límite de archivos**: Previene sobrecarga del servidor
4. **Streaming de archivos**: Multer usa streams para eficiencia

### Consideraciones

- **Almacenamiento**: ~25MB por publicación (5 imágenes × 5MB)
- **Tiempo de upload**: Depende de la conexión del usuario
- **Procesamiento**: Mínimo (solo guardar referencia)

## 🔄 Futuras Mejoras

1. **Compresión de imágenes**: Reducir tamaño automáticamente
2. **Miniaturas**: Generar thumbnails para listados
3. **CDN**: Mover a servicio externo (Cloudinary, S3)
4. **Validación de contenido**: Detectar imágenes inapropiadas
5. **Watermarking**: Agregar marca de agua opcional
6. **WebP conversion**: Convertir a formato más eficiente
7. **Image optimization**: Optimizar antes de guardar

## 🐛 Troubleshooting

### Error: "ENOENT: no such file or directory"
**Solución**: El directorio `uploads/publicaciones` no existe. Multer lo crea automáticamente, pero verifica permisos.

### Error: "File too large"
**Solución**: El archivo excede 5MB. Validar en el cliente antes de enviar.

### Error: "Too many files"
**Solución**: Se intentaron subir más de 5 archivos. Validar en el cliente.

### Las imágenes no se ven en el frontend
**Solución**: Verificar que la configuración de CORS en app.js incluya los headers correctos.

## 📝 Notas de Implementación

- **Multer versión**: 1.4.5-lts.1
- **Storage**: Filesystem local (no base de datos)
- **Formato de URL**: Relativo al servidor (`/uploads/publicaciones/...`)
- **Eliminación**: Implementar cleanup job para archivos huérfanos (futuro)

## 🔗 Referencias

- [Multer Documentation](https://github.com/expressjs/multer)
- [Express Static Files](https://expressjs.com/en/starter/static-files.html)
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
