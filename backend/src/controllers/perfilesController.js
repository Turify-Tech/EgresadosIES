import database from "../config/database.js";

/**
 * Controlador para manejar endpoints públicos de perfiles de egresados
 * Issue #14 - Perfiles Públicos de Egresados
 * 
 * SEGURIDAD:
 * - Solo muestra perfiles con perfilPublico = 1
 * - Excluye datos sensibles: email, telefono, dni, password
 * - Aplica rate limiting
 * - Mensajes genéricos en errores (no revela existencia de usuarios)
 */
class PerfilesController {
    /**
     * Obtiene una lista paginada de perfiles públicos de egresados
     * GET /api/perfiles
     * 
     * @query {number} page - Página actual (default: 1)
     * @query {number} limit - Registros por página (max: 50, default: 20)
     * @query {string} search - Búsqueda en nombre, apellido, carrera
     * @query {string} carrera - Filtrar por carrera específica
     * @query {string} ciudad - Filtrar por ciudad
     * @query {string} orderBy - Ordenar por: nombre, carrera, ciudad (default: nombre)
     * @query {string} order - asc/desc (default: asc)
     */
    static async getPerfilesPublicos(req, res) {
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
            // CRÍTICO: Solo perfiles públicos
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

            // Búsqueda por texto (nombre, apellido, carrera, empresa)
            if (search && search.trim()) {
                const searchTerm = `%${search.trim()}%`;
                conditions.push(`(
                    u.nombre LIKE ? OR 
                    u.apellido LIKE ? OR
                    c.nombre LIKE ? OR
                    p.resumenProfesional LIKE ? OR
                    EXISTS (
                        SELECT 1 FROM ExperienciaLaboral el 
                        WHERE el.perfilId = p.id 
                        AND (el.empresa LIKE ? OR el.puesto LIKE ?)
                    )
                )`);
                params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
                SELECT COUNT(*) as total
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                LEFT JOIN Carrera c ON e.carreraId = c.id
                WHERE ${whereClause}
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
     * Obtiene un perfil específico de egresado por su ID de usuario
     * GET /api/perfiles/:id
     * 
     * @param {number} id - ID del usuario egresado
     * @returns {Object} Perfil completo con todas las relaciones
     * 
     * SEGURIDAD:
     * - Solo retorna perfiles con perfilPublico = 1
     * - Retorna 404 genérico para perfiles privados (no revela existencia)
     * - Excluye: email, telefono, dni
     */
    static async getPerfilPublico(req, res) {
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
                    p.mostrarContacto,
                    p.disponibleOfertas,
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
                    message: "Perfil no encontrado o no es público",
                });
            }

            const profile = result.rows[0];

            // CRÍTICO: Verificar que el perfil sea público
            if (profile.perfilPublico !== 1) {
                return res.status(404).json({
                    success: false,
                    message: "Perfil no encontrado o no es público",
                });
            }

            // Eliminar campo perfilPublico usando destructuring (no se puede delete en objeto de BD)
            const { perfilPublico, ...profileData } = profile;

            // Obtener datos relacionados en paralelo
            const [
                experiencias, 
                formacion, 
                cursos
                // Proyectos y habilidades comentados temporalmente
                // proyectos, 
                // habilidades
            ] = await Promise.all([
                PerfilesController.getExperienciasLaborales(profile.perfilId),
                PerfilesController.getFormacionAcademica(profile.perfilId),
                PerfilesController.getCursos(profile.perfilId)
                // PerfilesController.getProyectos(graduateId),
                // PerfilesController.getHabilidades(graduateId),
            ]);

            // Enriquecer perfil con todos los datos relacionados
            const enrichedProfile = {
                ...profileData,
                experienciasLaborales: experiencias,
                formacionAcademica: formacion,
                cursos: cursos,
                proyectos: [], // Vacío temporalmente
                habilidades: [] // Vacío temporalmente
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
