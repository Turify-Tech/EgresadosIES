import database from "../config/database.js";

/**
 * Controlador principal para gestión de perfiles
 * Sistema de Gestión de Egresados IES
 */

/**
 * Obtiene el perfil completo del usuario logueado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getMiPerfil(req, res) {
    try {
        const usuarioId = req.user.id;
        const client = database.getClient();

        // Buscar perfil del usuario con todos los datos relacionados
        const perfilQuery = `
            SELECT 
                u.id as userId,
                u.nombre,
                u.email,
                e.dni,
                e.telefono,
                p.id as perfilId,
                p.resumenProfesional,
                p.urlPortfolio,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.urlBanner,
                c.id as carreraId,
                c.nombre as carreraNombre
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            WHERE u.id = ?
        `;

        const perfilResult = await client.execute({
            sql: perfilQuery,
            args: [usuarioId],
        });

        if (perfilResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Perfil no encontrado",
            });
        }

        const perfil = perfilResult.rows[0];

        // Si no tiene perfil asociado, crear uno vacío
        let perfilId = perfil.perfilId;
        if (!perfilId) {
            const createPerfilQuery = `
                INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral, urlFotoPerfil, urlBanner)
                VALUES (?, ?, ?, ?, ?)
            `;

            const createResult = await client.execute({
                sql: createPerfilQuery,
                args: [null, null, null, null, null],
            });

            perfilId = Number(createResult.lastInsertRowid);

            // Asociar el perfil al egresado
            await client.execute({
                sql: "UPDATE Egresado SET perfilId = ? WHERE id = ?",
                args: [perfilId, usuarioId],
            });
        }

        // Obtener experiencias laborales
        const experienciasQuery = `
            SELECT id, puesto, empresa, fechaInicio, fechaFin, descripcion
            FROM ExperienciaLaboral
            WHERE perfilId = ?
            ORDER BY fechaInicio DESC
        `;

        const experienciasResult = await client.execute({
            sql: experienciasQuery,
            args: [perfilId],
        });

        // Obtener formación académica
        const formacionQuery = `
            SELECT id, titulo, institucion, anioFinalizacion
            FROM FormacionAcademica
            WHERE perfilId = ?
            ORDER BY anioFinalizacion DESC
        `;

        const formacionResult = await client.execute({
            sql: formacionQuery,
            args: [perfilId],
        });

        // Obtener cursos
        const cursosQuery = `
            SELECT id, nombre, institucion, horasDuracion
            FROM Curso
            WHERE perfilId = ?
            ORDER BY id DESC
        `;

        const cursosResult = await client.execute({
            sql: cursosQuery,
            args: [perfilId],
        });

        // Construir respuesta completa
        const perfilCompleto = {
            usuario: {
                id: perfil.userId,
                nombre: perfil.nombre,
                email: perfil.email,
                dni: perfil.dni,
                telefono: perfil.telefono,
            },
            carrera: perfil.carreraId
                ? {
                      id: perfil.carreraId,
                      nombre: perfil.carreraNombre,
                  }
                : null,
            perfil: {
                id: perfilId,
                resumenProfesional: perfil.resumenProfesional,
                urlPortfolio: perfil.urlPortfolio,
                situacionLaboral: perfil.situacionLaboral,
                urlFotoPerfil: perfil.urlFotoPerfil,
                urlBanner: perfil.urlBanner,
            },
            experienciasLaborales: experienciasResult.rows,
            formacionAcademica: formacionResult.rows,
            cursos: cursosResult.rows,
        };

        return res.status(200).json({
            success: true,
            data: perfilCompleto,
        });
    } catch (error) {
        console.error("Error obteniendo perfil:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Actualiza el perfil del usuario logueado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function updateMiPerfil(req, res) {
    try {
        const usuarioId = req.user.id;
        const {
            resumenProfesional,
            urlPortfolio,
            situacionLaboral,
            urlFotoPerfil,
            urlBanner,
        } = req.body;

        const client = database.getClient();

        // Obtener el perfil ID del usuario
        const perfilIdQuery = `
            SELECT e.perfilId 
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            WHERE u.id = ?
        `;

        const perfilIdResult = await client.execute({
            sql: perfilIdQuery,
            args: [usuarioId],
        });

        if (perfilIdResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Usuario no encontrado",
            });
        }

        let perfilId = perfilIdResult.rows[0].perfilId;

        // Si no tiene perfil, crear uno nuevo
        if (!perfilId) {
            const createPerfilQuery = `
                INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral, urlFotoPerfil, urlBanner)
                VALUES (?, ?, ?, ?, ?)
            `;

            const createResult = await client.execute({
                sql: createPerfilQuery,
                args: [
                    resumenProfesional || null,
                    urlPortfolio || null,
                    situacionLaboral || null,
                    urlFotoPerfil || null,
                    urlBanner || null,
                ],
            });

            perfilId = Number(createResult.lastInsertRowid);

            // Asociar el perfil al egresado
            await client.execute({
                sql: "UPDATE Egresado SET perfilId = ? WHERE id = ?",
                args: [perfilId, usuarioId],
            });
        } else {
            // Actualizar perfil existente
            const updatePerfilQuery = `
                UPDATE Perfil 
                SET resumenProfesional = ?, urlPortfolio = ?, situacionLaboral = ?, 
                    urlFotoPerfil = ?, urlBanner = ?
                WHERE id = ?
            `;

            await client.execute({
                sql: updatePerfilQuery,
                args: [
                    resumenProfesional || null,
                    urlPortfolio || null,
                    situacionLaboral || null,
                    urlFotoPerfil || null,
                    urlBanner || null,
                    perfilId,
                ],
            });
        }

        // Obtener el perfil actualizado
        const perfilActualizadoQuery = `
            SELECT id, resumenProfesional, urlPortfolio, situacionLaboral, urlFotoPerfil, urlBanner
            FROM Perfil
            WHERE id = ?
        `;

        const perfilActualizadoResult = await client.execute({
            sql: perfilActualizadoQuery,
            args: [perfilId],
        });

        console.info(
            `[PERFIL] Usuario ${usuarioId} actualizó su perfil - ID: ${perfilId}`
        );

        return res.status(200).json({
            success: true,
            data: {
                message: "Perfil actualizado exitosamente",
                perfil: perfilActualizadoResult.rows[0],
            },
        });
    } catch (error) {
        console.error("Error actualizando perfil:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Función auxiliar para obtener el perfil ID de un usuario
 * @param {Object} client - Cliente de base de datos
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number|null>} ID del perfil o null si no existe
 */
export async function getPerfilIdByUserId(client, usuarioId) {
    try {
        const result = await client.execute({
            sql: "SELECT e.perfilId FROM Egresado e WHERE e.id = ?",
            args: [usuarioId],
        });

        return result.rows.length > 0 ? result.rows[0].perfilId : null;
    } catch (error) {
        console.error("Error obteniendo perfil ID:", error);
        return null;
    }
}

/**
 * Función auxiliar para verificar si un usuario es propietario de un perfil
 * @param {Object} client - Cliente de base de datos
 * @param {number} usuarioId - ID del usuario
 * @param {number} perfilId - ID del perfil
 * @returns {Promise<boolean>} true si es propietario
 */
export async function isOwnerOfPerfil(client, usuarioId, perfilId) {
    try {
        const result = await client.execute({
            sql: "SELECT 1 FROM Egresado e WHERE e.id = ? AND e.perfilId = ?",
            args: [usuarioId, perfilId],
        });

        return result.rows.length > 0;
    } catch (error) {
        console.error("Error verificando propiedad del perfil:", error);
        return false;
    }
}

export default {
    getMiPerfil,
    updateMiPerfil,
    getPerfilIdByUserId,
    isOwnerOfPerfil,
};
