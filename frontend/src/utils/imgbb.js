/**
 * Servicio para manejo de imágenes con ImgBB
 * Sistema de Gestión de Egresados IES
 */

// Configuración de ImgBB
const IMGBB_CONFIG = {
    apiKey: import.meta.env.PUBLIC_IMGBB_API_KEY,
    uploadUrl: "https://api.imgbb.com/1/upload",
};

// Debug: Mostrar configuración cargada
console.log("🔍 Variables de entorno ImgBB cargadas:", {
    PUBLIC_IMGBB_API_KEY: import.meta.env.PUBLIC_IMGBB_API_KEY
        ? "✅ Configurada"
        : "❌ No encontrada",
    apiUrl: IMGBB_CONFIG.uploadUrl,
});

/**
 * Clase para manejar ImgBB
 */
class ImgBBService {
    constructor() {
        this.isInitialized = true; // ImgBB no requiere inicialización especial
    }

    /**
     * Subir imagen a ImgBB
     * @param {File} file - Archivo de imagen
     * @param {Object} options - Opciones de subida
     * @returns {Promise<Object>} Resultado de la subida
     */
    async uploadImage(file, options = {}) {
        if (!IMGBB_CONFIG.apiKey) {
            throw new Error("ImgBB API key no está configurada");
        }

        // Validar archivo
        await this.validateImage(file);

        try {
            console.log("📤 Subiendo imagen a ImgBB...", {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
            });

            // Crear FormData para la subida
            const formData = new FormData();
            formData.append("key", IMGBB_CONFIG.apiKey);
            formData.append("image", file);

            // Nombre personalizado si se proporciona
            if (options.name) {
                formData.append("name", options.name);
            }

            // Hacer la petición
            const response = await fetch(IMGBB_CONFIG.uploadUrl, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || "Error desconocido");
            }

            console.log("✅ Imagen subida exitosamente a ImgBB:", result.data);

            return {
                success: true,
                id: result.data.id,
                title: result.data.title,
                url: result.data.url,
                displayUrl: result.data.display_url,
                thumbnailUrl: result.data.thumb.url,
                mediumUrl: result.data.medium?.url,
                deleteUrl: result.data.delete_url,
                size: result.data.size,
                width: result.data.width,
                height: result.data.height,
                originalData: result.data,
            };
        } catch (error) {
            console.error("❌ Error subiendo imagen a ImgBB:", error);
            throw new Error(`Error al subir imagen: ${error.message}`);
        }
    }

    /**
     * Validar archivo de imagen
     * @param {File} file - Archivo a validar
     */
    validateImage(file) {
        // Verificar que es un archivo
        if (!file || !(file instanceof File)) {
            throw new Error("Debe proporcionar un archivo válido");
        }

        // Verificar tipo MIME
        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/bmp",
        ];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                "Tipo de archivo no válido. Solo se permiten JPEG, PNG, GIF, WebP y BMP"
            );
        }

        // Verificar tamaño (32MB máximo para ImgBB)
        const maxSize = 32 * 1024 * 1024; // 32MB
        if (file.size > maxSize) {
            throw new Error("El archivo es demasiado grande. Máximo 32MB");
        }

        // Verificar dimensiones mínimas si es posible
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const minWidth = 50;
                const minHeight = 50;

                if (img.width < minWidth || img.height < minHeight) {
                    reject(
                        new Error(
                            `La imagen debe ser de al menos ${minWidth}x${minHeight} píxeles`
                        )
                    );
                } else {
                    resolve(true);
                }
            };
            img.onerror = () => reject(new Error("No se pudo leer la imagen"));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Crear preview local de imagen antes de subir
     * @param {File} file - Archivo de imagen
     * @returns {Promise<string>} URL del preview
     */
    createPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target && typeof e.target.result === "string") {
                    resolve(e.target.result);
                } else {
                    reject(new Error("No se pudo crear el preview"));
                }
            };

            reader.onerror = () =>
                reject(new Error("Error leyendo el archivo"));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Obtener configuración de ImgBB
     * @returns {Object} Configuración actual
     */
    getConfig() {
        return {
            hasApiKey: !!IMGBB_CONFIG.apiKey,
            uploadUrl: IMGBB_CONFIG.uploadUrl,
            isInitialized: this.isInitialized,
        };
    }

    /**
     * Verificar conectividad con ImgBB
     * @returns {Promise<Object>} Estado de la conexión
     */
    async testConnection() {
        try {
            if (!IMGBB_CONFIG.apiKey) {
                throw new Error("API key no configurada");
            }

            return {
                success: true,
                status: "ImgBB configurado correctamente",
                apiUrl: IMGBB_CONFIG.uploadUrl,
                hasApiKey: !!IMGBB_CONFIG.apiKey,
            };
        } catch (error) {
            return {
                success: false,
                status: "Error de configuración con ImgBB",
                apiUrl: IMGBB_CONFIG.uploadUrl,
                error: error.message,
            };
        }
    }
}

// Instancia global del servicio
export const imageService = new ImgBBService();

/**
 * Utilidades auxiliares para imágenes
 */
export const ImageUtils = {
    /**
     * Comprimir imagen antes de subir
     * @param {File} file - Archivo original
     * @param {Object} options - Opciones de compresión
     * @returns {Promise<File>} Archivo comprimido
     */
    async compressImage(file, options = {}) {
        const {
            maxWidth = 1200,
            maxHeight = 1200,
            quality = 0.8,
            format = "image/jpeg",
        } = options;

        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                // Calcular nuevas dimensiones
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(
                        maxWidth / width,
                        maxHeight / height
                    );
                    width *= ratio;
                    height *= ratio;
                }

                // Configurar canvas
                canvas.width = width;
                canvas.height = height;

                // Dibujar imagen redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: format,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file); // Fallback al archivo original
                        }
                    },
                    format,
                    quality
                );
            };

            img.src = URL.createObjectURL(file);
        });
    },
};

export default {
    imageService,
    ImageUtils,
    IMGBB_CONFIG,
};
