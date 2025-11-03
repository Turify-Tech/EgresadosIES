/**
 * Controlador para gestión de habilidades en el perfil
 * Sistema de Gestión de Egresados IES
 */

import database from "../config/database.js";

/**
 * Agregar una nueva habilidad al perfil
 * @param {Request} req - Solicitud HTTP con { nombre, tipo?, nivel? }
 * @param {Response} res - Respuesta HTTP
 */
export const addHabilidad = async (req, res) => {
    try {
        await database.connect();
        const { nombre, tipo = "tecnica", nivel = "intermedio" } = req.body;
        const userId = req.user.id;

        console.log("🆕 Agregando habilidad:", { userId, nombre, tipo, nivel });

        // Validar que no exista ya la habilidad
        const existingHabilidad = await database.client.execute({
            sql: `SELECT id FROM Habilidades 
                  WHERE usuarioId = ? AND LOWER(nombre) = LOWER(?)`,
            args: [userId, nombre],
        });

        if (existingHabilidad.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: "Esta habilidad ya existe en tu perfil",
            });
        }

        // Insertar nueva habilidad
        const result = await database.client.execute({
            sql: `INSERT INTO Habilidades (usuarioId, nombre, tipo, nivel) 
                  VALUES (?, ?, ?, ?)`,
            args: [userId, nombre, tipo, nivel],
        });

        if (result.rowsAffected === 0) {
            throw new Error("No se pudo agregar la habilidad");
        }

        console.log(
            "✅ Habilidad agregada exitosamente:",
            result.lastInsertRowid
        );

        // Convertir BigInt a número para evitar error de serialización JSON
        const habilidadId = Number(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "Habilidad agregada exitosamente",
            data: {
                id: habilidadId,
                nombre,
                tipo,
                nivel,
            },
        });
    } catch (error) {
        console.error("❌ Error agregando habilidad:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            details:
                process.env.NODE_ENV !== "production"
                    ? error.message
                    : undefined,
        });
    }
};

/**
 * Actualizar una habilidad existente
 * @param {Request} req - Solicitud HTTP con { nombre?, tipo?, nivel? }
 * @param {Response} res - Respuesta HTTP
 */
export const updateHabilidad = async (req, res) => {
    try {
        await database.connect();
        const { id } = req.params;
        const { nombre, tipo, nivel } = req.body;
        const userId = req.user.id;

        console.log("📝 Actualizando habilidad:", {
            id,
            userId,
            nombre,
            tipo,
            nivel,
        });

        // Verificar que la habilidad existe y pertenece al usuario
        const habilidad = await database.client.execute({
            sql: `SELECT * FROM Habilidades 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (habilidad.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Habilidad no encontrada",
            });
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (nombre !== undefined) {
            updates.push("nombre = ?");
            values.push(nombre);
        }
        if (tipo !== undefined) {
            updates.push("tipo = ?");
            values.push(tipo);
        }
        if (nivel !== undefined) {
            updates.push("nivel = ?");
            values.push(nivel);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No se proporcionaron campos para actualizar",
            });
        }

        values.push(id, userId);

        const result = await database.client.execute({
            sql: `UPDATE Habilidades 
                  SET ${updates.join(
                      ", "
                  )}, fechaActualizacion = CURRENT_TIMESTAMP
                  WHERE id = ? AND usuarioId = ?`,
            args: values,
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                error: "Habilidad no encontrada o sin cambios",
            });
        }

        console.log("✅ Habilidad actualizada exitosamente");

        res.json({
            success: true,
            message: "Habilidad actualizada exitosamente",
        });
    } catch (error) {
        console.error("❌ Error actualizando habilidad:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            details:
                process.env.NODE_ENV !== "production"
                    ? error.message
                    : undefined,
        });
    }
};

/**
 * Eliminar una habilidad
 * @param {Request} req - Solicitud HTTP con parámetro id
 * @param {Response} res - Respuesta HTTP
 */
export const deleteHabilidad = async (req, res) => {
    try {
        await database.connect();
        const { id } = req.params;
        const userId = req.user.id;

        console.log("🗑️ Eliminando habilidad:", { id, userId });

        // Verificar que la habilidad existe y pertenece al usuario
        const habilidad = await database.client.execute({
            sql: `SELECT * FROM Habilidades 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (habilidad.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Habilidad no encontrada",
            });
        }

        // Eliminar la habilidad
        const result = await database.client.execute({
            sql: `DELETE FROM Habilidades 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                error: "Habilidad no encontrada",
            });
        }

        console.log("✅ Habilidad eliminada exitosamente");

        res.json({
            success: true,
            message: "Habilidad eliminada exitosamente",
        });
    } catch (error) {
        console.error("❌ Error eliminando habilidad:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor",
            details:
                process.env.NODE_ENV !== "production"
                    ? error.message
                    : undefined,
        });
    }
};
