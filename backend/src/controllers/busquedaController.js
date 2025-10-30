/**
 * Controlador para el motor de búsqueda de perfiles de egresados
 */

import database from "../config/database.js";

/**
 * Buscar perfiles de egresados
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
export const buscarPerfiles = async (req, res) => {
    try {
        // Obtener el cliente de la base de datos
        const client = database.getClient();

        // Extraer parámetros de búsqueda de req.query
        const { query, carrera, situacionLaboral, empresa, puesto, orderBy } =
            req.query;

        // Consulta SQL base que une las tablas necesarias
        // Usamos una subconsulta para manejar múltiples experiencias sin duplicar egresados
        let sqlBase = `
            SELECT DISTINCT 
                u.id,
                u.nombre,
                u.email,
                p.resumenProfesional,
                p.situacionLaboral,
                p.urlPortfolio,
                p.urlFotoPerfil,
                p.urlBanner,
                c.nombre as carrera,
                e.dni,
                e.telefono,
                (
                    SELECT GROUP_CONCAT(el.puesto || ' en ' || el.empresa, ', ')
                    FROM ExperienciaLaboral el 
                    WHERE el.perfilId = p.id
                ) as experiencias
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            WHERE u.tipo_usuario = 'Egresado'
        `;

        // Arrays para construir las condiciones WHERE y parámetros de forma segura
        const condiciones = [];
        const parametros = [];

        // Lógica para búsqueda de texto libre (query)
        if (query && query.trim()) {
            const textoBusqueda = `%${query.trim()}%`;
            condiciones.push(`(
                u.nombre LIKE ? OR 
                p.resumenProfesional LIKE ? OR 
                EXISTS (
                    SELECT 1 FROM ExperienciaLaboral el2 
                    WHERE el2.perfilId = p.id 
                    AND (el2.puesto LIKE ? OR el2.empresa LIKE ?)
                )
            )`);
            // Agregar el mismo parámetro 4 veces para cada campo de búsqueda
            parametros.push(
                textoBusqueda,
                textoBusqueda,
                textoBusqueda,
                textoBusqueda
            );
        }

        // Lógica para filtros específicos
        if (carrera && carrera.trim()) {
            condiciones.push("c.nombre = ?");
            parametros.push(carrera.trim());
        }

        if (situacionLaboral && situacionLaboral.trim()) {
            condiciones.push("p.situacionLaboral = ?");
            parametros.push(situacionLaboral.trim());
        }

        if (empresa && empresa.trim()) {
            condiciones.push(`EXISTS (
                SELECT 1 FROM ExperienciaLaboral el3 
                WHERE el3.perfilId = p.id AND el3.empresa LIKE ?
            )`);
            parametros.push(`%${empresa.trim()}%`);
        }

        if (puesto && puesto.trim()) {
            condiciones.push(`EXISTS (
                SELECT 1 FROM ExperienciaLaboral el4 
                WHERE el4.perfilId = p.id AND el4.puesto LIKE ?
            )`);
            parametros.push(`%${puesto.trim()}%`);
        }

        // Construir la consulta final
        let consultaFinal = sqlBase;
        if (condiciones.length > 0) {
            consultaFinal += " AND " + condiciones.join(" AND ");
        }

        // Agregar ordenamiento
        let ordenClause = "ORDER BY u.nombre ASC"; // Por defecto
        if (orderBy) {
            switch (orderBy) {
                case "nombre_desc":
                    ordenClause = "ORDER BY u.nombre DESC";
                    break;
                case "carrera_asc":
                    ordenClause = "ORDER BY c.nombre ASC, u.nombre ASC";
                    break;
                case "reciente":
                    ordenClause = "ORDER BY u.fecha_creacion DESC";
                    break;
                default:
                    ordenClause = "ORDER BY u.nombre ASC";
            }
        }
        consultaFinal += " " + ordenClause;

        // Ejecutar la consulta de forma segura
        console.log("Consulta SQL final:", consultaFinal);
        console.log("Parámetros:", parametros);

        const result = await client.execute({
            sql: consultaFinal,
            args: parametros,
        });

        console.log("Resultados encontrados:", result.rows.length);
        console.log("Primeros resultados:", result.rows.slice(0, 2));

        // Devolver los resultados
        const response = {
            success: true,
            data: {
                perfiles: result.rows,
                total: result.rows.length,
            },
            parametrosBusqueda: {
                query,
                carrera,
                situacionLaboral,
                empresa,
                puesto,
                orderBy,
            },
            timestamp: new Date().toISOString(),
        };

        console.log(
            "Respuesta de búsqueda:",
            JSON.stringify(response, null, 2)
        );
        res.status(200).json(response);
    } catch (error) {
        console.error("Error en buscarPerfiles:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudo procesar la búsqueda",
            detalles:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

/**
 * Obtener sugerencias de autocompletado
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
export const autocompletado = async (req, res) => {
    try {
        const client = database.getClient();
        const { query, type = "all" } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(200).json({ suggestions: [] });
        }

        const textoBusqueda = `%${query.trim()}%`;
        const suggestions = [];

        // Buscar nombres
        if (type === "all" || type === "name") {
            const nombresQuery = `
                SELECT DISTINCT u.nombre as text, 'name' as type
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                WHERE u.tipo_usuario = 'Egresado' AND u.nombre LIKE ?
                LIMIT 5
            `;
            const nombresResult = await client.execute({
                sql: nombresQuery,
                args: [textoBusqueda],
            });
            suggestions.push(...nombresResult.rows);
        }

        // Buscar empresas
        if (type === "all" || type === "company") {
            const empresasQuery = `
                SELECT DISTINCT el.empresa as text, 'company' as type
                FROM ExperienciaLaboral el
                WHERE el.empresa LIKE ?
                LIMIT 5
            `;
            const empresasResult = await client.execute({
                sql: empresasQuery,
                args: [textoBusqueda],
            });
            suggestions.push(...empresasResult.rows);
        }

        // Buscar puestos
        if (type === "all" || type === "position") {
            const puestosQuery = `
                SELECT DISTINCT el.puesto as text, 'position' as type
                FROM ExperienciaLaboral el
                WHERE el.puesto LIKE ?
                LIMIT 5
            `;
            const puestosResult = await client.execute({
                sql: puestosQuery,
                args: [textoBusqueda],
            });
            suggestions.push(...puestosResult.rows);
        }

        // Buscar carreras
        if (type === "all" || type === "career") {
            const carrerasQuery = `
                SELECT DISTINCT c.nombre as text, 'career' as type
                FROM Carrera c
                WHERE c.nombre LIKE ?
                LIMIT 5
            `;
            const carrerasResult = await client.execute({
                sql: carrerasQuery,
                args: [textoBusqueda],
            });
            suggestions.push(...carrerasResult.rows);
        }

        // Limitar total de sugerencias
        const limitedSuggestions = suggestions.slice(0, 10);

        res.status(200).json({
            suggestions: limitedSuggestions,
            query: query.trim(),
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error en autocompletado:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudo procesar el autocompletado",
            detalles:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

/**
 * Obtener opciones de filtros dinámicamente
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
export const obtenerFiltros = async (req, res) => {
    try {
        const client = database.getClient();

        // Obtener carreras disponibles
        const carrerasQuery = `
            SELECT DISTINCT c.id, c.nombre
            FROM Carrera c
            INNER JOIN Egresado e ON c.id = e.carreraId
            ORDER BY c.nombre ASC
        `;

        console.log("Ejecutando query de carreras:", carrerasQuery);
        const carrerasResult = await client.execute(carrerasQuery);
        console.log("Resultado carreras:", carrerasResult.rows);

        // Obtener situaciones laborales disponibles
        const situacionesQuery = `
            SELECT DISTINCT p.situacionLaboral
            FROM Perfil p
            WHERE p.situacionLaboral IS NOT NULL AND p.situacionLaboral != ''
            ORDER BY p.situacionLaboral ASC
        `;

        console.log("Ejecutando query de situaciones:", situacionesQuery);
        const situacionesResult = await client.execute(situacionesQuery);
        console.log("Resultado situaciones:", situacionesResult.rows);

        // Obtener empresas más comunes
        const empresasQuery = `
            SELECT DISTINCT el.empresa, COUNT(*) as count
            FROM ExperienciaLaboral el
            WHERE el.empresa IS NOT NULL AND el.empresa != ''
            GROUP BY el.empresa
            ORDER BY count DESC, el.empresa ASC
            LIMIT 20
        `;

        console.log("Ejecutando query de empresas:", empresasQuery);
        const empresasResult = await client.execute(empresasQuery);
        console.log("Resultado empresas:", empresasResult.rows);

        // Obtener puestos más comunes
        const puestosQuery = `
            SELECT DISTINCT el.puesto, COUNT(*) as count
            FROM ExperienciaLaboral el
            WHERE el.puesto IS NOT NULL AND el.puesto != ''
            GROUP BY el.puesto
            ORDER BY count DESC, el.puesto ASC
            LIMIT 20
        `;

        console.log("Ejecutando query de puestos:", puestosQuery);
        const puestosResult = await client.execute(puestosQuery);
        console.log("Resultado puestos:", puestosResult.rows); // Construir respuesta
        const response = {
            success: true,
            data: {
                carreras: (carrerasResult.rows || []).map((row) => row.nombre),
                situacionesLaborales: (situacionesResult.rows || []).map(
                    (row) => row.situacionLaboral
                ),
                empresas: (empresasResult.rows || []).map((row) => row.empresa),
                puestos: (puestosResult.rows || []).map((row) => row.puesto),
            },
            timestamp: new Date().toISOString(),
        };

        console.log("Respuesta de filtros:", response);
        res.status(200).json(response);
    } catch (error) {
        console.error("Error en obtenerFiltros:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudieron obtener las opciones de filtros",
            detalles:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};
