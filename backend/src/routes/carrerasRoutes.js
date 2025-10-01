import express from "express";
import PerfilesController from "../controllers/perfilesController.js";

const router = express.Router();

/**
 * @route GET /api/carreras
 * @desc Obtener lista de carreras disponibles
 * @access Público
 */
router.get("/", PerfilesController.getCarreras);

export default router;