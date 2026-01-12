import express from "express";
import rateLimit from "express-rate-limit";
import PerfilesController from "../controllers/perfilesController.js";
import { publicDataMiddleware } from "../middleware/sanitizePublicData.js";

const router = express.Router();

// Aplicar middleware de sanitización a TODAS las rutas
// Capa adicional de seguridad que elimina datos sensibles automáticamente
router.use(publicDataMiddleware);

/**
 * Rate limiting para lista de perfiles
 * Issue #14 - Protección contra DDoS
 * Límite más permisivo para navegación general
 */
const listLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por ventana
    message: { 
        success: false, 
        message: "Demasiadas solicitudes, intenta más tarde" 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiting para perfiles individuales
 * Issue #14 - Protección contra scraping masivo
 * Límite más restrictivo para acceso a datos detallados
 */
const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 30, // 30 requests por ventana
    message: { 
        success: false, 
        message: "Demasiadas solicitudes, intenta más tarde" 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @route GET /api/perfiles
 * @desc Obtener lista paginada de perfiles públicos de egresados
 * @access Público (sin autenticación)
 * @security Rate limit: 100 requests/15min
 * @security Solo perfiles con perfilPublico = 1
 * @security Excluye: email, telefono, dni
 * 
 * @query {number} page - Página actual (default: 1)
 * @query {number} limit - Registros por página (max: 50, default: 20)
 * @query {string} search - Búsqueda en nombre, apellido, carrera
 * @query {string} carrera - Filtrar por carrera específica
 * @query {string} ciudad - Filtrar por ciudad
 * @query {string} orderBy - Ordenar por: nombre, carrera, ciudad (default: nombre)
 * @query {string} order - asc/desc (default: asc)
 */
router.get("/", listLimiter, PerfilesController.getPerfilesPublicos);

/**
 * @route GET /api/perfiles/:id
 * @desc Obtener perfil completo de un egresado específico
 * @access Público (sin autenticación)
 * @security Rate limit: 30 requests/15min
 * @security Solo perfiles con perfilPublico = 1
 * @security Excluye: email, telefono, dni
 * @security Retorna 404 genérico para perfiles privados
 * 
 * @param {number} id - ID del usuario egresado
 * @returns Perfil con experiencias, formación, cursos, proyectos, habilidades
 */
router.get("/:id", profileLimiter, PerfilesController.getPerfilPublico);

export default router;