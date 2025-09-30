import bcrypt from "bcryptjs";
import readline from "readline";
import database from "../src/config/database.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Función para hacer preguntas
function question(query) {
    return new Promise((resolve) => rl.question(query, resolve));
}

// Función para validar DNI argentino
function validateDNI(dni) {
    const dniRegex = /^\d{7,8}$/;
    return dniRegex.test(dni);
}

// Función para validar email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function createAdmin() {
    try {
        console.log("🔧 Creador de Administradores - Sistema de Egresados IES");
        console.log("=".repeat(55));

        // Conectar a la base de datos
        await database.connect();
        const db = database.getClient();

        // Verificar si hay administradores existentes
        const existingAdmins = await db.execute(
            "SELECT COUNT(*) as count FROM Administrador"
        );

        if (existingAdmins.rows[0].count > 0) {
            console.log(
                `ℹ️  Ya existen ${existingAdmins.rows[0].count} administrador(es) en el sistema.`
            );
            const continuar = await question(
                "¿Deseas crear otro administrador? (s/N): "
            );
            if (
                continuar.toLowerCase() !== "s" &&
                continuar.toLowerCase() !== "si"
            ) {
                console.log("❌ Operación cancelada");
                rl.close();
                await database.disconnect();
                return;
            }
        }

        let adminData = {};

        // Usar valores por defecto o pedir datos
        const useDefaults = await question(
            "¿Usar valores por defecto para desarrollo? (S/n): "
        );

        if (
            useDefaults.toLowerCase() === "n" ||
            useDefaults.toLowerCase() === "no"
        ) {
            // Pedir datos manualmente
            console.log("\n📝 Ingresa los datos del nuevo administrador:");

            // Nombre
            adminData.nombre = await question("Nombre completo: ");
            while (!adminData.nombre.trim()) {
                console.log("❌ El nombre es requerido");
                adminData.nombre = await question("Nombre completo: ");
            }

            // DNI
            adminData.dni = await question("DNI (sin puntos ni espacios): ");
            while (!validateDNI(adminData.dni)) {
                console.log("❌ DNI inválido. Debe tener 7-8 dígitos.");
                adminData.dni = await question("DNI: ");
            }

            // Verificar DNI único
            const existingDNI = await db.execute(
                "SELECT id FROM Administrador WHERE dni = ?",
                [adminData.dni]
            );
            if (existingDNI.rows.length > 0) {
                console.log("❌ Ya existe un administrador con ese DNI");
                rl.close();
                await database.disconnect();
                return;
            }

            // Email
            adminData.email = await question("Email: ");
            while (!validateEmail(adminData.email)) {
                console.log("❌ Email inválido");
                adminData.email = await question("Email: ");
            }

            // Verificar email único
            const existingEmail = await db.execute(
                "SELECT id FROM Usuario WHERE email = ?",
                [adminData.email]
            );
            if (existingEmail.rows.length > 0) {
                console.log("❌ Ya existe un usuario con ese email");
                rl.close();
                await database.disconnect();
                return;
            }

            // Contraseña
            adminData.password = await question("Contraseña: ");
            while (adminData.password.length < 6) {
                console.log(
                    "❌ La contraseña debe tener al menos 6 caracteres"
                );
                adminData.password = await question("Contraseña: ");
            }

            const confirmPassword = await question("Confirmar contraseña: ");
            while (adminData.password !== confirmPassword) {
                console.log("❌ Las contraseñas no coinciden");
                adminData.password = await question("Contraseña: ");
                const confirmPassword = await question(
                    "Confirmar contraseña: "
                );
            }
        } else {
            // Usar valores por defecto
            adminData = {
                nombre: process.env.DEFAULT_ADMIN_NAME || "Administrador IES",
                dni: process.env.DEFAULT_ADMIN_DNI || "00000000",
                email: process.env.DEFAULT_ADMIN_EMAIL || "admin@ies.edu.ar",
                password: process.env.DEFAULT_ADMIN_PASSWORD || "temporal123",
            };

            console.log("\n📋 Usando valores por defecto:");
            console.log(`Nombre: ${adminData.nombre}`);
            console.log(`DNI: ${adminData.dni}`);
            console.log(`Email: ${adminData.email}`);
            console.log(`Contraseña: ${adminData.password}`);
            console.log(
                "\n⚠️  IMPORTANTE: Cambia estas credenciales en producción"
            );
        }

        // Confirmar creación
        console.log("\n📄 Resumen del administrador a crear:");
        console.log(`Nombre: ${adminData.nombre}`);
        console.log(`DNI: ${adminData.dni}`);
        console.log(`Email: ${adminData.email}`);

        const confirm = await question("\n¿Crear este administrador? (S/n): ");
        if (confirm.toLowerCase() === "n" || confirm.toLowerCase() === "no") {
            console.log("❌ Operación cancelada");
            rl.close();
            await database.disconnect();
            return;
        }

        // Crear el administrador
        console.log("\n🔐 Creando administrador...");

        // Hash de la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(
            adminData.password,
            saltRounds
        );

        // Insertar en tabla Usuario
        const userResult = await db.execute(
            "INSERT INTO Usuario (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)",
            [adminData.nombre, adminData.email, hashedPassword, "Administrador"]
        );

        // Insertar en tabla Administrador
        await db.execute("INSERT INTO Administrador (id, dni) VALUES (?, ?)", [
            userResult.lastInsertRowid,
            adminData.dni,
        ]);

        console.log("✅ Administrador creado exitosamente!");
        console.log(`ID: ${userResult.lastInsertRowid}`);
        console.log(
            "\n🚀 Ahora puedes iniciar sesión con estas credenciales en /acceso"
        );
    } catch (error) {
        console.error("❌ Error creando administrador:", error.message);
    } finally {
        rl.close();
        await database.disconnect();
    }
}

// Función para listar administradores
async function listAdmins() {
    try {
        await database.connect();
        const db = database.getClient();

        const admins = await db.execute(`
      SELECT u.id, u.nombre, u.email, a.dni
      FROM Usuario u
      JOIN Administrador a ON u.id = a.id
      WHERE u.tipo_usuario = 'Administrador'
    `);

        console.log("\n📋 Administradores del sistema:");
        console.log("=".repeat(50));

        if (admins.rows.length === 0) {
            console.log("No hay administradores en el sistema");
        } else {
            admins.rows.forEach((admin) => {
                console.log(`ID: ${admin.id}`);
                console.log(`Nombre: ${admin.nombre}`);
                console.log(`DNI: ${admin.dni}`);
                console.log(`Email: ${admin.email}`);
                console.log("-".repeat(30));
            });
        }

        await database.disconnect();
    } catch (error) {
        console.error("❌ Error listando administradores:", error.message);
    }
}

// Función principal
async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--list") || args.includes("-l")) {
        await listAdmins();
    } else {
        await createAdmin();
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { createAdmin, listAdmins };
