import { Router } from "express";
import {
    buscarPerfiles,
    autocompletado,
    obtenerFiltros,
    busquedaGlobal,
    obtenerSugerencias,
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

/**
 * @route   GET /global
 * @desc    Búsqueda global del sistema (personas, publicaciones, carreras, etc.)
 * @access  Public
 */
router.get("/global", busquedaGlobal);

/**
 * @route   GET /sugerencias
 * @desc    Obtener sugerencias para autocompletado global
 * @access  Public
 */
router.get("/sugerencias", obtenerSugerencias);

export default router;
