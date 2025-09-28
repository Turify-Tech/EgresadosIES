import { verifyToken, extractToken } from "../utils/jwt.js";
import database from "../config/database.js";

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario esté autenticado y agrega su información a req.user
 */
export function authenticateToken(req, res, next) {
    try {
        // Extraer token del header Authorization
        const authHeader = req.headers.authorization;
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token de acceso requerido",
            });
        }

        // Verificar y decodificar el token
        const decoded = verifyToken(token);

        // Agregar información del usuario a la request
        req.user = {
            id: decoded.id,
            dni: decoded.dni,
            tipoUsuario: decoded.tipoUsuario,
            email: decoded.email,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || "Token inválido",
        });
    }
}

/**
 * Middleware de autenticación opcional
 * Similar al anterior pero no falla si no hay token (para rutas públicas con funcionalidad extra para usuarios logueados)
 */
export function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = extractToken(authHeader);

        if (token) {
            const decoded = verifyToken(token);
            req.user = {
                id: decoded.id,
                dni: decoded.dni,
                tipoUsuario: decoded.tipoUsuario,
                email: decoded.email,
            };
        }

        next();
    } catch (error) {
        // Si hay error en el token, continuamos sin usuario autenticado
        req.user = null;
        next();
    }
}

/**
 * Middleware para verificar que el usuario esté activo en la base de datos
 * Debe usarse después de authenticateToken
 */
export async function verifyActiveUser(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const db = database.getClient();
        let user = null;

        // Buscar usuario según su tipo
        if (req.user.tipoUsuario === "egresado") {
            const result = await db.execute({
                sql: "SELECT id, dni, email, activo FROM Usuario WHERE id = ? AND activo = 1",
                args: [req.user.id],
            });
            user = result.rows[0];
        } else if (req.user.tipoUsuario === "administrador") {
            const result = await db.execute({
                sql: "SELECT id, dni, email, activo FROM Administrador WHERE id = ? AND activo = 1",
                args: [req.user.id],
            });
            user = result.rows[0];
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no encontrado o inactivo",
            });
        }

        // Actualizar información del usuario con datos frescos de la BD
        req.user = {
            ...req.user,
            activo: user.activo,
        };

        next();
    } catch (error) {
        console.error("Error verificando usuario activo:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
}

/**
 * Middleware para verificar permisos específicos por tipo de usuario
 * @param {string[]} allowedTypes - Tipos de usuario permitidos: ['egresado', 'administrador']
 */
export function requireUserType(...allowedTypes) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        if (!allowedTypes.includes(req.user.tipoUsuario)) {
            return res.status(403).json({
                success: false,
                message: "No tiene permisos para realizar esta acción",
            });
        }

        next();
    };
}

/**
 * Middleware para verificar que el usuario solo acceda a sus propios datos
 * @param {string} userIdParam - Nombre del parámetro que contiene el ID del usuario
 */
export function requireOwnership(userIdParam = "id") {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const resourceUserId = req.params[userIdParam];

        // Los administradores pueden acceder a cualquier recurso
        if (req.user.tipoUsuario === "administrador") {
            return next();
        }

        // Los usuarios solo pueden acceder a sus propios recursos
        if (parseInt(resourceUserId) !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a recursos de otros usuarios",
            });
        }

        next();
    };
}

/**
 * Middleware de rate limiting simple basado en usuario
 * @param {number} maxRequests - Máximo número de requests
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 */
export function userRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const requests = new Map();

    return (req, res, next) => {
        if (!req.user) {
            return next(); // Sin rate limit para usuarios no autenticados
        }

        const userId = req.user.id;
        const now = Date.now();
        const windowStart = now - windowMs;

        // Limpiar requests antiguos
        if (requests.has(userId)) {
            const userRequests = requests
                .get(userId)
                .filter((time) => time > windowStart);
            requests.set(userId, userRequests);
        }

        // Verificar límite
        const userRequests = requests.get(userId) || [];
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message:
                    "Demasiadas solicitudes. Intente nuevamente más tarde.",
                retryAfter: Math.ceil(windowMs / 1000),
            });
        }

        // Agregar request actual
        userRequests.push(now);
        requests.set(userId, userRequests);

        next();
    };
}

/**
 * Middleware para logging de actividad de usuarios autenticados
 */
export function logUserActivity(req, res, next) {
    if (req.user) {
        console.log(
            `[${new Date().toISOString()}] ${req.user.tipoUsuario} ${
                req.user.dni
            } - ${req.method} ${req.path}`
        );
    }
    next();
}
