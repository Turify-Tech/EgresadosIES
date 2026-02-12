import database from '../config/database.js';

/**
 * Controlador para operaciones relacionadas con egresados
 * Proporciona endpoints para búsqueda y autocomplete
 */

/**
 * Buscar egresados por nombre para menciones
 * @route GET /api/egresados/buscar
 * @desc Busca egresados por nombre (para sistema de menciones)
 * @access Privado (solo usuarios autenticados)
 */
export async function buscarEgresados(req, res) {
    try {
        const { query, limit = 10 } = req.query;
        const currentUserId = req.user?.id; // Usuario actual para excluirlo opcionalmente

        if (!query || query.trim().length === 0) {
            return res.json({ egresados: [] });
        }

        const searchTerm = query.trim();
        const db = database.getClient();

        // Buscar solo egresados (tipo_usuario = 'Egresado')
        // Buscar por nombre o apellido
        const sql = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                u.email,
                c.nombre as carrera,
                p.urlFotoPerfil
            FROM Usuario u
            INNER JOIN Egresado e ON e.id = u.id
            LEFT JOIN Carrera c ON c.id = e.carreraId
            LEFT JOIN Perfil p ON p.id = e.perfilId
            WHERE u.tipo_usuario = 'Egresado'
            AND (
                LOWER(u.nombre) LIKE LOWER(?) 
                OR LOWER(u.apellido) LIKE LOWER(?)
                OR LOWER(u.nombre || ' ' || u.apellido) LIKE LOWER(?)
            )
            ORDER BY u.nombre, u.apellido
            LIMIT ?
        `;

        const searchPattern = `%${searchTerm}%`;
        const result = await db.execute({
            sql,
            args: [searchPattern, searchPattern, searchPattern, Number(limit)]
        });

        // Formatear resultados
        const egresados = result.rows.map(row => ({
            id: Number(row.id),
            nombre: row.nombre,
            apellido: row.apellido,
            nombreCompleto: row.apellido ? `${row.nombre} ${row.apellido}` : row.nombre,
            email: row.email,
            carrera: row.carrera,
            fotoPerfil: row.urlFotoPerfil
        }));

        res.json({ 
            success: true,
            data: egresados,
            total: egresados.length 
        });

    } catch (error) {
        console.error('❌ Error al buscar egresados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar egresados',
            message: error.message
        });
    }
}

/**
 * Obtener información de egresados por IDs
 * @route POST /api/egresados/info
 * @desc Obtiene información de múltiples egresados por sus IDs
 * @access Privado
 */
export async function obtenerInfoEgresados(req, res) {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.json({ egresados: [] });
        }

        const db = database.getClient();
        const placeholders = ids.map(() => '?').join(',');

        const sql = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido,
                c.nombre as carrera,
                p.urlFotoPerfil
            FROM Usuario u
            INNER JOIN Egresado e ON e.id = u.id
            LEFT JOIN Carrera c ON c.id = e.carreraId
            LEFT JOIN Perfil p ON p.id = e.perfilId
            WHERE u.tipo_usuario = 'Egresado'
            AND u.id IN (${placeholders})
        `;

        const result = await db.execute({
            sql,
            args: ids.map(id => Number(id))
        });

        const egresados = result.rows.map(row => ({
            id: Number(row.id),
            nombre: row.nombre,
            apellido: row.apellido,
            nombreCompleto: row.apellido ? `${row.nombre} ${row.apellido}` : row.nombre,
            carrera: row.carrera,
            fotoPerfil: row.urlFotoPerfil
        }));

        res.json({ 
            success: true,
            data: egresados 
        });

    } catch (error) {
        console.error('❌ Error al obtener info de egresados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener información de egresados',
            message: error.message
        });
    }
}
