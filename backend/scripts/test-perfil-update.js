#!/usr/bin/env node

/**
 * Script de prueba para verificar la funcionalidad del perfil actualizada
 * Simula una actualización completa del perfil con todos los campos
 */

import { createClient } from "@libsql/client";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testPerfilUpdate() {
    const databaseUrl =
        process.env.DATABASE_URL ||
        `file:${path.join(__dirname, "../database.db")}`;
    const client = createClient({
        url: databaseUrl,
        authToken: process.env.DATABASE_AUTH_TOKEN,
    });

    console.log("🧪 Iniciando test de actualización de perfil...");

    try {
        // 1. Verificar la estructura actual de la base de datos
        console.log("\n📋 Verificando estructura de la base de datos:");

        const usuarioColumns = await client.execute(
            `PRAGMA table_info(Usuario)`
        );
        const egresadoColumns = await client.execute(
            `PRAGMA table_info(Egresado)`
        );
        const perfilColumns = await client.execute(`PRAGMA table_info(Perfil)`);

        console.log(
            "Usuario:",
            usuarioColumns.rows.map((col) => col.name).join(", ")
        );
        console.log(
            "Egresado:",
            egresadoColumns.rows.map((col) => col.name).join(", ")
        );
        console.log(
            "Perfil:",
            perfilColumns.rows.map((col) => col.name).join(", ")
        );

        // 2. Buscar un usuario de prueba
        console.log("\n👤 Buscando usuario de prueba...");

        const usuarioTest = await client.execute(`
            SELECT u.id, u.nombre, u.email, e.dni, e.perfilId
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LIMIT 1
        `);

        if (usuarioTest.rows.length === 0) {
            console.log("❌ No hay usuarios de prueba en la base de datos");
            return;
        }

        const usuario = usuarioTest.rows[0];
        console.log("✅ Usuario encontrado:", usuario);

        // 3. Simular actualización de datos completa
        console.log("\n📝 Simulando actualización completa del perfil...");

        const datosActualizacion = {
            nombre: "Juan Carlos",
            apellido: "Pérez González",
            correo: "juan.perez@ejemplo.com",
            contacto: "2604123456",
            dni: "12345678",
            resumenProfesional:
                "Desarrollador Full Stack con 5 años de experiencia...",
            urlPortfolio: "https://juanperez.dev",
            situacionLaboral: "Empleado",
            ciudad: "Mendoza",
            provincia: "Mendoza",
            pais: "Argentina",
        };

        // Actualizar Usuario
        await client.execute({
            sql: `UPDATE Usuario SET nombre = ?, apellido = ?, email = ? WHERE id = ?`,
            args: [
                datosActualizacion.nombre,
                datosActualizacion.apellido,
                datosActualizacion.correo,
                usuario.id,
            ],
        });

        // Actualizar Egresado
        await client.execute({
            sql: `UPDATE Egresado SET dni = ?, telefono = ? WHERE id = ?`,
            args: [
                datosActualizacion.dni,
                datosActualizacion.contacto,
                usuario.id,
            ],
        });

        // Crear o actualizar Perfil
        if (usuario.perfilId) {
            await client.execute({
                sql: `UPDATE Perfil SET resumenProfesional = ?, urlPortfolio = ?, situacionLaboral = ?, ciudad = ?, provincia = ?, pais = ? WHERE id = ?`,
                args: [
                    datosActualizacion.resumenProfesional,
                    datosActualizacion.urlPortfolio,
                    datosActualizacion.situacionLaboral,
                    datosActualizacion.ciudad,
                    datosActualizacion.provincia,
                    datosActualizacion.pais,
                    usuario.perfilId,
                ],
            });
        } else {
            const nuevoPerfil = await client.execute({
                sql: `INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral, ciudad, provincia, pais) VALUES (?, ?, ?, ?, ?, ?)`,
                args: [
                    datosActualizacion.resumenProfesional,
                    datosActualizacion.urlPortfolio,
                    datosActualizacion.situacionLaboral,
                    datosActualizacion.ciudad,
                    datosActualizacion.provincia,
                    datosActualizacion.pais,
                ],
            });

            await client.execute({
                sql: `UPDATE Egresado SET perfilId = ? WHERE id = ?`,
                args: [Number(nuevoPerfil.lastInsertRowid), usuario.id],
            });
        }

        // 4. Verificar que los datos se guardaron correctamente
        console.log("\n✅ Verificando datos actualizados...");

        const perfilCompleto = await client.execute({
            sql: `
                SELECT 
                    u.id as userId,
                    u.nombre,
                    u.apellido,
                    u.email,
                    e.dni,
                    e.telefono,
                    p.resumenProfesional,
                    p.urlPortfolio,
                    p.situacionLaboral,
                    p.ciudad,
                    p.provincia,
                    p.pais
                FROM Usuario u
                INNER JOIN Egresado e ON u.id = e.id
                LEFT JOIN Perfil p ON e.perfilId = p.id
                WHERE u.id = ?
            `,
            args: [usuario.id],
        });

        console.log("📄 Perfil actualizado:", perfilCompleto.rows[0]);

        // 5. Mapeo de respuesta simulando la API
        const datosParaFrontend = {
            success: true,
            data: {
                message: "Perfil actualizado exitosamente",
                perfil: perfilCompleto.rows[0],
            },
        };

        console.log("\n🎯 Respuesta simulada para el frontend:");
        console.log(JSON.stringify(datosParaFrontend, null, 2));

        console.log("\n🎉 Test completado exitosamente!");
    } catch (error) {
        console.error("❌ Error en el test:", error);
    } finally {
        client.close();
    }
}

// Ejecutar test
testPerfilUpdate();
