/**
 * Validadores específicos para el sistema de mensajería
 * Valida entrada de datos y reglas de negocio para mensajes
 */

/**
 * Validar datos para envío de mensaje
 * @param {Object} data - Datos del mensaje
 * @returns {Object} Resultado de validación
 */
export function validateMensajeData(data) {
    const errors = [];

    // Validar destinatarioId
    if (!data.destinatarioId) {
        errors.push("El destinatario es requerido");
    } else if (!Number.isInteger(parseInt(data.destinatarioId))) {
        errors.push("El ID del destinatario debe ser un número válido");
    } else if (parseInt(data.destinatarioId) <= 0) {
        errors.push("El ID del destinatario debe ser mayor a 0");
    }

    // Validar contenido
    if (!data.contenido) {
        errors.push("El contenido del mensaje es requerido");
    } else {
        const contenidoLimpio = data.contenido.toString().trim();
        
        if (contenidoLimpio.length === 0) {
            errors.push("El contenido del mensaje no puede estar vacío");
        } else if (contenidoLimpio.length > 1000) {
            errors.push("El contenido del mensaje no puede exceder 1000 caracteres");
        } else if (contenidoLimpio.length < 1) {
            errors.push("El contenido del mensaje debe tener al menos 1 caracter");
        }

        // Validar caracteres no permitidos (opcional)
        const caracteresProhibidos = /[<>]/g;
        if (caracteresProhibidos.test(contenidoLimpio)) {
            errors.push("El contenido contiene caracteres no permitidos (< >)");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        data: errors.length === 0 ? {
            destinatarioId: parseInt(data.destinatarioId),
            contenido: data.contenido.toString().trim()
        } : null
    };
}

/**
 * Validar parámetros de paginación con límites de seguridad estrictos
 * @param {Object} query - Query parameters
 * @param {string} type - Tipo de paginación ('conversations' o 'messages')
 * @returns {Object} Parámetros validados
 */
export function validatePaginationParams(query, type = 'conversations') {
    const { page = 1, limit = 20 } = query;

    // SEGURIDAD: Límites máximos absolutos para prevenir memory leaks
    const LIMITS = {
        conversations: {
            max: 25,           // Máximo 25 conversaciones por página
            default: 20,       // Default 20 conversaciones
            maxPages: 1000     // Máximo 1000 páginas
        },
        messages: {
            max: 50,           // Máximo 50 mensajes por página
            default: 30,       // Default 30 mensajes
            maxPages: 10000    // Máximo 10,000 páginas
        }
    };

    const config = LIMITS[type] || LIMITS.conversations;

    // Validar y normalizar page con límite máximo
    let pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
        pageNum = 1;
    }
    // CRÍTICO: Limitar número máximo de páginas
    if (pageNum > config.maxPages) {
        pageNum = config.maxPages;
    }

    // Validar y normalizar limit con límite máximo de seguridad
    let limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1) {
        limitNum = config.default;
    }
    // CRÍTICO: Aplicar límite máximo absoluto
    if (limitNum > config.max) {
        limitNum = config.max;
    }

    return {
        page: pageNum,
        limit: limitNum,
        offset: (pageNum - 1) * limitNum,
        maxAllowed: config.max,
        wasLimited: parseInt(limit) > config.max || pageNum > config.maxPages
    };
}

/**
 * Validar ID de usuario en parámetros de URL
 * @param {string} userId - ID del usuario
 * @returns {Object} Resultado de validación
 */
export function validateUserId(userId) {
    const errors = [];

    if (!userId) {
        errors.push("ID de usuario es requerido");
    } else {
        const userIdNum = parseInt(userId);
        
        if (isNaN(userIdNum)) {
            errors.push("ID de usuario debe ser un número");
        } else if (userIdNum <= 0) {
            errors.push("ID de usuario debe ser mayor a 0");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        userId: errors.length === 0 ? parseInt(userId) : null
    };
}

/**
 * Validar ID de mensaje
 * @param {string} messageId - ID del mensaje
 * @returns {Object} Resultado de validación
 */
export function validateMessageId(messageId) {
    const errors = [];

    if (!messageId) {
        errors.push("ID de mensaje es requerido");
    } else {
        const messageIdNum = parseInt(messageId);
        
        if (isNaN(messageIdNum)) {
            errors.push("ID de mensaje debe ser un número");
        } else if (messageIdNum <= 0) {
            errors.push("ID de mensaje debe ser mayor a 0");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        messageId: errors.length === 0 ? parseInt(messageId) : null
    };
}

/**
 * Validar que el usuario no se envíe mensaje a sí mismo
 * @param {number} remitenteId - ID del remitente
 * @param {number} destinatarioId - ID del destinatario
 * @returns {Object} Resultado de validación
 */
export function validateNotSelfMessage(remitenteId, destinatarioId) {
    if (parseInt(remitenteId) === parseInt(destinatarioId)) {
        return {
            isValid: false,
            error: "No puedes enviarte un mensaje a ti mismo"
        };
    }

    return {
        isValid: true,
        error: null
    };
}

/**
 * Sanitizar contenido de mensaje para prevenir ataques
 * @param {string} contenido - Contenido del mensaje
 * @returns {string} Contenido sanitizado
 */
export function sanitizeMessageContent(contenido) {
    if (!contenido) return "";

    return contenido
        .toString()
        .trim()
        // Remover caracteres de control
        .replace(/[\x00-\x1F\x7F]/g, "")
        // Limitar espacios múltiples
        .replace(/\s+/g, " ")
        // Remover HTML básico por seguridad
        .replace(/<[^>]*>/g, "");
}

/**
 * Validador de middleware para envío de mensajes
 * Middleware que se puede usar en las rutas
 */
export function validateMensajeMiddleware(req, res, next) {
    const validation = validateMensajeData(req.body);

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "Datos de mensaje inválidos",
            errors: validation.errors
        });
    }

    // Validar que no se envíe a sí mismo
    const selfValidation = validateNotSelfMessage(req.user.id, validation.data.destinatarioId);
    if (!selfValidation.isValid) {
        return res.status(400).json({
            success: false,
            message: selfValidation.error
        });
    }

    // Añadir datos validados al request
    req.validatedMessage = validation.data;
    req.validatedMessage.contenido = sanitizeMessageContent(validation.data.contenido);

    next();
}

/**
 * Validador de middleware para parámetros de paginación
 */
export function validatePaginationMiddleware(req, res, next) {
    const params = validatePaginationParams(req.query);
    
    // Añadir parámetros validados al request
    req.pagination = params;
    
    next();
}

/**
 * Validador de middleware para ID de usuario en params
 */
export function validateUserIdMiddleware(paramName = 'userId') {
    return (req, res, next) => {
        const validation = validateUserId(req.params[paramName]);

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario inválido",
                errors: validation.errors
            });
        }

        // Añadir userId validado al request
        req.validatedUserId = validation.userId;

        next();
    };
}

/**
 * Validador de middleware para ID de mensaje
 */
export function validateMessageIdMiddleware(req, res, next) {
    const validation = validateMessageId(req.params.id);

    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: "ID de mensaje inválido",
            errors: validation.errors
        });
    }

    // Añadir messageId validado al request
    req.validatedMessageId = validation.messageId;

    next();
}

export default {
    validateMensajeData,
    validatePaginationParams,
    validateUserId,
    validateMessageId,
    validateNotSelfMessage,
    sanitizeMessageContent,
    validateMensajeMiddleware,
    validatePaginationMiddleware,
    validateUserIdMiddleware,
    validateMessageIdMiddleware,
};