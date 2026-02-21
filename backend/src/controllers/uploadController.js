import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * Configuración de Multer con Cloudinary Storage para fotos de perfil
 * Las imágenes se suben directamente a Cloudinary para persistencia en producción
 */

// Configurar almacenamiento en Cloudinary para fotos de perfil
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'egresados-ies/perfiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' }, // Recorte centrado en cara
            { quality: 'auto:good' }, // Calidad automática
            { fetch_format: 'auto' } // Formato automático (WebP cuando sea posible)
        ],
        public_id: (req, file) => {
            // Generar ID único: perfil-{userId}-{timestamp}
            const uniqueId = `perfil-${req.user.id}-${Date.now()}`;
            console.log(`📤 Subiendo foto de perfil a Cloudinary: ${file.originalname} → ${uniqueId}`);
            return uniqueId;
        }
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten: JPG, PNG, GIF, WEBP`), false);
    }
};

// Configurar multer con Cloudinary
export const uploadFotoPerfil = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: fileFilter,
});

/**
 * Controlador para subir foto de perfil
 * La foto ya fue subida a Cloudinary por multer
 */
export async function subirFotoPerfil(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se recibió ningún archivo",
            });
        }

        // Cloudinary devuelve la URL en req.file.path
        const fotoUrl = req.file.path;

        console.log("📸 Foto de perfil subida a Cloudinary:", {
            usuario: req.user.id,
            archivo: req.file.originalname,
            tamaño: `${(req.file.size / 1024).toFixed(2)} KB`,
            url: fotoUrl,
        });

        return res.status(200).json({
            success: true,
            url: fotoUrl,
            mensaje: "Foto subida exitosamente",
        });
    } catch (error) {
        console.error("Error al subir foto:", error);
        return res.status(500).json({
            success: false,
            error: "Error al subir la foto",
        });
    }
}
