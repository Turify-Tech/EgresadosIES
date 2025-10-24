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
                u.apellido,
                u.email,
                e.dni,
                e.telefono,
                p.id as perfilId,
                p.resumenProfesional,
                p.urlPortfolio,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.urlBanner,
                p.fechaNacimiento,
                p.direccion,
                p.ciudad,
                p.provincia,
                p.pais,
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
            // Campos de datos personales del formulario
            nombre,
            apellido,
            correo, // Se mapea a email
            contacto, // Se mapea a telefono
            dni,
            telefono,
            // Campos del perfil
            resumenProfesional,
            urlPortfolio,
            situacionLaboral,
            urlFotoPerfil,
            urlBanner,
            fechaNacimiento,
            direccion,
            ciudad,
            provincia,
            pais,
        } = req.body;

        const client = database.getClient();

        console.log("📝 Datos recibidos para actualizar perfil:", {
            nombre,
            apellido,
            correo,
            contacto,
            dni,
            resumenProfesional,
            situacionLaboral,
        });

        // Obtener información actual del usuario
        const usuarioQuery = `
            SELECT u.id, u.nombre, u.apellido, u.email, e.dni, e.telefono, e.perfilId
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            WHERE u.id = ?
        `;

        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [usuarioId],
        });

        if (usuarioResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Usuario no encontrado",
            });
        }

        const usuario = usuarioResult.rows[0];
        let perfilId = usuario.perfilId;

        // 1. Actualizar datos del Usuario (nombre, apellido, email)
        if (
            nombre !== undefined ||
            apellido !== undefined ||
            correo !== undefined
        ) {
            const updateUsuarioQuery = `
                UPDATE Usuario 
                SET nombre = COALESCE(?, nombre), 
                    apellido = COALESCE(?, apellido), 
                    email = COALESCE(?, email)
                WHERE id = ?
            `;

            await client.execute({
                sql: updateUsuarioQuery,
                args: [
                    nombre || null,
                    apellido || null,
                    correo || null, // correo del form → email en BD
                    usuarioId,
                ],
            });
        }

        // 2. Actualizar datos del Egresado (dni, telefono)
        if (
            dni !== undefined ||
            contacto !== undefined ||
            telefono !== undefined
        ) {
            const updateEgresadoQuery = `
                UPDATE Egresado 
                SET dni = COALESCE(?, dni), 
                    telefono = COALESCE(?, ?, telefono)
                WHERE id = ?
            `;

            await client.execute({
                sql: updateEgresadoQuery,
                args: [
                    dni || null,
                    contacto || null, // contacto del form → telefono en BD
                    telefono || null, // telefono adicional
                    usuarioId,
                ],
            });
        }

        // 3. Crear o actualizar Perfil
        if (!perfilId) {
            const createPerfilQuery = `
                INSERT INTO Perfil (
                    resumenProfesional, urlPortfolio, situacionLaboral, 
                    urlFotoPerfil, urlBanner, fechaNacimiento, direccion, 
                    ciudad, provincia, pais
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const createResult = await client.execute({
                sql: createPerfilQuery,
                args: [
                    resumenProfesional || null,
                    urlPortfolio || null,
                    situacionLaboral || null,
                    urlFotoPerfil || null,
                    urlBanner || null,
                    fechaNacimiento || null,
                    direccion || null,
                    ciudad || null,
                    provincia || null,
                    pais || "Argentina",
                ],
            });

            perfilId = Number(createResult.lastInsertRowid);

            // Asociar el perfil al egresado
            await client.execute({
                sql: "UPDATE Egresado SET perfilId = ? WHERE id = ?",
                args: [perfilId, usuarioId],
            });
        } else {
            // Actualizar perfil existente solo con los campos que se enviaron
            const updateFields = [];
            const updateValues = [];

            if (resumenProfesional !== undefined) {
                updateFields.push("resumenProfesional = ?");
                updateValues.push(resumenProfesional);
            }
            if (urlPortfolio !== undefined) {
                updateFields.push("urlPortfolio = ?");
                updateValues.push(urlPortfolio);
            }
            if (situacionLaboral !== undefined) {
                updateFields.push("situacionLaboral = ?");
                updateValues.push(situacionLaboral);
            }
            if (urlFotoPerfil !== undefined) {
                updateFields.push("urlFotoPerfil = ?");
                updateValues.push(urlFotoPerfil);
            }
            if (urlBanner !== undefined) {
                updateFields.push("urlBanner = ?");
                updateValues.push(urlBanner);
            }
            if (fechaNacimiento !== undefined) {
                updateFields.push("fechaNacimiento = ?");
                updateValues.push(fechaNacimiento);
            }
            if (direccion !== undefined) {
                updateFields.push("direccion = ?");
                updateValues.push(direccion);
            }
            if (ciudad !== undefined) {
                updateFields.push("ciudad = ?");
                updateValues.push(ciudad);
            }
            if (provincia !== undefined) {
                updateFields.push("provincia = ?");
                updateValues.push(provincia);
            }
            if (pais !== undefined) {
                updateFields.push("pais = ?");
                updateValues.push(pais);
            }

            if (updateFields.length > 0) {
                const updatePerfilQuery = `
                    UPDATE Perfil 
                    SET ${updateFields.join(", ")}
                    WHERE id = ?
                `;

                updateValues.push(perfilId);

                await client.execute({
                    sql: updatePerfilQuery,
                    args: updateValues,
                });
            }
        }

        // Obtener el perfil completo actualizado
        const perfilActualizadoQuery = `
            SELECT 
                u.id as userId,
                u.nombre,
                u.apellido,
                u.email,
                e.dni,
                e.telefono,
                p.id as perfilId,
                p.resumenProfesional,
                p.urlPortfolio,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.urlBanner,
                p.fechaNacimiento,
                p.direccion,
                p.ciudad,
                p.provincia,
                p.pais
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            WHERE u.id = ?
        `;

        const perfilActualizadoResult = await client.execute({
            sql: perfilActualizadoQuery,
            args: [usuarioId],
        });

        console.info(
            `[PERFIL] Usuario ${usuarioId} actualizó su perfil completo - ID: ${perfilId}`
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
