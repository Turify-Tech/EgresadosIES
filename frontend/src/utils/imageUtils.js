/**
 * Obtiene la URL del backend según el entorno
 * @returns {string} - URL del backend
 */
function getBackendUrl() {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        // En producción
        return 'https://egresados-ies-api.vercel.app';
    }
    // SSR fallback
    return 'http://localhost:3000';
}

/**
 * Construye la URL completa de una imagen desde el backend
 * @param {string} imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @returns {string} - URL completa de la imagen
 */
export function getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Si ya es una URL completa, retornarla tal cual
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // Si es una ruta relativa, agregar el dominio del backend
    const backendUrl = getBackendUrl();
    return `${backendUrl}${imageUrl}`;
}

/**
 * Obtiene la URL de la foto de perfil con fallback a avatar por defecto
 * @param {object} perfil - Objeto del perfil
 * @returns {string} - URL de la foto o null para mostrar avatar SVG
 */
export function getFotoPerfil(perfil) {
    if (!perfil?.urlFotoPerfil) return null;
    return getImageUrl(perfil.urlFotoPerfil);
}
