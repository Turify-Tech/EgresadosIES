import database from "../config/database.js";
import notificationService from '../services/notificationService.js';

/**
 * Controlador para el sistema de likes en comentarios
 * Maneja toggle de likes y contadores en comentarios
 */

/**
 * Convierte BigInt a Number (necesario para SQLite)
 */
function convertBigIntToNumber(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return Number(obj);
    if (Array.isArray(obj)) return obj.map(convertBigIntToNumber);
    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToNumber(value);
        }
        return converted;
    }
    return obj;
}

/**
 * Toggle like en un comentario
 * @route POST /api/comentarios/:comentarioId/like
 * @desc Dar o quitar like a un comentario
 * @access Privado (solo egresados)
 */
export async function toggleLikeComentario(req, res) {
    try {
        const usuarioId = req.user.id;
        const { comentarioId } = req.params;

        if (!comentarioId) {
            return res.status(400).json({
                success: false,
                message: "El ID del comentario es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que el comentario existe
        const comentario = await client.execute({
            sql: `SELECT id, autorId FROM Comentario WHERE id = ?`,
            args: [comentarioId]
        });

        if (comentario.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        // Verificar si el usuario ya dio like
        const likeExistente = await client.execute({
            sql: `SELECT * FROM LikeComentario 
                  WHERE egresadoId = ? AND comentarioId = ?`,
            args: [usuarioId, comentarioId]
        });

        let accion = '';
        let liked = false;

        if (likeExistente.rows.length > 0) {
            // Quitar like
            await client.execute({
                sql: `DELETE FROM LikeComentario 
                      WHERE egresadoId = ? AND comentarioId = ?`,
                args: [usuarioId, comentarioId]
            });
            accion = 'removido';
            liked = false;
        } else {
            // Dar like
            await client.execute({
                sql: `INSERT INTO LikeComentario (egresadoId, comentarioId) 
                      VALUES (?, ?)`,
                args: [usuarioId, comentarioId]
            });
            accion = 'agregado';
            liked = true;

            // Obtener ID de publicación asociada al comentario para la notificación
            const comentarioAutorId = Number(comentario.rows[0].autorId);
            const comentarioData = await client.execute({
                sql: `SELECT publicacionId FROM Comentario WHERE id = ?`,
                args: [comentarioId]
            });
            const publicacionId = comentarioData.rows[0]?.publicacionId;

            // Notificar al autor del comentario (en background)
            if (publicacionId) {
                notificationService.notificarLikeComentario({
                    comentarioAutorId,
                    likeAutorId: usuarioId,
                    publicacionId: Number(publicacionId),
                    comentarioId: Number(comentarioId)
                }).catch(err => console.error('Error al notificar like de comentario:', err));
            }
        }

        // Contar likes actuales
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM LikeComentario 
                  WHERE comentarioId = ?`,
            args: [comentarioId]
        });

        const totalLikes = Number(countResult.rows[0].total);

        res.json({
            success: true,
            message: `Like ${accion} exitosamente`,
            data: {
                comentarioId: Number(comentarioId),
                liked,
                totalLikes
            }
        });

    } catch (error) {
        console.error("Error en toggle de like de comentario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Obtener total de likes de un comentario
 * @route GET /api/comentarios/:comentarioId/likes
 * @desc Obtener el conteo de likes de un comentario
 * @access Público
 */
export async function obtenerLikesComentario(req, res) {
    try {
        const { comentarioId } = req.params;

        if (!comentarioId) {
            return res.status(400).json({
                success: false,
                message: "El ID del comentario es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que el comentario existe
        const comentario = await client.execute({
            sql: `SELECT id FROM Comentario WHERE id = ?`,
            args: [comentarioId]
        });

        if (comentario.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        // Contar likes
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM LikeComentario 
                  WHERE comentarioId = ?`,
            args: [comentarioId]
        });

        const totalLikes = Number(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                comentarioId: Number(comentarioId),
                totalLikes
            }
        });

    } catch (error) {
        console.error("Error obteniendo likes de comentario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Verificar si el usuario actual dio like a un comentario
 * @route GET /api/comentarios/:comentarioId/mi-like
 * @desc Verificar el estado del like del usuario en un comentario
 * @access Privado (solo egresados)
 */
export async function verificarMiLikeComentario(req, res) {
    try {
        const usuarioId = req.user.id;
        const { comentarioId } = req.params;

        if (!comentarioId) {
            return res.status(400).json({
                success: false,
                message: "El ID del comentario es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que el comentario existe
        const comentario = await client.execute({
            sql: `SELECT id FROM Comentario WHERE id = ?`,
            args: [comentarioId]
        });

        if (comentario.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        // Verificar si el usuario dio like
        const likeResult = await client.execute({
            sql: `SELECT * FROM LikeComentario 
                  WHERE egresadoId = ? AND comentarioId = ?`,
            args: [usuarioId, comentarioId]
        });

        const liked = likeResult.rows.length > 0;

        res.json({
            success: true,
            data: {
                comentarioId: Number(comentarioId),
                liked
            }
        });

    } catch (error) {
        console.error("Error verificando like de comentario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}
