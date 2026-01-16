import database from "../config/database.js";

/**
 * Controlador para el sistema de mensajería entre egresados
 * Maneja envío, recepción, listado y estado de mensajes
 */

// CONSTANTES DE SEGURIDAD - Límites máximos para prevenir memory leaks y DoS
const SECURITY_LIMITS = {
    CONVERSATIONS: {
        MAX_PER_PAGE: 25,        // Máximo absoluto de conversaciones por página
        DEFAULT_LIMIT: 20,       // Límite por defecto
        MAX_PAGES: 1000,         // Máximo número de páginas permitidas
    },
    MESSAGES: {
        MAX_PER_PAGE: 50,        // Máximo absoluto de mensajes por página
        DEFAULT_LIMIT: 30,       // Límite por defecto
        MAX_PAGES: 10000,        // Máximo número de páginas permitidas
        MAX_CONTENT_LENGTH: 1000 // Máximo caracteres en mensaje
    },
    DATABASE: {
        QUERY_TIMEOUT: 10000,    // Timeout de 10 segundos para consultas complejas
        MAX_MEMORY_USAGE: 50     // Máximo 50MB estimado por consulta
    }
};

/**
 * Convierte BigInt a Number en objetos recursivamente
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
 * Enviar un nuevo mensaje
 * @route POST /api/mensajes
 * @desc Envía un mensaje a otro egresado
 * @access Privado (solo egresados autenticados)
 */
export async function enviarMensaje(req, res) {
    const { destinatarioId, contenido } = req.body;
    const remitenteId = req.user.id;

    // Validaciones básicas
    if (!destinatarioId || !contenido) {
        return res.status(400).json({
            success: false,
            message: "Destinatario y contenido son requeridos",
        });
    }

    // Validar contenido no vacío después de trim
    const contenidoLimpio = contenido.toString().trim();
    if (contenidoLimpio.length === 0) {
        return res.status(400).json({
            success: false,
            message: "El contenido del mensaje no puede estar vacío",
        });
    }

    // Validar longitud del contenido usando límites de seguridad
    if (contenidoLimpio.length > SECURITY_LIMITS.MESSAGES.MAX_CONTENT_LENGTH) {
        return res.status(400).json({
            success: false,
            message: `El mensaje no puede exceder ${SECURITY_LIMITS.MESSAGES.MAX_CONTENT_LENGTH} caracteres`,
        });
    }

    // No permitir enviar mensaje a sí mismo
    if (parseInt(remitenteId) === parseInt(destinatarioId)) {
        return res.status(400).json({
            success: false,
            message: "No puedes enviarte un mensaje a ti mismo",
        });
    }

    const client = database.getClient();

    try {
        // 1. Verificar que el destinatario existe y es un egresado
        const destinatarioQuery = `
            SELECT e.id, u.nombre, u.email 
            FROM Egresado e
            INNER JOIN Usuario u ON e.id = u.id
            WHERE u.id = ?
        `;

        const destinatarioResult = await client.execute({
            sql: destinatarioQuery,
            args: [destinatarioId],
        });

        if (destinatarioResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Destinatario no encontrado",
            });
        }

        const destinatario = destinatarioResult.rows[0];

        // 2. Verificar que el remitente existe y es un egresado
        const remitenteQuery = `
            SELECT e.id, u.nombre, u.email 
            FROM Egresado e
            INNER JOIN Usuario u ON e.id = u.id
            WHERE u.id = ?
        `;

        const remitenteResult = await client.execute({
            sql: remitenteQuery,
            args: [remitenteId],
        });

        if (remitenteResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Solo los egresados pueden enviar mensajes",
            });
        }

        // 3. Crear el mensaje
        const mensajeQuery = `
            INSERT INTO Mensaje (contenido, fechaEnvio, estado, remitenteId, destinatarioId)
            VALUES (?, CURRENT_TIMESTAMP, 'NO_LEIDO', ?, ?)
        `;

        const mensajeResult = await client.execute({
            sql: mensajeQuery,
            args: [contenidoLimpio, remitenteId, destinatarioId],
        });

        const mensajeId = Number(mensajeResult.lastInsertRowid);

        // 4. Crear notificación para el destinatario (DESHABILITADO temporalmente)
        // TODO: Implementar cuando se actualice el schema de Notificacion en Turso
        // const notificacionQuery = `
        //     INSERT INTO Notificacion (contenido, fechaEnvio, egresadoId)
        //     VALUES (?, CURRENT_TIMESTAMP, ?)
        // `;
        // const notificacionContenido = `Tienes un nuevo mensaje de ${remitenteResult.rows[0].nombre}`;
        // await client.execute({
        //     sql: notificacionQuery,
        //     args: [notificacionContenido, destinatarioId],
        // });

        // 5. Obtener el mensaje completo para la respuesta
        const mensajeCompletoQuery = `
            SELECT m.id, m.contenido, m.fechaEnvio, m.estado,
                   ur.nombre as remitente_nombre,
                   ud.nombre as destinatario_nombre
            FROM Mensaje m
            INNER JOIN Usuario ur ON m.remitenteId = ur.id
            INNER JOIN Usuario ud ON m.destinatarioId = ud.id
            WHERE m.id = ?
        `;

        const mensajeCompletoResult = await client.execute({
            sql: mensajeCompletoQuery,
            args: [mensajeId],
        });

        console.info(`[MESSAGING] Mensaje enviado - De: ${remitenteId} Para: ${destinatarioId}, ID: ${mensajeId}`);

        const responseData = {
            id: Number(mensajeId),
            contenido: contenidoLimpio,
            fechaEnvio: mensajeCompletoResult.rows[0].fechaEnvio,
            estado: "NO_LEIDO",
            remitente: {
                id: Number(remitenteId),
                nombre: mensajeCompletoResult.rows[0].remitente_nombre,
            },
            destinatario: {
                id: Number(destinatarioId),
                nombre: mensajeCompletoResult.rows[0].destinatario_nombre,
            },
        };

        res.status(201).json({
            success: true,
            message: "Mensaje enviado exitosamente",
            data: convertBigIntToNumber(responseData),
        });
    } catch (error) {
        console.error("Error al enviar mensaje:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al enviar mensaje",
        });
    }
}

