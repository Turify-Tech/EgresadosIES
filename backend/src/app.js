import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import database from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());

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
// app.use('/api/perfil', require('./routes/perfilRoutes'));
// app.use('/api/perfiles', require('./routes/perfilesRoutes'));

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
    database.connect()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
                console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
                console.log(`🔐 Auth login: http://localhost:${PORT}/api/auth/login`);
                console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
            });
        })
        .catch((error) => {
            console.error("❌ Error al iniciar la aplicación:", error);
            process.exit(1);
        });
}

export default app;
