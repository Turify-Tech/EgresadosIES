import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    crearComentario,
    obtenerComentariosPorPublicacion,
    editarComentario,
    eliminarComentario
} from "../controllers/comentariosController.js";

const router = express.Router();

/**
 * @route   POST /api/comentarios
 * @desc    Crear nuevo comentario
 * @access  Privado (solo egresados)
 */
router.post("/", authenticateToken, crearComentario);

/**
 * @route   GET /api/comentarios/publicacion/:publicacionId
 * @desc    Obtener comentarios de una publicación
 * @access  Público
 */
router.get("/publicacion/:publicacionId", obtenerComentariosPorPublicacion);

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
