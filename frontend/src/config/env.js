// Configuración centralizada de variables de entorno

// Función para detectar el entorno y retornar la URL base correcta
function getApiBaseUrl() {
    // En el cliente (navegador), detectar por hostname
    if (typeof window !== 'undefined') {
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        
        if (isLocal) {
            return 'http://localhost:3000';
        } else {
            return 'https://egresados-ies-api.vercel.app';
        }
    }
    
    // En SSR (servidor Astro), usar variable de entorno
    return import.meta.env.PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:3000';
}

// Exportar las URLs dinámicas
export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const IMGBB_API_KEY = import.meta.env.PUBLIC_IMGBB_API_KEY;
