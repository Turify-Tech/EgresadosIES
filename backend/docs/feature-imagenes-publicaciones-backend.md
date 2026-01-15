# Feature: Imágenes en Publicaciones - Backend

## 📋 Descripción

Implementación del backend para permitir que los egresados agreguen imágenes a sus publicaciones. El sistema utiliza **Cloudinary** como almacenamiento en la nube, permitiendo subir hasta 5 imágenes por publicación con un tamaño máximo de 5MB cada una.

### ☁️ Cloudinary Integration

Las imágenes se almacenan en **Cloudinary CDN**, proporcionando:
- ✅ Acceso global desde cualquier dispositivo/computadora
- ✅ URLs públicas permanentes
- ✅ Transformaciones automáticas (optimización de calidad/formato)
- ✅ Límite de resolución (1920x1080 máximo)
- ✅ No requiere almacenamiento local en el servidor

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
- `url`: URL completa de Cloudinary (ej: `https://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-123.jpg`)
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

## ☁️ Cloudinary Configuration

### cloudinary.js

**Ubicación**: `backend/src/config/cloudinary.js`

**Función**: Inicializa el SDK de Cloudinary v2

**Configuración:**

```javascript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;
```

**Variables de entorno (.env):**
```
CLOUDINARY_CLOUD_NAME=djgrfq6oi
CLOUDINARY_API_KEY=975256742522911
CLOUDINARY_API_SECRET=ct3KvJqkbEBtUPItrW8Nl26uqD4
```

## 🔧 Middleware

### uploadImagesCloudinary.js

**Ubicación**: `backend/src/middleware/uploadImagesCloudinary.js`

**Función**: Maneja la subida de archivos directamente a Cloudinary usando `multer` + `multer-storage-cloudinary`

**Dependencias:**
```bash
npm install cloudinary@2.8.0 multer-storage-cloudinary@4.0.0 --legacy-peer-deps
```

**Configuración:**

```javascript
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "egresados-ies/publicaciones",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      { width: 1920, height: 1080, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" }
    ],
    public_id: (req, file) => `pub-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`
  }
});

const upload = multer({ a Cloudinary**
   ```javascript
   if (req.files && req.files.length > 0) {
       for (const file of req.files) {
           // file.path contiene la URL completa de Cloudinary
           const imageUrl = file.path;
           await client.execute({
               sql: `INSERT INTO ImagenPublicacion (url, publicacionId) VALUES (?, ?)`,
               args: [imageUrl, publicacionId]
           });
       }
   }
   ```
   
   **Nota**: `file.path` devuelto por `multer-storage-cloudinary` contiene la URL completa de Cloudinary (ej: `https://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-123.jpg`)leSize: 5 * 1024 * 1024, // 5MB por archivo
    files: 5                    // Máximo 5 archivos
  }
});
```

**Validaciones:**
- **Tipos permitidos**: `jpg`, `jpeg`, `png`, `gif`, `webp`
- **Tamaño máximo**: 5MB por imagen
- **Cantidad máxima**: 5 imágenes por request
- **Transformaciones automáticas**:
  - Límite de resolución: 1920x1080 (crop: "limit" mantiene aspect ratio)
  - Calidad automática (quality: "auto")
  - Formato automático (fetch_format: "auto" - WebP para navegadores compatibles)

**Exports:**
- `uploadPublicacionImages`: Middleware configurado para múltiples archivos
- `handleMulterError`: Middleware para manejar errores de multer

**Manejo de Errores:**
- `LIMIT_FILE_SIZE`: Archivo demasiado grande
- `LIMIT_FILE_COUNT`: Demasiados archivos
- Tipo de archivo no permitido
- Error de conexión con Cloudinary

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
       data: { // URLs completas de Cloudinary
       }
   });
   ```

**Modificación**: Función `eliminarPublicacion`

Ahora incluye eliminación de imágenes desde Cloudinary:

```javascript
// Obtener URLs de las imágenes antes de eliminar
const imagenesQuery = `SELECT url FROM ImagenPublicacion WHERE publicacionId = ?`;
const imagenesResult = await client.execute({
    sql: imagenesQuery,
    args: [publicacionId]
});

// Eliminar publicación (CASCADE elimina registros de ImagenPublicacion)
await client.execute({
    sql: `DELETE FROM Publicacion WHERE id = ?`,
    args: [publicacionId]
});

// Eliminar imágenes de Cloudinary
if (imagenesResult.rows.length > 0) {
    for (const row of imagenesResult.rows) {
        try {
            // Extraer public_id de la URL
            // URL: https://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-123.jpg
            const urlParts = row.url.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
            const publicId = pathAfterVersion.replace(/\.[^/.]+$/, ""); // Quitar extensión
            
            // Eliminar de Cloudinary
            const result = await cloudinary.uploader.destroy(publicId);
            
            if (result.result === 'ok') {
                console.log(`✅ Imagen eliminada de Cloudinary: ${publicId}`);
            }
        } catch (error) {
            console.error(`❌ Error eliminando imagen de Cloudinary:`, error.message);
        }
    }
}
        imagenes: imagenesUrls
       }
   });
   ```

