import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import database from "../src/config/database.js";

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "../.env");
dotenv.config({ path: envPath });

/**
 * Script de migración: Crear tabla ActividadAdmin
 * Este script crea la tabla para registrar actividades administrativas
 */

async function migrarActividadesAdmin() {
    try {
        console.log("🔄 Iniciando migración de tabla ActividadAdmin...");

        await database.connect();
        const client = database.getClient();

        // Crear tabla ActividadAdmin
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS ActividadAdmin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                adminId INTEGER NOT NULL,
                tipoAccion TEXT NOT NULL CHECK (tipoAccion IN (
                    'AGREGAR_DNI',
                    'EDITAR_DNI',
                    'ELIMINAR_DNI',
                    'CARGAR_EXCEL',
                    'VER_ESTADISTICAS',
                    'ACCESO_PANEL'
                )),
                descripcion TEXT NOT NULL,
                detalles TEXT,
                fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (adminId) REFERENCES Administrador (id) ON DELETE CASCADE
            )
        `;

        await client.execute(createTableQuery);
        console.log("✅ Tabla ActividadAdmin creada exitosamente");

        // Crear índice para mejorar el rendimiento
        const createIndexQuery = `
            CREATE INDEX IF NOT EXISTS idx_actividad_admin 
            ON ActividadAdmin(adminId, fechaCreacion DESC)
        `;

        await client.execute(createIndexQuery);
        console.log("✅ Índice idx_actividad_admin creado exitosamente");

        // Verificar que la tabla se creó correctamente
        const checkTable = await client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='ActividadAdmin'
        `);

        if (checkTable.rows.length > 0) {
            console.log("✅ Verificación exitosa: tabla ActividadAdmin existe");
        } else {
            throw new Error("La tabla no se creó correctamente");
        }

        // Insertar actividad de prueba para el primer administrador
        try {
            const adminCheck = await client.execute(`
                SELECT id FROM Administrador LIMIT 1
            `);

            if (adminCheck.rows.length > 0) {
                const adminId = adminCheck.rows[0].id;
                
                await client.execute({
                    sql: `
                        INSERT INTO ActividadAdmin (adminId, tipoAccion, descripcion, detalles, fechaCreacion)
                        VALUES (?, ?, ?, ?, datetime('now'))
                    `,
                    args: [
                        adminId,
                        'ACCESO_PANEL',
                        'Sistema de actividades inicializado',
                        JSON.stringify({ version: '1.0', migracion: true })
                    ]
                });

                console.log("✅ Actividad de prueba insertada");
            }
        } catch (error) {
            console.log("⚠️  No se pudo insertar actividad de prueba (puede no haber administradores)");
        }

        console.log("\n🎉 Migración completada exitosamente");
        console.log("📝 La tabla ActividadAdmin está lista para usar");

    } catch (error) {
        console.error("❌ Error en la migración:", error);
        process.exit(1);
    } finally {
        await database.disconnect();
    }
}

// Ejecutar migración
migrarActividadesAdmin();
