/**
 * Servicio para manejo de imágenes con ImageKit
 * Sistema de Gestión de Egresados IES
 */

// Configuración de ImageKit
const IMAGEKIT_CONFIG = {
    publicKey:
        import.meta.env.PUBLIC_IMAGEKIT_PUBLIC_KEY || "public_key_placeholder",
    urlEndpoint:
        import.meta.env.PUBLIC_IMAGEKIT_URL_ENDPOINT ||
        "https://ik.imagekit.io/your_imagekit_id/",
    authenticationEndpoint: import.meta.env.PUBLIC_API_URL
        ? `${import.meta.env.PUBLIC_API_URL}/api/imagekit/auth`
        : "http://localhost:3000/api/imagekit/auth",
};

/**
 * Clase para manejar ImageKit
 */
class ImageKitService {
    constructor() {
        this.imagekit = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar ImageKit
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Importar ImageKit dinámicamente (solo en el cliente)
            if (typeof window !== "undefined") {
                const ImageKit = await import("imagekit-javascript");

                this.imagekit = new ImageKit.default({
                    publicKey: IMAGEKIT_CONFIG.publicKey,
                    urlEndpoint: IMAGEKIT_CONFIG.urlEndpoint,
                    authenticationEndpoint:
                        IMAGEKIT_CONFIG.authenticationEndpoint,
                });

                this.isInitialized = true;
                console.log("ImageKit inicializado correctamente");
            }
        } catch (error) {
            console.error("Error inicializando ImageKit:", error);
            throw new Error("No se pudo inicializar ImageKit");
        }
    }

    /**
     * Subir imagen a ImageKit
     * @param {File} file - Archivo de imagen
     * @param {Object} options - Opciones de subida
     * @returns {Promise<Object>} Resultado de la subida
     */
    async uploadImage(file, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.imagekit) {
            throw new Error("ImageKit no está inicializado");
        }

        // Validar archivo
        this.validateImage(file);

        const uploadOptions = {
            file: file,
            fileName: options.fileName || this.generateFileName(file),
            folder: options.folder || "/profiles/",
            useUniqueFileName: options.useUniqueFileName !== false,
            tags: options.tags || ["profile", "egresado"],
            ...options,
        };

        try {
            console.log(
                "Subiendo imagen a ImageKit...",
                uploadOptions.fileName
            );

            const result = await this.imagekit.upload(uploadOptions);

            console.log("Imagen subida exitosamente:", result);

            return {
                success: true,
                fileId: result.fileId,
                name: result.name,
                url: result.url,
                thumbnailUrl: result.thumbnailUrl,
                filePath: result.filePath,
                size: result.size,
                width: result.width,
                height: result.height,
            };
        } catch (error) {
            console.error("Error subiendo imagen a ImageKit:", error);
            throw new Error(`Error al subir imagen: ${error.message}`);
        }
    }

    /**
     * Eliminar imagen de ImageKit
     * @param {string} fileId - ID del archivo en ImageKit
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    async deleteImage(fileId) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.imagekit) {
            throw new Error("ImageKit no está inicializado");
        }

        try {
            await this.imagekit.deleteFile(fileId);
            console.log("Imagen eliminada de ImageKit:", fileId);
            return true;
        } catch (error) {
            console.error("Error eliminando imagen de ImageKit:", error);
            return false;
        }
    }

    /**
     * Generar URL de imagen transformada
     * @param {string} imageUrl - URL base de la imagen
     * @param {Object} transformations - Transformaciones a aplicar
     * @returns {string} URL transformada
     */
    generateTransformedUrl(imageUrl, transformations = {}) {
        if (!imageUrl) return "";

        // Transformaciones por defecto para fotos de perfil
        const defaultTransformations = {
            width: 200,
            height: 200,
            crop: "face",
            cropMode: "extract",
            focus: "face",
            format: "webp",
            quality: 80,
            ...transformations,
        };

        // Construir query string de transformaciones
        const transformQuery = Object.entries(defaultTransformations)
            .map(([key, value]) => `tr=${key}-${value}`)
            .join(",");

        // Si la URL ya contiene transformaciones, reemplazarlas
        if (imageUrl.includes("?")) {
            const [baseUrl] = imageUrl.split("?");
            return `${baseUrl}?${transformQuery}`;
        }

        return `${imageUrl}?${transformQuery}`;
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
            "image/webp",
        ];
        if (!allowedTypes.includes(file.type)) {
            throw new Error(
                "Tipo de archivo no válido. Solo se permiten JPEG, PNG y WebP"
            );
        }

        // Verificar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new Error("El archivo es demasiado grande. Máximo 5MB");
        }

        // Verificar dimensiones mínimas si es posible
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const minWidth = 100;
                const minHeight = 100;

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
     * Generar nombre único para archivo
     * @param {File} file - Archivo
     * @returns {string} Nombre único
     */
    generateFileName(file) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split(".").pop() || "jpg";
        return `profile_${timestamp}_${randomId}.${extension}`;
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
     * Obtener configuración de ImageKit
     * @returns {Object} Configuración actual
     */
    getConfig() {
        return {
            ...IMAGEKIT_CONFIG,
            isInitialized: this.isInitialized,
        };
    }
}

// Instancia global del servicio
export const imageKitService = new ImageKitService();

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

    /**
     * Generar múltiples tamaños de una imagen
     * @param {string} baseUrl - URL base de ImageKit
     * @returns {Object} URLs para diferentes tamaños
     */
    generateResponsiveSizes(baseUrl) {
        if (!baseUrl) return {};

        return {
            thumbnail: imageKitService.generateTransformedUrl(baseUrl, {
                width: 50,
                height: 50,
                crop: "face",
            }),
            small: imageKitService.generateTransformedUrl(baseUrl, {
                width: 100,
                height: 100,
                crop: "face",
            }),
            medium: imageKitService.generateTransformedUrl(baseUrl, {
                width: 200,
                height: 200,
                crop: "face",
            }),
            large: imageKitService.generateTransformedUrl(baseUrl, {
                width: 400,
                height: 400,
                crop: "face",
            }),
            original: baseUrl,
        };
    },

    /**
     * Validar URL de ImageKit
     * @param {string} url - URL a validar
     * @returns {boolean} True si es una URL válida de ImageKit
     */
    isImageKitUrl(url) {
        if (!url || typeof url !== "string") return false;
        return (
            url.includes("imagekit.io") ||
            url.startsWith(IMAGEKIT_CONFIG.urlEndpoint)
        );
    },
};

export default {
    imageKitService,
    ImageUtils,
    IMAGEKIT_CONFIG,
};