**Modificación**: Función `listarPublicaciones`

Ya incluye el query para obtener las imágenes asociadas:

```javascripthttps://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-1768491223303-323692830.jpg",
            "https://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-1768491223304
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

## ☁️ Almacenamiento en la Nube

### ¿Por qué Cloudinary en lugar de filesystem local?

**Problema con filesystem local:**
- ❌ Las imágenes solo son accesibles desde el servidor donde se almacenan
- ❌ Si un usuario desde otra computadora sube una imagen, otros no pueden verla
- ❌ No escalable para aplicaciones multi-usuario
- ❌ Requiere servir archivos estáticos con Express
- ❌ No se pueden acceder desde múltiples servidores (deployment distribuido)

**Solución con Cloudinary:**
- ✅ URLs públicas accesibles desde cualquier dispositivo/computadora
- ✅ CDN global con alta disponibilidad
- ✅ Transformaciones automáticas (optimización, redimensionamiento)
- ✅ No requiere almacenamiento en el servidor
- ✅ Fácil escalabilidad
- ✅ Gestión centralizada de assets

### Gestión de Imágenes

**Almacenamiento:**
- **Cloudinary CDN**: Archivos almacenados en la nube de Cloudinary
- **Base de datos**: URL completa de Cloudinary (ej: `https://res.cloudinary.com/djgrfq6oi/image/upload/...`)

**Limpieza automática:**
Cuando se elimina una publicación, el controlador:
1. Consulta las URLs de las imágenes asociadas
2. Extrae el `public_id` de cada URL
3. Elimina la publicación (CASCADE elimina registros de ImagenPublicacion)
4. Elimina las imágenes de Cloudinary usando `cloudinary.uploader.destroy(publicId)`

**Estructura en Cloudinary:**
```
djgrfq6oi (cloud_name)
└── egresados-ies/
    └── publicaciones/
        ├── pub-1768491223303-323692830.jpg
        ├── pub-1768491223304-987654321.png
        └── ...
```

**Dashboard de Cloudinary:**
- URL: https://console.cloudinary.com/
- Media Library: Ver todas las imágenes subidas
- Carpeta: `egresados-ies/publicaciones/`

### .gitignore

Ya no es necesario excluir carpetas `uploads/` porque las imágenes se almacenan en Cloudinary:

```gitignore
# Las imágenes ahora se almacenan en Cloudinary, no en filesystem local
# backend/uploads/ eliminado
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
4. 

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "publicaciones": [
      {
        "id": 8,
   ✅ **CDN**: ~~Mover a servicio externo~~ → **Implementado con Cloudinary**
2. ✅ **Image optimization**: ~~Optimizar antes de guardar~~ → **Automático con Cloudinary (quality: auto)**
3. ✅ **WebP conversion**: ~~Convertir a formato más eficiente~~ → **Automático con Cloudinary (fetch_format: auto)**
4. ✅ **Compresión de imágenes**: ~~Reducir tamaño automáticamente~~ → **Límite de 1920x1080 con Cloudinary**
5. **Miniaturas**: Generar thumbnails para listados (Cloudinary permite transformaciones on-the-fly)
6. **Validación de contenido**: Detectar imágenes inapropiadas (usar Cloudinary AI Moderation)
7. **Watermarking**: Agregar marca de agua opcional (soportado por Cloudinary)
}
```**CDN de Cloudinary**: Entrega rápida desde servidores distribuidos globalmente
3. **Transformaciones automáticas**: Cloudinary optimiza formato/calidad automáticamente
4. **Límite drror conectando a Cloudinary"
**Solución**: Verificar que las variables de entorno `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` estén configuradas correctamente en `.env`.

### Error: "File too large"
**Solución**: El archivo excede 5MB. Validar en el cliente antes de enviar.

### Error: "Too many files"
**Solución**: Se intentaron subir más de 5 archivos. Validar en el cliente.

### Las imágenes no se ven en el frontend
**Solución**: Las URLs de Cloudinary son públicas y no requieren CORS. Verificar que la URL completa esté guardada en la base de datos.

### Error: "Invalid public_id" al eliminar
**Solución**: Verificar que la extracción del `public_id` desde la URL de Cloudinary sea correcta. El formato debe ser `egresados-ies/publicaciones/pub-123` (sin extensión).

### Las imágenes antiguas (filesystem local) no se ven
**Solución**: Ejecutar script de limpieza para eliminar referencias a URLs `/uploads/...`:
```bash
cd backend
node scripts/cleanup-old-uploads.js
```
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
Cloudinary SDK**: 2.8.0
- **multer-storage-cloudinary**: 4.0.0
- **Storage**: Cloudinary CDN (no filesystem local)
- **Formato de URL**: URL completa de Cloudinary (`https://res.cloudinary.com/...`)
- **Eliminación**: Automática desde Cloudinary cuando se elimina la publicación
- **Transformaciones**: Aplicadas automáticamente por Cloudinary (optimización, límite de resolución)

## 🔗 Referencias

- [Multer Documentation](https://github.com/expressjs/multer)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [multer-storage-cloudinary](https://github.com/affanshahid/multer-storage-cloudinary)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations
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
