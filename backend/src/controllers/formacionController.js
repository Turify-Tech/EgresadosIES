import database from "../config/database.js";
import { getPerfilIdByUserId } from "./perfilController.js";

/**
 * Controlador para gestión de formación académica
 * Sistema de Gestión de Egresados IES
 */

/**
 * Agrega una nueva formación académica al perfil del usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function addFormacionAcademica(req, res) {
    try {
        const usuarioId = req.user.id;
        const { titulo, institucion, anioFinalizacion } = req.body;

        // Validaciones básicas
        if (!titulo || !institucion) {
            return res.status(400).json({
                success: false,
                error: "Título e institución son campos requeridos",
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

        // Validar año de finalización si se proporciona
        if (anioFinalizacion) {
            const anio = parseInt(anioFinalizacion);
            const currentYear = new Date().getFullYear();
            
            if (isNaN(anio) || anio < 1950 || anio > currentYear + 5) {
                return res.status(400).json({
                    success: false,
                    error: `El año de finalización debe estar entre 1950 y ${currentYear + 5}`,
                });
            }
        }

        // Insertar nueva formación académica
        const insertQuery = `
            INSERT INTO FormacionAcademica (titulo, institucion, anioFinalizacion, perfilId)
            VALUES (?, ?, ?, ?)
        `;

        const result = await client.execute({
            sql: insertQuery,
            args: [
                titulo.trim(),
                institucion.trim(),
                anioFinalizacion ? parseInt(anioFinalizacion) : null,
                perfilId,
            ],
        });

        // Obtener la formación recién creada
        const formacionQuery = `
            SELECT id, titulo, institucion, anioFinalizacion
            FROM FormacionAcademica
            WHERE id = ?
        `;

        const formacionResult = await client.execute({
            sql: formacionQuery,
            args: [result.lastInsertRowid],
        });

        console.info(`[FORMACION] Usuario ${usuarioId} agregó formación académica - ID: ${result.lastInsertRowid}`);

        return res.status(201).json({
            success: true,
            data: {
                message: "Formación académica agregada exitosamente",
                formacion: formacionResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error agregando formación académica:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Actualiza una formación académica existente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function updateFormacionAcademica(req, res) {
    try {
        const usuarioId = req.user.id;
        const formacionId = parseInt(req.params.id);
        const { titulo, institucion, anioFinalizacion } = req.body;

        // Validaciones básicas
        if (!formacionId || isNaN(formacionId)) {
            return res.status(400).json({
                success: false,
                error: "ID de formación inválido",
            });
        }

        if (!titulo || !institucion) {
            return res.status(400).json({
                success: false,
                error: "Título e institución son campos requeridos",
            });
        }

        const client = database.getClient();

        // Verificar que la formación existe y pertenece al usuario
        const verificarQuery = `
            SELECT fa.id, fa.perfilId
            FROM FormacionAcademica fa
            INNER JOIN Egresado e ON fa.perfilId = e.perfilId
            WHERE fa.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [formacionId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Formación académica no encontrada o no tiene permisos para editarla",
            });
        }

        // Validar año de finalización si se proporciona
        if (anioFinalizacion) {
            const anio = parseInt(anioFinalizacion);
            const currentYear = new Date().getFullYear();
            
            if (isNaN(anio) || anio < 1950 || anio > currentYear + 5) {
                return res.status(400).json({
                    success: false,
                    error: `El año de finalización debe estar entre 1950 y ${currentYear + 5}`,
                });
            }
        }

        // Actualizar formación académica
        const updateQuery = `
            UPDATE FormacionAcademica
            SET titulo = ?, institucion = ?, anioFinalizacion = ?
            WHERE id = ?
        `;

        await client.execute({
            sql: updateQuery,
            args: [
                titulo.trim(),
                institucion.trim(),
                anioFinalizacion ? parseInt(anioFinalizacion) : null,
                formacionId,
            ],
        });

        // Obtener la formación actualizada
        const formacionQuery = `
            SELECT id, titulo, institucion, anioFinalizacion
            FROM FormacionAcademica
            WHERE id = ?
        `;

        const formacionResult = await client.execute({
            sql: formacionQuery,
            args: [formacionId],
        });

        console.info(`[FORMACION] Usuario ${usuarioId} actualizó formación académica - ID: ${formacionId}`);

        return res.status(200).json({
            success: true,
            data: {
                message: "Formación académica actualizada exitosamente",
                formacion: formacionResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error actualizando formación académica:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Elimina una formación académica
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function deleteFormacionAcademica(req, res) {
    try {
        const usuarioId = req.user.id;
        const formacionId = parseInt(req.params.id);

        // Validación básica
        if (!formacionId || isNaN(formacionId)) {
            return res.status(400).json({
                success: false,
                error: "ID de formación inválido",
            });
        }

        const client = database.getClient();

        // Verificar que la formación existe y pertenece al usuario
        const verificarQuery = `
            SELECT fa.id, fa.titulo, fa.institucion
            FROM FormacionAcademica fa
            INNER JOIN Egresado e ON fa.perfilId = e.perfilId
            WHERE fa.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [formacionId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Formación académica no encontrada o no tiene permisos para eliminarla",
            });
        }

        const formacion = verificarResult.rows[0];

        // Eliminar formación académica
        await client.execute({
            sql: "DELETE FROM FormacionAcademica WHERE id = ?",
            args: [formacionId],
        });

        console.info(`[FORMACION] Usuario ${usuarioId} eliminó formación académica - ID: ${formacionId} (${formacion.titulo} en ${formacion.institucion})`);

        return res.status(200).json({
            success: true,
            data: {
                message: "Formación académica eliminada exitosamente",
                formacionEliminada: {
                    id: formacionId,
                    titulo: formacion.titulo,
                    institucion: formacion.institucion,
                },
            },
        });
    } catch (error) {
        console.error("Error eliminando formación académica:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

export default {
    addFormacionAcademica,
    updateFormacionAcademica,
    deleteFormacionAcademica,
};