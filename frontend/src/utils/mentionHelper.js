/**
 * Utilidades para procesar y formatear menciones
 */

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Procesa texto con menciones y las convierte a HTML
 * Formato backend: @[id:123]
 * Formato visual: <span class="mention">@NombreUsuario</span>
 * 
 * @param {string} texto - Texto con menciones en formato @[id:123]
 * @param {Array} egresados - Array de objetos de egresados mencionados
 * @returns {string} HTML con menciones formateadas
 */
export function formatearMenciones(texto, egresados = []) {
    if (!texto) return '';
    
    // Crear un mapa de IDs a nombres
    const egresadosMap = {};
    egresados.forEach(egresado => {
        egresadosMap[egresado.id] = egresado.nombreCompleto || `${egresado.nombre} ${egresado.apellido || ''}`.trim();
    });

    // Reemplazar @[id:123] con el nombre del usuario
    return texto.replace(/@\[id:(\d+)\]/g, (match, userId) => {
        const nombreUsuario = egresadosMap[userId] || 'Usuario';
        return `<span class="mention" data-user-id="${userId}">@${nombreUsuario}</span>`;
    });
}

/**
 * Extrae los IDs de usuarios mencionados de un texto
 * @param {string} texto - Texto con menciones
 * @returns {Array<number>} Array de IDs de usuarios mencionados
 */
export function extraerMencionesIds(texto) {
    if (!texto) return [];
    
    const matches = texto.matchAll(/@\[id:(\d+)\]/g);
    const ids = [];
    
    for (const match of matches) {
        ids.push(Number(match[1]));
    }
    
    return [...new Set(ids)]; // Remover duplicados
}

/**
 * Obtiene información de egresados mencionados desde la API
 * @param {Array<number>} ids - Array de IDs de egresados
 * @returns {Promise<Array>} Array de objetos de egresados
 */
export async function obtenerInfoEgresados(ids) {
    if (!ids || ids.length === 0) return [];
    
    try {
        const token = localStorage.getItem('token');
        if (!token) return [];

        const response = await fetch(`${API_URL}/api/egresados/info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids })
        });

        if (!response.ok) {
            console.error('Error al obtener info de egresados:', response.status);
            return [];
        }

        const data = await response.json();
        return data.egresados || [];
    } catch (error) {
        console.error('Error al obtener info de egresados:', error);
        return [];
    }
}

/**
 * Procesa un texto completo: extrae IDs, obtiene info y formatea
 * @param {string} texto - Texto con menciones
 * @returns {Promise<string>} HTML con menciones formateadas
 */
export async function procesarTextoConMenciones(texto) {
    if (!texto) return '';
    
    const ids = extraerMencionesIds(texto);
    
    if (ids.length === 0) {
        // No hay menciones, escapar HTML y retornar
        return texto.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }
    
    const egresados = await obtenerInfoEgresados(ids);
    const textoFormateado = formatearMenciones(texto, egresados);
    
    // Escapar HTML excepto las menciones y saltos de línea
    return textoFormateado.replace(/\n/g, '<br>');
}

/**
 * Convierte menciones visuales a formato backend para envío
 * Esto es por si acaso el usuario edita manualmente
 * @param {string} texto - Texto con posibles menciones
 * @returns {string} Texto con menciones en formato @[id:123]
 */
export function normalizarMenciones(texto) {
    // Ya debería venir en formato correcto del MentionSystem
    return texto;
}

// Estilos CSS para las menciones (se pueden agregar dinámicamente)
export const mencionesCSS = `
.mention {
    color: #3b82f6;
    font-weight: 600;
    background-color: rgba(59, 130, 246, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.mention:hover {
    background-color: rgba(59, 130, 246, 0.2);
    text-decoration: underline;
}
`;

// Agregar estilos al documento si no existen
if (typeof document !== 'undefined') {
    const styleId = 'mentions-inline-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = mencionesCSS;
        document.head.appendChild(style);
    }
}

export default {
    formatearMenciones,
    extraerMencionesIds,
    obtenerInfoEgresados,
    procesarTextoConMenciones,
    normalizarMenciones
};
