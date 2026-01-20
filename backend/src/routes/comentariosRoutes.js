import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    crearComentario,
    obtenerComentariosPorPublicacion,
    obtenerRespuestasComentario,
    editarComentario,
    eliminarComentario
} from "../controllers/comentariosController.js";
import {
    toggleLikeComentario,
    obtenerLikesComentario,
    verificarMiLikeComentario
} from "../controllers/likesComentariosController.js";

const router = express.Router();

/**
 * @route   POST /api/comentarios
 * @desc    Crear nuevo comentario o respuesta
 * @access  Privado (solo egresados)
 */
router.post("/", authenticateToken, crearComentario);

/**
 * @route   GET /api/comentarios/publicacion/:publicacionId
 * @desc    Obtener comentarios principales de una publicación
 * @access  Público
 */
router.get("/publicacion/:publicacionId", obtenerComentariosPorPublicacion);

/**
 * @route   GET /api/comentarios/:comentarioId/respuestas
 * @desc    Obtener respuestas de un comentario específico
 * @access  Público
 */
router.get("/:comentarioId/respuestas", obtenerRespuestasComentario);

/**
 * @route   POST /api/comentarios/:comentarioId/like
 * @desc    Toggle like en un comentario
 * @access  Privado (solo egresados)
 */
router.post("/:comentarioId/like", authenticateToken, toggleLikeComentario);

/**
 * @route   GET /api/comentarios/:comentarioId/likes
 * @desc    Obtener total de likes de un comentario
 * @access  Público
 */
router.get("/:comentarioId/likes", obtenerLikesComentario);

/**
 * @route   GET /api/comentarios/:comentarioId/mi-like
 * @desc    Verificar si el usuario dio like a un comentario
 * @access  Privado (solo egresados)
 */
router.get("/:comentarioId/mi-like", authenticateToken, verificarMiLikeComentario);

/**
 * @route   PUT /api/comentarios/:id
 * @desc    Editar comentario propio
 * @access  Privado (solo el autor)
 */
router.put("/:id", authenticateToken, editarComentario);

/**
 * @route   DELETE /api/comentarios/:id
 * @desc    Eliminar comentario propio
 * @access  Privado (solo el autor)
 */
router.delete("/:id", authenticateToken, eliminarComentario);

export default router;
