import database from "../config/database.js";
import { getPerfilIdByUserId } from "./perfilController.js";

/**
 * Controlador para gestión de cursos
 * Sistema de Gestión de Egresados IES
 */

/**
 * Agrega un nuevo curso al perfil del usuario
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function addCurso(req, res) {
    try {
        const usuarioId = req.user.id;
        const { nombre, institucion, horasDuracion } = req.body;

        // Validaciones básicas
        if (!nombre || !institucion) {
            return res.status(400).json({
                success: false,
                error: "Nombre e institución son campos requeridos",
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

        // Validar horas de duración si se proporciona
        if (horasDuracion !== undefined && horasDuracion !== null) {
            const horas = parseInt(horasDuracion);

            if (isNaN(horas) || horas <= 0 || horas > 10000) {
                return res.status(400).json({
                    success: false,
                    error: "Las horas de duración deben ser un número positivo menor a 10,000",
                });
            }
        }

        // Insertar nuevo curso
        const insertQuery = `
            INSERT INTO Curso (nombre, institucion, horasDuracion, perfilId)
            VALUES (?, ?, ?, ?)
        `;

        const result = await client.execute({
            sql: insertQuery,
            args: [
                nombre.trim(),
                institucion.trim(),
                horasDuracion ? parseInt(horasDuracion) : null,
                perfilId,
            ],
        });

        // Obtener el curso recién creado
        const cursoQuery = `
            SELECT id, nombre, institucion, horasDuracion
            FROM Curso
            WHERE id = ?
        `;

        const cursoId = Number(result.lastInsertRowid);
        const cursoResult = await client.execute({
            sql: cursoQuery,
            args: [cursoId],
        });

        console.info(
            `[CURSO] Usuario ${usuarioId} agregó curso - ID: ${cursoId}`
        );

        return res.status(201).json({
            success: true,
            data: {
                message: "Curso agregado exitosamente",
                curso: cursoResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error agregando curso:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Actualiza un curso existente
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function updateCurso(req, res) {
    try {
        const usuarioId = req.user.id;
        const cursoId = parseInt(req.params.id);
        const { nombre, institucion, horasDuracion } = req.body;

        // Validaciones básicas
        if (!cursoId || isNaN(cursoId)) {
            return res.status(400).json({
                success: false,
                error: "ID de curso inválido",
            });
        }

        if (!nombre || !institucion) {
            return res.status(400).json({
                success: false,
                error: "Nombre e institución son campos requeridos",
            });
        }

        const client = database.getClient();

        // Verificar que el curso existe y pertenece al usuario
        const verificarQuery = `
            SELECT c.id, c.perfilId
            FROM Curso c
            INNER JOIN Egresado e ON c.perfilId = e.perfilId
            WHERE c.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [cursoId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Curso no encontrado o no tiene permisos para editarlo",
            });
        }

        // Validar horas de duración si se proporciona
        if (horasDuracion !== undefined && horasDuracion !== null) {
            const horas = parseInt(horasDuracion);

            if (isNaN(horas) || horas <= 0 || horas > 10000) {
                return res.status(400).json({
                    success: false,
                    error: "Las horas de duración deben ser un número positivo menor a 10,000",
                });
            }
        }

        // Actualizar curso
        const updateQuery = `
            UPDATE Curso
            SET nombre = ?, institucion = ?, horasDuracion = ?
            WHERE id = ?
        `;

        await client.execute({
            sql: updateQuery,
            args: [
                nombre.trim(),
                institucion.trim(),
                horasDuracion ? parseInt(horasDuracion) : null,
                cursoId,
            ],
        });

        // Obtener el curso actualizado
        const cursoQuery = `
            SELECT id, nombre, institucion, horasDuracion
            FROM Curso
            WHERE id = ?
        `;

        const cursoResult = await client.execute({
            sql: cursoQuery,
            args: [cursoId],
        });

        console.info(
            `[CURSO] Usuario ${usuarioId} actualizó curso - ID: ${cursoId}`
        );

        return res.status(200).json({
            success: true,
            data: {
                message: "Curso actualizado exitosamente",
                curso: cursoResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error actualizando curso:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Elimina un curso
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function deleteCurso(req, res) {
    try {
        const usuarioId = req.user.id;
        const cursoId = parseInt(req.params.id);

        // Validación básica
        if (!cursoId || isNaN(cursoId)) {
            return res.status(400).json({
                success: false,
                error: "ID de curso inválido",
            });
        }

        const client = database.getClient();

        // Verificar que el curso existe y pertenece al usuario
        const verificarQuery = `
            SELECT c.id, c.nombre, c.institucion
            FROM Curso c
            INNER JOIN Egresado e ON c.perfilId = e.perfilId
            WHERE c.id = ? AND e.id = ?
        `;

        const verificarResult = await client.execute({
            sql: verificarQuery,
            args: [cursoId, usuarioId],
        });

        if (verificarResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Curso no encontrado o no tiene permisos para eliminarlo",
            });
        }

        const curso = verificarResult.rows[0];

        // Eliminar curso
        await client.execute({
            sql: "DELETE FROM Curso WHERE id = ?",
            args: [cursoId],
        });

        console.info(
            `[CURSO] Usuario ${usuarioId} eliminó curso - ID: ${cursoId} (${curso.nombre} en ${curso.institucion})`
        );

        return res.status(200).json({
            success: true,
            data: {
                message: "Curso eliminado exitosamente",
                cursoEliminado: {
                    id: cursoId,
                    nombre: curso.nombre,
                    institucion: curso.institucion,
                },
            },
        });
    } catch (error) {
        console.error("Error eliminando curso:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

export default {
    addCurso,
    updateCurso,
    deleteCurso,
};
