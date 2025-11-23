import database from "../config/database.js";

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
        const { contenido, publicacionId } = req.body;

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

        // Crear el comentario
        const insertResult = await client.execute({
            sql: `INSERT INTO Comentario (contenido, autorId, publicacionId) 
                  VALUES (?, ?, ?)`,
            args: [contenido.trim(), usuarioId, publicacionId]
        });

        const comentarioId = insertResult.lastInsertRowid;

        // Obtener el comentario completo con datos del autor
        const comentarioCompleto = await client.execute({
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
                totalLikes: 0
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

        // Obtener comentarios con datos del autor
        const comentariosResult = await client.execute({
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
                WHERE c.publicacionId = ?
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
                totalLikes: 0
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

/**
 * Eliminar comentario propio
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
