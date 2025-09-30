import bcrypt from "bcryptjs";

/**
 * Utilidades para hashing y verificación de contraseñas usando bcrypt
 */

// Configuración por defecto para el salt rounds
const DEFAULT_SALT_ROUNDS = 12;

/**
 * Hashea una contraseña usando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @param {number} saltRounds - Número de rondas de salt (default: 12)
 * @returns {Promise<string>} Hash de la contraseña
 */
export async function hashPassword(password, saltRounds = DEFAULT_SALT_ROUNDS) {
    if (!password) {
        throw new Error("La contraseña es requerida");
    }

    if (typeof password !== "string") {
        throw new Error("La contraseña debe ser una cadena de texto");
    }

    if (password.length < 6) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    if (password.length > 128) {
        throw new Error("La contraseña no puede exceder 128 caracteres");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        throw new Error("Error al hashear la contraseña: " + error.message);
    }
}

/**
 * Verifica si una contraseña coincide con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado en la base de datos
 * @returns {Promise<boolean>} true si la contraseña coincide
 */
export async function verifyPassword(password, hash) {
    if (!password || !hash) {
        return false;
    }

    if (typeof password !== "string" || typeof hash !== "string") {
        return false;
    }

    try {
        const isMatch = await bcrypt.compare(password, hash);
        return isMatch;
    } catch (error) {
        console.error("Error al verificar contraseña:", error.message);
        return false;
    }
}

/**
 * Genera una contraseña temporal aleatoria
 * @param {number} length - Longitud de la contraseña (default: 12)
 * @returns {string} Contraseña temporal
 */
export function generateTempPassword(length = 12) {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";

    // Asegurar que tenga al menos una mayúscula, minúscula, número y símbolo
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Completar el resto de la longitud
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Mezclar los caracteres
    return password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
}

/**
 * Valida la fortaleza de una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {Object} Objeto con validez y mensajes de error
 */
export function validatePasswordStrength(password) {
    const result = {
        isValid: true,
        errors: [],
        score: 0,
    };

    if (!password) {
        result.isValid = false;
        result.errors.push("La contraseña es requerida");
        return result;
    }

    // Longitud mínima
    if (password.length < 6) {
        result.isValid = false;
        result.errors.push("Debe tener al menos 6 caracteres");
    } else {
        result.score += 1;
    }

    // Longitud recomendada
    if (password.length >= 12) {
        result.score += 1;
    }

    // Contiene mayúsculas
    if (/[A-Z]/.test(password)) {
        result.score += 1;
    } else {
        result.errors.push("Debe contener al menos una mayúscula");
    }

    // Contiene minúsculas
    if (/[a-z]/.test(password)) {
        result.score += 1;
    } else {
        result.errors.push("Debe contener al menos una minúscula");
    }

    // Contiene números
    if (/\d/.test(password)) {
        result.score += 1;
    } else {
        result.errors.push("Debe contener al menos un número");
    }

    // Contiene símbolos
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        result.score += 1;
    }

    // No contiene espacios
    if (/\s/.test(password)) {
        result.isValid = false;
        result.errors.push("No debe contener espacios");
    }

    // Contraseñas comunes
    const commonPasswords = [
        "123456",
        "password",
        "123456789",
        "qwerty",
        "abc123",
        "password123",
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
        result.isValid = false;
        result.errors.push("Es una contraseña muy común");
    }

    return result;
}

/**
 * Verifica si una contraseña necesita ser actualizada (rehash)
 * @param {string} hash - Hash actual de la contraseña
 * @param {number} currentSaltRounds - Rounds de salt actuales
 * @returns {boolean} true si necesita actualización
 */
export function needsPasswordRehash(
    hash,
    currentSaltRounds = DEFAULT_SALT_ROUNDS
) {
    try {
        // Extraer los rounds del hash existente
        const hashParts = hash.split("$");
        if (hashParts.length < 4) {
            return true; // Hash malformado, necesita rehash
        }

        const existingRounds = parseInt(hashParts[2]);
        return existingRounds < currentSaltRounds;
    } catch (error) {
        return true; // Error en el hash, necesita rehash
    }
}
