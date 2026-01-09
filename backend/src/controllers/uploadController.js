import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear directorio de uploads si no existe
const uploadsDir = path.join(__dirname, "../../uploads/profiles");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `perfil-${req.user.id}-${uniqueSuffix}${ext}`);
    },
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Solo se permiten archivos de imagen"));
    }
};

// Configurar multer
export const uploadFotoPerfil = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB máximo
    },
    fileFilter: fileFilter,
});

/**
 * Controlador para subir foto de perfil
 */
export async function subirFotoPerfil(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se recibió ningún archivo",
            });
        }

        // Construir URL de la foto
        const fotoUrl = `/uploads/profiles/${req.file.filename}`;

        console.log("📸 Foto de perfil subida:", {
            usuario: req.user.id,
            archivo: req.file.filename,
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