/**
 * Listar conversaciones del usuario
 * @route GET /api/mensajes/conversaciones
 * @desc Obtiene lista de conversaciones con último mensaje y count no leídos
 * @access Privado (solo egresados autenticados)
 */
export async function listarConversaciones(req, res) {
    const usuarioId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // SEGURIDAD: Aplicar límites máximos estrictos para prevenir memory leaks y DoS
    const pageNum = Math.max(1, Math.min(SECURITY_LIMITS.CONVERSATIONS.MAX_PAGES, parseInt(page) || 1));
    const requestedLimit = parseInt(limit) || SECURITY_LIMITS.CONVERSATIONS.DEFAULT_LIMIT;
    
    // CRÍTICO: Aplicar límite máximo absoluto
    const limitNum = Math.max(1, Math.min(SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE, requestedLimit));
    const offset = (pageNum - 1) * limitNum;

    // Log de seguridad si se intentó exceder límites
    if (requestedLimit > SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE) {
        console.warn(`[SECURITY] Usuario ${usuarioId} intentó exceder límite de conversaciones: ${requestedLimit} > ${SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE}`);
    }

    const client = database.getClient();

    try {
        // Verificar que el usuario es un egresado
        const usuarioQuery = `
            SELECT e.id 
            FROM Egresado e
            WHERE e.id = ?
        `;

        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [usuarioId],
        });

        if (usuarioResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Solo los egresados pueden ver conversaciones",
            });
        }

        // Query principal: obtener conversaciones con último mensaje
        const conversacionesQuery = `
            WITH conversaciones_base AS (
                SELECT DISTINCT
                    CASE 
                        WHEN m.remitenteId = ? THEN m.destinatarioId
                        ELSE m.remitenteId
                    END AS otroUsuarioId
                FROM Mensaje m
                WHERE m.remitenteId = ? OR m.destinatarioId = ?
            ),
            ultimo_mensaje AS (
                SELECT 
                    cb.otroUsuarioId,
                    m.id,
                    m.contenido,
                    m.fechaEnvio,
                    m.estado,
                    m.remitenteId,
                    ROW_NUMBER() OVER (
                        PARTITION BY cb.otroUsuarioId 
                        ORDER BY m.fechaEnvio DESC
                    ) as rn
                FROM conversaciones_base cb
                INNER JOIN Mensaje m ON (
                    (m.remitenteId = ? AND m.destinatarioId = cb.otroUsuarioId) OR
                    (m.remitenteId = cb.otroUsuarioId AND m.destinatarioId = ?)
                )
            ),
            no_leidos AS (
                SELECT 
                    m.remitenteId as otroUsuarioId,
                    COUNT(*) as cantidad_no_leidos
                FROM Mensaje m
                WHERE m.destinatarioId = ? 
                  AND m.estado = 'NO_LEIDO'
                GROUP BY m.remitenteId
            )
            SELECT 
                um.otroUsuarioId,
                u.nombre as otroUsuario_nombre,
                um.id as ultimo_mensaje_id,
                um.contenido as ultimo_mensaje_contenido,
                um.fechaEnvio as ultimo_mensaje_fecha,
                um.estado as ultimo_mensaje_estado,
                um.remitenteId as ultimo_mensaje_remitente,
                COALESCE(nl.cantidad_no_leidos, 0) as mensajes_no_leidos
            FROM ultimo_mensaje um
            INNER JOIN Usuario u ON um.otroUsuarioId = u.id
            LEFT JOIN no_leidos nl ON um.otroUsuarioId = nl.otroUsuarioId
            WHERE um.rn = 1
            ORDER BY um.fechaEnvio DESC
            LIMIT ? OFFSET ?
        `;

        const conversacionesResult = await client.execute({
            sql: conversacionesQuery,
            args: [usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId, limitNum, offset],
        });

        // Query para contar total de conversaciones
        const totalQuery = `
            SELECT COUNT(DISTINCT 
                CASE 
                    WHEN m.remitenteId = ? THEN m.destinatarioId
                    ELSE m.remitenteId
                END
            ) as total
            FROM Mensaje m
            WHERE m.remitenteId = ? OR m.destinatarioId = ?
        `;

        const totalResult = await client.execute({
            sql: totalQuery,
            args: [usuarioId, usuarioId, usuarioId],
        });

        const totalConversaciones = totalResult.rows[0]?.total || 0;
        const totalPages = Math.ceil(totalConversaciones / limitNum);

        // Formatear conversaciones
        const conversaciones = conversacionesResult.rows.map((row) => ({
            usuario: {
                id: row.otroUsuarioId,
                nombre: row.otroUsuario_nombre,
            },
            ultimoMensaje: {
                id: row.ultimo_mensaje_id,
                contenido: row.ultimo_mensaje_contenido,
                fechaEnvio: row.ultimo_mensaje_fecha,
                estado: row.ultimo_mensaje_estado,
                esPropio: row.ultimo_mensaje_remitente === usuarioId,
            },
            noLeidos: row.mensajes_no_leidos,
        }));

        // Información de límites de seguridad aplicados
        const limitWasApplied = requestedLimit > SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE;
        
        res.status(200).json({
            success: true,
            data: {
                conversaciones,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalConversaciones,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                },
                security: {
                    maxLimitPerPage: SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE,
                    limitWasApplied,
                    ...(limitWasApplied && {
                        message: `Límite de seguridad aplicado: máximo ${SECURITY_LIMITS.CONVERSATIONS.MAX_PER_PAGE} conversaciones por página`
                    })
                }
            },
        });
    } catch (error) {
        console.error("Error al obtener conversaciones:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al obtener conversaciones",
        });
    }
}

