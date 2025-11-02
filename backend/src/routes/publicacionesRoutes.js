import express from "express";
import rateLimit from "express-rate-limit";
import { authenticateToken } from "../middleware/auth.js";
import { requireEgresado } from "../middleware/roles.js";
import * as publicacionesController from "../controllers/publicacionesController.js";

const router = express.Router();

// Rate limiting para publicaciones
const publicacionesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por ventana
    message: {
        success: false,
        message: "Demasiadas solicitudes. Intenta más tarde."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting para crear publicaciones
const crearPublicacionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // máximo 10 publicaciones cada 5 minutos
    message: {
        success: false,
        message: "Has creado demasiadas publicaciones muy rápido. Espera un momento."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware: todas las rutas requieren autenticación y ser egresado
router.use(authenticateToken);
router.use(requireEgresado);
router.use(publicacionesLimiter);

/**
 * @route   POST /api/publicaciones
 * @desc    Crear nueva publicación
 * @access  Privado (solo egresados autenticados)
 * @body    { "contenido": string, "imagenes": ["url1", "url2"] }
 */
router.post("/", crearPublicacionLimiter, publicacionesController.crearPublicacion);

/**
 * @route   GET /api/publicaciones
 * @desc    Listar publicaciones (feed paginado)
 * @access  Privado (solo egresados autenticados)
 * @query   { "page": number, "limit": number }
 */
router.get("/", publicacionesController.listarPublicaciones);

/**
 * @route   GET /api/publicaciones/:id
 * @desc    Ver publicación específica
 * @access  Privado (solo egresados autenticados)
 * @param   {number} id - ID de la publicación
 */
router.get("/:id", publicacionesController.verPublicacion);

/**
 * @route   PUT /api/publicaciones/:id
 * @desc    Editar publicación propia
 * @access  Privado (solo el autor de la publicación)
 * @param   {number} id - ID de la publicación
 * @body    { "contenido": string, "imagenes": ["url1", "url2"] }
 */
router.put("/:id", publicacionesController.editarPublicacion);

/**
 * @route   DELETE /api/publicaciones/:id
 * @desc    Eliminar publicación propia
 * @access  Privado (solo el autor de la publicación)
 * @param   {number} id - ID de la publicación
 */
router.delete("/:id", publicacionesController.eliminarPublicacion);

/**
 * @route   GET /api/publicaciones/usuario/:userId
 * @desc    Publicaciones de un usuario específico
 * @access  Privado (solo egresados autenticados)
 * @param   {number} userId - ID del usuario
 * @query   { "page": number, "limit": number }
 */
router.get("/usuario/:userId", publicacionesController.publicacionesDeUsuario);

export default router;