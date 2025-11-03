/**
 * Script de migración para agregar tablas de Habilidades y Proyectos
 * Sistema de Gestión de Egresados IES
 */

import dotenv from "dotenv";
import database from "../src/config/database.js";

// Cargar variables de entorno
dotenv.config();

async function runMigrations() {
    try {
        console.log("🔧 Iniciando migración de base de datos...");

        // Conectar a la base de datos
        if (!database.isConnected) {
            await database.connect();
        }

        // Verificar si las tablas ya existen
        const existingTables = await database.client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND (name='Habilidades' OR name='Proyectos')
        `);

        const existingTableNames = existingTables.rows.map((row) => row.name);

        console.log("📋 Tablas existentes encontradas:", existingTableNames);

        // Crear tabla Habilidades si no existe
        if (!existingTableNames.includes("Habilidades")) {
            console.log("🆕 Creando tabla Habilidades...");

            await database.client.execute(`
                CREATE TABLE Habilidades (
                    id INTEGER PRIMARY KEY,
                    usuarioId INTEGER NOT NULL,
                    nombre TEXT NOT NULL,
                    tipo TEXT NOT NULL DEFAULT 'tecnica' CHECK (tipo IN ('tecnica', 'blanda', 'idioma')),
                    nivel TEXT NOT NULL DEFAULT 'intermedio' CHECK (nivel IN ('basico', 'intermedio', 'avanzado', 'experto')),
                    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuarioId) REFERENCES Egresado (id) ON DELETE CASCADE,
                    UNIQUE(usuarioId, nombre)
                )
            `);

            console.log("✅ Tabla Habilidades creada exitosamente");
        } else {
            console.log("⚠️ Tabla Habilidades ya existe, saltando...");
        }

        // Crear tabla Proyectos si no existe
        if (!existingTableNames.includes("Proyectos")) {
            console.log("🆕 Creando tabla Proyectos...");

            await database.client.execute(`
                CREATE TABLE Proyectos (
                    id INTEGER PRIMARY KEY,
                    usuarioId INTEGER NOT NULL,
                    nombre TEXT NOT NULL,
                    descripcion TEXT,
                    enlace TEXT,
                    tecnologias TEXT,
                    fechaProyecto DATE,
                    imagen TEXT,
                    fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuarioId) REFERENCES Egresado (id) ON DELETE CASCADE
                )
            `);

            console.log("✅ Tabla Proyectos creada exitosamente");
        } else {
            console.log("⚠️ Tabla Proyectos ya existe, saltando...");
        }

        // Verificar la estructura final
        const finalTables = await database.client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name IN ('Habilidades', 'Proyectos')
        `);

        console.log("🎉 Migración completada exitosamente!");
        console.log(
            "📊 Tablas disponibles:",
            finalTables.rows.map((row) => row.name)
        );
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
        throw error;
    } finally {
        await database.disconnect();
        console.log("🔒 Conexión a base de datos cerrada");
    }
}

// Ejecutar migración si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations()
        .then(() => {
            console.log("✨ Migración completada exitosamente");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Error en migración:", error);
            process.exit(1);
        });
}

export { runMigrations };
