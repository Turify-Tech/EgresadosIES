import database from "../src/config/database.js";
import readline from "readline";

/**
 * Script para agregar DNIs válidos de egresados
 * Uso: node scripts/add-valid-dni.js
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function addValidDni() {
    try {
        console.log("\n=== Agregar DNI Válido de Egresado ===\n");

        // Obtener carreras disponibles
        const client = database.getClient();
        const carrerasResult = await client.execute("SELECT id, nombre FROM Carrera");

        if (carrerasResult.rows.length === 0) {
            console.log("❌ No hay carreras disponibles. Creando 'Desarrollo de Software'...");
            await client.execute({
                sql: "INSERT INTO Carrera (nombre) VALUES (?)",
                args: ["Desarrollo de Software"],
            });
            console.log("✅ Carrera 'Desarrollo de Software' creada");
        }

        // Mostrar carreras
        const carreras = await client.execute("SELECT nombre FROM Carrera");
        console.log("Carreras disponibles:");
        carreras.rows.forEach((carrera, index) => {
            console.log(`  ${index + 1}. ${carrera.nombre}`);
        });
        console.log();

        // Solicitar datos
        const dni = await question("Ingresa el DNI (7-8 dígitos): ");
        const carreraNombre = await question(
            "Ingresa el nombre de la carrera (debe coincidir con la lista): "
        );

        // Validar DNI
        if (!/^\d{7,8}$/.test(dni)) {
            console.log("❌ Error: El DNI debe tener 7 u 8 dígitos");
            rl.close();
            return;
        }

        // Verificar si el DNI ya existe
        const existingDni = await client.execute({
            sql: "SELECT dni FROM DniValido WHERE dni = ?",
            args: [dni],
        });

        if (existingDni.rows.length > 0) {
            console.log(`⚠️  El DNI ${dni} ya está registrado como válido`);
            rl.close();
            return;
        }

        // Insertar DNI válido
        await client.execute({
            sql: "INSERT INTO DniValido (dni, carrera) VALUES (?, ?)",
            args: [dni, carreraNombre],
        });

        console.log(`\n✅ DNI ${dni} agregado exitosamente!`);
        console.log(`   Carrera: ${carreraNombre}`);
        console.log("\nAhora puedes usar este DNI para registrarte en /acceso\n");

        rl.close();
    } catch (error) {
        console.error("❌ Error al agregar DNI:", error.message);
        rl.close();
    }
}

addValidDni();
