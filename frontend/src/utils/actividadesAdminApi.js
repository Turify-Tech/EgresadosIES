/**
 * Servicio para gestionar actividades administrativas
 * Proporciona métodos para consumir el endpoint de actividades recientes
 */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * Obtiene las actividades recientes del administrador autenticado
 * @param {number} limite - Cantidad de actividades a obtener (1-50, default: 10)
 * @returns {Promise<Array>} - Lista de actividades recientes
 */
export async function obtenerActividadesRecientes(limite = 10) {
    try {
        const token = localStorage.getItem("auth_token");
        
        if (!token) {
            throw new Error("No se encontró token de autenticación");
        }

        const url = `${API_BASE_URL}/admin/actividades-recientes?limite=${limite}`;
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Error al obtener actividades recientes");
        }

        if (!data.success) {
            throw new Error(data.message || "Respuesta inválida del servidor");
        }

        return data.data;
    } catch (error) {
        console.error("Error en obtenerActividadesRecientes:", error);
        throw error;
    }
}

/**
 * Formatea la fecha de una actividad para mostrarla de forma legible
 * @param {string} fechaISO - Fecha en formato ISO o SQLite
 * @returns {string} - Fecha formateada (ej: "hace 5 minutos", "hace 2 horas")
 */
export function formatearFechaActividad(fechaISO) {
    // Convertir fecha SQLite a formato ISO si es necesario
    let fechaStr = fechaISO;
    if (fechaISO && !fechaISO.includes('T') && fechaISO.includes(' ')) {
        // Formato SQLite: "2026-01-20 15:30:00" -> "2026-01-20T15:30:00Z"
        fechaStr = fechaISO.replace(' ', 'T') + 'Z';
    }
    
    const fecha = new Date(fechaStr);
    const ahora = new Date();
    
    // Verificar que la fecha sea válida
    if (isNaN(fecha.getTime())) {
        return "Fecha inválida";
    }
    
    const diferencia = Math.floor((ahora - fecha) / 1000); // diferencia en segundos

    if (diferencia < 60) {
        return "hace unos segundos";
    }

    if (diferencia < 3600) {
        const minutos = Math.floor(diferencia / 60);
        return `hace ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
    }

    if (diferencia < 86400) {
        const horas = Math.floor(diferencia / 3600);
        return `hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
    }

    if (diferencia < 604800) {
        const dias = Math.floor(diferencia / 86400);
        return `hace ${dias} ${dias === 1 ? "día" : "días"}`;
    }

    // Si es más de una semana, mostrar fecha completa
    return fecha.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: fecha.getFullYear() !== ahora.getFullYear() ? "numeric" : undefined,
    });
}

/**
 * Obtiene el ícono SVG correspondiente al tipo de acción
 * @param {string} tipoAccion - Tipo de acción (AGREGAR_DNI, EDITAR_DNI, etc.)
 * @returns {string} - Path SVG del ícono
 */
export function obtenerIconoAccion(tipoAccion) {
    const iconos = {
        AGREGAR_DNI: '<path d="M12 5v14m-7-7h14"></path>', // Plus
        EDITAR_DNI: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>', // Edit
        ELIMINAR_DNI: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>', // Trash
        CARGAR_EXCEL: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>', // Upload
        VER_ESTADISTICAS: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>', // Activity
        ACCESO_PANEL: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line>' // Login
    };

    return iconos[tipoAccion] || '<circle cx="12" cy="12" r="10"></circle>'; // Default
}

/**
 * Obtiene el color CSS correspondiente al tipo de acción
 * @param {string} tipoAccion - Tipo de acción
 * @returns {string} - Clase CSS para el color
 */
export function obtenerColorAccion(tipoAccion) {
    const colores = {
        AGREGAR_DNI: "success",
        EDITAR_DNI: "info",
        ELIMINAR_DNI: "danger",
        CARGAR_EXCEL: "primary",
        VER_ESTADISTICAS: "secondary",
        ACCESO_PANEL: "default"
    };

    return colores[tipoAccion] || "default";
}
