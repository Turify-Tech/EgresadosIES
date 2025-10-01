import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import database from "../src/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
    try {
        console.log("🗂️  Iniciando migración de base de datos...");

        // Conectar a la base de datos
        await database.connect();
        const db = database.getClient();

        // Leer el archivo schema.sql
        const schemaPath = path.join(__dirname, "..", "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf8");

        // Dividir el schema en comandos individuales
        const commands = schemaSql
            .split(";")
            .map((cmd) => cmd.trim())
            .filter(
                (cmd) =>
                    cmd &&
                    !cmd.startsWith("--") &&
                    cmd !== "PRAGMA foreign_keys = ON"
            );

        console.log(
            `📋 Ejecutando ${commands.length} comandos de migración...`
        );

        // Ejecutar cada comando
        for (const command of commands) {
            if (command) {
                try {
                    await db.execute(command);
                } catch (error) {
                    // Ignorar errores de "tabla ya existe"
                    if (!error.message.includes("already exists")) {
                        throw error;
                    }
                }
            }
        }

        // Verificar que las tablas se crearon
        const tables = await db.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        );

        console.log("✅ Migración completada exitosamente");
        console.log(
            `📊 Tablas creadas: ${tables.rows
                .map((row) => row.name)
                .join(", ")}`
        );

        await database.disconnect();
    } catch (error) {
        console.error("❌ Error en migración:", error);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(console.error);
}

export default runMigrations;
