import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    obtenerNotificaciones,
    obtenerContadorNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    obtenerPreferencias,
    actualizarPreferencias,
    limpiarNotificacionesLeidas
} from '../controllers/notificacionesController.js';

const router = express.Router();

/**
 * @route   GET /api/notificaciones
 * @desc    Obtener notificaciones del usuario autenticado
 * @query   limit, offset, solo_no_leidas
 * @access  Privado
 */
router.get('/', authenticateToken, obtenerNotificaciones);

/**
 * @route   GET /api/notificaciones/no-leidas/contador
 * @desc    Obtener contador de notificaciones no leídas
 * @access  Privado
 */
router.get('/no-leidas/contador', authenticateToken, obtenerContadorNoLeidas);

/**
 * @route   GET /api/notificaciones/preferencias
 * @desc    Obtener preferencias de notificaciones del usuario
 * @access  Privado
 */
router.get('/preferencias', authenticateToken, obtenerPreferencias);

/**
 * @route   PUT /api/notificaciones/preferencias
 * @desc    Actualizar preferencias de notificaciones
 * @access  Privado
 */
router.put('/preferencias', authenticateToken, actualizarPreferencias);

/**
 * @route   PUT /api/notificaciones/leer-todas
 * @desc    Marcar todas las notificaciones como leídas
 * @access  Privado
 */
router.put('/leer-todas', authenticateToken, marcarTodasComoLeidas);

/**
 * @route   PUT /api/notificaciones/:id/leer
 * @desc    Marcar una notificación como leída
 * @access  Privado
 */
router.put('/:id/leer', authenticateToken, marcarComoLeida);

/**
 * @route   DELETE /api/notificaciones/limpiar-leidas
 * @desc    Eliminar todas las notificaciones leídas
 * @access  Privado
 */
router.delete('/limpiar-leidas', authenticateToken, limpiarNotificacionesLeidas);

/**
 * @route   DELETE /api/notificaciones/:id
 * @desc    Eliminar una notificación específica
 * @access  Privado
 */
router.delete('/:id', authenticateToken, eliminarNotificacion);

export default router;
