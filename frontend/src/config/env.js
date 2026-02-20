// Configuración centralizada de variables de entorno
export const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:3000/api";
export const API_BASE_URL = (import.meta.env.PUBLIC_API_URL || "http://localhost:3000").replace(/\/api$/, '');
export const IMGBB_API_KEY = import.meta.env.PUBLIC_IMGBB_API_KEY;
