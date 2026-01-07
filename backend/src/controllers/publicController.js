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
}

export default PublicController;
