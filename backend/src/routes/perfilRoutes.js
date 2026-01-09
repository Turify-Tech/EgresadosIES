import express from "express";
import {
    authenticateToken,
    requireUserType,
    userRateLimit,
} from "../middleware/auth.js";
import {
    validatePerfil,
    validateExperienciaLaboral,
    validateFormacionAcademica,
    validateCurso,
    validateHabilidad,
    validateProyecto,
    validateIdParam,
    sanitizeStrings,
    logValidation,
} from "../validators/perfilValidators.js";

// Importar controladores
import {
    getMiPerfil,
    updateMiPerfil,
} from "../controllers/perfilController.js";
import {
    addExperienciaLaboral,
    updateExperienciaLaboral,
    deleteExperienciaLaboral,
} from "../controllers/experienciaController.js";
import {
    addFormacionAcademica,
    updateFormacionAcademica,
    deleteFormacionAcademica,
} from "../controllers/formacionController.js";
import {
    addCurso,
    updateCurso,
    deleteCurso,
} from "../controllers/cursosController.js";
import {
    addHabilidad,
    updateHabilidad,
    deleteHabilidad,
} from "../controllers/habilidadesController.js";
import {
    addProyecto,
    updateProyecto,
    deleteProyecto,
} from "../controllers/proyectosController.js";
import { downloadMiCV } from "../controllers/cvController.js";
import {
    uploadFotoPerfil,
    subirFotoPerfil,
} from "../controllers/uploadController.js";

const router = express.Router();

// Middleware global para todas las rutas del perfil
router.use(authenticateToken); // Todas las rutas requieren autenticación
router.use(requireUserType("Egresado")); // Solo egresados pueden gestionar perfiles
router.use(userRateLimit(50, 15 * 60 * 1000)); // 50 requests por usuario cada 15 minutos
router.use(sanitizeStrings); // Sanitizar strings automáticamente

// ===============================================
// RUTAS DEL PERFIL PRINCIPAL
// ===============================================

/**
 * @route   GET /api/perfil/mi-perfil
 * @desc    Obtiene el perfil completo del usuario logueado
 * @access  Private (Egresado)
 */
router.get("/mi-perfil", logValidation("Obtener mi perfil"), getMiPerfil);

/**
 * @route   PUT /api/perfil/mi-perfil
 * @desc    Actualiza el perfil del usuario logueado
 * @access  Private (Egresado)
 * @body    { resumenProfesional?, urlPortfolio?, situacionLaboral?, urlFotoPerfil?, urlBanner? }
 */
router.put(
    "/mi-perfil",
    logValidation("Actualizar mi perfil"),
    validatePerfil,
    updateMiPerfil
);

/**
 * @route   POST /api/perfil/subir-foto
 * @desc    Sube una foto de perfil
 * @access  Private (Egresado)
 */
router.post(
    "/subir-foto",
    uploadFotoPerfil.single("foto"),
    subirFotoPerfil
);

/**
 * @route   GET /api/perfil/mi-cv
 * @desc    Descarga el CV del usuario logueado en formato PDF
 * @access  Private (Egresado)
 */
router.get("/mi-cv", logValidation("Descargar mi CV"), downloadMiCV);

// ===============================================
// RUTAS DE EXPERIENCIA LABORAL
// ===============================================

/**
 * @route   POST /api/perfil/experiencia
 * @desc    Agrega una nueva experiencia laboral
 * @access  Private (Egresado)
 * @body    { puesto, empresa, fechaInicio?, fechaFin?, descripcion? }
 */
router.post(
    "/experiencia",
    logValidation("Agregar experiencia laboral"),
    validateExperienciaLaboral,
    addExperienciaLaboral
);

/**
 * @route   PUT /api/perfil/experiencia/:id
 * @desc    Actualiza una experiencia laboral existente
 * @access  Private (Egresado - solo propias)
 * @body    { puesto, empresa, fechaInicio?, fechaFin?, descripcion? }
 */
router.put(
    "/experiencia/:id",
    validateIdParam("id"),
    logValidation("Actualizar experiencia laboral"),
    validateExperienciaLaboral,
    updateExperienciaLaboral
);

/**
 * @route   DELETE /api/perfil/experiencia/:id
 * @desc    Elimina una experiencia laboral
 * @access  Private (Egresado - solo propias)
 */
router.delete(
    "/experiencia/:id",
    validateIdParam("id"),
    logValidation("Eliminar experiencia laboral"),
    deleteExperienciaLaboral
);

// ===============================================
// RUTAS DE FORMACIÓN ACADÉMICA
// ===============================================

/**
 * @route   POST /api/perfil/formacion
 * @desc    Agrega una nueva formación académica
 * @access  Private (Egresado)
 * @body    { titulo, institucion, anioFinalizacion? }
 */
