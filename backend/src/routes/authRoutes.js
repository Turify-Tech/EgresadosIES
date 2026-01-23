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

// Rate limiting para registro (prevenir spam de bots)
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 intentos de registro por IP cada 15 minutos
    message: {
        success: false,
        message: "Demasiados intentos de registro. Por favor, intenta nuevamente más tarde."
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
 * @rateLimit 50 intentos por 15 minutos por IP
 */
router.post("/register", registerLimiter, register);

export default router;