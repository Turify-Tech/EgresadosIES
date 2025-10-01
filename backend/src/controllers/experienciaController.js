import database from "../config/database.js";
import { getPerfilIdByUserId } from "./perfilController.js";

/**
 * Controlador para gestión de experiencias laborales
 * Sistema de Gestión de Egresados IES
 */

/**
 * Agrega una nueva experiencia laboral al perfil del usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function addExperienciaLaboral(req, res) {
    try {
        const usuarioId = req.user.id;
        const { puesto, empresa, fechaInicio, fechaFin, descripcion } = req.body;

        // Validaciones básicas
        if (!puesto || !empresa) {
            return res.status(400).json({
                success: false,
                error: "Puesto y empresa son campos requeridos",
            });
        }

        const client = database.getClient();

        // Obtener el perfil ID del usuario
        const perfilId = await getPerfilIdByUserId(client, usuarioId);
        if (!perfilId) {
            return res.status(404).json({
                success: false,
                error: "Perfil no encontrado. Debe completar su perfil primero",
            });
        }

        // Validar fechas si se proporcionan
        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            if (fin <= inicio) {
                return res.status(400).json({
                    success: false,
                    error: "La fecha de fin debe ser posterior a la fecha de inicio",
                });
            }
        }

        // Insertar nueva experiencia laboral
        const insertQuery = `
            INSERT INTO ExperienciaLaboral (puesto, empresa, fechaInicio, fechaFin, descripcion, perfilId)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await client.execute({
            sql: insertQuery,
            args: [
                puesto.trim(),
                empresa.trim(),
                fechaInicio || null,
                fechaFin || null,
                descripcion ? descripcion.trim() : null,
                perfilId,
            ],
        });

        // Obtener la experiencia recién creada
        const experienciaQuery = `
            SELECT id, puesto, empresa, fechaInicio, fechaFin, descripcion
            FROM ExperienciaLaboral
            WHERE id = ?
        `;

        const experienciaResult = await client.execute({
            sql: experienciaQuery,
            args: [result.lastInsertRowid],
        });

        console.info(`[EXPERIENCIA] Usuario ${usuarioId} agregó experiencia laboral - ID: ${result.lastInsertRowid}`);

        return res.status(201).json({
            success: true,
            data: {
                message: "Experiencia laboral agregada exitosamente",
                experiencia: experienciaResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error agregando experiencia laboral:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Actualiza una experiencia laboral existente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function updateExperienciaLaboral(req, res) {
    try {
        const usuarioId = req.user.id;
        const experienciaId = parseInt(req.params.id);
        const { puesto, empresa, fechaInicio, fechaFin, descripcion } = req.body;

        // Validaciones básicas
        if (!experienciaId || isNaN(experienciaId)) {
            return res.status(400).json({
                success: false,
                error: "ID de experiencia inválido",
            });
        }

        if (!puesto || !empresa) {
            return res.status(400).json({
                success: false,
                error: "Puesto y empresa son campos requeridos",
            });
        }

        const client = database.getClient();

        // Verificar que la experiencia existe y pertenece al usuario
        const verificarQuery = `
            SELECT el.id, el.perfilId
            FROM ExperienciaLaboral el
            INNER JOIN Egresado e ON el.perfilId = e.perfilId
            WHERE el.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [experienciaId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Experiencia laboral no encontrada o no tiene permisos para editarla",
            });
        }

        // Validar fechas si se proporcionan
        if (fechaInicio && fechaFin) {
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            
            if (fin <= inicio) {
                return res.status(400).json({
                    success: false,
                    error: "La fecha de fin debe ser posterior a la fecha de inicio",
                });
            }
        }

        // Actualizar experiencia laboral
        const updateQuery = `
            UPDATE ExperienciaLaboral
            SET puesto = ?, empresa = ?, fechaInicio = ?, fechaFin = ?, descripcion = ?
            WHERE id = ?
        `;

        await client.execute({
            sql: updateQuery,
            args: [
                puesto.trim(),
                empresa.trim(),
                fechaInicio || null,
                fechaFin || null,
                descripcion ? descripcion.trim() : null,
                experienciaId,
            ],
        });

        // Obtener la experiencia actualizada
        const experienciaQuery = `
            SELECT id, puesto, empresa, fechaInicio, fechaFin, descripcion
            FROM ExperienciaLaboral
            WHERE id = ?
        `;

        const experienciaResult = await client.execute({
            sql: experienciaQuery,
            args: [experienciaId],
        });

        console.info(`[EXPERIENCIA] Usuario ${usuarioId} actualizó experiencia laboral - ID: ${experienciaId}`);

        return res.status(200).json({
            success: true,
            data: {
                message: "Experiencia laboral actualizada exitosamente",
                experiencia: experienciaResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error actualizando experiencia laboral:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Elimina una experiencia laboral
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function deleteExperienciaLaboral(req, res) {
    try {
        const usuarioId = req.user.id;
        const experienciaId = parseInt(req.params.id);

        // Validación básica
        if (!experienciaId || isNaN(experienciaId)) {
            return res.status(400).json({
                success: false,
                error: "ID de experiencia inválido",
            });
        }

        const client = database.getClient();

        // Verificar que la experiencia existe y pertenece al usuario
        const verificarQuery = `
            SELECT el.id, el.puesto, el.empresa
            FROM ExperienciaLaboral el
            INNER JOIN Egresado e ON el.perfilId = e.perfilId
            WHERE el.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [experienciaId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Experiencia laboral no encontrada o no tiene permisos para eliminarla",
            });
        }

        const experiencia = verificarResult.rows[0];

        // Eliminar experiencia laboral
        await client.execute({
            sql: "DELETE FROM ExperienciaLaboral WHERE id = ?",
            args: [experienciaId],
        });

        console.info(`[EXPERIENCIA] Usuario ${usuarioId} eliminó experiencia laboral - ID: ${experienciaId} (${experiencia.puesto} en ${experiencia.empresa})`);

        return res.status(200).json({
            success: true,
            data: {
                message: "Experiencia laboral eliminada exitosamente",
                experienciaEliminada: {
                    id: experienciaId,
                    puesto: experiencia.puesto,
                    empresa: experiencia.empresa,
                },
            },
        });
    } catch (error) {
        console.error("Error eliminando experiencia laboral:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

export default {
    addExperienciaLaboral,
    updateExperienciaLaboral,
    deleteExperienciaLaboral,
};