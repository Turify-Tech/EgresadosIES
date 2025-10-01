import express from "express";
import PerfilesController from "../controllers/perfilesController.js";

const router = express.Router();

/**
 * @route GET /api/perfiles
 * @desc Obtener lista paginada de perfiles públicos de egresados
 * @access Público
 * @query {number} page - Número de página (default: 1)
 * @query {number} limit - Cantidad de resultados por página (default: 10, max: 50)
 * @query {string} carrera - Filtrar por nombre de carrera (opcional)
 */
router.get("/", PerfilesController.getPerfilesPublicos);

/**
 * @route GET /api/perfiles/:id
 * @desc Obtener perfil específico de un egresado
 * @access Público
 * @param {number} id - ID del egresado
 */
router.get("/:id", PerfilesController.getPerfilPublico);

export default router;