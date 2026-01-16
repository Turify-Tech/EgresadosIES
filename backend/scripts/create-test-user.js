/**
 * Script para crear un usuario de prueba para mensajería
 * Ejecutar con: node scripts/create-test-user.js
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import database from "../src/config/database.js";
import bcrypt from "bcryptjs";

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

async function crearUsuarioPrueba() {
    // Conectar a la base de datos
    await database.connect();
    const client = database.getClient();

    try {
        console.log("🔄 Creando usuario de prueba para mensajería...\n");

        // Datos del nuevo usuario
        const nuevoUsuario = {
            nombre: "Pedro Sánchez",
            email: "pedro.sanchez@test.com",
            dni: "98765432",
            telefono: "+54 11 9876-5432",
            password: "Test1234!",
            carrera: "Ingeniería en Sistemas",
            resumenProfesional: "Desarrollador Mobile especializado en React Native y Flutter. Experiencia en desarrollo de aplicaciones iOS y Android.",
            situacionLaboral: "Empleado"
        };

        // 1. Verificar si el usuario ya existe
        const verificarUsuario = await client.execute({
            sql: "SELECT u.id FROM Usuario u LEFT JOIN Egresado e ON u.id = e.id WHERE u.email = ? OR e.dni = ?",
            args: [nuevoUsuario.email, nuevoUsuario.dni]
        });

        if (verificarUsuario.rows.length > 0) {
            console.log("⚠️  El usuario ya existe en la base de datos");
            console.log("\n📧 Credenciales del usuario existente:");
            console.log("   Email:", nuevoUsuario.email);
            console.log("   Contraseña: Test1234!");
            return;
        }

        // 2. Hash de la contraseña
        const hashedPassword = await bcrypt.hash(nuevoUsuario.password, 10);

        // 3. Insertar usuario
        const resultUsuario = await client.execute({
            sql: `
                INSERT INTO Usuario (nombre, email, password, tipo_usuario)
                VALUES (?, ?, ?, 'Egresado')
            `,
            args: [
                nuevoUsuario.nombre,
                nuevoUsuario.email,
                hashedPassword
            ]
        });

        const usuarioId = Number(resultUsuario.lastInsertRowid);
        console.log(`✅ Usuario creado con ID: ${usuarioId}`);

        // 4. Crear perfil de egresado con DNI y teléfono
        await client.execute({
            sql: `
                INSERT INTO Egresado (id, dni, telefono)
                VALUES (?, ?, ?)
            `,
            args: [usuarioId, nuevoUsuario.dni, nuevoUsuario.telefono]
        });
        console.log("✅ Perfil de egresado creado");

        // 5. Crear perfil detallado
        const resultPerfil = await client.execute({
            sql: `
                INSERT INTO Perfil (resumenProfesional, situacionLaboral)
                VALUES (?, ?)
            `,
            args: [
                nuevoUsuario.resumenProfesional,
                nuevoUsuario.situacionLaboral
            ]
        });
        const perfilId = Number(resultPerfil.lastInsertRowid);

        // 6. Asociar perfil y carrera al egresado
        // Primero obtener o crear la carrera
        const carreraResult = await client.execute({
            sql: "SELECT id FROM Carrera WHERE nombre = ?",
            args: [nuevoUsuario.carrera]
        });
        
        let carreraId;
        if (carreraResult.rows.length > 0) {
            carreraId = Number(carreraResult.rows[0].id);
        } else {
            const nuevaCarrera = await client.execute({
                sql: "INSERT INTO Carrera (nombre) VALUES (?)",
                args: [nuevoUsuario.carrera]
            });
            carreraId = Number(nuevaCarrera.lastInsertRowid);
        }

        await client.execute({
            sql: "UPDATE Egresado SET perfilId = ?, carreraId = ? WHERE id = ?",
            args: [perfilId, carreraId, usuarioId]
        });
        console.log("✅ Perfil detallado creado y asociado");

        // 7. Agregar experiencia laboral
        await client.execute({
            sql: `
                INSERT INTO ExperienciaLaboral (
                    puesto, empresa, fechaInicio, descripcion, perfilId
                )
                VALUES (?, ?, ?, ?, ?)
            `,
            args: [
                "Desarrollador Mobile",
                "TechMobile Solutions",
                "2022-06-01",
                "Desarrollo de aplicaciones móviles nativas y multiplataforma usando React Native",
                perfilId
            ]
        });
        console.log("✅ Experiencia laboral agregada");

        // 8. Agregar habilidades (si existe la tabla)
        try {
            const habilidades = ["React Native", "Flutter", "JavaScript", "TypeScript", "Firebase"];
            for (const habilidad of habilidades) {
                await client.execute({
                    sql: `INSERT INTO Habilidad (nombre, perfilId) VALUES (?, ?)`,
                    args: [habilidad, perfilId]
                });
            }
            console.log(`✅ ${habilidades.length} habilidades agregadas`);
        } catch (error) {
            console.log("⚠️  Tabla Habilidad no disponible, omitiendo habilidades");
        }

        console.log("\n" + "=".repeat(60));
        console.log("🎉 Usuario de prueba creado exitosamente!");
        console.log("=".repeat(60));
        console.log("\n📋 CREDENCIALES PARA PRUEBA DE MENSAJERÍA:\n");
        console.log("   👤 Nombre:", nuevoUsuario.nombre);
        console.log("   📧 Email:", nuevoUsuario.email);
        console.log("   🔑 Contraseña:", nuevoUsuario.password);
        console.log("   🆔 DNI:", nuevoUsuario.dni);
        console.log("   📱 Teléfono:", nuevoUsuario.telefono);
        console.log("\n💡 Usa estas credenciales para iniciar sesión y probar el sistema de mensajería");
        console.log("=".repeat(60) + "\n");

    } catch (error) {
        console.error("❌ Error al crear usuario de prueba:", error);
        throw error;
    }
}

// Ejecutar el script
crearUsuarioPrueba()
    .then(() => {
        console.log("✅ Script completado");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error fatal:", error);
        process.exit(1);
    });
