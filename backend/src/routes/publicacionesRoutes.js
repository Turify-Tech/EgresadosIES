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

/**
 * @route   GET /api/publicaciones
 * @desc    Listar publicaciones (feed paginado)
 * @access  Público
 * @query   { "page": number, "limit": number }
 */
router.get("/", publicacionesLimiter, publicacionesController.listarPublicaciones);

/**
 * @route   GET /api/publicaciones/mis-publicaciones
 * @desc    Mis publicaciones (del usuario autenticado)
 * @access  Privado (solo egresados autenticados)
 * @query   { "page": number, "limit": number }
 */
router.get("/mis-publicaciones", authenticateToken, requireEgresado, publicacionesLimiter, publicacionesController.misPublicaciones);

/**
 * @route   GET /api/publicaciones/usuario/:userId
 * @desc    Publicaciones de un usuario específico
 * @access  Público
 * @param   {number} userId - ID del usuario
 * @query   { "page": number, "limit": number }
 */
router.get("/usuario/:userId", publicacionesLimiter, publicacionesController.publicacionesDeUsuario);

/**
 * @route   GET /api/publicaciones/:id
 * @desc    Ver publicación específica
 * @access  Público
 * @param   {number} id - ID de la publicación
 */
router.get("/:id", publicacionesLimiter, publicacionesController.verPublicacion);

/**
 * @route   POST /api/publicaciones
 * @desc    Crear nueva publicación
 * @access  Privado (solo egresados autenticados)
 * @body    { "contenido": string, "imagenes": ["url1", "url2"] }
 */
router.post("/", authenticateToken, requireEgresado, crearPublicacionLimiter, publicacionesController.crearPublicacion);

/**
 * @route   POST /api/publicaciones
 * @desc    Crear nueva publicación
 * @access  Privado (solo egresados autenticados)
 * @body    { "contenido": string, "imagenes": ["url1", "url2"] }
 */
router.post("/", authenticateToken, requireEgresado, crearPublicacionLimiter, publicacionesController.crearPublicacion);

/**
 * @route   PUT /api/publicaciones/:id
 * @desc    Editar publicación propia
 * @access  Privado (solo el autor de la publicación)
 * @param   {number} id - ID de la publicación
 * @body    { "contenido": string, "imagenes": ["url1", "url2"] }
 */
router.put("/:id", authenticateToken, requireEgresado, publicacionesController.editarPublicacion);

/**
 * @route   DELETE /api/publicaciones/:id
 * @desc    Eliminar publicación propia
 * @access  Privado (solo el autor de la publicación)
 * @param   {number} id - ID de la publicación
 */
router.delete("/:id", authenticateToken, requireEgresado, publicacionesController.eliminarPublicacion);

export default router;