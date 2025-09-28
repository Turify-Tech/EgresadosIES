/**
 * Constantes de configuración para el frontend
 * Sistema de Gestión de Egresados IES
 */

// URLs y endpoints
export const API_ENDPOINTS = {
    BASE_URL: import.meta.env.PUBLIC_API_URL || "http://localhost:3000",

    // Autenticación
    AUTH: {
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        VERIFY: "/auth/verify",
        REFRESH: "/auth/refresh",
        RESET_PASSWORD: "/auth/reset-password",
        CONFIRM_RESET: "/auth/confirm-reset",
    },

    // Perfil
    PROFILE: {
        ME: "/profile/me",
        BY_ID: (id) => `/profile/${id}`,
        UPDATE: (id) => `/profile/${id}`,
        COMPLETE: "/profile/complete",
        UPLOAD_CV: "/profile/upload-cv",
        DOWNLOAD_CV: (id) => `/profile/${id}/cv`,
    },

    // Usuarios (admin)
    USERS: {
        LIST: "/users",
        CREATE: "/users",
        TOGGLE_STATUS: (id) => `/users/${id}/status`,
        DELETE: (id) => `/users/${id}`,
    },

    // Estadísticas
    STATS: {
        GENERAL: "/stats/general",
        GRADUATES: "/stats/graduates",
        REPORTS: (type) => `/stats/reports/${type}`,
    },

    // Sistema
    SYSTEM: {
        HEALTH: "/health",
        INFO: "/system/info",
    },
};

// Configuración de la aplicación
export const APP_CONFIG = {
    NAME: "Sistema de Gestión de Egresados IES",
    SHORT_NAME: "Egresados IES",
    VERSION: "1.0.0",

    // Timeouts
    REQUEST_TIMEOUT: 10000,
    TOKEN_REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutos

    // Límites de archivos
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],

    // Paginación
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,

    // Validación
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
};

// Tipos de usuario
export const USER_TYPES = {
    EGRESADO: "egresado",
    ADMINISTRADOR: "administrador",
};

// Estados de perfil
export const PROFILE_STATUS = {
    INCOMPLETE: "incompleto",
    COMPLETE: "completo",
    PENDING_VERIFICATION: "pendiente_verificacion",
    VERIFIED: "verificado",
};

// Niveles de educación
export const EDUCATION_LEVELS = [
    { value: "secundario", label: "Secundario" },
    { value: "terciario", label: "Terciario" },
    { value: "universitario", label: "Universitario" },
    { value: "postgrado", label: "Postgrado" },
    { value: "maestria", label: "Maestría" },
    { value: "doctorado", label: "Doctorado" },
];

// Estados civiles
export const MARITAL_STATUS = [
    { value: "soltero", label: "Soltero/a" },
    { value: "casado", label: "Casado/a" },
    { value: "divorciado", label: "Divorciado/a" },
    { value: "viudo", label: "Viudo/a" },
    { value: "union_libre", label: "Unión Libre" },
];

// Situaciones laborales
export const EMPLOYMENT_STATUS = [
    { value: "empleado", label: "Empleado" },
    { value: "desempleado", label: "Desempleado" },
    { value: "independiente", label: "Trabajador Independiente" },
    { value: "empresario", label: "Empresario" },
    { value: "estudiante", label: "Estudiante" },
    { value: "jubilado", label: "Jubilado" },
];

// Carreras del IES (ejemplo - ajustar según la institución real)
export const CAREERS = [
    {
        value: "administracion_empresas",
        label: "Administración de Empresas",
        duration: 3,
    },
    {
        value: "contabilidad",
        label: "Contabilidad",
        duration: 3,
    },
    {
        value: "marketing",
        label: "Marketing",
        duration: 2,
    },
    {
        value: "recursos_humanos",
        label: "Recursos Humanos",
        duration: 3,
    },
    {
        value: "comercio_exterior",
        label: "Comercio Exterior",
        duration: 3,
    },
    {
        value: "turismo",
        label: "Turismo",
        duration: 2,
    },
    {
        value: "sistemas",
        label: "Análisis de Sistemas",
        duration: 3,
    },
    {
        value: "enfermeria",
        label: "Enfermería",
        duration: 3,
    },
];

// Tipos de documentos
export const DOCUMENT_TYPES = [
    { value: "cv", label: "Curriculum Vitae" },
    { value: "certificado", label: "Certificado de Graduación" },
    { value: "titulo", label: "Título Oficial" },
    { value: "analitico", label: "Analítico" },
];

// Colores del tema
export const THEME_COLORS = {
    PRIMARY: {
        50: "#eff6ff",
        100: "#dbeafe",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        900: "#1e3a8a",
    },

    SUCCESS: {
        50: "#f0fdf4",
        100: "#dcfce7",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
    },

    WARNING: {
        50: "#fffbeb",
        100: "#fef3c7",
        500: "#f59e0b",
        600: "#d97706",
        700: "#b45309",
    },

    ERROR: {
        50: "#fef2f2",
        100: "#fee2e2",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
    },

    GRAY: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
    },
};

// Rutas de la aplicación
export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    PROFILE: {
        VIEW: "/profile",
        EDIT: "/profile/edit",
        COMPLETE: "/profile/complete",
    },
    ADMIN: {
        DASHBOARD: "/admin",
        USERS: "/admin/users",
        STATS: "/admin/stats",
        REPORTS: "/admin/reports",
        SETTINGS: "/admin/settings",
    },
    NOT_FOUND: "/404",
    UNAUTHORIZED: "/401",
};

// Mensajes de la aplicación
export const MESSAGES = {
    SUCCESS: {
        LOGIN: "Inicio de sesión exitoso",
        LOGOUT: "Sesión cerrada correctamente",
        PROFILE_UPDATED: "Perfil actualizado correctamente",
        CV_UPLOADED: "CV subido correctamente",
        PASSWORD_RESET_SENT: "Se ha enviado un email con las instrucciones",
        PASSWORD_CHANGED: "Contraseña cambiada correctamente",
    },

    ERROR: {
        NETWORK: "Error de conexión. Verifique su conexión a internet",
        UNAUTHORIZED: "No tiene permisos para realizar esta acción",
        INVALID_CREDENTIALS: "DNI o contraseña incorrectos",
        TOKEN_EXPIRED:
            "Su sesión ha expirado. Por favor, inicie sesión nuevamente",
        FILE_TOO_LARGE: "El archivo es demasiado grande",
        INVALID_FILE_TYPE: "Tipo de archivo no válido",
        REQUIRED_FIELD: "Este campo es requerido",
        INVALID_DNI: "El DNI ingresado no es válido",
        INVALID_EMAIL: "El email ingresado no es válido",
        PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 6 caracteres",
    },

    LOADING: {
        AUTHENTICATING: "Iniciando sesión...",
        SAVING: "Guardando...",
        UPLOADING: "Subiendo archivo...",
        LOADING: "Cargando...",
    },
};

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
    DURATION: {
        SUCCESS: 5000,
        ERROR: 8000,
        WARNING: 6000,
        INFO: 4000,
    },

    POSITION: "top-right",
};

// Claves de localStorage
export const STORAGE_KEYS = {
    AUTH_TOKEN: "auth_token",
    USER_DATA: "user_data",
    THEME: "theme",
    LANGUAGE: "language",
    PREFERENCES: "user_preferences",
};

// Expresiones regulares útiles
export const REGEX_PATTERNS = {
    DNI: /^\d{7,8}$/,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^(\+54)?\d{10}$/,
    ONLY_LETTERS: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
};
