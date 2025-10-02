import express from "express";
import rateLimit from "express-rate-limit";
import PerfilesController from "../controllers/perfilesController.js";

const router = express.Router();

// Rate limiting para endpoints públicos
const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de requests por IP
    message: { 
        success: false, 
        message: "Demasiadas solicitudes, intenta más tarde" 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Aplicar rate limiting a todas las rutas
router.use(publicApiLimiter);

/**
 * @route GET /api/carreras
 * @desc Obtener lista de carreras disponibles
 * @access Público
 */
router.get("/", PerfilesController.getCarreras);

export default router;