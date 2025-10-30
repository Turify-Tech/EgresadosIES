import { Router } from "express";
import {
    buscarPerfiles,
    autocompletado,
    obtenerFiltros,
} from "../controllers/busquedaController.js";

const router = Router();

/**
 * @route   GET /
 * @desc    Buscar perfiles de egresados
 * @access  Public (por ahora, luego se puede añadir autenticación)
 */
router.get("/", buscarPerfiles);

/**
 * @route   GET /autocomplete
 * @desc    Obtener sugerencias de autocompletado
 * @access  Public
 */
router.get("/autocomplete", autocompletado);

/**
 * @route   GET /filtros
 * @desc    Obtener opciones de filtros dinámicamente
 * @access  Public
 */
router.get("/filtros", obtenerFiltros);

export default router;
