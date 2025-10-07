/**
 * Utilidades generales para el frontend
 * Sistema de Gestión de Egresados IES
 */

/**
 * Formatea fechas para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Locale (default: 'es-AR')
 * @returns {string} Fecha formateada
 */
export function formatDate(date, locale = "es-AR") {
    if (!date) return "";

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return "Fecha inválida";
    }

    return dateObj.toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * Formatea fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @param {string} locale - Locale (default: 'es-AR')
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(date, locale = "es-AR") {
    if (!date) return "";

    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return "Fecha inválida";
    }

    return dateObj.toLocaleString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 * @param {string|Date} birthDate - Fecha de nacimiento
 * @returns {number} Edad en años
 */
export function calculateAge(birthDate) {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    if (isNaN(birth.getTime())) {
        return null;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
        age--;
    }

    return age;
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export function capitalizeWords(str) {
    if (!str) return "";

    return str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Trunca texto con puntos suspensivos
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;

    return text.slice(0, maxLength).trim() + "...";
}

/**
 * Convierte bytes a formato legible
 * @param {number} bytes - Bytes a convertir
 * @returns {string} Tamaño formateado
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} true si se copió exitosamente
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback para navegadores antiguos
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand("copy");
            document.body.removeChild(textArea);
            return successful;
        }
    } catch (err) {
        console.error("Error copiando al portapapeles:", err);
        return false;
    }
}

/**
 * Descargar archivo blob
 * @param {Blob} blob - Blob a descargar
 * @param {string} filename - Nombre del archivo
 */
export function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Scroll suave a un elemento
 * @param {string|Element} target - Selector CSS o elemento DOM
 * @param {number} offset - Offset en pixels
 */
export function scrollToElement(target, offset = 0) {
    const element =
        typeof target === "string" ? document.querySelector(target) : target;

    if (element) {
        const elementPosition =
            element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
        });
    }
}

/**
 * Detecta si estamos en modo oscuro
 * @returns {boolean} true si está en modo oscuro
 */
export function isDarkMode() {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

/**
 * Obtiene parámetros de la URL
 * @returns {Object} Parámetros de la URL
 */
export function getUrlParams() {
    if (typeof window === "undefined") return {};

    const params = new URLSearchParams(window.location.search);
    const result = {};

    for (const [key, value] of params) {
        result[key] = value;
    }

    return result;
}

/**
 * Actualiza la URL sin recargar la página
 * @param {string} url - Nueva URL
 */
export function updateUrl(url) {
    if (typeof window !== "undefined" && window.history) {
        window.history.pushState({}, "", url);
    }
}

/**
 * Verifica si un elemento está visible en el viewport
 * @param {Element} element - Elemento a verificar
 * @returns {boolean} true si está visible
 */
export function isElementVisible(element) {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
        window.innerWidth || document.documentElement.clientWidth;

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth
    );
}

/**
 * Throttle para limitar ejecución de funciones
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en milisegundos
 * @returns {Function} Función con throttle
 */
export function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Detecta tipo de dispositivo
 * @returns {string} Tipo de dispositivo: 'mobile', 'tablet', 'desktop'
 */
export function getDeviceType() {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;

    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
}

/**
 * Manejo de errores para mostrar al usuario
 * @param {Error|string} error - Error a formatear
 * @returns {string} Mensaje de error amigable
 */
export function getErrorMessage(error) {
    if (typeof error === "string") {
        return error;
    }

    if (error?.message) {
        return error.message;
    }

    if (error?.data?.message) {
        return error.data.message;
    }

    return "Ha ocurrido un error inesperado";
}

/**
 * Storage local con soporte para JSON
 */
export const storage = {
    /**
     * Guardar item en localStorage
     */
    set(key, value) {
        if (typeof window === "undefined") return;

        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error("Error guardando en localStorage:", error);
        }
    },

    /**
     * Obtener item de localStorage
     */
    get(key) {
        if (typeof window === "undefined") return null;

        try {
            const serialized = localStorage.getItem(key);
            return serialized ? JSON.parse(serialized) : null;
        } catch (error) {
            console.error("Error leyendo de localStorage:", error);
            return null;
        }
    },

    /**
     * Eliminar item de localStorage
     */
    remove(key) {
        if (typeof window === "undefined") return;

        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error("Error eliminando de localStorage:", error);
        }
    },

    /**
     * Limpiar localStorage
     */
    clear() {
        if (typeof window === "undefined") return;

        try {
            localStorage.clear();
        } catch (error) {
            console.error("Error limpiando localStorage:", error);
        }
    },
};

/**
 * Constantes útiles
 */
export const CONSTANTS = {
    ROLES: {
        EGRESADO: "egresado",
        ADMINISTRADOR: "administrador",
    },

    FILE_TYPES: {
        PDF: "application/pdf",
        DOC: "application/msword",
        DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    },

    ROUTES: {
        HOME: "/",
        LOGIN: "/acceso",
        PROFILE: "/profile",
        ADMIN: "/admin",
        NOT_FOUND: "/404",
    },
};
