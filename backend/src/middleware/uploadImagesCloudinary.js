import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * Configuración de Multer con Cloudinary Storage
 * Las imágenes se suben directamente a Cloudinary
 */

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'egresados-ies/publicaciones',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 1920, height: 1080, crop: 'limit' }, // Limitar tamaño máximo
            { quality: 'auto' }, // Calidad automática
            { fetch_format: 'auto' } // Formato automático (WebP cuando sea posible)
        ],
        public_id: (req, file) => {
            // Generar ID único: pub-{timestamp}-{random}
            const uniqueId = `pub-${Date.now()}-${Math.floor(Math.random() * 1000000000)}`;
            console.log(`📤 Subiendo imagen a Cloudinary: ${file.originalname} → ${uniqueId}`);
            return uniqueId;
        }
    }
});

console.log('✅ Cloudinary Storage configurado correctamente');

// Configurar Multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB por archivo
        files: 5 // Máximo 5 archivos por request
    },
    fileFilter: (req, file, cb) => {
        // Validar tipo MIME
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: JPG, PNG, GIF, WEBP`), false);
        }
    }
});

/**
 * Middleware para subir múltiples imágenes de publicaciones
 */
export const uploadPublicacionImages = upload.array('imagenes', 5);

/**
 * Middleware para manejar errores de Multer
 */
export function handleMulterError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo es demasiado grande. Máximo 5MB por imagen.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Demasiados archivos. Máximo 5 imágenes por publicación.'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Campo de archivo inesperado.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Error en la carga: ${err.message}`
        });
    }
    
    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'Error al procesar las imágenes'
        });
    }
    
    next();
}
