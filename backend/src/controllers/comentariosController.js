import database from "../config/database.js";
import notificationService from "../services/notificationService.js";

/**
 * Controlador para el sistema de comentarios en publicaciones
 * Maneja CRUD de comentarios con validaciones de propiedad
 */

const SECURITY_LIMITS = {
    COMENTARIOS: {
        MAX_PER_PAGE: 100,
        DEFAULT_LIMIT: 50,
        MAX_CONTENT_LENGTH: 500
    }
};

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
 * Crear nuevo comentario
 * @route POST /api/comentarios
 * @desc Crear un comentario en una publicación
 * @access Privado (solo egresados)
 */
export async function crearComentario(req, res) {
    try {
        const usuarioId = req.user.id;
        const { contenido, publicacionId, comentarioPadreId } = req.body;

        // Validaciones
        if (!contenido || contenido.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "El contenido es obligatorio"
            });
        }

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

        // Si es una respuesta, verificar que el comentario padre existe y obtener su autor
        let comentarioPadreAutorId = null;
        if (comentarioPadreId) {
            const comentarioPadre = await client.execute({
                sql: `SELECT id, autorId FROM Comentario WHERE id = ?`,
                args: [comentarioPadreId]
            });

            if (comentarioPadre.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "El comentario al que intentas responder no existe"
                });
            }

            comentarioPadreAutorId = comentarioPadre.rows[0].autorId;
        }

        // Crear el comentario (con o sin comentarioPadreId)
        const insertResult = await client.execute({
            sql: `INSERT INTO Comentario (contenido, autorId, publicacionId, comentarioPadreId) 
                  VALUES (?, ?, ?, ?)`,
            args: [contenido.trim(), usuarioId, publicacionId, comentarioPadreId || null]
        });

        const comentarioId = insertResult.lastInsertRowid;

        // Si es una respuesta, notificar al autor del comentario padre
        if (comentarioPadreAutorId) {
            notificationService.notificarRespuesta({
                comentarioPadreAutorId: Number(comentarioPadreAutorId),
                respuestaAutorId: usuarioId,
                respuestaTexto: contenido.trim(),
                publicacionId: Number(publicacionId),
                respuestaId: Number(comentarioId)
            }).catch(err => console.error('Error al notificar respuesta:', err));
        }

        // Notificar al autor de la publicación (solo si no es una respuesta o si el autor de la publicación es diferente al del comentario padre)
        if (!comentarioPadreAutorId || comentarioPadreAutorId !== publicacionAutorId) {
            notificationService.notificarComentario({
                publicacionAutorId: Number(publicacionAutorId),
                comentarioAutorId: usuarioId,
                comentarioTexto: contenido.trim(),
                publicacionId: Number(publicacionId),
                comentarioId: Number(comentarioId)
            }).catch(err => console.error('Error al enviar notificación:', err));
        }

        // Detectar y notificar menciones (en background)
        const usuariosMencionados = await notificationService.detectarMenciones(contenido.trim());
        for (const usuarioMencionadoId of usuariosMencionados) {
            notificationService.notificarMencion({
                usuarioMencionadoId,
                autorMencionId: usuarioId,
                comentarioTexto: contenido.trim(),
                publicacionId: Number(publicacionId),
                comentarioId: Number(comentarioId)
            }).catch(err => console.error('Error al notificar mención:', err));
        }

        // Obtener el comentario completo con datos del autor y contador de likes
        const comentarioCompleto = await client.execute({
            sql: `
                SELECT 
                    c.id,
                    c.contenido,
                    c.fechaCreacion,
                    c.fueEditado,
                    c.autorId,
                    c.publicacionId,
                    c.comentarioPadreId,
                    u.nombre,
                    u.apellido,
                    p.urlFotoPerfil,
                    car.nombre as tituloCarrera,
                    (SELECT COUNT(*) FROM LikeComentario WHERE comentarioId = c.id) as totalLikes
                FROM Comentario c
                INNER JOIN Usuario u ON c.autorId = u.id
                LEFT JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera car ON e.carreraId = car.id
                WHERE c.id = ?
            `,
            args: [comentarioId]
        });

        const comentario = convertBigIntToNumber(comentarioCompleto.rows[0]);

        res.status(201).json({
            success: true,
            message: "Comentario creado exitosamente",
            data: {
                id: comentario.id,
                contenido: comentario.contenido,
                fechaCreacion: comentario.fechaCreacion,
                fueEditado: Boolean(comentario.fueEditado),
                autor: {
                    id: comentario.autorId,
                    nombre: comentario.nombre,
                    apellido: comentario.apellido,
                    urlFotoPerfil: comentario.urlFotoPerfil,
                    tituloCarrera: comentario.tituloCarrera
                },
                publicacionId: comentario.publicacionId,
                comentarioPadreId: comentario.comentarioPadreId,
                totalLikes: comentario.totalLikes || 0,
                totalRespuestas: 0
            }
        });

    } catch (error) {
        console.error("Error creando comentario:", error);
        console.error("Error stack:", error.stack);
        console.error("Request body:", req.body);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Obtener comentarios de una publicación
 * @route GET /api/comentarios/publicacion/:publicacionId
 * @desc Obtener todos los comentarios de una publicación (paginados)
 * @access Público
 */
export async function obtenerComentariosPorPublicacion(req, res) {
    try {
        const { publicacionId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            parseInt(req.query.limit) || SECURITY_LIMITS.COMENTARIOS.DEFAULT_LIMIT,
            SECURITY_LIMITS.COMENTARIOS.MAX_PER_PAGE
        );
        const offset = (page - 1) * limit;

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

        // Contar total de comentarios
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM Comentario WHERE publicacionId = ?`,
            args: [publicacionId]
        });

        const total = Number(countResult.rows[0].total);

        // Obtener comentarios principales (sin comentarioPadreId) con datos del autor
        const comentariosResult = await client.execute({
            sql: `
                SELECT 
                    c.id,
                    c.contenido,
                    c.fechaCreacion,
                    c.fueEditado,
                    c.autorId,
                    c.publicacionId,
                    c.comentarioPadreId,
                    u.nombre,
                    u.apellido,
                    p.urlFotoPerfil,
                    car.nombre as tituloCarrera,
                    (SELECT COUNT(*) FROM Comentario WHERE comentarioPadreId = c.id) as totalRespuestas,
                    (SELECT COUNT(*) FROM LikeComentario WHERE comentarioId = c.id) as totalLikes
                FROM Comentario c
                INNER JOIN Usuario u ON c.autorId = u.id
                LEFT JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera car ON e.carreraId = car.id
                WHERE c.publicacionId = ? AND c.comentarioPadreId IS NULL
                ORDER BY c.fechaCreacion DESC
                LIMIT ? OFFSET ?
            `,
            args: [publicacionId, limit, offset]
        });

        const comentarios = comentariosResult.rows.map(c => {
            const converted = convertBigIntToNumber(c);
            return {
                id: converted.id,
                contenido: converted.contenido,
                fechaCreacion: converted.fechaCreacion,
                fueEditado: Boolean(converted.fueEditado),
                autor: {
                    id: converted.autorId,
                    nombre: converted.nombre,
                    apellido: converted.apellido,
                    urlFotoPerfil: converted.urlFotoPerfil,
                    tituloCarrera: converted.tituloCarrera
                },
                publicacionId: converted.publicacionId,
                comentarioPadreId: converted.comentarioPadreId,
                totalLikes: converted.totalLikes || 0,
                totalRespuestas: converted.totalRespuestas || 0
            };
        });

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: comentarios,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });

    } catch (error) {
        console.error("Error obteniendo comentarios:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Editar comentario propio
 * @route PUT /api/comentarios/:id
 * @desc Editar un comentario propio
 * @access Privado (solo el autor del comentario)
 */
export async function editarComentario(req, res) {
    try {
        const usuarioId = req.user.id;
        const { id } = req.params;
        const { contenido } = req.body;

        // Validaciones
        if (!contenido || contenido.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "El contenido es obligatorio"
            });
        }

        if (contenido.length > SECURITY_LIMITS.COMENTARIOS.MAX_CONTENT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `El comentario no puede exceder ${SECURITY_LIMITS.COMENTARIOS.MAX_CONTENT_LENGTH} caracteres`
            });
        }

        const client = database.getClient();

        // Verificar que el comentario existe y pertenece al usuario
        const comentario = await client.execute({
            sql: `SELECT autorId FROM Comentario WHERE id = ?`,
            args: [id]
        });

        if (comentario.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        if (Number(comentario.rows[0].autorId) !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para editar este comentario"
            });
        }

        // Actualizar el comentario
        await client.execute({
            sql: `UPDATE Comentario 
                  SET contenido = ?, fueEditado = 1 
                  WHERE id = ?`,
            args: [contenido.trim(), id]
        });

        // Obtener el comentario actualizado con datos del autor
        const comentarioActualizado = await client.execute({
            sql: `
                SELECT 
                    c.id,
                    c.contenido,
                    c.fechaCreacion,
                    c.fueEditado,
                    c.autorId,
                    c.publicacionId,
                    u.nombre,
                    u.apellido,
                    p.urlFotoPerfil,
                    car.nombre as tituloCarrera
                FROM Comentario c
                INNER JOIN Usuario u ON c.autorId = u.id
                LEFT JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera car ON e.carreraId = car.id
                WHERE c.id = ?
            `,
            args: [id]
        });

        const comentarioData = convertBigIntToNumber(comentarioActualizado.rows[0]);

        res.json({
            success: true,
            message: "Comentario actualizado exitosamente",
            data: {
                id: comentarioData.id,
                contenido: comentarioData.contenido,
                fechaCreacion: comentarioData.fechaCreacion,
                fueEditado: Boolean(comentarioData.fueEditado),
                autor: {
                    id: comentarioData.autorId,
                    nombre: comentarioData.nombre,
                    apellido: comentarioData.apellido,
                    urlFotoPerfil: comentarioData.urlFotoPerfil,
                    tituloCarrera: comentarioData.tituloCarrera
                },
                publicacionId: comentarioData.publicacionId
            }
        });

    } catch (error) {
        console.error("Error editando comentario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/** * Obtener respuestas de un comentario
 * @route GET /api/comentarios/:comentarioId/respuestas
 * @desc Obtener todas las respuestas de un comentario específico
 * @access Público
 */
export async function obtenerRespuestasComentario(req, res) {
    try {
        const { comentarioId } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            parseInt(req.query.limit) || 20,
            50 // Máximo 50 respuestas por página
        );
        const offset = (page - 1) * limit;

        const client = database.getClient();

        // Verificar que el comentario padre existe
        const comentarioPadre = await client.execute({
            sql: `SELECT id FROM Comentario WHERE id = ?`,
            args: [comentarioId]
        });

        if (comentarioPadre.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        // Contar total de respuestas
        const countResult = await client.execute({
            sql: `SELECT COUNT(*) as total FROM Comentario WHERE comentarioPadreId = ?`,
            args: [comentarioId]
        });

        const total = Number(countResult.rows[0].total);

        // Obtener respuestas con datos del autor
        const respuestasResult = await client.execute({
            sql: `
                SELECT 
                    c.id,
                    c.contenido,
                    c.fechaCreacion,
                    c.fueEditado,
                    c.autorId,
                    c.publicacionId,
                    c.comentarioPadreId,
                    u.nombre,
                    u.apellido,
                    p.urlFotoPerfil,
                    car.nombre as tituloCarrera,
                    (SELECT COUNT(*) FROM Comentario WHERE comentarioPadreId = c.id) as totalRespuestas,
                    (SELECT COUNT(*) FROM LikeComentario WHERE comentarioId = c.id) as totalLikes
                FROM Comentario c
                INNER JOIN Usuario u ON c.autorId = u.id
                LEFT JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera car ON e.carreraId = car.id
                WHERE c.comentarioPadreId = ?
                ORDER BY c.fechaCreacion ASC
                LIMIT ? OFFSET ?
            `,
            args: [comentarioId, limit, offset]
        });

        const respuestas = respuestasResult.rows.map(r => {
            const converted = convertBigIntToNumber(r);
            return {
                id: converted.id,
                contenido: converted.contenido,
                fechaCreacion: converted.fechaCreacion,
                fueEditado: Boolean(converted.fueEditado),
                autor: {
                    id: converted.autorId,
                    nombre: converted.nombre,
                    apellido: converted.apellido,
                    urlFotoPerfil: converted.urlFotoPerfil,
                    tituloCarrera: converted.tituloCarrera
                },
                publicacionId: converted.publicacionId,
                comentarioPadreId: converted.comentarioPadreId,
                totalLikes: converted.totalLikes || 0,
                totalRespuestas: converted.totalRespuestas || 0
            };
        });

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: respuestas,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });

    } catch (error) {
        console.error("Error obteniendo respuestas:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/** * Eliminar comentario propio
 * @route DELETE /api/comentarios/:id
 * @desc Eliminar un comentario propio
 * @access Privado (solo el autor del comentario)
 */
export async function eliminarComentario(req, res) {
    try {
        const usuarioId = req.user.id;
        const { id } = req.params;

        const client = database.getClient();

        // Verificar que el comentario existe y pertenece al usuario
        const comentario = await client.execute({
            sql: `SELECT autorId FROM Comentario WHERE id = ?`,
            args: [id]
        });

        if (comentario.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "El comentario no existe"
            });
        }

        if (Number(comentario.rows[0].autorId) !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para eliminar este comentario"
            });
        }

        // Eliminar el comentario
        await client.execute({
            sql: `DELETE FROM Comentario WHERE id = ?`,
            args: [id]
        });

        res.json({
            success: true,
            message: "Comentario eliminado exitosamente"
        });

    } catch (error) {
        console.error("Error eliminando comentario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}