/**
 * Ver mensajes de una conversación específica
 * @route GET /api/mensajes/conversacion/:userId
 * @desc Obtiene mensajes entre el usuario autenticado y otro usuario
 * @access Privado (solo egresados autenticados)
 */
export async function verConversacion(req, res) {
    const { userId } = req.params;
    const usuarioActualId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Validaciones
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
            success: false,
            message: "ID de usuario inválido",
        });
    }

    const otroUsuarioId = parseInt(userId);
    
    if (otroUsuarioId === usuarioActualId) {
        return res.status(400).json({
            success: false,
            message: "No puedes ver una conversación contigo mismo",
        });
    }

    // SEGURIDAD: Aplicar límites máximos estrictos para prevenir memory leaks y DoS
    const pageNum = Math.max(1, Math.min(SECURITY_LIMITS.MESSAGES.MAX_PAGES, parseInt(page) || 1));
    const requestedLimit = parseInt(limit) || SECURITY_LIMITS.MESSAGES.DEFAULT_LIMIT;
    
    // CRÍTICO: Aplicar límite máximo absoluto
    const limitNum = Math.max(1, Math.min(SECURITY_LIMITS.MESSAGES.MAX_PER_PAGE, requestedLimit));
    const offset = (pageNum - 1) * limitNum;

    // Log de seguridad si se intentó exceder límites
    if (requestedLimit > SECURITY_LIMITS.MESSAGES.MAX_PER_PAGE) {
        console.warn(`[SECURITY] Usuario ${usuarioActualId} intentó exceder límite de mensajes: ${requestedLimit} > ${SECURITY_LIMITS.MESSAGES.MAX_PER_PAGE}`);
    }

    const client = database.getClient();

    try {
        // Verificar que ambos usuarios son egresados
        const usuariosQuery = `
            SELECT e.id, u.nombre 
            FROM Egresado e
            INNER JOIN Usuario u ON e.id = u.id
            WHERE e.id IN (?, ?)
        `;

        const usuariosResult = await client.execute({
            sql: usuariosQuery,
            args: [usuarioActualId, otroUsuarioId],
        });

        if (usuariosResult.rows.length !== 2) {
            return res.status(404).json({
                success: false,
                message: "Uno o ambos usuarios no encontrados",
            });
        }

        // Obtener mensajes de la conversación
        const mensajesQuery = `
            SELECT 
                m.id,
                m.contenido,
                m.fechaEnvio,
                m.estado,
                m.remitenteId,
                m.destinatarioId,
                ur.nombre as remitente_nombre,
                ud.nombre as destinatario_nombre
            FROM Mensaje m
            INNER JOIN Usuario ur ON m.remitenteId = ur.id
            INNER JOIN Usuario ud ON m.destinatarioId = ud.id
            WHERE (m.remitenteId = ? AND m.destinatarioId = ?) 
               OR (m.remitenteId = ? AND m.destinatarioId = ?)
            ORDER BY m.fechaEnvio DESC
            LIMIT ? OFFSET ?
        `;

        const mensajesResult = await client.execute({
            sql: mensajesQuery,
            args: [usuarioActualId, otroUsuarioId, otroUsuarioId, usuarioActualId, limitNum, offset],
        });

        // Contar total de mensajes
        const totalQuery = `
            SELECT COUNT(*) as total
            FROM Mensaje m
            WHERE (m.remitenteId = ? AND m.destinatarioId = ?) 
               OR (m.remitenteId = ? AND m.destinatarioId = ?)
        `;

        const totalResult = await client.execute({
            sql: totalQuery,
            args: [usuarioActualId, otroUsuarioId, otroUsuarioId, usuarioActualId],
        });

        const totalMensajes = totalResult.rows[0]?.total || 0;
        const totalPages = Math.ceil(totalMensajes / limitNum);

        // Formatear mensajes
        const mensajes = mensajesResult.rows.map((row) => ({
            id: row.id,
            contenido: row.contenido,
            fechaEnvio: row.fechaEnvio,
            estado: row.estado,
            esPropio: row.remitenteId === usuarioActualId,
            remitente: {
                id: row.remitenteId,
                nombre: row.remitente_nombre,
            },
            destinatario: {
                id: row.destinatarioId,
                nombre: row.destinatario_nombre,
            },
        })).reverse(); // Mostrar del más antiguo al más nuevo

        // Obtener información del otro usuario
        const otroUsuario = usuariosResult.rows.find(u => u.id === otroUsuarioId);

        res.status(200).json({
            success: true,
            data: {
                otroUsuario: {
                    id: otroUsuario.id,
                    nombre: otroUsuario.nombre,
                },
                mensajes,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalMensajes,
                    limit: limitNum,
                    hasNextPage: pageNum < totalPages,
                    hasPrevPage: pageNum > 1,
                },
            },
        });
    } catch (error) {
        console.error("Error al obtener conversación:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al obtener conversación",
        });
    }
}

