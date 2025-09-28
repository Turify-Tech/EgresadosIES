/**
 * Archivo de exportación central para utilidades de autenticación
 * Facilita las importaciones en otros módulos
 */

// Utilidades JWT
export {
    generateToken,
    verifyToken,
    decodeToken,
    extractToken,
    isTokenExpiringSoon,
    generateRefreshToken,
} from "./utils/jwt.js";

// Utilidades de contraseñas
export {
    hashPassword,
    verifyPassword,
    generateTempPassword,
    validatePasswordStrength,
    needsPasswordRehash,
} from "./utils/bcrypt.js";

// Middleware de autenticación
export {
    authenticateToken,
    optionalAuth,
    verifyActiveUser,
    requireUserType,
    requireOwnership,
    userRateLimit,
    logUserActivity,
} from "./middleware/auth.js";

// Middleware de roles y permisos
export {
    PERMISSIONS,
    ROLES,
    getUserPermissions,
    requirePermission,
    requireAllPermissions,
    requireAnyPermission,
    requireOwnershipOrPermission,
    requireDynamicPermission,
    hasPermission,
    logPermissionAction,
    getUserPermissionInfo,
} from "./middleware/roles.js";
