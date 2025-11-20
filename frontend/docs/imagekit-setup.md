# Configuración de ImageKit para el Sistema de Gestión de Egresados

## Introducción

ImageKit es un servicio de gestión de imágenes que proporciona CDN, optimización automática, transformaciones en tiempo real y almacenamiento confiable. Este documento explica cómo configurar ImageKit para manejar las imágenes de perfil de los egresados.

## 1. Crear Cuenta en ImageKit

1. Ve a [ImageKit.io](https://imagekit.io/)
2. Crea una cuenta gratuita (incluye 20GB de almacenamiento y 20GB de transferencia por mes)
3. Confirma tu email y accede al dashboard

## 2. Obtener Credenciales

Una vez en el dashboard de ImageKit:

1. Ve a **Developer → API Keys** en el menú lateral
2. Copia las siguientes credenciales:
    - **Public Key** - Se usa en el frontend
    - **Private Key** - Se usa en el backend (NUNCA exponer)
    - **URL Endpoint** - URL base para tus imágenes

## 3. Configurar Variables de Entorno

### Frontend (.env)

Actualiza el archivo `/frontend/.env`:

```bash
# ImageKit Configuration
PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/tu_imagekit_id/
```

### Backend (.env)

Actualiza el archivo `/backend/.env`:

```bash
# ImageKit Configuration
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxxx
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxxx
```

## 4. Configurar Carpetas en ImageKit

En el dashboard de ImageKit:

1. Ve a **Media Library**
2. Crea las siguientes carpetas:
    ```
    /profiles/          # Para fotos de perfil
    /documents/         # Para CVs y documentos
    /posts/            # Para imágenes de posts sociales
    ```

## 5. Configurar Transformaciones Predefinidas

Para optimizar el rendimiento, configura estas transformaciones:

### Profile Avatar (200x200)

-   **Name:** `profile-avatar`
-   **Transformation:** `w-200,h-200,c-face`
-   **Format:** WebP con fallback a JPEG

### Profile Thumbnail (50x50)

-   **Name:** `profile-thumb`
-   **Transformation:** `w-50,h-50,c-face`
-   **Format:** WebP con fallback a JPEG

### Profile Large (400x400)

-   **Name:** `profile-large`
-   **Transformation:** `w-400,h-400,c-face`
-   **Format:** WebP con fallback a JPEG

## 6. Configurar Webhooks (Opcional)

Para recibir notificaciones de subidas/eliminaciones:

1. Ve a **Developer → Webhooks**
2. Agrega webhook URL: `https://tu-dominio.com/api/imagekit/webhook`
3. Selecciona eventos:
    - `upload.success`
    - `upload.error`
    - `delete.success`

## 7. Políticas de Seguridad

### Restricciones de Subida

En **Settings → Upload**:

```json
{
    "maxFileSize": 5242880, // 5MB máximo
    "allowedFileTypes": ["jpg", "jpeg", "png", "webp"],
    "folder": "/profiles/",
    "useUniqueFileName": true,
    "tags": ["profile", "egresado"]
}
```

### CORS Configuration

En **Settings → CORS**:

```json
{
    "allowedOrigins": ["http://localhost:4321", "https://tu-dominio.com"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"]
}
```

## 8. Funcionalidades Implementadas

### Servicio ImageKit (`/src/utils/imagekit.js`)

-   ✅ **Autenticación automática** - Se conecta usando las credenciales configuradas
-   ✅ **Validación de archivos** - Verifica tipo, tamaño y dimensiones
-   ✅ **Compresión automática** - Reduce archivos grandes antes de subir
-   ✅ **Transformaciones** - Genera URLs optimizadas para diferentes tamaños
-   ✅ **Manejo de errores** - Mensajes específicos para diferentes tipos de error
-   ✅ **Preview local** - Muestra preview inmediato antes de subir

### Integración en Perfil (`/src/pages/perfil/editar.astro`)

-   ✅ **Subida real** - Reemplaza el sistema simulado con ImageKit
-   ✅ **URLs optimizadas** - Usa transformaciones para cargar imágenes eficientemente
-   ✅ **Compatibilidad legacy** - Mantiene compatibilidad con URLs existentes
-   ✅ **Carga inteligente** - Detecta si la imagen es de ImageKit para optimizar

### Backend (`/src/routes/imagekit.js`)

-   ✅ **Autenticación segura** - Genera tokens temporales para subidas frontend
-   ✅ **Firmas HMAC** - Valida autenticidad de las solicitudes
-   ✅ **Tokens de expiración** - Tokens válidos por 10 minutos máximo

## 9. Uso en Producción

### Variables de Entorno Requeridas

```bash
# Frontend
PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxxx
PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/tu_id/

# Backend
IMAGEKIT_PRIVATE_KEY=private_xxxxx
IMAGEKIT_PUBLIC_KEY=public_xxxxx
```

### CDN y Performance

ImageKit proporciona automáticamente:

-   **CDN Global** - Entrega rápida desde 300+ ubicaciones
-   **Optimización automática** - Compresión inteligente y formatos modernos
-   **Responsive Images** - Transformaciones basadas en dispositivo
-   **Lazy Loading** - Carga progresiva de imágenes

## 10. Monitoreo y Análisis

En el dashboard puedes monitorear:

-   **Uso de ancho de banda** - Transferencia mensual
-   **Almacenamiento** - Espacio ocupado por carpeta
-   **Transformaciones** - Número de optimizaciones aplicadas
-   **Errores** - Logs de subidas fallidas

## 11. Costos y Límites

### Plan Gratuito (Free Tier)

-   20GB almacenamiento
-   20GB transferencia/mes
-   Transformaciones ilimitadas
-   CDN incluido

### Escalamiento

Si excedes los límites gratuitos, ImageKit tiene planes pagos escalables:

-   **Starter:** $20/mes - 100GB almacenamiento, 100GB transferencia
-   **Growth:** $79/mes - 500GB almacenamiento, 500GB transferencia
-   **Pro:** Personalizado

## 12. Troubleshooting

### Errores Comunes

1. **Error 401 Unauthorized**

    - Verificar que las claves estén correctas
    - Confirmar que el token no esté expirado

2. **CORS Errors**

    - Verificar configuración CORS en ImageKit
    - Asegurarse de que el origen esté permitido

3. **File Too Large**

    - Reducir tamaño del archivo
    - Verificar límites en ImageKit settings

4. **Transformation Failed**
    - Verificar que la transformación esté bien formada
    - Probar con parámetros más simples

### Debug Mode

Para activar logs detallados, agrega en el navegador:

```javascript
localStorage.setItem("imagekit-debug", "true");
```

## 13. Seguridad

### Mejores Prácticas

-   ✅ **Nunca exponer la clave privada** en el frontend
-   ✅ **Usar tokens de corta duración** (máximo 10 minutos)
-   ✅ **Validar archivos** tanto frontend como backend
-   ✅ **Configurar CORS** restrictivamente
-   ✅ **Monitorear uso** regularmente

### Ejemplo de Configuración Segura

```javascript
// ❌ NUNCA hacer esto
const privateKey = "private_xxxxx"; // En frontend

// ✅ Hacer esto instead
const authToken = await fetch("/api/imagekit/auth").then((r) => r.json());
```

---

## Conclusión

Con esta configuración, el sistema puede manejar de forma eficiente y segura las imágenes de perfil de los egresados, proporcionando:

-   **Performance óptimo** mediante CDN y optimizaciones
-   **Experiencia de usuario mejorada** con carga rápida de imágenes
-   **Escalabilidad** para manejar crecimiento futuro
-   **Seguridad robusta** mediante autenticación y validaciones

Para soporte adicional, consulta la [documentación oficial de ImageKit](https://docs.imagekit.io/) o contacta su soporte técnico.