router.post(
    "/formacion",
    logValidation("Agregar formación académica"),
    validateFormacionAcademica,
    addFormacionAcademica
);

/**
 * @route   PUT /api/perfil/formacion/:id
 * @desc    Actualiza una formación académica existente
 * @access  Private (Egresado - solo propias)
 * @body    { titulo, institucion, anioFinalizacion? }
 */
router.put(
    "/formacion/:id",
    validateIdParam("id"),
    logValidation("Actualizar formación académica"),
    validateFormacionAcademica,
    updateFormacionAcademica
);

/**
 * @route   DELETE /api/perfil/formacion/:id
 * @desc    Elimina una formación académica
 * @access  Private (Egresado - solo propias)
 */
router.delete(
    "/formacion/:id",
    validateIdParam("id"),
    logValidation("Eliminar formación académica"),
    deleteFormacionAcademica
);

// ===============================================
// RUTAS DE CURSOS
// ===============================================

/**
 * @route   POST /api/perfil/curso
 * @desc    Agrega un nuevo curso
 * @access  Private (Egresado)
 * @body    { nombre, institucion, horasDuracion? }
 */
router.post("/curso", logValidation("Agregar curso"), validateCurso, addCurso);

/**
 * @route   PUT /api/perfil/curso/:id
 * @desc    Actualiza un curso existente
 * @access  Private (Egresado - solo propios)
 * @body    { nombre, institucion, horasDuracion? }
 */
router.put(
    "/curso/:id",
    validateIdParam("id"),
    logValidation("Actualizar curso"),
    validateCurso,
    updateCurso
);

/**
 * @route   DELETE /api/perfil/curso/:id
 * @desc    Elimina un curso
 * @access  Private (Egresado - solo propios)
 */
router.delete(
    "/curso/:id",
    validateIdParam("id"),
    logValidation("Eliminar curso"),
    deleteCurso
);

// ===============================================
// RUTAS DE HABILIDADES
// ===============================================

/**
 * @route   POST /api/perfil/habilidad
 * @desc    Agrega una nueva habilidad
 * @access  Private (Egresado)
 * @body    { nombre, tipo?, nivel? }
 */
router.post(
    "/habilidad",
    logValidation("Agregar habilidad"),
    validateHabilidad,
    addHabilidad
);

/**
 * @route   PUT /api/perfil/habilidad/:id
 * @desc    Actualiza una habilidad existente
 * @access  Private (Egresado - solo propias)
 * @body    { nombre?, tipo?, nivel? }
 */
router.put(
    "/habilidad/:id",
    validateIdParam("id"),
    logValidation("Actualizar habilidad"),
    validateHabilidad,
    updateHabilidad
);

/**
 * @route   DELETE /api/perfil/habilidad/:id
 * @desc    Elimina una habilidad
 * @access  Private (Egresado - solo propias)
 */
router.delete(
    "/habilidad/:id",
    validateIdParam("id"),
    logValidation("Eliminar habilidad"),
    deleteHabilidad
);

// ===============================================
// RUTAS DE PROYECTOS
// ===============================================

/**
 * @route   POST /api/perfil/proyecto
 * @desc    Agrega un nuevo proyecto
 * @access  Private (Egresado)
 * @body    { nombre, descripcion?, enlace?, tecnologias?, fechaProyecto?, imagen? }
 */
router.post(
    "/proyecto",
    logValidation("Agregar proyecto"),
    validateProyecto,
    addProyecto
);

/**
 * @route   PUT /api/perfil/proyecto/:id
 * @desc    Actualiza un proyecto existente
 * @access  Private (Egresado - solo propios)
 * @body    { nombre?, descripcion?, enlace?, tecnologias?, fechaProyecto?, imagen? }
 */
router.put(
    "/proyecto/:id",
    validateIdParam("id"),
    logValidation("Actualizar proyecto"),
    validateProyecto,
    updateProyecto
);

/**
 * @route   DELETE /api/perfil/proyecto/:id
 * @desc    Elimina un proyecto
 * @access  Private (Egresado - solo propios)
 */
router.delete(
    "/proyecto/:id",
    validateIdParam("id"),
    logValidation("Eliminar proyecto"),
    deleteProyecto
);

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES ESPECÍFICO
// ===============================================

// Manejador de errores específico para las rutas de perfil
router.use((err, req, res, next) => {
    console.error(
        `[PERFIL_ERROR] Usuario: ${req.user?.id || "unknown"}, Ruta: ${
            req.path
        }, Error:`,
        err
    );

    // Error de validación de Joi o similar
    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            error: "Error de validación",
            details: err.details || err.message,
        });
    }

    // Error de base de datos
    if (err.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({
            success: false,
            error: "Conflicto con los datos existentes",
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        error:
            process.env.NODE_ENV === "production"
                ? "Error interno del servidor"
                : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
});

export default router;
