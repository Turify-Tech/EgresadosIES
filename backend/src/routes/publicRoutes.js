import express from "express";
import rateLimit from "express-rate-limit";
import PublicController from "../controllers/publicController.js";
import { publicDataMiddleware } from "../middleware/publicData.js";

const router = express.Router();

/**
 * Rate limiting para endpoints públicos
 * Más restrictivo que endpoints autenticados para prevenir abuso
 */
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // Límite de 50 requests por IP (más restrictivo que /api/perfiles)
    message: {
        success: false,
        message: "Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde",
    },
    standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Demasiadas solicitudes desde esta IP, intenta nuevamente más tarde",
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
        });
    },
});

/**
 * Rate limiting específico para endpoint de lista
 * Permite más requests para navegación de páginas
 */
const listLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // Más permisivo para paginación
    message: {
        success: false,
        message: "Demasiadas búsquedas, intenta más tarde",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiting para perfiles individuales
 * Más restrictivo para prevenir scraping masivo
 */
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30, // Límite más bajo para perfiles individuales
    message: {
        success: false,
        message: "Demasiadas solicitudes de perfiles, intenta más tarde",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar middleware de sanitización a todas las rutas públicas
router.use(publicDataMiddleware);

/**
 * @route   GET /api/public/graduates
 * @desc    Obtener lista paginada de egresados públicos
 * @access  Público (sin autenticación)
 * @query   {number} page - Número de página (default: 1)
 * @query   {number} limit - Resultados por página (default: 20, max: 50)
 * @query   {string} carrera - Filtro por nombre de carrera
 * @query   {string} ciudad - Filtro por ciudad
 * @query   {string} search - Búsqueda por nombre, habilidades, empresa
 * @query   {string} orderBy - Campo de ordenamiento (nombre|carrera|ciudad)
 * @query   {string} order - Dirección (asc|desc)
 * 
 * @example GET /api/public/graduates?page=1&limit=20&carrera=Desarrollo%20Web
 * @example GET /api/public/graduates?search=React&orderBy=nombre&order=asc
 */
router.get("/graduates", listLimiter, PublicController.getPublicGraduates);

/**
 * @route   GET /api/public/graduates/:id
 * @desc    Obtener perfil completo de un egresado público
 * @access  Público (sin autenticación)
 * @param   {number} id - ID del egresado
 * 
 * @example GET /api/public/graduates/1
 * 
 * @returns {404} Si el perfil no existe o no es público
 * @returns {400} Si el ID no es válido
 */
router.get("/graduates/:id", profileLimiter, PublicController.getPublicGraduate);

/**
 * Middleware para manejar rutas no encontradas dentro de /api/public
 */
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta pública ${req.originalUrl} no encontrada`,
    });
});

export default router;
