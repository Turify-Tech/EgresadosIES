/**
 * Validadores para endpoints de administración de DNIs
 */

/**
 * Validar formato de DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {object} - {isValid: boolean, message?: string}
 */
export function validateDNI(dni) {
    if (!dni) {
        return {
            isValid: false,
            message: 'DNI es requerido'
        };
    }

    // Convertir a string y limpiar espacios
    const dniStr = dni.toString().trim();

    // DNI argentino: 7-8 dígitos numéricos sin puntos ni espacios
    const dniRegex = /^\d{7,8}$/;
    
    if (!dniRegex.test(dniStr)) {
        return {
            isValid: false,
            message: 'DNI debe contener entre 7 y 8 dígitos numéricos solamente'
        };
    }

    // Validación adicional: no puede ser todo ceros
    if (/^0+$/.test(dniStr)) {
        return {
            isValid: false,
            message: 'DNI no puede ser todo ceros'
        };
    }

    return {
        isValid: true,
        cleanDNI: dniStr
    };
}

/**
 * Validar datos para agregar DNI individual
 * @param {object} data - {dni, carrera}
 * @returns {object} - {isValid: boolean, errors: string[]}
 */
export function validateAgregarDNI(data) {
    const errors = [];
    
    if (!data) {
        return {
            isValid: false,
            errors: ['Datos requeridos']
        };
    }

    const { dni, carrera } = data;

    // Validar DNI
    const dniValidation = validateDNI(dni);
    if (!dniValidation.isValid) {
        errors.push(dniValidation.message);
    }

    // Validar carrera
    if (!carrera || typeof carrera !== 'string' || carrera.trim().length === 0) {
        errors.push('Carrera es requerida y debe ser un texto válido');
    } else if (carrera.trim().length > 100) {
        errors.push('Carrera no puede exceder 100 caracteres');
    }

    return {
        isValid: errors.length === 0,
        errors,
        cleanData: errors.length === 0 ? {
            dni: dniValidation.cleanDNI,
            carrera: carrera.trim()
        } : null
    };
}

/**
 * Validar parámetros de paginación
 * @param {object} query - Query parameters {page, limit, search, carrera}
 * @returns {object} - {isValid: boolean, errors: string[], cleanParams: object}
 */
export function validatePaginationParams(query) {
    const errors = [];
    const cleanParams = {};

    // Validar page
    const page = parseInt(query.page) || 1;
    if (page < 1) {
        errors.push('Página debe ser mayor a 0');
    } else if (page > 1000) {
        errors.push('Página no puede ser mayor a 1000');
    } else {
        cleanParams.page = page;
    }

    // Validar limit
    const limit = parseInt(query.limit) || 50;
    if (limit < 1) {
        errors.push('Límite debe ser mayor a 0');
    } else if (limit > 100) {
        errors.push('Límite no puede ser mayor a 100');
    } else {
        cleanParams.limit = limit;
    }

    // Validar search (opcional)
    if (query.search) {
        const search = query.search.toString().trim();
        if (search.length > 50) {
            errors.push('Búsqueda no puede exceder 50 caracteres');
        } else {
            cleanParams.search = search;
        }
    }

    // Validar carrera filter (opcional)
    if (query.carrera) {
        const carrera = query.carrera.toString().trim();
        if (carrera.length > 100) {
            errors.push('Filtro de carrera no puede exceder 100 caracteres');
        } else {
            cleanParams.carrera = carrera;
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        cleanParams
    };
}

/**
 * Validar archivo Excel subido
 * @param {object} file - Multer file object
 * @returns {object} - {isValid: boolean, errors: string[]}
 */
export function validateExcelFile(file) {
    const errors = [];
    
    if (!file) {
        return {
            isValid: false,
            errors: ['Archivo Excel es requerido']
        };
    }

    // Validar tipo de archivo
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
        errors.push('Solo se permiten archivos Excel (.xlsx, .xls)');
    }

    // Validar tamaño (10MB máximo)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        errors.push('Archivo demasiado grande. Máximo 10MB permitido');
    }

    // Validar que tenga contenido
    if (file.size === 0) {
        errors.push('Archivo está vacío');
    }

    // Validar nombre de archivo
    const filename = file.originalname;
    if (!filename || filename.length > 255) {
        errors.push('Nombre de archivo inválido');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validar datos para editar DNI
 * @param {object} params - {dni} de la URL
 * @param {object} body - {carrera} del body
 * @returns {object} - {isValid: boolean, errors: string[], cleanData: object}
 */
export function validateEditarDNI(params, body) {
    const errors = [];
    
    // Validar DNI del parámetro
    const dniValidation = validateDNI(params.dni);
    if (!dniValidation.isValid) {
        errors.push(`DNI en URL: ${dniValidation.message}`);
    }

    // Validar carrera del body
    if (!body || !body.carrera) {
        errors.push('Carrera es requerida en el cuerpo de la petición');
    } else {
        const carrera = body.carrera.toString().trim();
        if (carrera.length === 0) {
            errors.push('Carrera no puede estar vacía');
        } else if (carrera.length > 100) {
            errors.push('Carrera no puede exceder 100 caracteres');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        cleanData: errors.length === 0 ? {
            dni: dniValidation.cleanDNI,
            carrera: body.carrera.toString().trim()
        } : null
    };
}

/**
 * Sanitizar datos de entrada para prevenir inyecciones
 * @param {string} input - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    return input
        .trim()
        .replace(/[<>\"'&]/g, '') // Remover caracteres potencialmente peligrosos
        .substring(0, 1000); // Limitar longitud
}

/**
 * Middleware de validación para agregar DNI
 */
export function validateAgregarDNIMiddleware(req, res, next) {
    const validation = validateAgregarDNI(req.body);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: validation.errors
        });
    }
    
    // Agregar datos limpios al request
    req.validatedData = validation.cleanData;
    next();
}

/**
 * Middleware de validación para parámetros de paginación
 */
export function validatePaginationMiddleware(req, res, next) {
    const validation = validatePaginationParams(req.query);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Parámetros de consulta inválidos',
            errors: validation.errors
        });
    }
    
    // Agregar parámetros limpios al request
    req.validatedParams = validation.cleanParams;
    next();
}

/**
 * Middleware de validación para editar DNI
 */
export function validateEditarDNIMiddleware(req, res, next) {
    const validation = validateEditarDNI(req.params, req.body);
    
    if (!validation.isValid) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: validation.errors
        });
    }
    
    // Agregar datos limpios al request
    req.validatedData = validation.cleanData;
    next();
}