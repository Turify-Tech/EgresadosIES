/**
 * Validadores específicos para la gestión de perfiles
 * Sistema de Gestión de Egresados IES
 */

/**
 * Valida los datos del perfil principal
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validatePerfil(req, res, next) {
    const {
        resumenProfesional,
        urlPortfolio,
        situacionLaboral,
        urlFotoPerfil,
        urlBanner,
    } = req.body;
    const errors = [];

    // Validar resumen profesional
    if (resumenProfesional !== undefined && resumenProfesional !== null) {
        if (typeof resumenProfesional !== "string") {
            errors.push("El resumen profesional debe ser texto");
        } else if (resumenProfesional.trim().length > 1000) {
            errors.push(
                "El resumen profesional no puede exceder 1000 caracteres"
            );
        }
    }

    // Validar URL del portfolio
    if (
        urlPortfolio !== undefined &&
        urlPortfolio !== null &&
        urlPortfolio.trim()
    ) {
        const urlRegex =
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(urlPortfolio.trim())) {
            errors.push("La URL del portfolio no es válida");
        }
    }

    // Validar situación laboral
    if (situacionLaboral !== undefined && situacionLaboral !== null) {
        if (typeof situacionLaboral !== "string") {
            errors.push("La situación laboral debe ser texto");
        } else if (situacionLaboral.trim().length > 200) {
            errors.push("La situación laboral no puede exceder 200 caracteres");
        }
    }

    // Validar URL de foto de perfil
    if (
        urlFotoPerfil !== undefined &&
        urlFotoPerfil !== null &&
        urlFotoPerfil.trim()
    ) {
        const urlRegex =
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(urlFotoPerfil.trim())) {
            errors.push("La URL de la foto de perfil no es válida");
        }
    }

    // Validar URL del banner
    if (urlBanner !== undefined && urlBanner !== null && urlBanner.trim()) {
        const urlRegex =
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(urlBanner.trim())) {
            errors.push("La URL del banner no es válida");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Errores de validación",
            details: errors,
        });
    }

    next();
}

/**
 * Valida los datos de experiencia laboral
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validateExperienciaLaboral(req, res, next) {
    const { puesto, empresa, fechaInicio, fechaFin, descripcion } = req.body;
    const errors = [];

    // Validar puesto (requerido)
    if (!puesto || typeof puesto !== "string" || !puesto.trim()) {
        errors.push("El puesto es requerido");
    } else if (puesto.trim().length > 100) {
        errors.push("El puesto no puede exceder 100 caracteres");
    }

    // Validar empresa (requerido)
    if (!empresa || typeof empresa !== "string" || !empresa.trim()) {
        errors.push("La empresa es requerida");
    } else if (empresa.trim().length > 100) {
        errors.push("La empresa no puede exceder 100 caracteres");
    }

    // Validar fechas
    if (fechaInicio) {
        const fecha = new Date(fechaInicio);
        if (isNaN(fecha.getTime())) {
            errors.push("La fecha de inicio no es válida");
        } else {
            const fechaMinima = new Date("1950-01-01");
            const fechaMaxima = new Date();
            fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 1); // Permitir fechas futuras hasta 1 año

            if (fecha < fechaMinima || fecha > fechaMaxima) {
                errors.push(
                    "La fecha de inicio debe estar entre 1950 y el próximo año"
                );
            }
        }
    }

    if (fechaFin) {
        const fecha = new Date(fechaFin);
        if (isNaN(fecha.getTime())) {
            errors.push("La fecha de fin no es válida");
        } else {
            const fechaMinima = new Date("1950-01-01");
            const fechaMaxima = new Date();
            fechaMaxima.setFullYear(fechaMaxima.getFullYear() + 1);

            if (fecha < fechaMinima || fecha > fechaMaxima) {
                errors.push(
                    "La fecha de fin debe estar entre 1950 y el próximo año"
                );
            }
        }
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (fechaInicio && fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);

        if (
            !isNaN(inicio.getTime()) &&
            !isNaN(fin.getTime()) &&
            fin <= inicio
        ) {
            errors.push(
                "La fecha de fin debe ser posterior a la fecha de inicio"
            );
        }
    }

    // Validar descripción
    if (descripcion !== undefined && descripcion !== null) {
        if (typeof descripcion !== "string") {
            errors.push("La descripción debe ser texto");
        } else if (descripcion.trim().length > 500) {
            errors.push("La descripción no puede exceder 500 caracteres");
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Errores de validación",
            details: errors,
        });
    }

    next();
}

/**
 * Valida los datos de formación académica
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validateFormacionAcademica(req, res, next) {
    const { titulo, institucion, anioFinalizacion } = req.body;
    const errors = [];

    // Validar título (requerido)
    if (!titulo || typeof titulo !== "string" || !titulo.trim()) {
        errors.push("El título es requerido");
    } else if (titulo.trim().length > 150) {
        errors.push("El título no puede exceder 150 caracteres");
    }

    // Validar institución (requerido)
    if (
        !institucion ||
        typeof institucion !== "string" ||
        !institucion.trim()
    ) {
        errors.push("La institución es requerida");
    } else if (institucion.trim().length > 150) {
        errors.push("La institución no puede exceder 150 caracteres");
    }

    // Validar año de finalización
    if (anioFinalizacion !== undefined && anioFinalizacion !== null) {
        const anio = parseInt(anioFinalizacion);
        const currentYear = new Date().getFullYear();

        if (isNaN(anio)) {
            errors.push("El año de finalización debe ser un número válido");
        } else if (anio < 1950 || anio > currentYear + 5) {
            errors.push(
                `El año de finalización debe estar entre 1950 y ${
                    currentYear + 5
                }`
            );
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Errores de validación",
            details: errors,
        });
    }

    next();
}

/**
 * Valida los datos de curso
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validateCurso(req, res, next) {
    const { nombre, institucion, horasDuracion } = req.body;
    const errors = [];

    // Validar nombre del curso (requerido)
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        errors.push("El nombre del curso es requerido");
    } else if (nombre.trim().length > 150) {
        errors.push("El nombre del curso no puede exceder 150 caracteres");
    }

    // Validar institución (opcional)
    if (institucion !== undefined && institucion !== null) {
        if (typeof institucion !== "string") {
            errors.push("La institución debe ser texto");
        } else if (institucion.trim().length > 150) {
            errors.push("La institución no puede exceder 150 caracteres");
        }
    }

    // Validar horas de duración (opcional)
    if (horasDuracion !== undefined && horasDuracion !== null) {
        const hours = parseInt(horasDuracion);
        if (isNaN(hours) || hours < 0 || hours > 10000) {
            errors.push(
                "Las horas de duración deben ser un número entre 0 y 10000"
            );
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Error de validación",
            details: errors,
        });
    }

    next();
}

/**
 * Valida los datos de habilidad
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validateHabilidad(req, res, next) {
    const { nombre, tipo, nivel } = req.body;
    const errors = [];

    // Validar nombre de la habilidad (requerido)
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        errors.push("El nombre de la habilidad es requerido");
    } else if (nombre.trim().length > 100) {
        errors.push(
            "El nombre de la habilidad no puede exceder 100 caracteres"
        );
    }

    // Validar tipo (opcional, con valores permitidos)
    if (tipo !== undefined && tipo !== null) {
        const tiposPermitidos = ["tecnica", "blanda", "idioma"];
        if (
            typeof tipo !== "string" ||
            !tiposPermitidos.includes(tipo.toLowerCase())
        ) {
            errors.push("El tipo debe ser uno de: técnica, blanda, idioma");
        }
    }

    // Validar nivel (opcional, con valores permitidos)
    if (nivel !== undefined && nivel !== null) {
        const nivelesPermitidos = [
            "basico",
            "intermedio",
            "avanzado",
            "experto",
        ];
        if (
            typeof nivel !== "string" ||
            !nivelesPermitidos.includes(nivel.toLowerCase())
        ) {
            errors.push(
                "El nivel debe ser uno de: básico, intermedio, avanzado, experto"
            );
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Error de validación",
            details: errors,
        });
    }

    next();
}

/**
 * Valida los datos de proyecto
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function validateProyecto(req, res, next) {
    console.log(
        "🔍 Validando proyecto con datos:",
        JSON.stringify(req.body, null, 2)
    );

    const { nombre, descripcion, enlace, tecnologias, fechaProyecto, imagen } =
        req.body;
    const errors = [];

    // Validar nombre del proyecto (requerido)
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
        errors.push("El nombre del proyecto es requerido");
    } else if (nombre.trim().length > 150) {
        errors.push("El nombre del proyecto no puede exceder 150 caracteres");
    }

    // Validar descripción (opcional)
    if (descripcion !== undefined && descripcion !== null) {
        if (typeof descripcion !== "string") {
            errors.push("La descripción debe ser texto");
        } else if (descripcion.trim().length > 1000) {
            errors.push("La descripción no puede exceder 1000 caracteres");
        }
    }

    // Validar enlace (opcional, pero debe ser URL válida si se proporciona)
    if (enlace !== undefined && enlace !== null && enlace.trim()) {
        const urlRegex =
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(enlace.trim())) {
            errors.push("El enlace del proyecto no es una URL válida");
        }
    }

    // Validar tecnologías (opcional)
    if (tecnologias !== undefined && tecnologias !== null) {
        if (typeof tecnologias !== "string") {
            errors.push("Las tecnologías deben ser texto");
        } else if (tecnologias.trim().length > 300) {
            errors.push("Las tecnologías no pueden exceder 300 caracteres");
        }
    }

    // Validar fecha del proyecto (opcional)
    if (
        fechaProyecto !== undefined &&
        fechaProyecto !== null &&
        fechaProyecto.trim()
    ) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(fechaProyecto.trim())) {
            errors.push("La fecha del proyecto debe tener formato YYYY-MM-DD");
        } else {
            const date = new Date(fechaProyecto.trim());
            if (isNaN(date.getTime())) {
                errors.push("La fecha del proyecto no es válida");
            }
        }
    }

    // Validar imagen (opcional, pero debe ser URL válida si se proporciona)
    if (imagen !== undefined && imagen !== null && imagen.trim()) {
        const urlRegex =
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        if (!urlRegex.test(imagen.trim())) {
            errors.push("La URL de la imagen no es válida");
        }
    }

    console.log("🔍 [validateProyecto] req.body recibido:", req.body);
    console.log("🔍 [validateProyecto] errors encontrados:", errors);

    if (errors.length > 0) {
        console.log(
            "❌ [validateProyecto] Devolviendo 400 con errores:",
            errors
        );
        return res.status(400).json({
            success: false,
            error: "Error de validación",
            details: errors,
        });
    }

    console.log("✅ [validateProyecto] Validación exitosa, continuando...");
    next();
}

/**
 * Valida que el ID del parámetro sea un número válido
 * @param {string} paramName - Nombre del parámetro a validar
 * @returns {Function} Middleware de validación
 */
