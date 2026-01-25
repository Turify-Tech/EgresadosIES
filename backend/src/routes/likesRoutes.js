import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
    toggleLike,
    contarLikes,
    verificarEstadoLike,
    verificarEstadoLikeBatch
} from "../controllers/likesController.js";

const router = express.Router();

/**
 * @route   POST /api/likes/toggle/:publicacionId
 * @desc    Dar o quitar like a una publicación
 * @access  Privado (solo egresados)
 */
router.post("/toggle/:publicacionId", authenticateToken, toggleLike);

/**
 * @route   GET /api/likes/publicacion/:publicacionId
 * @desc    Obtener cantidad de likes de una publicación
 * @access  Público
 */
router.get("/publicacion/:publicacionId", contarLikes);

/**
 * @route   GET /api/likes/mi-estado/:publicacionId
 * @desc    Verificar si el usuario dio like a una publicación
 * @access  Privado (solo egresados)
 */
router.get("/mi-estado/:publicacionId", authenticateToken, verificarEstadoLike);

/**
 * @route   POST /api/likes/mi-estado-batch
 * @desc    Verificar estado de like para múltiples publicaciones
 * @access  Privado (solo egresados)
 */
router.post("/mi-estado-batch", authenticateToken, verificarEstadoLikeBatch);

export default router;
