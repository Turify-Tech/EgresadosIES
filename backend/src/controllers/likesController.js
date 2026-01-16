import database from "../config/database.js";
import notificationService from "../services/notificationService.js";

/**
 * Controlador para el sistema de likes en publicaciones
 * Maneja toggle de likes y contadores
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
 * Toggle like en una publicación
 * @route POST /api/likes/toggle/:publicacionId
 * @desc Dar o quitar like a una publicación
 * @access Privado (solo egresados)
 */
export async function toggleLike(req, res) {
    try {
        const usuarioId = req.user.id;
        const { publicacionId } = req.params;

        if (!publicacionId) {
            return res.status(400).json({
                success: false,
                message: "El ID de la publicación es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que la publicación existe y obtener el autor
        const publicacion = await client.execute({
            sql: `SELECT id, autorId FROM Publicacion WHERE id = ?`,
            args: [publicacionId]
        });

        if (publicacion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "La publicación no existe"
            });
        }

        const publicacionAutorId = publicacion.rows[0].autorId;

        // Verificar si el usuario ya dio like
        const likeExistente = await client.execute({
            sql: `SELECT * FROM LikePublicacion 
                  WHERE egresadoId = ? AND publicacionId = ?`,
            args: [usuarioId, publicacionId]
        });

        let accion = '';
        let liked = false;

        if (likeExistente.rows.length > 0) {
            // Quitar like
            await client.execute({
                sql: `DELETE FROM LikePublicacion 
                      WHERE egresadoId = ? AND publicacionId = ?`,
                args: [usuarioId, publicacionId]
            });
            accion = 'removido';
            liked = false;
        } else {
            // Dar like
            await client.execute({
                sql: `INSERT INTO LikePublicacion (egresadoId, publicacionId) 
                      VALUES (?, ?)`,
                args: [usuarioId, publicacionId]
            });
            accion = 'agregado';
            liked = true;

            // Notificar al autor de la publicación (en background, solo al dar like)
            notificationService.notificarLike({
                publicacionAutorId: Number(publicacionAutorId),
                likeAutorId: usuarioId,
                publicacionId: Number(publicacionId)
            }).catch(err => console.error('Error al enviar notificación de like:', err));
        }

        // Contar likes actuales
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM LikePublicacion 
                  WHERE publicacionId = ?`,
            args: [publicacionId]
        });

        const totalLikes = Number(countResult.rows[0].total);

        res.json({
            success: true,
            message: `Like ${accion} exitosamente`,
            data: {
                publicacionId: Number(publicacionId),
                liked,
                totalLikes
            }
        });

    } catch (error) {
        console.error("Error en toggle de like:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Obtener cantidad de likes de una publicación
 * @route GET /api/likes/publicacion/:publicacionId
 * @desc Obtener el contador de likes de una publicación
 * @access Público
 */
export async function contarLikes(req, res) {
    try {
        const { publicacionId } = req.params;

        if (!publicacionId) {
            return res.status(400).json({
                success: false,
                message: "El ID de la publicación es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que la publicación existe
        const publicacion = await client.execute({
            sql: `SELECT id FROM Publicacion WHERE id = ?`,
            args: [publicacionId]
        });

        if (publicacion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "La publicación no existe"
            });
        }

        // Contar likes
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM LikePublicacion 
                  WHERE publicacionId = ?`,
            args: [publicacionId]
        });

        const totalLikes = Number(countResult.rows[0].total);

        res.json({
            success: true,
            data: {
                publicacionId: Number(publicacionId),
                totalLikes
            }
        });

    } catch (error) {
        console.error("Error contando likes:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Verificar si el usuario dio like a una publicación
 * @route GET /api/likes/mi-estado/:publicacionId
 * @desc Verificar si el usuario autenticado dio like a una publicación
 * @access Privado (solo egresados)
 */
export async function verificarEstadoLike(req, res) {
    try {
        const usuarioId = req.user.id;
        const { publicacionId } = req.params;

        if (!publicacionId) {
            return res.status(400).json({
                success: false,
                message: "El ID de la publicación es obligatorio"
            });
        }

        const client = database.getClient();

        // Verificar que la publicación existe
        const publicacion = await client.execute({
            sql: `SELECT id FROM Publicacion WHERE id = ?`,
            args: [publicacionId]
        });

        if (publicacion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "La publicación no existe"
            });
        }

        // Verificar si el usuario dio like
        const likeResult = await client.execute({
            sql: `SELECT * FROM LikePublicacion 
                  WHERE egresadoId = ? AND publicacionId = ?`,
            args: [usuarioId, publicacionId]
        });

        const liked = likeResult.rows.length > 0;

        res.json({
            success: true,
            data: {
                publicacionId: Number(publicacionId),
                liked
            }
        });

    } catch (error) {
        console.error("Error verificando estado de like:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}
