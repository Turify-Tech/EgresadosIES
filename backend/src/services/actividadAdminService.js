import database from "../config/database.js";

/**
 * Servicio para gestionar actividades administrativas
 * Proporciona métodos para registrar y consultar acciones realizadas por administradores
 */

// Tipos de acciones válidas
export const TIPOS_ACCION = {
    AGREGAR_DNI: 'AGREGAR_DNI',
    EDITAR_DNI: 'EDITAR_DNI',
    ELIMINAR_DNI: 'ELIMINAR_DNI',
    CARGAR_EXCEL: 'CARGAR_EXCEL',
    VER_ESTADISTICAS: 'VER_ESTADISTICAS',
    ACCESO_PANEL: 'ACCESO_PANEL'
};

/**
 * Registra una actividad administrativa en el sistema
 * @param {number} adminId - ID del administrador que realiza la acción
 * @param {string} tipoAccion - Tipo de acción (debe estar en TIPOS_ACCION)
 * @param {string} descripcion - Descripción legible de la acción
 * @param {object|null} detalles - Detalles adicionales en formato JSON (opcional)
 * @returns {Promise<object>} - Actividad registrada
 */
export async function registrarActividad(adminId, tipoAccion, descripcion, detalles = null) {
    try {
        const db = database.getClient();

        // Validar tipo de acción
        if (!Object.values(TIPOS_ACCION).includes(tipoAccion)) {
            throw new Error(`Tipo de acción inválido: ${tipoAccion}`);
        }

        // Convertir detalles a JSON si existe
        const detallesJson = detalles ? JSON.stringify(detalles) : null;

        const query = `
            INSERT INTO ActividadAdmin (adminId, tipoAccion, descripcion, detalles, fechaCreacion)
            VALUES (?, ?, ?, ?, datetime('now'))
        `;

        const result = await db.execute({
            sql: query,
            args: [adminId, tipoAccion, descripcion, detallesJson]
        });

        return {
            id: result.lastInsertRowid,
            adminId,
            tipoAccion,
            descripcion,
            detalles: detalles,
            fechaCreacion: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error al registrar actividad administrativa:', error);
        throw error;
    }
}

/**
 * Obtiene las actividades recientes de un administrador
 * @param {number} adminId - ID del administrador
 * @param {number} limite - Cantidad máxima de actividades a retornar (default: 10)
 * @returns {Promise<Array>} - Lista de actividades recientes
 */
export async function obtenerActividadesRecientes(adminId, limite = 10) {
    try {
        const db = database.getClient();

        const query = `
            SELECT 
                a.id,
                a.tipoAccion,
                a.descripcion,
                a.detalles,
                a.fechaCreacion,
                u.nombre || ' ' || COALESCE(u.apellido, '') as nombreAdmin
            FROM ActividadAdmin a
            INNER JOIN Administrador ad ON a.adminId = ad.id
            INNER JOIN Usuario u ON ad.id = u.id
            WHERE a.adminId = ?
            ORDER BY a.fechaCreacion DESC
            LIMIT ?
        `;

        const result = await db.execute({
            sql: query,
            args: [adminId, limite]
        });

        // Parsear detalles JSON
        return result.rows.map(row => ({
            id: row.id,
            tipoAccion: row.tipoAccion,
            descripcion: row.descripcion,
            detalles: row.detalles ? JSON.parse(row.detalles) : null,
            fechaCreacion: row.fechaCreacion,
            nombreAdmin: row.nombreAdmin
        }));
    } catch (error) {
        console.error('Error al obtener actividades recientes:', error);
        throw error;
    }
}

/**
 * Obtiene todas las actividades del sistema (para super administradores)
 * @param {number} limite - Cantidad máxima de actividades a retornar (default: 20)
 * @returns {Promise<Array>} - Lista de actividades de todos los administradores
 */
export async function obtenerTodasLasActividades(limite = 20) {
    try {
        const db = database.getClient();

        const query = `
            SELECT 
                a.id,
                a.adminId,
                a.tipoAccion,
                a.descripcion,
                a.detalles,
                a.fechaCreacion,
                u.nombre || ' ' || COALESCE(u.apellido, '') as nombreAdmin
            FROM ActividadAdmin a
            INNER JOIN Administrador ad ON a.adminId = ad.id
            INNER JOIN Usuario u ON ad.id = u.id
            ORDER BY a.fechaCreacion DESC
            LIMIT ?
        `;

        const result = await db.execute({
            sql: query,
            args: [limite]
        });

        // Parsear detalles JSON
        return result.rows.map(row => ({
            id: row.id,
            adminId: row.adminId,
            tipoAccion: row.tipoAccion,
            descripcion: row.descripcion,
            detalles: row.detalles ? JSON.parse(row.detalles) : null,
            fechaCreacion: row.fechaCreacion,
            nombreAdmin: row.nombreAdmin
        }));
    } catch (error) {
        console.error('Error al obtener todas las actividades:', error);
        throw error;
    }
}

/**
 * Limpia actividades antiguas (mantenimiento)
 * @param {number} diasAntiguedad - Cantidad de días de antigüedad para eliminar
 * @returns {Promise<number>} - Cantidad de registros eliminados
 */
export async function limpiarActividadesAntiguas(diasAntiguedad = 90) {
    try {
        const db = database.getClient();

        const query = `
            DELETE FROM ActividadAdmin
            WHERE fechaCreacion < datetime('now', '-' || ? || ' days')
        `;

        const result = await db.execute({
            sql: query,
            args: [diasAntiguedad]
        });

        return result.rowsAffected || 0;
    } catch (error) {
        console.error('Error al limpiar actividades antiguas:', error);
        throw error;
    }
}