/**
 * Marcar mensaje como leído
 * @route PUT /api/mensajes/:id/leer
 * @desc Marca un mensaje como leído (solo el destinatario puede hacerlo)
 * @access Privado (solo egresados autenticados)
 */
export async function marcarComoLeido(req, res) {
    const { id } = req.params;
    const usuarioId = req.user.id;

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
            success: false,
            message: "ID de mensaje inválido",
        });
    }

    const mensajeId = parseInt(id);
    const client = database.getClient();

    try {
        // Verificar que el mensaje existe y el usuario es el destinatario
        const mensajeQuery = `
            SELECT m.id, m.destinatarioId, m.estado
            FROM Mensaje m
            WHERE m.id = ?
        `;

        const mensajeResult = await client.execute({
            sql: mensajeQuery,
            args: [mensajeId],
        });

        if (mensajeResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Mensaje no encontrado",
            });
        }

        const mensaje = mensajeResult.rows[0];

        // Verificar que el usuario es el destinatario
        if (mensaje.destinatarioId !== usuarioId) {
            return res.status(403).json({
                success: false,
                message: "Solo el destinatario puede marcar el mensaje como leído",
            });
        }

        // Si ya está leído, no hacer nada
        if (mensaje.estado === 'LEIDO') {
            return res.status(200).json({
                success: true,
                message: "El mensaje ya estaba marcado como leído",
                data: { id: mensajeId, estado: 'LEIDO' },
            });
        }

        // Marcar como leído
        const updateQuery = `
            UPDATE Mensaje 
            SET estado = 'LEIDO'
            WHERE id = ?
        `;

        await client.execute({
            sql: updateQuery,
            args: [mensajeId],
        });

        console.info(`[MESSAGING] Mensaje marcado como leído - ID: ${mensajeId}, Usuario: ${usuarioId}`);

        res.status(200).json({
            success: true,
            message: "Mensaje marcado como leído",
            data: { id: mensajeId, estado: 'LEIDO' },
        });
    } catch (error) {
        console.error("Error al marcar mensaje como leído:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al marcar mensaje como leído",
        });
    }
}

