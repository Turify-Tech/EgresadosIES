/**
 * Utilidades para comunicación con la API del backend
 * Sistema de Gestión de Egresados IES
 */

// Configuración base de la API
const API_CONFIG = {
    baseURL: import.meta.env.PUBLIC_API_URL || "http://localhost:3000",
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
};

/**
 * Clase para manejar errores de API
 */
export class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

/**
 * Cliente HTTP base para la API
 */
class ApiClient {
    constructor(config = {}) {
        this.config = { ...API_CONFIG, ...config };
        this.token = null;
    }

    /**
     * Establece el token de autenticación
     * @param {string} token - JWT token
     */
    setAuthToken(token) {
        this.token = token;
    }

    /**
     * Elimina el token de autenticación
     */
    clearAuthToken() {
        this.token = null;
    }

    /**
     * Obtiene los headers para la request
     * @param {Object} customHeaders - Headers adicionales
     */
    getHeaders(customHeaders = {}) {
        const headers = { ...this.config.headers, ...customHeaders };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Realiza una request HTTP
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de fetch
     */
    async request(endpoint, options = {}) {
        const url = `${this.config.baseURL}/api${endpoint}`;

        const config = {
            ...options,
            headers: this.getHeaders(options.headers),
        };

        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.config.timeout
        );
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Intentar parsear JSON
            let data = null;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new ApiError(
                    data?.message || `HTTP Error ${response.status}`,
                    response.status,
                    data
                );
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === "AbortError") {
                throw new ApiError("Request timeout", 408);
            }

            if (error instanceof ApiError) {
                throw error;
            }

