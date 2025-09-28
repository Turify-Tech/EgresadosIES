import jwt from "jsonwebtoken";

/**
 * Utilidades JWT para manejo de tokens de autenticación
 */

/**
 * Genera un nuevo token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} payload.id - ID del usuario
 * @param {string} payload.dni - DNI del usuario
 * @param {string} payload.tipoUsuario - Tipo: 'egresado' o 'administrador'
 * @param {string} payload.email - Email del usuario
 * @returns {string} Token JWT firmado
 */
export function generateToken(payload) {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET no está configurado en las variables de entorno"
        );
    }

    const tokenPayload = {
        id: payload.id,
        dni: payload.dni,
        tipoUsuario: payload.tipoUsuario,
        email: payload.email,
        iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        issuer: "ies-egresados-api",
        subject: payload.id.toString(),
    });
}

/**
 * Verifica y decodifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado del token
 * @throws {Error} Si el token es inválido, expirado o malformado
 */
export function verifyToken(token) {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET no está configurado en las variables de entorno"
        );
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "ies-egresados-api",
        });

        return decoded;
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error("El token ha expirado");
        }
        if (error.name === "JsonWebTokenError") {
            throw new Error("Token inválido");
        }
        if (error.name === "NotBeforeError") {
            throw new Error("El token aún no es válido");
        }

        throw new Error("Error al verificar el token: " + error.message);
    }
}

/**
 * Decodifica un token sin verificar la firma (solo para debug)
 * ⚠️ NUNCA usar en producción para autenticación
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} Payload decodificado o null si falla
 */
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch (error) {
        console.error("Error decodificando token:", error.message);
        return null;
    }
}

/**
 * Extrae el token del header Authorization
 * @param {string} authHeader - Header Authorization de la request
 * @returns {string|null} Token extraído o null si no es válido
 */
export function extractToken(authHeader) {
    if (!authHeader) {
        return null;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return null;
    }

    return parts[1];
}

/**
 * Verifica si un token está próximo a expirar
 * @param {Object} decodedToken - Token decodificado
 * @param {number} minutesThreshold - Minutos antes de expiración para considerar "próximo"
 * @returns {boolean} true si está próximo a expirar
 */
export function isTokenExpiringSoon(decodedToken, minutesThreshold = 30) {
    if (!decodedToken.exp) {
        return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedToken.exp - now;
    const thresholdSeconds = minutesThreshold * 60;

    return timeUntilExpiry <= thresholdSeconds && timeUntilExpiry > 0;
}

/**
 * Genera un token de refresh con mayor duración
 * @param {Object} payload - Datos del usuario
 * @returns {string} Refresh token
 */
export function generateRefreshToken(payload) {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET no está configurado en las variables de entorno"
        );
    }

    const tokenPayload = {
        id: payload.id,
        dni: payload.dni,
        type: "refresh",
        iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: "30d", // Refresh tokens duran más
        issuer: "ies-egresados-api",
        subject: payload.id.toString(),
    });
}