export function validateIdParam(paramName = "id") {
    return (req, res, next) => {
        const id = parseInt(req.params[paramName]);

        if (!id || isNaN(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: `ID ${paramName} inválido`,
            });
        }

        // Agregar el ID validado al request
        req.validatedId = id;
        next();
    };
}

/**
 * Middleware para sanitizar strings en el body de la request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export function sanitizeStrings(req, res, next) {
    const sanitizeValue = (value) => {
        if (typeof value === "string") {
            return value.trim();
        }
        return value;
    };

    if (req.body && typeof req.body === "object") {
        Object.keys(req.body).forEach((key) => {
            req.body[key] = sanitizeValue(req.body[key]);
        });
    }

    next();
}

/**
 * Middleware para logging de validaciones
 * @param {string} action - Acción que se está validando
 * @returns {Function} Middleware de logging
 */
export function logValidation(action) {
    return (req, res, next) => {
        console.info(
            `[VALIDATION] Usuario ${req.user?.id || "unknown"} - ${action} - ${
                req.method
            } ${req.path}`
        );
        next();
    };
}

export default {
    validatePerfil,
    validateExperienciaLaboral,
    validateFormacionAcademica,
    validateCurso,
    validateHabilidad,
    validateProyecto,
    validateIdParam,
    sanitizeStrings,
    logValidation,
};
