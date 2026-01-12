/**
 * Middleware para sanitizar datos sensibles en respuestas públicas
 * Issue #14 - Perfiles Públicos de Egresados
 * 
 * PROPÓSITO:
 * Capa adicional de seguridad que elimina automáticamente campos sensibles
 * de las respuestas, incluso si algún query los incluye por error.
 * 
 * CAMPOS ELIMINADOS:
 * - email: Correo electrónico personal
 * - telefono: Número de teléfono
 * - dni: Documento Nacional de Identidad
 * - password: Contraseña (por seguridad extrema)
 */

/**
 * Elimina campos sensibles de un objeto de perfil individual
 * @param {Object} profile - Objeto con datos del perfil
 * @returns {Object} Perfil sanitizado sin datos sensibles
 */
function sanitizeProfile(profile) {
    if (!profile || typeof profile !== 'object') {
        return profile;
    }

    const { email, telefono, dni, password, ...safeProfile } = profile;
    return safeProfile;
}

/**
 * Elimina campos sensibles de un array de perfiles
 * @param {Array} profiles - Array de perfiles
 * @returns {Array} Array de perfiles sanitizados
 */
function sanitizeProfileList(profiles) {
    if (!Array.isArray(profiles)) {
        return profiles;
    }

    return profiles.map(profile => sanitizeProfile(profile));
}

/**
 * Middleware para interceptar res.json() y sanitizar automáticamente
 * Se aplica a todas las rutas de /api/perfiles
 * 
 * @usage En perfilesRoutes.js:
 * import { publicDataMiddleware } from '../middleware/sanitizePublicData.js';
 * router.use(publicDataMiddleware);
 */
export const publicDataMiddleware = (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body) {
        // Solo sanitizar respuestas exitosas con datos
        if (body && body.success && body.data) {
            // Si es un array (lista), sanitizar cada elemento
            if (Array.isArray(body.data)) {
                body.data = sanitizeProfileList(body.data);
            }
            // Si es un objeto (perfil individual), sanitizar
            else if (typeof body.data === 'object') {
                body.data = sanitizeProfile(body.data);
            }
        }

        return originalJson(body);
    };

    next();
};

/**
 * Sanitiza un perfil individual (para uso directo en controladores)
 * @param {Object} profile - Perfil a sanitizar
 * @returns {Object} Perfil sin datos sensibles
 */
export const sanitizePublicProfile = sanitizeProfile;

/**
 * Sanitiza una lista de perfiles (para uso directo en controladores)
 * @param {Array} profiles - Lista de perfiles a sanitizar
 * @returns {Array} Lista sin datos sensibles
 */
export const sanitizeGraduateList = sanitizeProfileList;

export default {
    publicDataMiddleware,
    sanitizePublicProfile,
    sanitizeGraduateList
};
