/**
 * Controlador para gestión de proyectos en el perfil
 * Sistema de Gestión de Egresados IES
 */

import database from "../config/database.js";

/**
 * Agregar un nuevo proyecto al perfil
 * @param {Request} req - Solicitud HTTP con { nombre, descripcion?, enlace?, tecnologias?, fechaProyecto?, imagen? }
 * @param {Response} res - Respuesta HTTP
 */
export const addProyecto = async (req, res) => {
    try {
        await database.connect();

        console.log(
            "📥 Datos completos recibidos en req.body:",
            JSON.stringify(req.body, null, 2)
        );

        const {
            nombre,
            descripcion,
            enlace,
            tecnologias,
            fechaProyecto,
            imagen,
        } = req.body;
        const userId = req.user.id;

        console.log("🆕 Agregando proyecto:", {
            userId,
            nombre,
            descripcion,
            enlace,
        });

        // Insertar nuevo proyecto
        const result = await database.client.execute({
            sql: `INSERT INTO Proyectos (
                    usuarioId, nombre, descripcion, enlace, tecnologias, fechaProyecto, imagen
                  ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
                userId,
                nombre,
                descripcion || null,
                enlace || null,
                tecnologias || null,
                fechaProyecto || null,
                imagen || null,
            ],
        });

        if (result.rowsAffected === 0) {
            throw new Error("No se pudo agregar el proyecto");
        }

        console.log(
            "✅ Proyecto agregado exitosamente:",
            result.lastInsertRowid
        );

        // Convertir BigInt a número para evitar error de serialización JSON
        const projectId = Number(result.lastInsertRowid);

        res.status(201).json({
            success: true,
            message: "Proyecto agregado exitosamente",
            data: {
                id: projectId,
                nombre,
                descripcion,
                enlace,
                tecnologias,
                fechaProyecto,
                imagen,
            },
        });
    } catch (error) {
        console.error("❌ Error agregando proyecto:", error);
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
 * Actualizar un proyecto existente
 * @param {Request} req - Solicitud HTTP con { nombre?, descripcion?, enlace?, tecnologias?, fechaProyecto?, imagen? }
 * @param {Response} res - Respuesta HTTP
 */
export const updateProyecto = async (req, res) => {
    try {
        await database.connect();
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            enlace,
            tecnologias,
            fechaProyecto,
            imagen,
        } = req.body;
        const userId = req.user.id;

        console.log("📝 Actualizando proyecto:", { id, userId, nombre });

        // Verificar que el proyecto existe y pertenece al usuario
        const proyecto = await database.client.execute({
            sql: `SELECT * FROM Proyectos 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (proyecto.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proyecto no encontrado",
            });
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (nombre !== undefined) {
            updates.push("nombre = ?");
            values.push(nombre);
        }
        if (descripcion !== undefined) {
            updates.push("descripcion = ?");
            values.push(descripcion);
        }
        if (enlace !== undefined) {
            updates.push("enlace = ?");
            values.push(enlace);
        }
        if (tecnologias !== undefined) {
            updates.push("tecnologias = ?");
            values.push(tecnologias);
        }
        if (fechaProyecto !== undefined) {
            updates.push("fechaProyecto = ?");
            values.push(fechaProyecto);
        }
        if (imagen !== undefined) {
            updates.push("imagen = ?");
            values.push(imagen);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: "No se proporcionaron campos para actualizar",
            });
        }

        values.push(id, userId);

        const result = await database.client.execute({
            sql: `UPDATE Proyectos 
                  SET ${updates.join(
                      ", "
                  )}, fechaActualizacion = CURRENT_TIMESTAMP
                  WHERE id = ? AND usuarioId = ?`,
            args: values,
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                error: "Proyecto no encontrado o sin cambios",
            });
        }

        console.log("✅ Proyecto actualizado exitosamente");

        res.json({
            success: true,
            message: "Proyecto actualizado exitosamente",
        });
    } catch (error) {
        console.error("❌ Error actualizando proyecto:", error);
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
 * Eliminar un proyecto
 * @param {Request} req - Solicitud HTTP con parámetro id
 * @param {Response} res - Respuesta HTTP
 */
export const deleteProyecto = async (req, res) => {
    try {
        await database.connect();
        const { id } = req.params;
        const userId = req.user.id;

        console.log("🗑️ Eliminando proyecto:", { id, userId });

        // Verificar que el proyecto existe y pertenece al usuario
        const proyecto = await database.client.execute({
            sql: `SELECT * FROM Proyectos 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (proyecto.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Proyecto no encontrado",
            });
        }

        // Eliminar el proyecto
        const result = await database.client.execute({
            sql: `DELETE FROM Proyectos 
                  WHERE id = ? AND usuarioId = ?`,
            args: [id, userId],
        });

        if (result.rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                error: "Proyecto no encontrado",
            });
        }

        console.log("✅ Proyecto eliminado exitosamente");

        res.json({
            success: true,
            message: "Proyecto eliminado exitosamente",
        });
    } catch (error) {
        console.error("❌ Error eliminando proyecto:", error);
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
