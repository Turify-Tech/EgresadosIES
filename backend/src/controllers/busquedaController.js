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
        const { 
            query, 
            carrera, 
            situacionLaboral, 
            empresa, 
            puesto, 
            orderBy,
            // NUEVO: Parámetros de paginación
            pagina = 1,
            limite = 10,
            // NUEVO: Filtro por tecnología
            tecnologia,
            // NUEVO: Ordenamiento avanzado
            ordenarPor,
            orden
        } = req.query;

        // NUEVO: Validar y convertir parámetros de paginación
        const paginaNum = Math.max(1, parseInt(pagina) || 1);
        const limiteNum = Math.min(50, Math.max(1, parseInt(limite) || 10)); // Max 50 por página
        const offset = (paginaNum - 1) * limiteNum;

        // Arrays para construir las condiciones WHERE y parámetros de forma segura
        const condiciones = [];
        const parametros = [];

        // Lógica para búsqueda de texto libre (query) - EXPANDIDA
        if (query && query.trim()) {
            const textoBusqueda = `%${query.trim()}%`;
            condiciones.push(`(
                u.nombre LIKE ? OR 
                p.resumenProfesional LIKE ? OR 
                EXISTS (
                    SELECT 1 FROM ExperienciaLaboral el2 
                    WHERE el2.perfilId = p.id 
                    AND (el2.puesto LIKE ? OR el2.empresa LIKE ? OR el2.descripcion LIKE ?)
                ) OR
                EXISTS (
                    SELECT 1 FROM Curso cu2 
                    WHERE cu2.perfilId = p.id 
                    AND cu2.nombre LIKE ?
                )
            )`);
            // Agregar el parámetro para cada campo de búsqueda
            parametros.push(
                textoBusqueda,
                textoBusqueda,
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

        // NUEVO: Filtro por tecnología (búsqueda en experiencias y cursos)
        if (tecnologia && tecnologia.trim()) {
            const techBusqueda = `%${tecnologia.trim()}%`;
            condiciones.push(`(
                EXISTS (
                    SELECT 1 FROM ExperienciaLaboral el6 
                    WHERE el6.perfilId = p.id 
                    AND (el6.descripcion LIKE ? OR el6.puesto LIKE ?)
                ) OR
                EXISTS (
                    SELECT 1 FROM Curso cu4 
                    WHERE cu4.perfilId = p.id 
                    AND cu4.nombre LIKE ?
                )
            )`);
            parametros.push(techBusqueda, techBusqueda, techBusqueda);
        }

        // Construir WHERE clause para las consultas
        let whereClause = "WHERE u.tipo_usuario = 'Egresado'";
        if (condiciones.length > 0) {
            whereClause += " AND " + condiciones.join(" AND ");
        }

        // MEJORADO: Sistema de ordenamiento que soporta ambos formatos
        let ordenClause = "ORDER BY u.nombre ASC"; // Por defecto
        
        // Priorizar el nuevo sistema de ordenamiento si está presente
        if (ordenarPor && orden) {
            const ordenamientosValidos = {
                'nombre': 'u.nombre',
                'carrera': 'c.nombre',
                'experiencia': 'p.situacionLaboral'
            };
            
            const campoOrden = ordenamientosValidos[ordenarPor] || 'u.nombre';
            const direccionOrden = orden === 'desc' ? 'DESC' : 'ASC';
            ordenClause = `ORDER BY ${campoOrden} ${direccionOrden}`;
        }
        // Mantener compatibilidad con el formato anterior de develop
        else if (orderBy) {
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

        // Consulta principal usando subquery para paginación correcta
        const consultaFinal = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
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
            ${whereClause}
            ${ordenClause}
            LIMIT ${limiteNum} OFFSET ${offset}
        `;

        // Consulta de conteo
        const consultaConteo = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            ${whereClause}
        `;

        // Ejecutar ambas consultas de forma segura

        const [resultConteo, resultPerfiles] = await Promise.all([
            client.execute({
                sql: consultaConteo,
                args: parametros
            }),
            client.execute({
                sql: consultaFinal,
                args: parametros,
            })
        ]);

        const total = resultConteo.rows[0]?.total || 0;
        const totalPaginas = Math.ceil(total / limiteNum);

        // Devolver los resultados con paginación
        const response = {
            success: true,
            data: {
                perfiles: resultPerfiles.rows,
                total: total,
                // NUEVO: Metadata de paginación
                pagina: paginaNum,
                limite: limiteNum,
                totalPaginas: totalPaginas,
            },
            parametrosBusqueda: {
                query,
                carrera,
                situacionLaboral,
                empresa,
                puesto,
                orderBy,
                tecnologia, // NUEVO: Parámetro de tecnología
                ordenarPor, // NUEVO: Campo de ordenamiento
                orden,      // NUEVO: Dirección de ordenamiento
                // NUEVO: Parámetros de paginación en respuesta
                pagina: paginaNum,
                limite: limiteNum,
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

/**
 * Búsqueda global del sistema - busca en múltiples entidades
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
export const busquedaGlobal = async (req, res) => {
    try {
        const client = database.getClient();
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: "Query muy corto",
                mensaje: "Por favor ingresa al menos 2 caracteres para buscar",
            });
        }

        const textoBusqueda = `%${query.trim()}%`;
        const limite = 10;

        // Búsqueda en Personas (Egresados)
        const personasQuery = `
            SELECT DISTINCT
                u.id,
                u.nombre,
                u.apellido,
                c.nombre as carrera,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.tituloprofesional
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            WHERE (
                u.nombre LIKE ? OR 
                u.apellido LIKE ? OR
                (u.nombre || ' ' || COALESCE(u.apellido, '')) LIKE ? OR
                p.tituloprofesional LIKE ? OR
                p.areaInteres LIKE ? OR
                p.resumenProfesional LIKE ? OR
                c.nombre LIKE ? OR
                p.situacionLaboral LIKE ? OR
                EXISTS (
                    SELECT 1 FROM Habilidades h 
                    WHERE h.usuarioId = e.id 
                    AND h.nombre LIKE ?
                ) OR
                EXISTS (
                    SELECT 1 FROM ExperienciaLaboral el 
                    WHERE el.perfilId = p.id 
                    AND (el.puesto LIKE ? OR el.empresa LIKE ? OR el.descripcion LIKE ?)
                ) OR
                EXISTS (
                    SELECT 1 FROM Proyectos pr 
                    WHERE pr.usuarioId = e.id 
                    AND (pr.nombre LIKE ? OR pr.tecnologias LIKE ? OR pr.descripcion LIKE ?)
                ) OR
                EXISTS (
                    SELECT 1 FROM Curso cu 
                    WHERE cu.perfilId = p.id 
                    AND (cu.nombre LIKE ? OR cu.institucion LIKE ?)
                ) OR
                EXISTS (
                    SELECT 1 FROM FormacionAcademica fa 
                    WHERE fa.perfilId = p.id 
                    AND (fa.titulo LIKE ? OR fa.institucion LIKE ?)
                )
            )
            AND p.perfilPublico = 1
            LIMIT ?
        `;

        const personasResult = await client.execute({
            sql: personasQuery,
            args: [
                textoBusqueda, // nombre
                textoBusqueda, // apellido
                textoBusqueda, // nombre completo (nombre + apellido)
                textoBusqueda, // tituloprofesional
                textoBusqueda, // areaInteres
                textoBusqueda, // resumenProfesional
                textoBusqueda, // carrera
                textoBusqueda, // situacionLaboral
                textoBusqueda, // habilidades nombre
                textoBusqueda, // experiencia puesto
                textoBusqueda, // experiencia empresa
                textoBusqueda, // experiencia descripcion
                textoBusqueda, // proyecto nombre
                textoBusqueda, // proyecto tecnologias
                textoBusqueda, // proyecto descripcion
                textoBusqueda, // curso nombre
                textoBusqueda, // curso institucion
                textoBusqueda, // formacion titulo
                textoBusqueda, // formacion institucion
                limite
            ],
        });

        // Búsqueda en Publicaciones
        const publicacionesQuery = `
            SELECT 
                pub.id,
                pub.contenido,
                pub.fechaCreacion,
                e.id as autorId,
                u.nombre as autorNombre,
                u.apellido as autorApellido,
                p.urlFotoPerfil,
                (SELECT COUNT(*) FROM LikePublicacion lp WHERE lp.publicacionId = pub.id) as likes,
                (SELECT COUNT(*) FROM Comentario c WHERE c.publicacionId = pub.id) as comentarios,
                (
                    SELECT GROUP_CONCAT(url, '||')
                    FROM ImagenPublicacion ip
                    WHERE ip.publicacionId = pub.id
                ) as imagenes
            FROM Publicacion pub
            INNER JOIN Egresado e ON pub.autorId = e.id
            INNER JOIN Usuario u ON e.id = u.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            WHERE pub.contenido LIKE ?
            ORDER BY pub.fechaCreacion DESC
            LIMIT ?
        `;

        const publicacionesResult = await client.execute({
            sql: publicacionesQuery,
            args: [textoBusqueda, limite],
        });

        const response = {
            success: true,
            query: query.trim(),
            resultados: {
                personas: personasResult.rows || [],
                publicaciones: publicacionesResult.rows || [],
            },
            timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error en busquedaGlobal:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudo completar la búsqueda",
            detalles:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

/**
 * Obtener sugerencias para autocompletado
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
export const obtenerSugerencias = async (req, res) => {
    try {
        const client = database.getClient();
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(200).json({
                success: true,
                sugerencias: [],
            });
        }

        const textoBusqueda = `%${query.trim()}%`;
        const limitePorCategoria = 5;

        // Sugerencias de nombres de personas (con foto de perfil)
        const nombresQuery = `
            SELECT DISTINCT 
                u.nombre || ' ' || COALESCE(u.apellido, '') as sugerencia, 
                'persona' as tipo,
                p.urlFotoPerfil as imagen
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            WHERE (u.nombre LIKE ? OR u.apellido LIKE ?)
            AND p.perfilPublico = 1
            LIMIT ?
        `;

        const nombresResult = await client.execute({
            sql: nombresQuery,
            args: [textoBusqueda, textoBusqueda, limitePorCategoria],
        });

        // Combinar todas las sugerencias
        const todasLasSugerencias = [
            ...(nombresResult.rows || []),
        ];

        // Limitar el total de sugerencias
        const sugerenciasLimitadas = todasLasSugerencias.slice(0, 10);

        const response = {
            success: true,
            query: query.trim(),
            sugerencias: sugerenciasLimitadas,
            timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error en obtenerSugerencias:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudieron obtener las sugerencias",
            detalles:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};
