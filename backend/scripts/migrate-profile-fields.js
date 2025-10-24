import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Script de migración para agregar campos faltantes del formulario de perfil
 * Sin modificar la estructura existente de las tablas
 */

async function runMigration() {
    const databaseUrl =
        process.env.DATABASE_URL ||
        `file:${path.join(__dirname, "../database.db")}`;
    const client = createClient({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    console.log("🔄 Iniciando migración de campos de perfil...");

    try {
        // Verificar qué columnas ya existen
        const usuarioColumns = await client.execute(
            `PRAGMA table_info(Usuario)`
        );
        const egresadoColumns = await client.execute(
            `PRAGMA table_info(Egresado)`
        );
        const perfilColumns = await client.execute(`PRAGMA table_info(Perfil)`);

        console.log("📋 Columnas actuales:");
        console.log(
            "Usuario:",
            usuarioColumns.rows.map((col) => col.name)
        );
        console.log(
            "Egresado:",
            egresadoColumns.rows.map((col) => col.name)
        );
        console.log(
            "Perfil:",
            perfilColumns.rows.map((col) => col.name)
        );

        // Verificar y agregar campos faltantes en Usuario
        const usuarioColumnNames = usuarioColumns.rows.map((col) => col.name);

        if (!usuarioColumnNames.includes("apellido")) {
            console.log('➕ Agregando columna "apellido" a tabla Usuario');
            await client.execute(
                `ALTER TABLE Usuario ADD COLUMN apellido TEXT`
            );
        }

        // Mapear correo → email (ya existe)
        // El campo email ya existe en Usuario, solo necesitamos mapear correo → email en el frontend

        // Verificar y agregar campos faltantes en Egresado
        const egresadoColumnNames = egresadoColumns.rows.map((col) => col.name);

        // El campo telefono ya existe en Egresado
        // Solo necesitamos mapear contacto → telefono en el frontend

        // Verificar y agregar campos adicionales que podrían necesitarse en Perfil
        const perfilColumnNames = perfilColumns.rows.map((col) => col.name);

        // Campos opcionales adicionales para el perfil
        const additionalPerfilFields = [
            { name: "fechaNacimiento", type: "DATE" },
            { name: "direccion", type: "TEXT" },
            { name: "ciudad", type: "TEXT" },
            { name: "provincia", type: "TEXT" },
            { name: "pais", type: 'TEXT DEFAULT "Argentina"' },
        ];

        for (const field of additionalPerfilFields) {
            if (!perfilColumnNames.includes(field.name)) {
                console.log(
                    `➕ Agregando columna "${field.name}" a tabla Perfil`
                );
                await client.execute(
                    `ALTER TABLE Perfil ADD COLUMN ${field.name} ${field.type}`
                );
            }
        }

        // Crear índices para mejorar el rendimiento
        console.log("📇 Creando índices...");

        const indices = [
            "CREATE INDEX IF NOT EXISTS idx_usuario_apellido ON Usuario(apellido)",
            "CREATE INDEX IF NOT EXISTS idx_perfil_ciudad ON Perfil(ciudad)",
            "CREATE INDEX IF NOT EXISTS idx_perfil_provincia ON Perfil(provincia)",
        ];

        for (const indexSQL of indices) {
            try {
                await client.execute(indexSQL);
            } catch (error) {
                if (
                    !error.message.includes("already exists") &&
                    !error.message.includes("duplicate")
                ) {
                    console.warn("⚠️  Error creando índice:", error.message);
                }
            }
        }

        // Verificar las columnas después de la migración
        console.log("\n✅ Migración completada. Estructura actualizada:");

        const updatedUsuarioColumns = await client.execute(
            `PRAGMA table_info(Usuario)`
        );
        const updatedPerfilColumns = await client.execute(
            `PRAGMA table_info(Perfil)`
        );

        console.log(
            "Usuario:",
            updatedUsuarioColumns.rows.map((col) => col.name)
        );
        console.log(
            "Perfil:",
            updatedPerfilColumns.rows.map((col) => col.name)
        );

        console.log("\n📝 Mapeo de campos frontend → backend:");
        console.log("• nombre → Usuario.nombre");
        console.log("• apellido → Usuario.apellido (nueva columna)");
        console.log("• correo → Usuario.email (existente)");
        console.log("• contacto → Egresado.telefono (existente)");
        console.log("• dni → Egresado.dni (existente)");
        console.log("• telefono → Egresado.telefono (existente)");
        console.log(
            "• resumen-profesional → Perfil.resumenProfesional (existente)"
        );
        console.log("• url-portfolio → Perfil.urlPortfolio (existente)");
        console.log(
            "• situacion-laboral → Perfil.situacionLaboral (existente)"
        );
    } catch (error) {
        console.error("❌ Error en la migración:", error);
        throw error;
    } finally {
        client.close();
    }

    console.log("\n🎉 Migración completada exitosamente!");
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigration()
        .then(() => {
            console.log("✨ Script de migración finalizado");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Error ejecutando migración:", error);
            process.exit(1);
        });
}

export { runMigration };
