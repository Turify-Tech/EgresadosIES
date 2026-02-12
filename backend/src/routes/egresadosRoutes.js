import { Router } from 'express';
import { buscarEgresados, obtenerInfoEgresados } from '../controllers/egresadosController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/egresados/buscar
 * @desc    Buscar egresados por nombre (para menciones)
 * @access  Privado
 */
router.get('/buscar', authenticateToken, buscarEgresados);

/**
 * @route   POST /api/egresados/info
 * @desc    Obtener información de múltiples egresados por IDs (público para renderizar menciones)
 * @access  Público
 */
router.post('/info', obtenerInfoEgresados);

export default router;
