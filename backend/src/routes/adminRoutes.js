import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middleware/auth.js";
import { requirePermission, PERMISSIONS } from "../middleware/roles.js";
import {
    validateAgregarDNIMiddleware,
    validatePaginationMiddleware,
    validateEditarDNIMiddleware,
    validateExcelFile
} from "../validators/adminValidators.js";
import {
    cargarExcel,
    agregarDNI,
    listarDNIs,
    eliminarDNI,
    editarDNI,
    obtenerEstadisticas
} from "../controllers/adminController.js";

const router = express.Router();

// Rate limiting específico para operaciones administrativas
const adminRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por ventana
    message: {
        success: false,
        message: 'Demasiadas operaciones administrativas desde esta IP. Intente nuevamente en 15 minutos.',
        error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
    // Aplicar solo a requests autenticados como admin
    skip: (req) => {
        // Si no hay token, dejar que pase y que falle en auth
        return !req.headers.authorization;
    }
});

// Rate limiting más estricto para carga masiva de Excel
const excelUploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // máximo 10 cargas de Excel por hora por IP
    message: {
        success: false,
        message: 'Límite de cargas masivas excedido. Máximo 10 cargas por hora.',
        error: 'EXCEL_UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Configuración de Multer para carga de archivos Excel
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Validar tipos de archivo Excel
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
        }
    }
});

// Middleware común: rate limiting + autenticación + permisos de administrador
const adminAuth = [
    adminRateLimit,
    authenticateToken,
    requirePermission(PERMISSIONS.ADMIN_PANEL)
];

/**
 * @route   POST /api/admin/dnis/cargar-excel
 * @desc    Cargar DNIs válidos desde archivo Excel
 * @access  Admin only
 * @body    FormData con archivo Excel
 * @rateLimit 10 requests per hour per IP
 */
router.post('/dnis/cargar-excel', 
    excelUploadRateLimit, // Rate limiting específico para Excel
    ...adminAuth,
    upload.single('archivo'),
    (req, res, next) => {
        const validation = validateExcelFile(req.file);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Archivo inválido',
                errors: validation.errors
            });
        }
        next();
    },
    cargarExcel
);

/**
 * @route   POST /api/admin/dnis/agregar
 * @desc    Agregar DNI individual a la lista de válidos
 * @access  Admin only
 * @body    { dni: string, carrera: string }
 */
router.post('/dnis/agregar', 
    ...adminAuth,
    agregarDNI
);

/**
 * @route   GET /api/admin/dnis
 * @desc    Listar DNIs válidos con paginación y filtros
 * @access  Admin only
 * @query   page?, limit?, search?, carrera?
 */
router.get('/dnis', 
    ...adminAuth,
    listarDNIs
);

/**
 * @route   GET /api/admin/dnis/estadisticas
 * @desc    Obtener estadísticas de DNIs válidos
 * @access  Admin only
 */
router.get('/dnis/estadisticas', 
    ...adminAuth,
    obtenerEstadisticas
);

/**
 * @route   DELETE /api/admin/dnis/:dni
 * @desc    Eliminar DNI de la lista de válidos
 * @access  Admin only
 */
router.delete('/dnis/:dni', 
    ...adminAuth,
    eliminarDNI
);

/**
 * @route   PUT /api/admin/dnis/:dni
 * @desc    Editar carrera de un DNI válido
 * @access  Admin only
 * @body    { carrera: string }
 */
router.put('/dnis/:dni', 
    ...adminAuth,
    validateEditarDNIMiddleware,
    editarDNI
);

// Middleware de manejo de errores específico para Multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Archivo demasiado grande. Máximo 10MB permitido.'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Error de archivo: ${error.message}`
        });
    }
    
    if (error.message.includes('Solo se permiten archivos Excel')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    
    next(error);
});

export default router;