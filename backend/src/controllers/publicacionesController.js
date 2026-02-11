import database from "../config/database.js";
import cloudinary from "../config/cloudinary.js";
import { verifyToken, extractToken } from "../utils/jwt.js";

/**
 * Controlador para el sistema de publicaciones sociales
 * Maneja CRUD de publicaciones, feed paginado y controladores 
 */

const SECURITY_LIMITS = {
    PUBLICACIONES: {
        MAX_PER_PAGE: 50,
        DEFAULT_LIMIT: 20,
        MAX_CONTENT_LENGTH: 2000
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
 * Crear nueva publicación
 * @route POST /api/publicaciones
 * @desc Crear una nueva publicación con contenido y opcionalmente imágenes
 * @access Privado (solo egresados autenticados)
 */
export async function crearPublicacion(req, res) {
    try {
        const usuarioId = req.user.id;
        const { contenido } = req.body;

        // Validaciones
        if (!contenido || contenido.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "El contenido es obligatorio"
            });
        }

        if (contenido.length > SECURITY_LIMITS.PUBLICACIONES.MAX_CONTENT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `El contenido no puede exceder ${SECURITY_LIMITS.PUBLICACIONES.MAX_CONTENT_LENGTH} caracteres`
            });
        }

        const client = database.getClient();

        // Crear la publicación
        const insertResult = await client.execute({
            sql: `INSERT INTO Publicacion (contenido, autorId) VALUES (?, ?)`,
            args: [contenido.trim(), usuarioId]
        });

        const publicacionId = insertResult.lastInsertRowid;

        // Procesar imágenes subidas (Cloudinary)
        const imagenesUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                // Cloudinary devuelve la URL segura en file.path
                const imageUrl = file.path;
                
                // Guardar en base de datos
                await client.execute({
                    sql: `INSERT INTO ImagenPublicacion (url, publicacionId) VALUES (?, ?)`,
                    args: [imageUrl, publicacionId]
                });
                
                imagenesUrls.push(imageUrl);
            }
        }

        res.status(201).json({
            success: true,
            message: "Publicación creada exitosamente",
            data: {
                id: Number(publicacionId),
                contenido: contenido.trim(),
                imagenes: imagenesUrls
            }
        });

    } catch (error) {
        console.error("Error creando publicación:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Listar publicaciones (feed) - VERSIÓN OPTIMIZADA
 * @route GET /api/publicaciones
 * @desc Obtener feed paginado de publicaciones con contadores usando una sola query
 * @access Público
 */
export async function listarPublicaciones(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            SECURITY_LIMITS.PUBLICACIONES.MAX_PER_PAGE,
            parseInt(req.query.limit) || SECURITY_LIMITS.PUBLICACIONES.DEFAULT_LIMIT
        );
        const offset = (page - 1) * limit;

        const client = database.getClient();

        // Query optimizada con JOINs y contadores en una sola consulta
        const publicacionesQuery = `
            SELECT 
                p.id,
                p.contenido,
                p.fechaCreacion,
                p.autorId,
                COALESCE(u.nombre, '') as nombreUsuario,
                COALESCE(u.apellido, '') as apellido,
                COALESCE(perf.tituloprofesional, '') as tituloprofesional,
                COALESCE(perf.urlFotoPerfil, '') as urlFotoPerfil,
                COALESCE(comment_counts.total_comentarios, 0) as totalComentarios,
                COALESCE(like_counts.total_likes, 0) as totalLikes
            FROM Publicacion p
            LEFT JOIN Usuario u ON p.autorId = u.id
            LEFT JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil perf ON e.perfilId = perf.id
            LEFT JOIN (
                SELECT publicacionId, COUNT(*) as total_comentarios 
                FROM Comentario 
                WHERE comentarioPadreId IS NULL
                GROUP BY publicacionId
            ) comment_counts ON p.id = comment_counts.publicacionId
            LEFT JOIN (
                SELECT publicacionId, COUNT(*) as total_likes 
                FROM LikePublicacion 
                GROUP BY publicacionId
            ) like_counts ON p.id = like_counts.publicacionId
            ORDER BY p.fechaCreacion DESC
            LIMIT ? OFFSET ?
        `;

        const publicacionesResult = await client.execute({
            sql: publicacionesQuery,
            args: [limit, offset]
        });

        // Obtener total de publicaciones para metadatos de paginación
        const totalQuery = `SELECT COUNT(*) as total FROM Publicacion`;
        const totalResult = await client.execute(totalQuery);
        const total = Number(totalResult.rows[0]?.total || 0);

        // Obtener todas las imágenes en batch para las publicaciones de esta página
        const publicacionIds = publicacionesResult.rows.map(p => p.id);
        let imagenesMap = {};
        
        if (publicacionIds.length > 0) {
            const placeholders = publicacionIds.map(() => '?').join(',');
            const imagenesQuery = `
                SELECT publicacionId, url, id
                FROM ImagenPublicacion 
                WHERE publicacionId IN (${placeholders})
                ORDER BY publicacionId, id
            `;
            const imagenesResult = await client.execute({
                sql: imagenesQuery,
                args: publicacionIds
            });
            
            // Agrupar imágenes por publicación
            imagenesResult.rows.forEach(img => {
                if (!imagenesMap[img.publicacionId]) {
                    imagenesMap[img.publicacionId] = [];
                }
                imagenesMap[img.publicacionId].push(img.url);
            });
        }

        // Obtener likes del usuario autenticado (si existe) - sin fallar si no hay token
        let likesMap = {};
        try {
            const authHeader = req.headers.authorization;
            const token = extractToken(authHeader);
            
            if (token && publicacionIds.length > 0) {
                const decoded = verifyToken(token);
                const usuarioId = decoded.id;
                
                // Query individual por cada publicación para evitar problemas con placeholders
                const promises = publicacionIds.map(async (pubId) => {
                    const result = await client.execute({
                        sql: 'SELECT publicacionId FROM LikePublicacion WHERE egresadoId = ? AND publicacionId = ?',
                        args: [usuarioId, pubId]
                    });
                    if (result.rows.length > 0) {
                        likesMap[pubId] = true;
                    }
                });
                
                await Promise.all(promises);
            }
        } catch (error) {
            // Si falla la autenticación o query de likes, simplemente continuamos sin likes
            likesMap = {};
        }

        // Procesar resultados
        const publicaciones = [];
        for (const row of publicacionesResult.rows) {
            const publicacion = convertBigIntToNumber(row);
            
            // Construir nombre completo del autor
            let nombreCompleto = 'Usuario desconocido';
            if (publicacion.nombreUsuario || publicacion.apellido) {
                if (publicacion.nombreUsuario && publicacion.apellido) {
                    nombreCompleto = `${publicacion.nombreUsuario} ${publicacion.apellido}`;
                } else if (publicacion.nombreUsuario) {
                    nombreCompleto = publicacion.nombreUsuario;
                } else if (publicacion.apellido) {
                    nombreCompleto = publicacion.apellido;
                }
            } else if (publicacion.tituloprofesional) {
                nombreCompleto = publicacion.tituloprofesional;
            }

            // Asignar imágenes desde el mapa
            publicacion.imagenes = imagenesMap[publicacion.id] || [];
            
            // Asignar estado de like del usuario (true si existe en likesMap, false si no)
            publicacion.userLiked = likesMap[publicacion.id] || false;
            
            // Construir objeto autor
            publicacion.autor = {
                id: publicacion.autorId,
                nombre: nombreCompleto,
                urlFotoPerfil: publicacion.urlFotoPerfil || null
            };
            
            // Convertir contadores a números
            publicacion.totalComentarios = Number(publicacion.totalComentarios);
            publicacion.totalLikes = Number(publicacion.totalLikes);
            
            // Limpiar campos temporales
            delete publicacion.autorId;
            delete publicacion.nombreUsuario;
            delete publicacion.apellido;
            delete publicacion.tituloprofesional;
            delete publicacion.urlFotoPerfil;

            publicaciones.push(publicacion);
        }

        res.status(200).json({
            success: true,
            data: {
                publicaciones,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Error listando publicaciones:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Ver publicación específica
 * @route GET /api/publicaciones/:id
 * @desc Obtener una publicación específica con detalles completos
 * @access Privado (solo egresados autenticados)
 */
export async function verPublicacion(req, res) {
    try {
        const publicacionId = parseInt(req.params.id);

        if (!publicacionId || publicacionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de publicación inválido"
            });
        }

        const client = database.getClient();

        // Obtener publicación con contadores
        const publicacionQuery = `
            SELECT 
                p.id,
                p.contenido,
                p.fechaCreacion,
                u.id as autorId,
                u.nombre as autorNombre,
                COUNT(DISTINCT c.id) as totalComentarios,
                COUNT(DISTINCT l.egresadoId) as totalLikes
            FROM Publicacion p
            INNER JOIN Usuario u ON p.autorId = u.id
            LEFT JOIN Comentario c ON p.id = c.publicacionId
            LEFT JOIN LikePublicacion l ON p.id = l.publicacionId
            WHERE p.id = ?
            GROUP BY p.id, p.contenido, p.fechaCreacion, u.id, u.nombre
        `;

        const publicacionResult = await client.execute({
            sql: publicacionQuery,
            args: [publicacionId]
        });

        if (publicacionResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Publicación no encontrada"
            });
        }

        const publicacion = convertBigIntToNumber(publicacionResult.rows[0]);

        // Obtener imágenes
        const imagenesQuery = `
            SELECT url FROM ImagenPublicacion 
            WHERE publicacionId = ? 
            ORDER BY id
        `;
        const imagenesResult = await client.execute({
            sql: imagenesQuery,
            args: [publicacionId]
        });

        publicacion.imagenes = imagenesResult.rows.map(img => img.url);
        publicacion.autor = {
            id: publicacion.autorId,
            nombre: publicacion.autorNombre
        };

        // Limpiar campos temporales
        delete publicacion.autorId;
        delete publicacion.autorNombre;

        res.status(200).json({
            success: true,
            data: publicacion
        });

    } catch (error) {
        console.error("Error obteniendo publicación:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Editar publicación propia
 * @route PUT /api/publicaciones/:id
 * @desc Editar el contenido de una publicación propia
 * @access Privado (solo el autor de la publicación)
 */
export async function editarPublicacion(req, res) {
    try {
        const publicacionId = parseInt(req.params.id);
        const usuarioId = req.user.id;
        const { contenido, imagenes = [] } = req.body;

        if (!publicacionId || publicacionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de publicación inválido"
            });
        }

        if (!contenido || contenido.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "El contenido es obligatorio"
            });
        }

        if (contenido.length > SECURITY_LIMITS.PUBLICACIONES.MAX_CONTENT_LENGTH) {
            return res.status(400).json({
                success: false,
                message: `El contenido no puede exceder ${SECURITY_LIMITS.PUBLICACIONES.MAX_CONTENT_LENGTH} caracteres`
            });
        }

        const client = database.getClient();

        // Verificar que la publicación existe y pertenece al usuario
        const verificarQuery = `
            SELECT autorId FROM Publicacion WHERE id = ?
        `;
        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [publicacionId]
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Publicación no encontrada"
            });
        }

        if (Number(verificarResult.rows[0].autorId) !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para editar esta publicación"
            });
        }

        // Actualizar contenido
        await client.execute({
            sql: `UPDATE Publicacion SET contenido = ? WHERE id = ?`,
            args: [contenido.trim(), publicacionId]
        });

        // Actualizar imágenes: eliminar las existentes y agregar las nuevas
        await client.execute({
            sql: `DELETE FROM ImagenPublicacion WHERE publicacionId = ?`,
            args: [publicacionId]
        });

        if (imagenes.length > 0) {
            for (const imagenUrl of imagenes) {
                await client.execute({
                    sql: `INSERT INTO ImagenPublicacion (url, publicacionId) VALUES (?, ?)`,
                    args: [imagenUrl, publicacionId]
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Publicación actualizada exitosamente",
            data: {
                id: publicacionId,
                contenido: contenido.trim(),
                imagenes
            }
        });

    } catch (error) {
        console.error("Error editando publicación:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Eliminar publicación propia
 * @route DELETE /api/publicaciones/:id
 * @desc Eliminar una publicación propia
 * @access Privado (solo el autor de la publicación)
 */
export async function eliminarPublicacion(req, res) {
    try {
        const publicacionId = parseInt(req.params.id);
        const usuarioId = req.user.id;

        if (!publicacionId || publicacionId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de publicación inválido"
            });
        }

        const client = database.getClient();

        // Verificar que la publicación existe y pertenece al usuario
        const verificarQuery = `
            SELECT autorId FROM Publicacion WHERE id = ?
        `;
        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [publicacionId]
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Publicación no encontrada"
            });
        }

        if (Number(verificarResult.rows[0].autorId) !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para eliminar esta publicación"
            });
        }

        // Obtener URLs de las imágenes antes de eliminar
        const imagenesQuery = `SELECT url FROM ImagenPublicacion WHERE publicacionId = ?`;
        const imagenesResult = await client.execute({
            sql: imagenesQuery,
            args: [publicacionId]
        });

        // Eliminar publicación (las imágenes, comentarios y likes se eliminan por CASCADE)
        await client.execute({
            sql: `DELETE FROM Publicacion WHERE id = ?`,
            args: [publicacionId]
        });

        // Eliminar imágenes de Cloudinary
        if (imagenesResult.rows.length > 0) {
            for (const row of imagenesResult.rows) {
                try {
                    // Extraer public_id de la URL de Cloudinary
                    // URL ejemplo: https://res.cloudinary.com/djgrfq6oi/image/upload/v1768491223/egresados-ies/publicaciones/pub-123456.jpg
                    const urlParts = row.url.split('/');
                    const uploadIndex = urlParts.indexOf('upload');
                    
                    if (uploadIndex === -1) {
                        console.error(`URL de Cloudinary inválida: ${row.url}`);
                        continue;
                    }
                    
                    // Obtener path después de la versión (v1768491223)
                    // urlParts[uploadIndex + 1] = versión (v1768491223)
                    // urlParts.slice(uploadIndex + 2) = ['egresados-ies', 'publicaciones', 'pub-123456.jpg']
                    const pathAfterVersion = urlParts.slice(uploadIndex + 2).join('/');
                    
                    // Quitar extensión (.jpg, .png, etc)
                    const publicId = pathAfterVersion.replace(/\.[^/.]+$/, "");
                    
                    // Eliminar de Cloudinary
                    const result = await cloudinary.uploader.destroy(publicId);
                    
                    if (result.result === 'ok') {
                        console.log(`✅ Imagen eliminada de Cloudinary: ${publicId}`);
                    } else {
                        console.warn(`⚠️ Cloudinary no encontró la imagen: ${publicId} (resultado: ${result.result})`);
                    }
                } catch (cloudinaryError) {
                    console.error(`❌ Error eliminando imagen de Cloudinary ${row.url}:`, cloudinaryError.message);
                    // No lanzamos el error para que no falle la eliminación de la publicación
                }
            }
        }

        res.status(200).json({
            success: true,
            message: "Publicación eliminada exitosamente"
        });

    } catch (error) {
        console.error("Error eliminando publicación:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Mis publicaciones (del usuario autenticado)
 * @route GET /api/publicaciones/mis-publicaciones
 * @desc Obtener todas las publicaciones del usuario autenticado
 * @access Privado (solo egresados autenticados)
 */
export async function misPublicaciones(req, res) {
    try {
        const usuarioId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            SECURITY_LIMITS.PUBLICACIONES.MAX_PER_PAGE,
            parseInt(req.query.limit) || SECURITY_LIMITS.PUBLICACIONES.DEFAULT_LIMIT
        );
        const offset = (page - 1) * limit;

        const client = database.getClient();

        // Obtener publicaciones del usuario
        const publicacionesQuery = `
            SELECT 
                p.id,
                p.contenido,
                p.fechaCreacion,
                p.autorId
            FROM Publicacion p
            WHERE p.autorId = ?
            ORDER BY p.fechaCreacion DESC
            LIMIT ? OFFSET ?
        `;

        const publicacionesResult = await client.execute({
            sql: publicacionesQuery,
            args: [usuarioId, limit, offset]
        });

        // Obtener total de publicaciones del usuario
        const totalQuery = `SELECT COUNT(*) as total FROM Publicacion WHERE autorId = ?`;
        const totalResult = await client.execute({
            sql: totalQuery,
            args: [usuarioId]
        });
        const total = Number(totalResult.rows[0].total);

        // Procesar cada publicación
        const publicaciones = [];
        for (const row of publicacionesResult.rows) {
            const publicacion = convertBigIntToNumber(row);
            
            // Obtener datos del autor (yo)
            const autorQuery = `
                SELECT 
                    u.nombre as nombreUsuario, 
                    u.apellido,
                    p.urlFotoPerfil,
                    p.tituloprofesional
                FROM Usuario u
                LEFT JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                WHERE u.id = ?
            `;
            const autorResult = await client.execute({
                sql: autorQuery,
                args: [usuarioId]
            });
            
            let nombreCompleto = 'Usuario desconocido';
            let urlFotoPerfil = null;
            let tituloprofesional = null;
            
            if (autorResult.rows.length > 0) {
                const autor = autorResult.rows[0];
                urlFotoPerfil = autor.urlFotoPerfil;
                tituloprofesional = autor.tituloprofesional;
                
                if (autor.nombreUsuario && autor.apellido) {
                    nombreCompleto = `${autor.nombreUsuario} ${autor.apellido}`;
                } else if (autor.nombreUsuario) {
                    nombreCompleto = autor.nombreUsuario;
                } else if (autor.tituloprofesional) {
                    nombreCompleto = autor.tituloprofesional;
                }
            }

            // Obtener imágenes de esta publicación
            const imagenesQuery = `
                SELECT url FROM ImagenPublicacion 
                WHERE publicacionId = ? 
                ORDER BY id
            `;
            const imagenesResult = await client.execute({
                sql: imagenesQuery,
                args: [publicacion.id]
            });

            publicacion.imagenes = imagenesResult.rows.map(img => img.url);
            publicacion.autor = {
                id: usuarioId,
                nombre: nombreCompleto,
                urlFotoPerfil: urlFotoPerfil,
                tituloprofesional: tituloprofesional
            };
            
            // Obtener total de comentarios
            const comentariosQuery = `
                SELECT COUNT(*) as total FROM Comentario 
                WHERE publicacionId = ?
            `;
            const comentariosResult = await client.execute({
                sql: comentariosQuery,
                args: [publicacion.id]
            });
            publicacion.totalComentarios = Number(comentariosResult.rows[0]?.total || 0);
            
            // Obtener total de likes
            const likesQuery = `
                SELECT COUNT(*) as total FROM LikePublicacion 
                WHERE publicacionId = ?
            `;
            const likesResult = await client.execute({
                sql: likesQuery,
                args: [publicacion.id]
            });
            publicacion.totalLikes = Number(likesResult.rows[0]?.total || 0);
            
            // Limpiar campos temporales
            delete publicacion.autorId;

            publicaciones.push(publicacion);
        }

        res.status(200).json({
            success: true,
            data: {
                publicaciones,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Error obteniendo mis publicaciones:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

/**
 * Publicaciones de un usuario específico
 * @route GET /api/publicaciones/usuario/:userId
 * @desc Obtener todas las publicaciones de un usuario específico
 * @access Privado (solo egresados autenticados)
 */
export async function publicacionesDeUsuario(req, res) {
    try {
        const userId = parseInt(req.params.userId);
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            SECURITY_LIMITS.PUBLICACIONES.MAX_PER_PAGE,
            parseInt(req.query.limit) || SECURITY_LIMITS.PUBLICACIONES.DEFAULT_LIMIT
        );
        const offset = (page - 1) * limit;

        if (!userId || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario inválido"
            });
        }

        const client = database.getClient();

        // Verificar que el usuario existe
        const usuarioQuery = `
            SELECT u.id, u.nombre FROM Usuario u 
            INNER JOIN Egresado e ON u.id = e.id 
            WHERE u.id = ?
        `;
        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [userId]
        });

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        const usuario = usuarioResult.rows[0];

        // Obtener publicaciones del usuario
        const publicacionesQuery = `
            SELECT 
                p.id,
                p.contenido,
                p.fechaCreacion,
                COUNT(DISTINCT c.id) as totalComentarios,
                COUNT(DISTINCT l.egresadoId) as totalLikes
            FROM Publicacion p
            LEFT JOIN Comentario c ON p.id = c.publicacionId
            LEFT JOIN LikePublicacion l ON p.id = l.publicacionId
            WHERE p.autorId = ?
            GROUP BY p.id, p.contenido, p.fechaCreacion
            ORDER BY p.fechaCreacion DESC
            LIMIT ? OFFSET ?
        `;

        const publicacionesResult = await client.execute({
            sql: publicacionesQuery,
            args: [userId, limit, offset]
        });

        // Obtener total de publicaciones del usuario
        const totalQuery = `SELECT COUNT(*) as total FROM Publicacion WHERE autorId = ?`;
        const totalResult = await client.execute({
            sql: totalQuery,
            args: [userId]
        });
        const total = Number(totalResult.rows[0].total);

        // Obtener imágenes para cada publicación
        const publicaciones = [];
        for (const row of publicacionesResult.rows) {
            const publicacion = convertBigIntToNumber(row);
            
            // Obtener imágenes de esta publicación
            const imagenesQuery = `
                SELECT url FROM ImagenPublicacion 
                WHERE publicacionId = ? 
                ORDER BY id
            `;
            const imagenesResult = await client.execute({
                sql: imagenesQuery,
                args: [publicacion.id]
            });

            publicacion.imagenes = imagenesResult.rows.map(img => img.url);
            publicacion.autor = {
                id: Number(usuario.id),
                nombre: usuario.nombre
            };

            publicaciones.push(publicacion);
        }

        res.status(200).json({
            success: true,
            data: {
                usuario: {
                    id: Number(usuario.id),
                    nombre: usuario.nombre
                },
                publicaciones,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error("Error obteniendo publicaciones del usuario:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