/**
 * Contar mensajes no leídos
 * @route GET /api/mensajes/no-leidos
 * @desc Obtiene el número total de mensajes no leídos del usuario
 * @access Privado (solo egresados autenticados)
 */
export async function contarNoLeidos(req, res) {
    const usuarioId = req.user.id;
    const client = database.getClient();

    try {
        // Verificar que el usuario es un egresado
        const usuarioQuery = `
            SELECT e.id 
            FROM Egresado e
            WHERE e.id = ?
        `;

        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [usuarioId],
        });

        if (usuarioResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Solo los egresados pueden consultar mensajes",
            });
        }

        // Contar mensajes no leídos
        const contarQuery = `
            SELECT COUNT(*) as total_no_leidos
            FROM Mensaje m
            WHERE m.destinatarioId = ? AND m.estado = 'NO_LEIDO'
        `;

        const contarResult = await client.execute({
            sql: contarQuery,
            args: [usuarioId],
        });

        const totalNoLeidos = contarResult.rows[0]?.total_no_leidos || 0;

        // También obtener desglose por remitente
        const desglosePorRemitenteQuery = `
            SELECT 
                m.remitenteId,
                u.nombre as remitente_nombre,
                COUNT(*) as mensajes_no_leidos
            FROM Mensaje m
            INNER JOIN Usuario u ON m.remitenteId = u.id
            WHERE m.destinatarioId = ? AND m.estado = 'NO_LEIDO'
            GROUP BY m.remitenteId, u.nombre
            ORDER BY COUNT(*) DESC
        `;

        const desgloseResult = await client.execute({
            sql: desglosePorRemitenteQuery,
            args: [usuarioId],
        });

        const desglosePorRemitente = desgloseResult.rows.map(row => ({
            remitenteId: row.remitenteId,
            remitenteNombre: row.remitente_nombre,
            cantidad: row.mensajes_no_leidos,
        }));

        res.status(200).json({
            success: true,
            data: {
                totalNoLeidos,
                desglosePorRemitente,
            },
        });
    } catch (error) {
        console.error("Error al contar mensajes no leídos:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al contar mensajes no leídos",
        });
    }
}

/**
 * Marcar todos los mensajes de una conversación como leídos
 * @route PUT /api/mensajes/conversacion/:userId/leer-todos
 * @desc Marca todos los mensajes no leídos de una conversación como leídos
 * @access Privado (solo egresados autenticados)
 */
export async function marcarConversacionLeida(req, res) {
    const { userId } = req.params;
    const usuarioActualId = req.user.id;

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
            success: false,
            message: "ID de usuario inválido",
        });
    }

    const otroUsuarioId = parseInt(userId);
    const client = database.getClient();

    try {
        // Marcar todos los mensajes del otro usuario hacia este usuario como leídos
        const updateQuery = `
            UPDATE Mensaje 
            SET estado = 'LEIDO'
            WHERE remitenteId = ? 
              AND destinatarioId = ? 
              AND estado = 'NO_LEIDO'
        `;

        const result = await client.execute({
            sql: updateQuery,
            args: [otroUsuarioId, usuarioActualId],
        });

        console.info(`[MESSAGING] Conversación marcada como leída - Usuario: ${usuarioActualId}, Conversación con: ${otroUsuarioId}`);

        res.status(200).json({
            success: true,
            message: "Conversación marcada como leída",
            data: { 
                mensajesActualizados: result.rowsAffected || 0,
                conversacionConUsuario: otroUsuarioId,
            },
        });
    } catch (error) {
        console.error("Error al marcar conversación como leída:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al marcar conversación como leída",
        });
    }
}

export default {
    enviarMensaje,
    listarConversaciones,
    verConversacion,
    marcarComoLeido,
    contarNoLeidos,
    marcarConversacionLeida,
};