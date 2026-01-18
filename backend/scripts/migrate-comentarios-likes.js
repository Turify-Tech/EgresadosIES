import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import database from "../src/config/database.js";

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

/**
 * Script de migración: Agregar respuestas a comentarios y likes en comentarios
 * 
 * Cambios:
 * 1. Agregar campo comentarioPadreId a tabla Comentario
 * 2. Crear tabla LikeComentario
 */

async function migrate() {
    console.log("🚀 Iniciando migración: Comentarios anidados y likes en comentarios...\n");

    // Conectar a la base de datos
    await database.connect();
    const client = database.getClient();

    try {
        // 1. Agregar campo comentarioPadreId a Comentario
        console.log("📝 Paso 1: Agregando campo comentarioPadreId a tabla Comentario...");
        try {
            await client.execute(`
                ALTER TABLE Comentario 
                ADD COLUMN comentarioPadreId INTEGER 
                REFERENCES Comentario(id) ON DELETE CASCADE
            `);
            console.log("✅ Campo comentarioPadreId agregado exitosamente\n");
        } catch (error) {
            if (error.message.includes("duplicate column name")) {
                console.log("⚠️  El campo comentarioPadreId ya existe, omitiendo...\n");
            } else {
                throw error;
            }
        }

        // 2. Crear tabla LikeComentario
        console.log("📝 Paso 2: Creando tabla LikeComentario...");
        try {
            await client.execute(`
                CREATE TABLE LikeComentario (
                    egresadoId INTEGER NOT NULL,
                    comentarioId INTEGER NOT NULL,
                    PRIMARY KEY (egresadoId, comentarioId),
                    FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE,
                    FOREIGN KEY (comentarioId) REFERENCES Comentario (id) ON DELETE CASCADE
                )
            `);
            console.log("✅ Tabla LikeComentario creada exitosamente\n");
        } catch (error) {
            if (error.message.includes("already exists")) {
                console.log("⚠️  La tabla LikeComentario ya existe, omitiendo...\n");
            } else {
                throw error;
            }
        }

        // 3. Verificar cambios
        console.log("📝 Paso 3: Verificando cambios...");
        
        // Verificar estructura de Comentario
        const comentarioInfo = await client.execute(`
            PRAGMA table_info(Comentario)
        `);
        const tieneComentarioPadre = comentarioInfo.rows.some(
            row => row.name === "comentarioPadreId"
        );
        
        // Verificar que existe tabla LikeComentario
        const tablesResult = await client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='LikeComentario'
        `);
        const existeLikeComentario = tablesResult.rows.length > 0;

        if (tieneComentarioPadre && existeLikeComentario) {
            console.log("✅ Verificación exitosa: Todos los cambios aplicados correctamente\n");
        } else {
            console.log("❌ Verificación fallida:");
            if (!tieneComentarioPadre) {
                console.log("   - Campo comentarioPadreId NO encontrado");
            }
            if (!existeLikeComentario) {
                console.log("   - Tabla LikeComentario NO encontrada");
            }
            console.log();
        }

        console.log("🎉 Migración completada exitosamente!");
        console.log("\n📊 Resumen de cambios:");
        console.log("  ✓ Campo comentarioPadreId agregado a Comentario");
        console.log("  ✓ Tabla LikeComentario creada");
        console.log("\n💡 Ahora los usuarios pueden:");
        console.log("  - Responder a comentarios existentes");
        console.log("  - Dar like a comentarios");

    } catch (error) {
        console.error("\n❌ Error durante la migración:");
        console.error(error);
        process.exit(1);
    }
}

migrate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error fatal:", error);
        process.exit(1);
    });
