/**
 * Script para obtener las credenciales del usuario de prueba
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import database from "../src/config/database.js";

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

async function obtenerCredenciales() {
    await database.connect();
    const client = database.getClient();

    try {
        const result = await client.execute({
            sql: `
                SELECT u.id, u.nombre, u.email, e.dni, e.telefono
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                WHERE u.id = 15
            `,
            args: []
        });

        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log("\n" + "=".repeat(60));
            console.log("📋 CREDENCIALES DEL USUARIO DE PRUEBA");
            console.log("=".repeat(60));
            console.log("\n👤 Nombre:", user.nombre);
            console.log("📧 Email:", user.email);
            console.log("🔑 Contraseña: Test1234!");
            console.log("🆔 DNI:", user.dni);
            console.log("📱 Teléfono:", user.telefono);
            console.log("\n💡 Usa estas credenciales para iniciar sesión");
            console.log("=".repeat(60) + "\n");
        } else {
            console.log("❌ Usuario no encontrado");
        }
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

obtenerCredenciales()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error fatal:", error);
        process.exit(1);
    });
