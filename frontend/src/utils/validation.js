/**
 * Utilidades para validación de formularios
 * Sistema de Gestión de Egresados IES
 */

/**
 * Valida DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {Object} Resultado de validación
 */
export function validateDNI(dni) {
    const result = { isValid: false, error: "" };

    if (!dni) {
        result.error = "El DNI es requerido";
        return result;
    }

    // Limpiar DNI (remover puntos y espacios)
    const cleanDNI = dni.toString().replace(/[.\s]/g, "");

    if (!/^\d{7,8}$/.test(cleanDNI)) {
        result.error = "El DNI debe tener 7 u 8 dígitos";
        return result;
    }

    result.isValid = true;
    result.cleanValue = cleanDNI;
    return result;
}

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {Object} Resultado de validación
 */
export function validateEmail(email) {
    const result = { isValid: false, error: "" };

    if (!email) {
        result.error = "El email es requerido";
        return result;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        result.error = "El formato del email no es válido";
        return result;
    }

    result.isValid = true;
    return result;
}

/**
 * Valida contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} Resultado de validación
 */
export function validatePassword(password) {
    const result = { isValid: false, error: "", strength: "weak" };

    if (!password) {
        result.error = "La contraseña es requerida";
        return result;
    }

    if (password.length < 6) {
        result.error = "La contraseña debe tener al menos 6 caracteres";
        return result;
    }

    if (password.length > 128) {
        result.error = "La contraseña no puede exceder 128 caracteres";
        return result;
    }

    // Calcular fortaleza
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score < 3) result.strength = "weak";
    else if (score < 5) result.strength = "medium";
    else result.strength = "strong";

    result.isValid = true;
    return result;
}

/**
 * Valida nombre completo
 * @param {string} name - Nombre a validar
 * @returns {Object} Resultado de validación
 */
export function validateName(name) {
    const result = { isValid: false, error: "" };

    if (!name) {
        result.error = "El nombre es requerido";
        return result;
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
        result.error = "El nombre debe tener al menos 2 caracteres";
        return result;
    }

    if (trimmedName.length > 100) {
        result.error = "El nombre no puede exceder 100 caracteres";
        return result;
    }

    // Solo letras, espacios, acentos y algunos caracteres especiales
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(trimmedName)) {
        result.error =
            "El nombre solo puede contener letras, espacios y guiones";
        return result;
    }

    result.isValid = true;
    result.cleanValue = trimmedName;
    return result;
}

/**
 * Valida teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {Object} Resultado de validación
 */
export function validatePhone(phone) {
    const result = { isValid: false, error: "" };

    if (!phone) {
        result.error = "El teléfono es requerido";
        return result;
    }

    // Limpiar teléfono (remover espacios, guiones, paréntesis)
    const cleanPhone = phone.replace(/[\s\-()]/g, "");

    // Validar formato argentino (con o sin código de país)
    if (!/^(\+54)?\d{10}$/.test(cleanPhone)) {
        result.error = "Formato inválido. Ej: +5491123456789 o 1123456789";
        return result;
    }

    result.isValid = true;
    result.cleanValue = cleanPhone;
    return result;
}

/**
 * Valida año de graduación
 * @param {number|string} year - Año a validar
 * @returns {Object} Resultado de validación
 */
export function validateGraduationYear(year) {
    const result = { isValid: false, error: "" };

    if (!year) {
        result.error = "El año de graduación es requerido";
        return result;
    }

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (isNaN(yearNum)) {
        result.error = "El año debe ser un número válido";
        return result;
    }

    if (yearNum < 1950) {
        result.error = "El año no puede ser anterior a 1950";
        return result;
    }

    if (yearNum > currentYear + 2) {
        result.error = `El año no puede ser posterior a ${currentYear + 2}`;
        return result;
    }

    result.isValid = true;
    result.value = yearNum;
    return result;
}

/**
 * Valida archivo de CV
 * @param {File} file - Archivo a validar
 * @returns {Object} Resultado de validación
 */
export function validateCVFile(file) {
    const result = { isValid: false, error: "" };

    if (!file) {
        result.error = "Debe seleccionar un archivo";
        return result;
    }

    // Verificar tipo de archivo
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
        result.error = "Solo se permiten archivos PDF, DOC o DOCX";
        return result;
    }

    // Verificar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        result.error = "El archivo no puede exceder 10MB";
        return result;
    }

    result.isValid = true;
    return result;
}

/**
 * Formatea DNI para mostrar
 * @param {string} dni - DNI a formatear
 * @returns {string} DNI formateado
 */
export function formatDNI(dni) {
    if (!dni) return "";
    const cleanDNI = dni.toString().replace(/[.\s]/g, "");
    return cleanDNI.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Formatea teléfono para mostrar
 * @param {string} phone - Teléfono a formatear
 * @returns {string} Teléfono formateado
 */
export function formatPhone(phone) {
    if (!phone) return "";
    const cleanPhone = phone.replace(/[\s\-()]/g, "");

    if (cleanPhone.startsWith("+54")) {
        const number = cleanPhone.slice(3);
        return `+54 ${number.slice(0, 2)} ${number.slice(2, 6)}-${number.slice(
            6
        )}`;
    } else if (cleanPhone.length === 10) {
        return `${cleanPhone.slice(0, 2)} ${cleanPhone.slice(
            2,
            6
        )}-${cleanPhone.slice(6)}`;
    }

    return cleanPhone;
}

/**
 * Valida formulario completo
 * @param {Object} data - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object} Resultado de validación
 */
export function validateForm(data, rules) {
    const errors = {};
    let isValid = true;

    for (const [field, value] of Object.entries(data)) {
        const rule = rules[field];
        if (!rule) continue;

        let fieldResult = { isValid: true };

        // Validar según el tipo
        switch (rule.type) {
            case "dni":
                fieldResult = validateDNI(value);
                break;
            case "email":
                fieldResult = validateEmail(value);
                break;
            case "password":
                fieldResult = validatePassword(value);
                break;
            case "name":
                fieldResult = validateName(value);
                break;
            case "phone":
                fieldResult = validatePhone(value);
                break;
            case "year":
                fieldResult = validateGraduationYear(value);
                break;
            case "required":
                if (!value || (typeof value === "string" && !value.trim())) {
                    fieldResult = {
                        isValid: false,
                        error: `${rule.label || field} es requerido`,
                    };
                }
                break;
        }

        // Validaciones adicionales
        if (fieldResult.isValid && rule.custom) {
            const customResult = rule.custom(value, data);
            if (!customResult.isValid) {
                fieldResult = customResult;
            }
        }

        if (!fieldResult.isValid) {
            errors[field] = fieldResult.error;
            isValid = false;
        }
    }

    return { isValid, errors };
}

/**
 * Debounce para validaciones en tiempo real
 * @param {Function} func - Función a ejecutar
 * @param {number} delay - Delay en milisegundos
 * @returns {Function} Función con debounce
 */
export function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}
