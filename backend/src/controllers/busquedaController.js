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
        const { query, carrera, situacionLaboral, empresa, puesto } = req.query;

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
            parametros.push(textoBusqueda, textoBusqueda, textoBusqueda, textoBusqueda);
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

        // Agregar ordenamiento para mejorar la experiencia
        consultaFinal += " ORDER BY u.nombre ASC";

        // Ejecutar la consulta de forma segura
        const result = await client.execute({
            sql: consultaFinal,
            args: parametros
        });

        // Devolver los resultados
        res.status(200).json({
            perfiles: result.rows,
            total: result.rows.length,
            parametrosBusqueda: {
                query,
                carrera,
                situacionLaboral,
                empresa,
                puesto
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error en buscarPerfiles:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            mensaje: "No se pudo procesar la búsqueda",
            detalles: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};