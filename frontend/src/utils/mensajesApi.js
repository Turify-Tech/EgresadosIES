/**
 * Servicio API para sistema de mensajería
 */

import { API_URL } from '../config/env.js';

/**
 * Obtener token de autenticación
 */
function getAuthToken() {
    if (typeof window === "undefined") return null;
    // Intentar ambos nombres de token para compatibilidad
    return localStorage.getItem("auth_token") || localStorage.getItem("token");
}

/**
 * Crear headers con autenticación
 */
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

/**
 * Manejar respuesta de la API
 */
async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        // Si el token expiró o es inválido, redirigir al login
        if (response.status === 401) {
            console.warn("[API] Token inválido o expirado, limpiando sesión...");
            localStorage.removeItem("token");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            localStorage.removeItem("user_data");
            window.location.href = "/acceso";
            throw new Error(data.message || "Sesión expirada. Por favor, inicia sesión nuevamente.");
        }
        throw new Error(data.message || "Error en la petición");
    }

    return data;
}

/**
 * Servicio de mensajería
 */
export const mensajesService = {
    /**
     * Enviar un nuevo mensaje
     * @param {number} destinatarioId - ID del destinatario
     * @param {string} contenido - Contenido del mensaje
     */
    async enviarMensaje(destinatarioId, contenido) {
        const response = await fetch(`${API_URL}/mensajes`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ destinatarioId, contenido }),
        });

        return handleResponse(response);
    },

    /**
     * Obtener lista de conversaciones
     * @param {number} page - Número de página
     * @param {number} limit - Límite de conversaciones por página
     */
    async obtenerConversaciones(page = 1, limit = 20) {
        console.log("[API] Obteniendo conversaciones...", { page, limit });
        console.log("[API] URL:", `${API_URL}/mensajes/conversaciones?page=${page}&limit=${limit}`);
        
        const token = getAuthToken();
        console.log("[API] Token presente:", !!token);
        console.log("[API] Token value:", token ? token.substring(0, 20) + "..." : "null");
        
        const response = await fetch(
            `${API_URL}/mensajes/conversaciones?page=${page}&limit=${limit}`,
            {
                headers: getAuthHeaders(),
            }
        );

        console.log("[API] Response status:", response.status);
        console.log("[API] Response ok:", response.ok);
        
        const result = await handleResponse(response);
        console.log("[API] Response data:", result);
        return result;
    },

    /**
     * Obtener mensajes de una conversación específica
     * @param {number} userId - ID del otro usuario
     * @param {number} page - Número de página
     * @param {number} limit - Límite de mensajes por página
     */
    async obtenerConversacion(userId, page = 1, limit = 50) {
        const response = await fetch(
            `${API_URL}/mensajes/conversacion/${userId}?page=${page}&limit=${limit}`,
            {
                headers: getAuthHeaders(),
            }
        );

        return handleResponse(response);
    },

    /**
     * Marcar un mensaje como leído
     * @param {number} mensajeId - ID del mensaje
     */
    async marcarComoLeido(mensajeId) {
        const response = await fetch(`${API_URL}/mensajes/${mensajeId}/leer`, {
            method: "PUT",
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Obtener contador de mensajes no leídos
     */
    async obtenerNoLeidos() {
        const response = await fetch(`${API_URL}/mensajes/no-leidos`, {
            headers: getAuthHeaders(),
        });

        return handleResponse(response);
    },

    /**
     * Marcar toda una conversación como leída
     * @param {number} userId - ID del otro usuario
     */
    async marcarConversacionLeida(userId) {
        const response = await fetch(
            `${API_URL}/mensajes/conversacion/${userId}/leer-todos`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
            }
        );

        return handleResponse(response);
    },

    /**
     * Buscar egresados para iniciar conversación
     * @param {string} query - Término de búsqueda
     */
    async buscarEgresados(query) {
        const response = await fetch(
            `${API_URL}/perfiles?search=${encodeURIComponent(query)}&limit=10`,
            {
                headers: getAuthHeaders(),
            }
        );

        return handleResponse(response);
    },
};

/**
 * Hook para polling de mensajes no leídos
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @param {number} interval - Intervalo en milisegundos (default: 30s)
 */
export function startNoLeidosPolling(callback, interval = 30000) {
    let polling = null;

    const poll = async () => {
        try {
            const result = await mensajesService.obtenerNoLeidos();
            callback(result.data);
        } catch (error) {
            console.error("Error en polling de mensajes:", error);
        }
    };

    // Primera ejecución inmediata
    poll();

    // Iniciar polling
    polling = setInterval(poll, interval);

    // Retornar función para detener polling
    return () => {
        if (polling) {
            clearInterval(polling);
        }
    };
}
