/**
 * Exportación centralizada de todas las utilidades
 * Sistema de Gestión de Egresados IES
 */

// API utilities
export {
    apiClient,
    ApiError,
    authService,
    profileService,
    userService,
    statsService,
    systemService,
    initializeApiAuth,
    setAuthToken,
    clearAuth,
    getUserData,
    setUserData,
    handleAuthError,
    apiRequest,
} from "./api.js";

// Validation utilities
export {
    validateDNI,
    validateEmail,
    validatePassword,
    validateName,
    validatePhone,
    validateGraduationYear,
    validateCVFile,
    formatDNI,
    formatPhone,
    validateForm,
    debounce,
} from "./validation.js";

// General helpers
export {
    formatDate,
    formatDateTime,
    calculateAge,
    capitalizeWords,
    truncateText,
    formatFileSize,
    generateId,
    copyToClipboard,
    downloadBlob,
    scrollToElement,
    isDarkMode,
    getUrlParams,
    updateUrl,
    isElementVisible,
    throttle,
    getDeviceType,
    getErrorMessage,
    storage,
    CONSTANTS,
} from "./helpers.js";

// Constants
export {
    API_ENDPOINTS,
    APP_CONFIG,
    USER_TYPES,
    PROFILE_STATUS,
    EDUCATION_LEVELS,
    MARITAL_STATUS,
    EMPLOYMENT_STATUS,
    CAREERS,
    DOCUMENT_TYPES,
    THEME_COLORS,
    ROUTES,
    MESSAGES,
    NOTIFICATION_CONFIG,
    STORAGE_KEYS,
    REGEX_PATTERNS,
} from "./constants.js";
