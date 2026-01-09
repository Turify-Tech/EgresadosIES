import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import database from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import busquedaRoutes from "./routes/busquedaRoutes.js";
import perfilRoutes from "./routes/perfilRoutes.js";
import perfilesRoutes from "./routes/perfilesRoutes.js";
import carrerasRoutes from "./routes/carrerasRoutes.js";
import mensajesRoutes from "./routes/mensajesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicacionesRoutes from "./routes/publicacionesRoutes.js";
import comentariosRoutes from "./routes/comentariosRoutes.js";
import likesRoutes from "./routes/likesRoutes.js";

// Configurar dotenv con ruta absoluta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");

console.log("🔧 Cargando variables de entorno desde:", envPath);
dotenv.config({ path: envPath });

// Debug: Verificar configuración básica
console.log("🔍 Environment Check:", {
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:4321",
    workingDir: process.cwd(),
    envPath: envPath,
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// CORS
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:4321",
        credentials: true,
    })
);

// Logging
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
}

// Parsing de JSON y URL encoded
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Servir archivos estáticos (uploads) con CORS
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "http://localhost:4321");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(uploadsPath));
console.log("📁 Sirviendo archivos estáticos desde:", uploadsPath);

// Health check endpoint
app.get("/api/health", async (req, res) => {
    try {
        // Verificar conexión a la base de datos
        const dbHealth = await database.healthCheck();

        res.status(200).json({
            status: "OK",
            message: "Sistema de Gestión de Egresados IES - API funcionando",
            timestamp: new Date().toISOString(),
            version: "1.0.0",
            database: dbHealth ? "Connected" : "Disconnected",
        });
    } catch (error) {
        res.status(503).json({
            status: "Error",
            message: "Error en el servicio",
            timestamp: new Date().toISOString(),
            database: "Error",
        });
    }
});

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/buscar", busquedaRoutes);
// app.use('/api/perfil', require('./routes/perfilRoutes'));
// app.use('/api/perfiles', require('./routes/perfilesRoutes'));
app.use("/api/perfil", perfilRoutes);
app.use("/api/perfiles", perfilesRoutes);
app.use("/api/carreras", carrerasRoutes);
app.use("/api/mensajes", mensajesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/publicaciones", publicacionesRoutes);
app.use("/api/comentarios", comentariosRoutes);
app.use("/api/likes", likesRoutes);

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
    console.error("Error:", err.stack);

    // Error de validación JSON
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "JSON inválido en la solicitud",
        });
    }

    // Error genérico
    res.status(err.status || 500).json({
        success: false,
        message:
            process.env.NODE_ENV === "production"
                ? "Error interno del servidor"
                : err.message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.originalUrl} no encontrada`,
    });
});

// Iniciar servidor solo si no está en testing
if (process.env.NODE_ENV !== "test") {
    // Conectar a la base de datos primero
    database
        .connect()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`� Servidor corriendo en http://localhost:${PORT}`);
                console.log(
                    `📊 Health check: http://localhost:${PORT}/api/health`
                );
                console.log(
                    `� Auth login: http://localhost:${PORT}/api/auth/login`
                );
                console.log(
                    `� Perfil: http://localhost:${PORT}/api/perfil/mi-perfil`
                );
                console.log(
                    `� Perfiles públicos: http://localhost:${PORT}/api/perfiles`
                );
                console.log(
                    `🎓 Carreras: http://localhost:${PORT}/api/carreras`
                );
                console.log(
                    `💬 Mensajes: http://localhost:${PORT}/api/mensajes`
                );
                console.log(
                    `⚙️  Admin DNIs: http://localhost:${PORT}/api/admin/dnis`
                );
                console.log(
                    `🌍 Entorno: ${process.env.NODE_ENV || "development"}`
                );
            });
        })
        .catch((error) => {
            console.error("❌ Error al iniciar la aplicación:", error);
            process.exit(1);
        });
}

export default app;
