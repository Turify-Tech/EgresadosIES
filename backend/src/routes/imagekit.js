/**
 * Endpoint para autenticación de ImageKit
 * Sistema de Gestión de Egresados IES
 */

import express from "express";
import crypto from "crypto";
const router = express.Router();

// Configuración de ImageKit (desde variables de entorno)
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY;

/**
 * GET /api/imagekit/auth
 * Generar parámetros de autenticación para ImageKit
 */
router.get("/auth", async (req, res) => {
    try {
        // Verificar que las claves están configuradas
        if (!IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_PUBLIC_KEY) {
            return res.status(500).json({
                error: "ImageKit no está configurado correctamente",
            });
        }

        // Generar token y expiración
        const token = crypto.randomUUID();
        const expire = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutos de expiración

        // Crear la cadena a firmar
        const stringToSign = `${token}${expire}`;

        // Generar firma usando HMAC SHA1
        const signature = crypto
            .createHmac("sha1", IMAGEKIT_PRIVATE_KEY)
            .update(stringToSign)
            .digest("hex");

        // Respuesta con los parámetros necesarios
        res.json({
            token: token,
            expire: expire,
            signature: signature,
            publicKey: IMAGEKIT_PUBLIC_KEY,
        });
    } catch (error) {
        console.error("Error generando autenticación ImageKit:", error);
        res.status(500).json({
            error: "Error interno del servidor",
        });
    }
});

export default router;
