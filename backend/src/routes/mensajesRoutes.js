import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middleware/auth.js";
import { requireEgresado } from "../middleware/roles.js";
import mensajesController from "../controllers/mensajesController.js";

const router = express.Router();

// Rate limiting específico para mensajería
const messagingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por ventana
    message: {
        success: false,
        message: "Demasiadas solicitudes de mensajería. Intenta más tarde."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting más estricto para envío de mensajes
const sendMessageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10, // máximo 10 mensajes por minuto por IP
    message: {
        success: false,
        message: "Has enviado demasiados mensajes muy rápido. Espera un momento."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware: todas las rutas requieren autenticación y ser egresado
router.use(authenticateToken);
router.use(requireEgresado);
router.use(messagingLimiter);

/**
 * @route   POST /api/mensajes
 * @desc    Enviar nuevo mensaje a otro egresado
 * @access  Privado (solo egresados autenticados)
 * @body    { "destinatarioId": number, "contenido": string }
 * @rateLimit 10 mensajes por minuto por IP
 */
router.post("/", sendMessageLimiter, mensajesController.enviarMensaje);

/**
 * @route   GET /api/mensajes/conversaciones
 * @desc    Listar conversaciones del usuario con último mensaje y contador de no leídos
 * @access  Privado (solo egresados autenticados)
 * @query   { "page": number, "limit": number }
 * @returns Array de conversaciones con metadata de paginación
 */
router.get("/conversaciones", mensajesController.listarConversaciones);

/**
 * @route   GET /api/mensajes/conversacion/:userId
 * @desc    Ver mensajes de una conversación específica con otro usuario
 * @access  Privado (solo egresados autenticados)
 * @param   {number} userId - ID del otro usuario en la conversación
 * @query   { "page": number, "limit": number }
 * @returns Lista paginada de mensajes entre ambos usuarios
 */
router.get("/conversacion/:userId", mensajesController.verConversacion);

/**
 * @route   PUT /api/mensajes/:id/leer
 * @desc    Marcar un mensaje específico como leído
 * @access  Privado (solo el destinatario del mensaje)
 * @param   {number} id - ID del mensaje a marcar como leído
 */
router.put("/:id/leer", mensajesController.marcarComoLeido);

/**
 * @route   GET /api/mensajes/no-leidos
 * @desc    Obtener contador de mensajes no leídos del usuario
 * @access  Privado (solo egresados autenticados)
 * @returns Número total de mensajes no leídos y desglose por remitente
 */
router.get("/no-leidos", mensajesController.contarNoLeidos);

/**
 * @route   PUT /api/mensajes/conversacion/:userId/leer-todos
 * @desc    Marcar todos los mensajes de una conversación como leídos
 * @access  Privado (solo egresados autenticados)
 * @param   {number} userId - ID del otro usuario en la conversación
 */
router.put("/conversacion/:userId/leer-todos", mensajesController.marcarConversacionLeida);

export default router;