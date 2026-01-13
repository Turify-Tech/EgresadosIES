import database from '../config/database.js';
import notificationService from '../services/notificationService.js';

/**
 * Controlador de Notificaciones
 * Gestiona las notificaciones internas del usuario
 */

/**
 * Obtener todas las notificaciones del usuario autenticado
 * @route GET /api/notificaciones
 * @access Privado
 */
export async function obtenerNotificaciones(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const limit = Number(req.query.limit) || 20;
        const offset = Number(req.query.offset) || 0;
        const solo_no_leidas = req.query.solo_no_leidas;

        if (isNaN(usuarioId)) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        const db = database.getClient();

        // Construir query base
        let sql = `
            SELECT 
                n.id,
                n.tipo,
                n.titulo,
                n.mensaje,
                n.url_destino as urlDestino,
                n.leida,
                n.fecha_creacion as fechaCreacion,
                n.origen_usuario_id as origenUsuarioId,
                u.nombre as origenNombre,
                u.apellido as origenApellido,
                p.urlFotoPerfil as origenFotoPerfil
            FROM Notificacion n
            LEFT JOIN Usuario u ON u.id = n.origen_usuario_id
            LEFT JOIN Egresado e ON e.id = u.id
            LEFT JOIN Perfil p ON p.id = e.perfilId
            WHERE n.usuario_id = ?
        `;

        const args = [usuarioId];

        // Filtrar solo no leídas si se solicita
        if (solo_no_leidas === 'true' || solo_no_leidas === true) {
            sql += ' AND n.leida = 0';
        }

        sql += ' ORDER BY n.fecha_creacion DESC LIMIT ? OFFSET ?';
        args.push(limit, offset);

        const result = await db.execute({ sql, args });

        // Contar total de no leídas
        const countResult = await db.execute({
            sql: 'SELECT COUNT(*) as total FROM Notificacion WHERE usuario_id = ? AND leida = 0',
            args: [usuarioId]
        });

        res.json({
            notificaciones: result.rows,
            noLeidas: Number(countResult.rows[0].total),
            hasMore: result.rows.length === parseInt(limit)
        });
    } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        res.status(500).json({ 
            error: 'Error al obtener notificaciones',
            details: error.message 
        });
    }
}

/**
 * Obtener contador de notificaciones no leídas
 * @route GET /api/notificaciones/no-leidas/contador
 * @access Privado
 */
export async function obtenerContadorNoLeidas(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const db = database.getClient();

        const result = await db.execute({
            sql: 'SELECT COUNT(*) as total FROM Notificacion WHERE usuario_id = ? AND leida = 0',
            args: [usuarioId]
        });

        res.json({ 
            noLeidas: Number(result.rows[0].total) 
        });
    } catch (error) {
        console.error('❌ Error al obtener contador:', error);
        res.status(500).json({ 
            error: 'Error al obtener contador',
            details: error.message 
        });
    }
}

/**
 * Marcar una notificación como leída
 * @route PUT /api/notificaciones/:id/leer
 * @access Privado
 */
export async function marcarComoLeida(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const { id } = req.params;
        const db = database.getClient();

        // Verificar que la notificación pertenece al usuario
        const verificacion = await db.execute({
            sql: 'SELECT id FROM Notificacion WHERE id = ? AND usuario_id = ?',
            args: [id, usuarioId]
        });

        if (verificacion.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        // Marcar como leída
        await db.execute({
            sql: 'UPDATE Notificacion SET leida = 1 WHERE id = ?',
            args: [id]
        });

        res.json({ 
            message: 'Notificación marcada como leída',
            id: Number(id)
        });
    } catch (error) {
        console.error('❌ Error al marcar notificación:', error);
        res.status(500).json({ 
            error: 'Error al marcar notificación',
            details: error.message 
        });
    }
}

/**
 * Marcar todas las notificaciones como leídas
 * @route PUT /api/notificaciones/leer-todas
 * @access Privado
 */
export async function marcarTodasComoLeidas(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const db = database.getClient();

        const result = await db.execute({
            sql: 'UPDATE Notificacion SET leida = 1 WHERE usuario_id = ? AND leida = 0',
            args: [usuarioId]
        });

        res.json({ 
            message: 'Todas las notificaciones marcadas como leídas',
            actualizadas: result.rowsAffected || 0
        });
    } catch (error) {
        console.error('❌ Error al marcar todas:', error);
        res.status(500).json({ 
            error: 'Error al marcar todas las notificaciones',
            details: error.message 
        });
    }
}