            throw new ApiError(error.message || "Network error", 0, {
                originalError: error,
            });
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, { method: "GET" });
    }

    /**
     * POST request
     */
    async post(endpoint, data = null, options = {}) {
        const config = {
            method: "POST",
            ...options,
        };

        if (data !== null) {
            if (data instanceof FormData) {
                // Para FormData no establecer Content-Type, el browser lo hará automáticamente
                delete config.headers;
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        return this.request(endpoint, config);
    }

    /**
     * PUT request
     */
    async put(endpoint, data = null) {
        return this.request(endpoint, {
            method: "PUT",
            body: data ? JSON.stringify(data) : null,
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: "DELETE" });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data = null) {
        return this.request(endpoint, {
            method: "PATCH",
            body: data ? JSON.stringify(data) : null,
        });
    }
}

// Instancia global del cliente API
export const apiClient = new ApiClient();

/**
 * Servicios específicos de la API
 */

// Servicio de autenticación
export const authService = {
    /**
     * Login unificado con DNI y contraseña
     */
    async login(dni, password) {
        return apiClient.post("/auth/login", { dni, password });
    },

    /**
     * Logout
     */
    async logout() {
        const result = await apiClient.post("/auth/logout");
        apiClient.clearAuthToken();
        return result;
    },

    /**
     * Verificar token actual
     */
    async verifyToken() {
        return apiClient.get("/auth/verify");
    },

    /**
     * Refresh token
     */
    async refreshToken() {
        return apiClient.post("/auth/refresh");
    },

    /**
     * Solicitar reset de contraseña
     */
    async requestPasswordReset(dni, email) {
        return apiClient.post("/auth/reset-password", { dni, email });
    },

    /**
     * Confirmar reset de contraseña
     */
    async confirmPasswordReset(token, newPassword) {
        return apiClient.post("/auth/confirm-reset", { token, newPassword });
    },
};

// Servicio de perfil
export const profileService = {
    /**
     * Obtener perfil del usuario logueado
     */
    async getMyProfile() {
        return apiClient.get("/perfil/mi-perfil");
    },

    /**
     * Actualizar perfil del usuario logueado
     */
    async updateMyProfile(data) {
        return apiClient.put("/perfil/mi-perfil", data);
    },

    /**
     * Obtener perfil por ID
     */
    async getProfile(id) {
        return apiClient.get(`/profile/${id}`);
    },

    /**
     * Actualizar perfil
     */
    async updateProfile(id, data) {
        return apiClient.put(`/profile/${id}`, data);
    },

    /**
     * Agregar experiencia laboral
     */
    async addExperiencia(data) {
        return apiClient.post("/perfil/experiencia", data);
    },

    /**
     * Actualizar experiencia laboral
     */
    async updateExperiencia(id, data) {
        return apiClient.put(`/perfil/experiencia/${id}`, data);
    },

    /**
     * Eliminar experiencia laboral
     */
    async deleteExperiencia(id) {
        return apiClient.delete(`/perfil/experiencia/${id}`);
    },

    /**
     * Agregar formación académica
     */
    async addFormacion(data) {
        return apiClient.post("/perfil/formacion", data);
    },

    /**
     * Actualizar formación académica
     */
    async updateFormacion(id, data) {
        return apiClient.put(`/perfil/formacion/${id}`, data);
    },

    /**
     * Eliminar formación académica
     */
    async deleteFormacion(id) {
        return apiClient.delete(`/perfil/formacion/${id}`);
    },

    /**
     * Agregar curso
     */
    async addCurso(data) {
        return apiClient.post("/perfil/curso", data);
    },

    /**
     * Actualizar curso
     */
    async updateCurso(id, data) {
        return apiClient.put(`/perfil/curso/${id}`, data);
    },

    /**
     * Eliminar curso
     */
    async deleteCurso(id) {
        return apiClient.delete(`/perfil/curso/${id}`);
    },

    /**
     * Completar perfil (wizard inicial)
     */
    async completeProfile(data) {
        return apiClient.post("/profile/complete", data);
    },

    /**
     * Subir CV
     */
    async uploadCV(file) {
        const formData = new FormData();
        formData.append("cv", file);
        return apiClient.post("/profile/upload-cv", formData);
    },

    /**
     * Descargar CV
     */
    async downloadCV(id) {
        return apiClient.get(`/profile/${id}/cv`);
    },
};

// Servicio de usuarios (admin)
export const userService = {
    /**
     * Obtener lista de usuarios
     */
    async getUsers(filters = {}) {
        return apiClient.get("/users", filters);
    },

    /**
     * Crear nuevo usuario
     */
    async createUser(userData) {
        return apiClient.post("/users", userData);
    },

    /**
     * Activar/desactivar usuario
     */
    async toggleUserStatus(id, active) {
        return apiClient.patch(`/users/${id}/status`, { active });
    },

    /**
     * Eliminar usuario
     */
    async deleteUser(id) {
        return apiClient.delete(`/users/${id}`);
    },
};

// Servicio de perfiles públicos (sin autenticación)
export const publicProfilesService = {
    /**
     * Obtener lista paginada de perfiles públicos
     */
    async getPublicProfiles(
        page = 1,
        limit = 10,
        carrera = null,
        search = null
    ) {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (carrera) params.set("carrera", carrera);
        if (search) params.set("search", search);

        return apiClient.get(`/perfiles?${params.toString()}`);
    },

    /**
     * Obtener perfil público específico por ID
     */
    async getPublicProfile(id) {
        return apiClient.get(`/perfiles/${id}`);
    },

    /**
     * Obtener lista de carreras disponibles
     */
    async getCarreras() {
        return apiClient.get("/carreras");
    },
};

// Servicio de estadísticas
export const statsService = {
    /**
     * Obtener estadísticas generales
     */
    async getGeneralStats() {
        return apiClient.get("/stats/general");
    },

    /**
     * Obtener estadísticas de egresados
     */
    async getGraduateStats(filters = {}) {
        return apiClient.get("/stats/graduates", filters);
    },

    /**
     * Obtener reporte detallado
     */
    async getDetailedReport(type, filters = {}) {
        return apiClient.get(`/stats/reports/${type}`, filters);
    },
};

// Servicio del sistema
export const systemService = {
    /**
     * Health check
     */
    async healthCheck() {
        return apiClient.get("/health");
    },

    /**
     * Obtener información del sistema
     */
    async getSystemInfo() {
        return apiClient.get("/system/info");
    },
};

/**
 * Utilidades auxiliares
 */

/**
 * Inicializar la API con token desde localStorage
 */
export function initializeApiAuth() {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        if (token) {
            apiClient.setAuthToken(token);
        }
    }
}

/**
 * Guardar token en localStorage y configurar API
 */
export function setAuthToken(token) {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
        apiClient.setAuthToken(token);
    }
}

/**
 * Limpiar autenticación
 */
export function clearAuth() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        apiClient.clearAuthToken();
    }
}

/**
 * Obtener datos del usuario desde localStorage
 */
export function getUserData() {
    if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user_data");
        return userData ? JSON.parse(userData) : null;
    }
    return null;
}

/**
 * Guardar datos del usuario en localStorage
 */
export function setUserData(userData) {
    if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(userData));
    }
}

/**
 * Interceptor para manejar errores de autenticación
 */
export function handleAuthError(error) {
    if (error.status === 401) {
        clearAuth();
        // Redirigir a acceso
        if (typeof window !== "undefined") {
            window.location.href = "/acceso";
        }
    }
    throw error;
}

/**
 * Wrapper para requests con manejo automático de errores de auth
 */
export async function apiRequest(requestFn) {
    try {
        return await requestFn();
    } catch (error) {
        return handleAuthError(error);
    }
}

// Inicializar automáticamente si estamos en el browser
if (typeof window !== "undefined") {
    initializeApiAuth();
}
