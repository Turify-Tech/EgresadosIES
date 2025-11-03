import database from "../config/database.js";

/**
 * Controlador para manejar endpoints públicos de perfiles de egresados
 * No requiere autenticación y excluye datos sensibles
 */
class PerfilesController {
    /**
     * Obtiene una lista paginada de perfiles públicos
     * GET /api/perfiles
     */
    static async getPerfilesPublicos(req, res) {
        try {
            const {
                page = 1,
                limit = 10,
                carrera = null,
                search = null,
            } = req.query;

            // Validar parámetros de paginación
            const pageNumber = Math.max(1, parseInt(page));
            const limitNumber = Math.min(50, Math.max(1, parseInt(limit))); // Máximo 50 por página
            const offset = (pageNumber - 1) * limitNumber;

            const client = database.getClient();

            // Construir filtros
            let whereClause = "";
            let params = [];
            let conditions = [];

            if (carrera) {
                conditions.push("c.nombre = ?");
                params.push(carrera);
            }

            if (search) {
                conditions.push("u.nombre LIKE ?");
                params.push(`%${search}%`);
            }

            if (conditions.length > 0) {
                whereClause = "WHERE " + conditions.join(" AND ");
            }

            // Query principal para obtener perfiles con datos públicos únicamente
            const profilesQuery = `
                SELECT 
                    e.id,
                    u.nombre,
                    c.nombre as carrera,
                    pf.resumenProfesional,
                    pf.situacionLaboral,
                    pf.urlPortfolio,
                    pf.urlFotoPerfil,
                    pf.urlBanner,
                    pf.id as perfilId
                FROM Egresado e
                INNER JOIN Usuario u ON e.id = u.id
                INNER JOIN Carrera c ON e.carreraId = c.id
                LEFT JOIN Perfil pf ON e.perfilId = pf.id
                ${whereClause}
                ORDER BY u.nombre ASC
                LIMIT ? OFFSET ?
            `;

            // Query para contar total de registros
            const countQuery = `
                SELECT COUNT(*) as total
                FROM Egresado e
                INNER JOIN Usuario u ON e.id = u.id
                INNER JOIN Carrera c ON e.carreraId = c.id
                LEFT JOIN Perfil pf ON e.perfilId = pf.id
                ${whereClause}
            `;

            // Ejecutar queries
            const countParams = [...params];
            const profilesParams = [...params, limitNumber, offset];

            const [profilesResult, countResult] = await Promise.all([
                client.execute({ sql: profilesQuery, args: profilesParams }),
                client.execute({ sql: countQuery, args: countParams }),
            ]);

            const profiles = profilesResult.rows;
            const total = countResult.rows[0].total;

            // Para cada perfil, obtener datos relacionados (experiencias, formación, cursos)
            const enrichedProfiles = await Promise.all(
                profiles.map(async (profile) => {
                    if (!profile.perfilId) return profile;

                    const [experiencias, formacion, cursos] = await Promise.all(
                        [
                            PerfilesController.getExperienciasLaborales(
                                profile.perfilId
                            ),
                            PerfilesController.getFormacionAcademica(
                                profile.perfilId
                            ),
                            PerfilesController.getCursos(profile.perfilId),
                        ]
                    );

                    return {
                        ...profile,
                        experienciasLaborales: experiencias,
                        formacionAcademica: formacion,
                        cursos: cursos,
                    };
                })
            );

            // Calcular metadata de paginación
            const totalPages = Math.ceil(total / limitNumber);
            const hasNextPage = pageNumber < totalPages;
            const hasPrevPage = pageNumber > 1;

            res.status(200).json({
                success: true,
                data: enrichedProfiles,
                pagination: {
                    currentPage: pageNumber,
                    totalPages,
                    totalRecords: total,
                    limit: limitNumber,
                    hasNextPage,
                    hasPrevPage,
                },
            });
        } catch (error) {
            console.error("❌ Error obteniendo perfiles públicos:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener perfiles",
            });
        }
    }

    /**
     * Obtiene un perfil específico por ID
     * GET /api/perfiles/:id
     */
    static async getPerfilPublico(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: "ID de perfil inválido",
                });
            }

            const client = database.getClient();

            // Query para obtener perfil específico sin datos sensibles
            const profileQuery = `
                SELECT 
                    e.id,
                    u.nombre,
                    c.nombre as carrera,
                    pf.resumenProfesional,
                    pf.situacionLaboral,
                    pf.urlPortfolio,
                    pf.urlFotoPerfil,
                    pf.urlBanner,
                    pf.id as perfilId
                FROM Egresado e
                INNER JOIN Usuario u ON e.id = u.id
                INNER JOIN Carrera c ON e.carreraId = c.id
                LEFT JOIN Perfil pf ON e.perfilId = pf.id
                WHERE e.id = ?
            `;

            const result = await client.execute({
                sql: profileQuery,
                args: [parseInt(id)],
            });

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Perfil no encontrado",
                });
            }

            const profile = result.rows[0];

            // Obtener datos relacionados si existe el perfil
            const [experiencias, formacion, cursos, proyectos, habilidades] =
                await Promise.all([
                    PerfilesController.getExperienciasLaborales(
                        profile.perfilId
                    ),
                    PerfilesController.getFormacionAcademica(profile.perfilId),
                    PerfilesController.getCursos(profile.perfilId),
                    PerfilesController.getProyectos(parseInt(id)), // Los proyectos están ligados a usuarioId
                    PerfilesController.getHabilidades(parseInt(id)), // Las habilidades están ligadas a usuarioId
                ]);

            const enrichedProfile = {
                ...profile,
                experienciasLaborales: experiencias,
                formacionAcademica: formacion,
                cursos: cursos,
                proyectos: proyectos,
                habilidades: habilidades,
            };

            res.status(200).json({
                success: true,
                data: enrichedProfile,
            });
        } catch (error) {
            console.error("❌ Error obteniendo perfil público:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener perfil",
            });
        }
    }

    /**
     * Obtiene lista de carreras disponibles
     * GET /api/carreras
     */
    static async getCarreras(req, res) {
        try {
            const client = database.getClient();

            const query = `
                SELECT id, nombre
                FROM Carrera
                ORDER BY nombre ASC
            `;

            const result = await client.execute(query);

            res.status(200).json({
                success: true,
                data: result.rows,
            });
        } catch (error) {
            console.error("❌ Error obteniendo carreras:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener carreras",
            });
        }
    }

    /**
     * Método auxiliar para obtener experiencias laborales de un perfil
     */
    static async getExperienciasLaborales(perfilId) {
        try {
            if (!perfilId) return [];

            const client = database.getClient();

            const query = `
                SELECT 
                    id,
                    puesto,
                    empresa,
                    fechaInicio,
                    fechaFin,
                    descripcion
                FROM ExperienciaLaboral
                WHERE perfilId = ?
                ORDER BY fechaInicio DESC
            `;

            const result = await client.execute({
                sql: query,
                args: [perfilId],
            });

            return result.rows;
        } catch (error) {
            console.error("❌ Error obteniendo experiencias laborales:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener formación académica de un perfil
     */
    static async getFormacionAcademica(perfilId) {
        try {
            if (!perfilId) return [];

            const client = database.getClient();

            const query = `
                SELECT 
                    id,
                    titulo,
                    institucion,
                    anioFinalizacion
                FROM FormacionAcademica
                WHERE perfilId = ?
                ORDER BY anioFinalizacion DESC
            `;

            const result = await client.execute({
                sql: query,
                args: [perfilId],
            });

            return result.rows;
        } catch (error) {
            console.error("❌ Error obteniendo formación académica:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener cursos de un perfil
     */
    static async getCursos(perfilId) {
        try {
            if (!perfilId) return [];

            const client = database.getClient();

            const query = `
                SELECT 
                    id,
                    nombre,
                    institucion,
                    horasDuracion
                FROM Curso
                WHERE perfilId = ?
                ORDER BY nombre ASC
            `;

            const result = await client.execute({
                sql: query,
                args: [perfilId],
            });

            return result.rows;
        } catch (error) {
            console.error("❌ Error obteniendo cursos:", error);
            return [];
        }
    }

    /**
     * Obtiene proyectos de un usuario
     */
    static async getProyectos(usuarioId) {
        try {
            if (!usuarioId) return [];

            const client = database.getClient();

            const query = `
                SELECT 
                    id,
                    nombre,
                    descripcion,
                    enlace,
                    tecnologias,
                    fechaProyecto,
                    imagen
                FROM Proyectos
                WHERE usuarioId = ?
                ORDER BY fechaProyecto DESC, id DESC
            `;

            const result = await client.execute({
                sql: query,
                args: [usuarioId],
            });

            return result.rows;
        } catch (error) {
            console.error("❌ Error obteniendo proyectos:", error);
            return [];
        }
    }

    /**
     * Obtiene habilidades de un usuario
     */
    static async getHabilidades(usuarioId) {
        try {
            if (!usuarioId) return [];

            const client = database.getClient();

            const query = `
                SELECT 
                    id,
                    nombre,
                    tipo,
                    nivel
                FROM Habilidades
                WHERE usuarioId = ?
                ORDER BY tipo, nombre
            `;

            const result = await client.execute({
                sql: query,
                args: [usuarioId],
            });

            return result.rows;
        } catch (error) {
            console.error("❌ Error obteniendo habilidades:", error);
            return [];
        }
    }
}

export default PerfilesController;
