import express from "express";
import rateLimit from "express-rate-limit";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Rate limiting para protección contra ataques de fuerza bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 intentos por IP
    message: {
        success: false,
        message: "Demasiados intentos de login. Intenta nuevamente en 15 minutos."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @route   POST /api/auth/login
 * @desc    Login unificado para egresados (con registro automático) y administradores
 * @access  Public
 * @rateLimit 5 intentos por 15 minutos por IP
 */
router.post("/login", loginLimiter, login);

export default router;