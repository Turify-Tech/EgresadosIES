import database from "../config/database.js";

/**
 * Controlador para endpoints públicos de egresados
 * Solo expone datos públicos sin información sensible
 */
class PublicController {
    /**
     * Obtiene lista paginada de egresados públicos
     * GET /api/public/graduates
     * 
     * Query params:
     * - page: número de página (default: 1)
     * - limit: resultados por página (default: 20, max: 50)
     * - carrera: filtro por nombre de carrera
     * - ciudad: filtro por ciudad
     * - search: búsqueda por nombre, habilidades, o empresa
     * - orderBy: campo para ordenar (nombre|carrera|ciudad)
     * - order: dirección (asc|desc)
     */
    static async getPublicGraduates(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                carrera = null,
                ciudad = null,
                search = null,
                orderBy = "nombre",
                order = "asc",
            } = req.query;

            // Validar y sanitizar parámetros de paginación
            const pageNumber = Math.max(1, parseInt(page));
            const limitNumber = Math.min(50, Math.max(1, parseInt(limit))); // Máximo 50 por página
            const offset = (pageNumber - 1) * limitNumber;

            // Validar ordenamiento
            const validOrderBy = ["nombre", "carrera", "ciudad"].includes(orderBy) ? orderBy : "nombre";
            const validOrder = order.toLowerCase() === "desc" ? "DESC" : "ASC";

            const client = database.getClient();

            // Construir condiciones WHERE dinámicamente
            const conditions = ["u.tipo_usuario = 'Egresado'", "p.perfilPublico = 1"];
            const params = [];

            // Filtro por carrera
            if (carrera && carrera.trim()) {
                conditions.push("c.nombre = ?");
                params.push(carrera.trim());
            }

            // Filtro por ciudad
            if (ciudad && ciudad.trim()) {
                conditions.push("p.ciudad LIKE ?");
                params.push(`%${ciudad.trim()}%`);
            }

