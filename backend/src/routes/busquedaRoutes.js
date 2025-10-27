import { Router } from "express";
import { buscarPerfiles } from "../controllers/busquedaController.js";

const router = Router();

/**
 * @route   GET /
 * @desc    Buscar perfiles de egresados
 * @access  Public (por ahora, luego se puede añadir autenticación)
 */
router.get("/", buscarPerfiles);

export default router;