import express from "express";
import rateLimit from "express-rate-limit";
import { login, register } from "../controllers/authController.js";

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

// Rate limiting para registro (más permisivo)
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 intentos de registro por IP por hora
    message: {
        success: false,
        message: "Demasiados intentos de registro. Intenta nuevamente en 1 hora."
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

/**
 * @route   POST /api/auth/register
 * @desc    Registro completo de nuevos egresados
 * @access  Public
 * @rateLimit 3 intentos por hora por IP
 */
router.post("/register", registerLimiter, register);

export default router;