            // Búsqueda por texto (nombre, habilidades, empresa)
            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                conditions.push(`(
                    u.nombre LIKE ? OR 
                    u.apellido LIKE ? OR
                    EXISTS (
                        SELECT 1 FROM Habilidades h 
                        WHERE h.usuarioId = u.id 
                        AND h.nombre LIKE ?
                    ) OR
                    EXISTS (
                        SELECT 1 FROM ExperienciaLaboral el 
                        WHERE el.perfilId = p.id 
                        AND (el.empresa LIKE ? OR el.puesto LIKE ?)
                    )
                )`);
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
            }

            const whereClause = conditions.join(" AND ");

            // Determinar campo de ordenamiento
            let orderByField = "u.nombre";
            if (validOrderBy === "carrera") orderByField = "c.nombre";
            if (validOrderBy === "ciudad") orderByField = "p.ciudad";

            // Query principal para obtener perfiles públicos (SIN datos sensibles)
            const profilesQuery = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    c.nombre as carrera,
                    p.resumenProfesional,
                    p.situacionLaboral,
                    p.urlPortfolio,
                    p.urlFotoPerfil,
                    p.urlBanner,
                    p.tituloprofesional,
                    p.areaInteres,
                    p.ciudad,
                    p.provincia,
                    p.pais,
                    p.id as perfilId
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera c ON e.carreraId = c.id
                WHERE ${whereClause}
                ORDER BY ${orderByField} ${validOrder}
                LIMIT ? OFFSET ?
            `;

            // Query para contar total de registros
            const countQuery = `
                SELECT COUNT(DISTINCT u.id) as total
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera c ON e.carreraId = c.id
                WHERE ${whereClause}
            `;

            // Ejecutar queries en paralelo
            const profilesParams = [...params, limitNumber, offset];
            const countParams = [...params];

            const [profilesResult, countResult] = await Promise.all([
                client.execute({ sql: profilesQuery, args: profilesParams }),
                client.execute({ sql: countQuery, args: countParams }),
            ]);

            const profiles = profilesResult.rows;
            const total = countResult.rows[0]?.total || 0;

            // Enriquecer perfiles con datos relacionados
            const enrichedProfiles = await Promise.all(
                profiles.map(async (profile) => {
                    if (!profile.perfilId) {
                        return profile;
                    }

                    const [experiencias, formacion, cursos] = await Promise.all([
                        PublicController.getExperienciasLaborales(profile.perfilId),
                        PublicController.getFormacionAcademica(profile.perfilId),
                        PublicController.getCursos(profile.perfilId),
                    ]);

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
            console.error("❌ Error obteniendo egresados públicos:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener egresados públicos",
            });
        }
    }

    /**
     * Obtiene perfil individual de un egresado público
     * GET /api/public/graduates/:id
     * 
     * Params:
     * - id: ID del egresado
     */
    static async getPublicGraduate(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número válido
            if (!id || isNaN(parseInt(id))) {
                return res.status(400).json({
                    success: false,
                    message: "ID de egresado inválido",
                });
            }

            const graduateId = parseInt(id);
            const client = database.getClient();

            // Query para obtener perfil específico (SIN datos sensibles)
            const profileQuery = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    c.nombre as carrera,
                    p.resumenProfesional,
                    p.situacionLaboral,
                    p.urlPortfolio,
                    p.urlFotoPerfil,
                    p.urlBanner,
                    p.tituloprofesional,
                    p.areaInteres,
                    p.ciudad,
                    p.provincia,
                    p.pais,
                    p.perfilPublico,
                    p.id as perfilId
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera c ON e.carreraId = c.id
                WHERE u.id = ? 
                  AND u.tipo_usuario = 'Egresado'
            `;

            const result = await client.execute({
                sql: profileQuery,
                args: [graduateId],
            });

            // Verificar si existe el egresado
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Egresado no encontrado",
                });
            }

            const profile = result.rows[0];

            // CRÍTICO: Verificar que el perfil sea público
            if (profile.perfilPublico !== 1) {
                return res.status(404).json({
                    success: false,
                    message: "Perfil no disponible públicamente",
                });
            }

            // Eliminar campo perfilPublico de la respuesta (no es necesario exponerlo)
            delete profile.perfilPublico;

            // Obtener datos relacionados en paralelo
            const [
                experiencias, 
                formacion, 
                cursos, 
                proyectos, 
                habilidades
            ] = await Promise.all([
                PublicController.getExperienciasLaborales(profile.perfilId),
                PublicController.getFormacionAcademica(profile.perfilId),
                PublicController.getCursos(profile.perfilId),
                PublicController.getProyectos(graduateId),
                PublicController.getHabilidades(graduateId),
            ]);

            // Enriquecer perfil con todos los datos relacionados
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
     * Método auxiliar para obtener experiencias laborales de un perfil
     * @private
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
                ORDER BY 
                    CASE WHEN fechaFin IS NULL THEN 0 ELSE 1 END,
                    fechaInicio DESC
            `;

            const result = await client.execute({
                sql: query,
                args: [perfilId],
            });

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo experiencias laborales:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener formación académica de un perfil
     * @private
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

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo formación académica:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener cursos de un perfil
     * @private
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

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo cursos:", error);
            return [];
        }
    }

    /**
     * Obtiene perfil individual de un egresado público
     * GET /api/public/graduates/:id
     * 
     * @param {number} id - ID del egresado (URL param)
     */
    static async getPublicGraduate(req, res) {
        try {
            const { id } = req.params;

            // Validar que el ID sea un número válido
            const graduateId = parseInt(id);
            if (isNaN(graduateId) || graduateId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "ID de egresado inválido",
                });
            }

            const client = database.getClient();

            // Query para obtener perfil específico (SIN datos sensibles)
            const profileQuery = `
                SELECT 
                    u.id,
                    u.nombre,
                    u.apellido,
                    c.nombre as carrera,
                    p.resumenProfesional,
                    p.situacionLaboral,
                    p.urlPortfolio,
                    p.urlFotoPerfil,
                    p.urlBanner,
                    p.tituloprofesional,
                    p.areaInteres,
                    p.ciudad,
                    p.provincia,
                    p.pais,
                    p.mostrarContacto,
                    p.disponibleOfertas,
                    p.id as perfilId
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera c ON e.carreraId = c.id
                WHERE u.id = ?
                  AND u.tipo_usuario = 'Egresado'
                  AND p.perfilPublico = 1
            `;

            const result = await client.execute({
                sql: profileQuery,
                args: [graduateId],
            });

            // Verificar si el perfil existe y es público
            if (!result.rows || result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Perfil no encontrado o no es público",
                });
            }

            const profile = result.rows[0];

            // Obtener datos relacionados si existe el perfil
            if (profile.perfilId) {
                const [
                    experiencias,
                    formacion,
                    cursos,
                    proyectos,
                    habilidades,
                ] = await Promise.all([
                    PublicController.getExperienciasLaborales(profile.perfilId),
                    PublicController.getFormacionAcademica(profile.perfilId),
                    PublicController.getCursos(profile.perfilId),
                    PublicController.getProyectos(graduateId), // Los proyectos están ligados a usuarioId
                    PublicController.getHabilidades(graduateId), // Las habilidades están ligadas a usuarioId
                ]);

                // Enriquecer perfil con todos los datos relacionados
                const enrichedProfile = {
                    ...profile,
                    experienciasLaborales: experiencias,
                    formacionAcademica: formacion,
                    cursos: cursos,
                    proyectos: proyectos,
                    habilidades: habilidades,
                };

                return res.status(200).json({
                    success: true,
                    data: enrichedProfile,
                });
            }

            // Si no tiene perfil completo, retornar datos básicos
            res.status(200).json({
                success: true,
                data: {
                    ...profile,
                    experienciasLaborales: [],
                    formacionAcademica: [],
                    cursos: [],
                    proyectos: [],
                    habilidades: [],
                },
            });
        } catch (error) {
            console.error("❌ Error obteniendo perfil público de egresado:", error);
            res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener perfil",
            });
        }
    }

    /**
     * Método auxiliar para obtener proyectos de un usuario
     * @private
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

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo proyectos:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener habilidades de un usuario
     * @private
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
                ORDER BY 
                    CASE tipo
                        WHEN 'tecnica' THEN 1
                        WHEN 'blanda' THEN 2
                        WHEN 'idioma' THEN 3
                        ELSE 4
                    END,
                    nombre ASC
            `;

            const result = await client.execute({
                sql: query,
                args: [usuarioId],
            });

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo habilidades:", error);
            return [];
        }
    }
    /**
     * Método auxiliar para obtener proyectos de un usuario
     * @private
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

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo proyectos:", error);
            return [];
        }
    }

    /**
     * Método auxiliar para obtener habilidades de un usuario
     * @private
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

            return result.rows || [];
        } catch (error) {
            console.error("❌ Error obteniendo habilidades:", error);
            return [];
        }
    }}

export default PublicController;
