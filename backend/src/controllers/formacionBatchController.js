import database from "../config/database.js";
import { getPerfilIdByUserId } from "./perfilController.js";

/**
 * Controlador batch para formaciones académicas y cursos
 * Permite crear/actualizar múltiples registros en una sola petición
 * para evitar rate limiting y mejorar rendimiento
 */

/**
 * Guarda múltiples formaciones académicas en batch (crear y/o actualizar)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function batchSaveFormaciones(req, res) {
    try {
        const usuarioId = req.user.id;
        const { formaciones } = req.body;

        if (!Array.isArray(formaciones) || formaciones.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Se requiere un array de formaciones no vacío",
            });
        }

        // Limitar cantidad para evitar abusos
        if (formaciones.length > 20) {
            return res.status(400).json({
                success: false,
                error: "No se pueden guardar más de 20 formaciones a la vez",
            });
        }

        const client = database.getClient();

        // Obtener el perfil ID del usuario (una sola vez)
        const perfilId = await getPerfilIdByUserId(client, usuarioId);
        if (!perfilId) {
            return res.status(404).json({
                success: false,
                error: "Perfil no encontrado. Debe completar su perfil primero",
            });
        }

        const currentYear = new Date().getFullYear();
        const resultados = [];
        const errores = [];

        for (let i = 0; i < formaciones.length; i++) {
            const formacion = formaciones[i];

            // Validaciones básicas
            if (!formacion.titulo || !formacion.institucion) {
                errores.push({
                    index: i,
                    error: "Título e institución son campos requeridos",
                });
                continue;
            }

            // Validar año de finalización si se proporciona
            if (formacion.anioFinalizacion) {
                const anio = parseInt(formacion.anioFinalizacion);
                if (isNaN(anio) || anio < 1950 || anio > currentYear + 5) {
                    errores.push({
                        index: i,
                        error: `El año de finalización debe estar entre 1950 y ${currentYear + 5}`,
                    });
                    continue;
                }
            }

            try {
                if (formacion.id) {
                    // Actualizar formación existente - verificar que pertenece al usuario
                    const verificarResult = await client.execute({
                        sql: `SELECT fa.id FROM FormacionAcademica fa
                              INNER JOIN Egresado e ON fa.perfilId = e.perfilId
                              WHERE fa.id = ? AND e.id = ?`,
                        args: [formacion.id, usuarioId],
                    });

                    if (verificarResult.rows.length === 0) {
                        errores.push({
                            index: i,
                            error: `Formación ${formacion.id} no encontrada o sin permisos`,
                        });
                        continue;
                    }

                    await client.execute({
                        sql: `UPDATE FormacionAcademica
                              SET titulo = ?, institucion = ?, anioFinalizacion = ?
                              WHERE id = ?`,
                        args: [
                            formacion.titulo.trim(),
                            formacion.institucion.trim(),
                            formacion.anioFinalizacion
                                ? parseInt(formacion.anioFinalizacion)
                                : null,
                            formacion.id,
                        ],
                    });

                    resultados.push({
                        index: i,
                        id: formacion.id,
                        action: "updated",
                    });
                } else {
                    // Crear nueva formación
                    const result = await client.execute({
                        sql: `INSERT INTO FormacionAcademica (titulo, institucion, anioFinalizacion, perfilId)
                              VALUES (?, ?, ?, ?)`,
                        args: [
                            formacion.titulo.trim(),
                            formacion.institucion.trim(),
                            formacion.anioFinalizacion
                                ? parseInt(formacion.anioFinalizacion)
                                : null,
                            perfilId,
                        ],
                    });

                    const newId = Number(result.lastInsertRowid);
                    resultados.push({
                        index: i,
                        id: newId,
                        action: "created",
                    });
                }
            } catch (error) {
                console.error(
                    `Error procesando formación ${i}:`,
                    error.message
                );
                errores.push({
                    index: i,
                    error: "Error interno al procesar esta formación",
                });
            }
        }

        console.info(
            `[FORMACION_BATCH] Usuario ${usuarioId} - ${resultados.length} guardadas, ${errores.length} errores`
        );

        return res.status(errores.length > 0 && resultados.length === 0 ? 400 : 200).json({
            success: resultados.length > 0,
            data: {
                message: `${resultados.length} formación(es) guardada(s) correctamente`,
                resultados,
                errores: errores.length > 0 ? errores : undefined,
            },
        });
    } catch (error) {
        console.error("Error en batch de formaciones:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

/**
 * Guarda múltiples cursos en batch (crear y/o actualizar)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function batchSaveCursos(req, res) {
    try {
        const usuarioId = req.user.id;
        const { cursos } = req.body;

        if (!Array.isArray(cursos) || cursos.length === 0) {
            return res.status(400).json({
                success: false,
                error: "Se requiere un array de cursos no vacío",
            });
        }

        // Limitar cantidad
        if (cursos.length > 30) {
            return res.status(400).json({
                success: false,
                error: "No se pueden guardar más de 30 cursos a la vez",
            });
        }

        const client = database.getClient();

        // Obtener el perfil ID del usuario (una sola vez)
        const perfilId = await getPerfilIdByUserId(client, usuarioId);
        if (!perfilId) {
            return res.status(404).json({
                success: false,
                error: "Perfil no encontrado. Debe completar su perfil primero",
            });
        }

        const resultados = [];
        const errores = [];

        for (let i = 0; i < cursos.length; i++) {
            const curso = cursos[i];

            // Validaciones básicas
            if (!curso.nombre) {
                errores.push({
                    index: i,
                    error: "El nombre del curso es requerido",
                });
                continue;
            }

            // Validar horas de duración si se proporciona
            if (
                curso.horasDuracion !== undefined &&
                curso.horasDuracion !== null
            ) {
                const horas = parseInt(curso.horasDuracion);
                if (isNaN(horas) || horas <= 0 || horas > 10000) {
                    errores.push({
                        index: i,
                        error: "Las horas de duración deben ser un número positivo menor a 10,000",
                    });
                    continue;
                }
            }

            try {
                if (curso.id) {
                    // Actualizar curso existente - verificar que pertenece al usuario
                    const verificarResult = await client.execute({
                        sql: `SELECT c.id FROM Curso c
                              INNER JOIN Egresado e ON c.perfilId = e.perfilId
                              WHERE c.id = ? AND e.id = ?`,
                        args: [curso.id, usuarioId],
                    });

                    if (verificarResult.rows.length === 0) {
                        errores.push({
                            index: i,
                            error: `Curso ${curso.id} no encontrado o sin permisos`,
                        });
                        continue;
                    }

                    await client.execute({
                        sql: `UPDATE Curso
                              SET nombre = ?, institucion = ?, horasDuracion = ?
                              WHERE id = ?`,
                        args: [
                            curso.nombre.trim(),
                            curso.institucion
                                ? curso.institucion.trim()
                                : null,
                            curso.horasDuracion
                                ? parseInt(curso.horasDuracion)
                                : null,
                            curso.id,
                        ],
                    });

                    resultados.push({
                        index: i,
                        id: curso.id,
                        action: "updated",
                    });
                } else {
                    // Crear nuevo curso
                    const result = await client.execute({
                        sql: `INSERT INTO Curso (nombre, institucion, horasDuracion, perfilId)
                              VALUES (?, ?, ?, ?)`,
                        args: [
                            curso.nombre.trim(),
                            curso.institucion
                                ? curso.institucion.trim()
                                : null,
                            curso.horasDuracion
                                ? parseInt(curso.horasDuracion)
                                : null,
                            perfilId,
                        ],
                    });

                    const newId = Number(result.lastInsertRowid);
                    resultados.push({
                        index: i,
                        id: newId,
                        action: "created",
                    });
                }
            } catch (error) {
                console.error(`Error procesando curso ${i}:`, error.message);
                errores.push({
                    index: i,
                    error: "Error interno al procesar este curso",
                });
            }
        }

        console.info(
            `[CURSO_BATCH] Usuario ${usuarioId} - ${resultados.length} guardados, ${errores.length} errores`
        );

        return res.status(errores.length > 0 && resultados.length === 0 ? 400 : 200).json({
            success: resultados.length > 0,
            data: {
                message: `${resultados.length} curso(s) guardado(s) correctamente`,
                resultados,
                errores: errores.length > 0 ? errores : undefined,
            },
        });
    } catch (error) {
        console.error("Error en batch de cursos:", error);
        return res.status(500).json({
            success: false,
            error: "Error interno del servidor",
        });
    }
}

export default {
    batchSaveFormaciones,
    batchSaveCursos,
};
