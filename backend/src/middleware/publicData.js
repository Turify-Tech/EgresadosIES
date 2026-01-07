/**
 * Middleware para sanitizar datos antes de exponerlos en endpoints públicos
 * Elimina información sensible y privada de los perfiles de egresados
 */

/**
 * Lista de campos sensibles que NO deben exponerse públicamente
 */
const SENSITIVE_FIELDS = [
    'email',
    'telefono',
    'dni',
    'password',
];

/**
 * Sanitiza un objeto de perfil individual eliminando campos sensibles
 * @param {Object} profile - Objeto de perfil de egresado
 * @returns {Object} Perfil sanitizado sin datos sensibles
 */
export function sanitizePublicProfile(profile) {
    if (!profile) return null;

    // Crear copia del objeto para no mutar el original
    const sanitized = { ...profile };

    // Eliminar campos sensibles
    SENSITIVE_FIELDS.forEach(field => {
        delete sanitized[field];
    });

    return sanitized;
}

/**
 * Sanitiza un array de perfiles eliminando campos sensibles de cada uno
 * @param {Array} graduates - Array de perfiles de egresados
 * @returns {Array} Array de perfiles sanitizados
 */
export function sanitizeGraduateList(graduates) {
    if (!Array.isArray(graduates)) return [];

    return graduates.map(graduate => sanitizePublicProfile(graduate));
}

/**
 * Middleware Express para sanitizar automáticamente la respuesta
 * Intercepta res.json() y sanitiza los datos antes de enviarlos
 * @param {Request} req - Request de Express
 * @param {Response} res - Response de Express
 * @param {Function} next - Función next de Express
 */
export function publicDataMiddleware(req, res, next) {
    // Guardar referencia original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para sanitizar automáticamente
    res.json = function(data) {
        if (data && data.success && data.data) {
            // Si data.data es un array, sanitizar lista
            if (Array.isArray(data.data)) {
                data.data = sanitizeGraduateList(data.data);
            } 
            // Si data.data es un objeto, sanitizar individualmente
            else if (typeof data.data === 'object') {
                data.data = sanitizePublicProfile(data.data);
            }
        }

        // Llamar al json original con datos sanitizados
        return originalJson(data);
    };

    next();
}

/**
 * Valida que un perfil esté marcado como público
 * @param {Object} perfil - Objeto de perfil con campo perfilPublico
 * @returns {boolean} true si el perfil es público
 */
export function isPublicProfile(perfil) {
    return perfil && perfil.perfilPublico === 1;
}

/**
 * Filtra un array de perfiles dejando solo los públicos
 * @param {Array} profiles - Array de perfiles
 * @returns {Array} Array con solo perfiles públicos
 */
export function filterPublicProfiles(profiles) {
    if (!Array.isArray(profiles)) return [];

    return profiles.filter(profile => {
        // Si el perfil tiene perfilId, verificar que sea público
        return !profile.perfilPublico || profile.perfilPublico === 1;
    });
}
