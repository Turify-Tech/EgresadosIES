import database from "../config/database.js";

/**
 * Middleware de autorización por roles
 * Sistema de permisos granular para el sistema de gestión de egresados
 */

/**
 * Definición de permisos del sistema
 */
export const PERMISSIONS = {
    // Permisos de perfil
    PROFILE_VIEW_OWN: "profile.view.own",
    PROFILE_VIEW_ALL: "profile.view.all",
    PROFILE_EDIT_OWN: "profile.edit.own",
    PROFILE_EDIT_ALL: "profile.edit.all",
    PROFILE_DELETE: "profile.delete",

    // Permisos de usuarios
    USER_CREATE: "user.create",
    USER_VIEW_ALL: "user.view.all",
    USER_EDIT_ALL: "user.edit.all",
    USER_DELETE: "user.delete",
    USER_ACTIVATE: "user.activate",

    // Permisos administrativos
    ADMIN_PANEL: "admin.panel",
    ADMIN_REPORTS: "admin.reports",
    ADMIN_SETTINGS: "admin.settings",
    ADMIN_LOGS: "admin.logs",

    // Permisos de archivos
    FILE_UPLOAD: "file.upload",
    FILE_DOWNLOAD_OWN: "file.download.own",
    FILE_DOWNLOAD_ALL: "file.download.all",
    FILE_DELETE_OWN: "file.delete.own",
    FILE_DELETE_ALL: "file.delete.all",

    // Permisos de notificaciones
    NOTIFICATION_SEND: "notification.send",
    NOTIFICATION_VIEW_ALL: "notification.view.all",

    // Permisos de estadísticas
    STATS_VIEW_BASIC: "stats.view.basic",
    STATS_VIEW_DETAILED: "stats.view.detailed",
};

/**
 * Roles predefinidos con sus permisos
 */
export const ROLES = {
    egresado: [
        PERMISSIONS.PROFILE_VIEW_OWN,
        PERMISSIONS.PROFILE_EDIT_OWN,
        PERMISSIONS.FILE_UPLOAD,
        PERMISSIONS.FILE_DOWNLOAD_OWN,
        PERMISSIONS.FILE_DELETE_OWN,
        PERMISSIONS.STATS_VIEW_BASIC,
    ],
    administrador: [
        // Todos los permisos de egresado
        ...Object.values(PERMISSIONS),
    ],
};

/**
 * Obtiene los permisos de un usuario según su tipo
 * @param {string} userType - Tipo de usuario ('egresado' o 'administrador')
 * @returns {string[]} Array de permisos
 */
export function getUserPermissions(userType) {
    return ROLES[userType] || [];
}

/**
 * Middleware para verificar si un usuario tiene un permiso específico
 * @param {string} permission - Permiso requerido
 * @returns {Function} Middleware function
 */
export function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const userPermissions = getUserPermissions(req.user.tipoUsuario);

        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                message:
                    "No tiene permisos suficientes para realizar esta acción",
                requiredPermission: permission,
            });
        }

        next();
    };
}

/**
 * Middleware para verificar múltiples permisos (requiere TODOS)
 * @param {...string} permissions - Permisos requeridos
 * @returns {Function} Middleware function
 */
export function requireAllPermissions(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const userPermissions = getUserPermissions(req.user.tipoUsuario);
        const missingPermissions = permissions.filter(
            (permission) => !userPermissions.includes(permission)
        );

        if (missingPermissions.length > 0) {
            return res.status(403).json({
                success: false,
                message: "No tiene todos los permisos requeridos",
                missingPermissions,
            });
        }

        next();
    };
}

/**
 * Middleware para verificar múltiples permisos (requiere al menos UNO)
 * @param {...string} permissions - Permisos requeridos (al menos uno)
 * @returns {Function} Middleware function
 */
export function requireAnyPermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const userPermissions = getUserPermissions(req.user.tipoUsuario);
        const hasAnyPermission = permissions.some((permission) =>
            userPermissions.includes(permission)
        );

        if (!hasAnyPermission) {
            return res.status(403).json({
                success: false,
                message: "No tiene ninguno de los permisos requeridos",
                requiredPermissions: permissions,
            });
        }

        next();
    };
}

/**
 * Middleware para verificar acceso a recursos propios o permisos administrativos
 * @param {string} resourceUserIdParam - Parámetro que contiene el ID del propietario del recurso
 * @param {string} adminPermission - Permiso administrativo que permite acceso total
 * @returns {Function} Middleware function
 */
export function requireOwnershipOrPermission(
    resourceUserIdParam,
    adminPermission
) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        const resourceUserId = parseInt(req.params[resourceUserIdParam]);
        const userPermissions = getUserPermissions(req.user.tipoUsuario);

        // Verificar si es propietario del recurso
        const isOwner = req.user.id === resourceUserId;

        // Verificar si tiene permisos administrativos
        const hasAdminPermission = userPermissions.includes(adminPermission);

        if (!isOwner && !hasAdminPermission) {
            return res.status(403).json({
                success: false,
                message: "No puede acceder a este recurso",
            });
        }

        // Agregar información adicional al request
        req.isResourceOwner = isOwner;
        req.hasAdminAccess = hasAdminPermission;

        next();
    };
}

/**
 * Middleware para verificar permisos con contexto de base de datos
 * Útil para permisos que dependen del estado en la BD
 */
export async function requireDynamicPermission(permissionChecker) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Usuario no autenticado",
            });
        }

        try {
            const hasPermission = await permissionChecker(
                req.user,
                req,
                database.getClient()
            );

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: "No tiene permisos para realizar esta acción",
                });
            }

            next();
        } catch (error) {
            console.error("Error verificando permisos dinámicos:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor",
            });
        }
    };
}

/**
 * Función utilitaria para verificar si un usuario tiene un permiso
 * @param {Object} user - Objeto usuario
 * @param {string} permission - Permiso a verificar
 * @returns {boolean} true si tiene el permiso
 */
export function hasPermission(user, permission) {
    if (!user || !user.tipoUsuario) {
        return false;
    }

    const userPermissions = getUserPermissions(user.tipoUsuario);
    return userPermissions.includes(permission);
}

/**
 * Middleware para logging de acciones con permisos
 */
export function logPermissionAction(action) {
    return (req, res, next) => {
        if (req.user) {
            console.log(
                `[PERMISSION] ${req.user.dni} (${req.user.tipoUsuario}) - ${action} - ${req.method} ${req.path}`
            );
        }
        next();
    };
}

/**
 * Obtener información completa de permisos de un usuario
 * @param {Object} user - Objeto usuario
 * @returns {Object} Información de permisos
 */
export function getUserPermissionInfo(user) {
    if (!user || !user.tipoUsuario) {
        return {
            userType: null,
            permissions: [],
            hasAdminAccess: false,
        };
    }

    const permissions = getUserPermissions(user.tipoUsuario);

    return {
        userType: user.tipoUsuario,
        permissions,
        hasAdminAccess: user.tipoUsuario === "administrador",
        permissionCount: permissions.length,
    };
}