/**
 * Eliminar una notificación
 * @route DELETE /api/notificaciones/:id
 * @access Privado
 */
export async function eliminarNotificacion(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const { id } = req.params;
        const db = database.getClient();

        // Verificar que la notificación pertenece al usuario
        const verificacion = await db.execute({
            sql: 'SELECT id FROM Notificacion WHERE id = ? AND usuario_id = ?',
            args: [id, usuarioId]
        });

        if (verificacion.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        // Eliminar notificación
        await db.execute({
            sql: 'DELETE FROM Notificacion WHERE id = ?',
            args: [id]
        });

        res.json({ 
            message: 'Notificación eliminada',
            id: Number(id)
        });
    } catch (error) {
        console.error('❌ Error al eliminar notificación:', error);
        res.status(500).json({ 
            error: 'Error al eliminar notificación',
            details: error.message 
        });
    }
}

/**
 * Obtener preferencias de notificaciones del usuario
 * @route GET /api/notificaciones/preferencias
 * @access Privado
 */
export async function obtenerPreferencias(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const preferencias = await notificationService.obtenerPreferencias(usuarioId);

        if (!preferencias) {
            return res.status(404).json({ error: 'Preferencias no encontradas' });
        }

        res.json(preferencias);
    } catch (error) {
        console.error('❌ Error al obtener preferencias:', error);
        res.status(500).json({ 
            error: 'Error al obtener preferencias',
            details: error.message 
        });
    }
}

/**
 * Actualizar preferencias de notificaciones
 * @route PUT /api/notificaciones/preferencias
 * @access Privado
 */
export async function actualizarPreferencias(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const {
            email_comentarios,
            email_likes,
            email_menciones,
            email_resumen_diario
        } = req.body;

        const db = database.getClient();

        // Construir UPDATE dinámicamente
        const campos = [];
        const valores = [];

        if (email_comentarios !== undefined) {
            campos.push('email_comentarios = ?');
            valores.push(email_comentarios ? 1 : 0);
        }
        if (email_likes !== undefined) {
            campos.push('email_likes = ?');
            valores.push(email_likes ? 1 : 0);
        }
        if (email_menciones !== undefined) {
            campos.push('email_menciones = ?');
            valores.push(email_menciones ? 1 : 0);
        }
        if (email_resumen_diario !== undefined) {
            campos.push('email_resumen_diario = ?');
            valores.push(email_resumen_diario ? 1 : 0);
        }

        if (campos.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
        }

        campos.push('fecha_actualizacion = CURRENT_TIMESTAMP');
        valores.push(usuarioId);

        const sql = `UPDATE PreferenciasNotificacion SET ${campos.join(', ')} WHERE usuario_id = ?`;

        await db.execute({ sql, args: valores });

        // Obtener preferencias actualizadas
        const preferenciasActualizadas = await notificationService.obtenerPreferencias(usuarioId);

        res.json({
            message: 'Preferencias actualizadas correctamente',
            preferencias: preferenciasActualizadas
        });
    } catch (error) {
        console.error('❌ Error al actualizar preferencias:', error);
        res.status(500).json({ 
            error: 'Error al actualizar preferencias',
            details: error.message 
        });
    }
}

/**
 * Eliminar todas las notificaciones leídas
 * @route DELETE /api/notificaciones/limpiar-leidas
 * @access Privado
 */
export async function limpiarNotificacionesLeidas(req, res) {
    try {
        const usuarioId = Number(req.user.id);
        const db = database.getClient();

        const result = await db.execute({
            sql: 'DELETE FROM Notificacion WHERE usuario_id = ? AND leida = 1',
            args: [usuarioId]
        });

        res.json({ 
            message: 'Notificaciones leídas eliminadas',
            eliminadas: result.rowsAffected || 0
        });
    } catch (error) {
        console.error('❌ Error al limpiar notificaciones:', error);
        res.status(500).json({ 
            error: 'Error al limpiar notificaciones',
            details: error.message 
        });
    }
}
