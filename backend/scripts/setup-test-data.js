import database from "../src/config/database.js";
import { hashPassword } from "../src/utils/bcrypt.js";
import dotenv from "dotenv";

dotenv.config();

async function setupTestData() {
    try {
        console.log("🚀 Configurando datos de prueba...");
        
        await database.connect();
        const client = database.getClient();
        
        // 1. Crear carrera de prueba
        console.log("\n📚 Creando carrera de prueba...");
        try {
            const carreraResult = await client.execute({
                sql: "INSERT INTO Carrera (nombre) VALUES (?)",
                args: ["Desarrollo de Software"]
            });
            console.log(`✅ Carrera creada con ID: ${carreraResult.lastInsertRowid}`);
        } catch (error) {
            if (error.message.includes("UNIQUE constraint failed")) {
                console.log("ℹ️  Carrera 'Desarrollo de Software' ya existe");
            } else {
                throw error;
            }
        }
        
        // 2. Crear administrador
        console.log("\n👤 Creando administrador de prueba...");
        const adminData = {
            nombre: process.env.DEFAULT_ADMIN_NAME || "Administrador IES",
            dni: process.env.DEFAULT_ADMIN_DNI || "00000000",
            email: process.env.DEFAULT_ADMIN_EMAIL || "admin@ies.edu.ar",
            password: process.env.DEFAULT_ADMIN_PASSWORD || "temporal123"
        };
        
        try {
            const hashedPassword = await hashPassword(adminData.password);
            
            // Insertar usuario
            const userResult = await client.execute({
                sql: "INSERT INTO Usuario (nombre, email, password, tipo_usuario) VALUES (?, ?, ?, ?)",
                args: [adminData.nombre, adminData.email, hashedPassword, "Administrador"]
            });
            
            // Insertar administrador
            await client.execute({
                sql: "INSERT INTO Administrador (id, dni) VALUES (?, ?)",
                args: [userResult.lastInsertRowid, adminData.dni]
            });
            
            console.log(`✅ Administrador creado con ID: ${userResult.lastInsertRowid}`);
            console.log(`   DNI: ${adminData.dni}`);
            console.log(`   Password: ${adminData.password}`);
            
        } catch (error) {
            if (error.message.includes("UNIQUE constraint failed")) {
                console.log("ℹ️  Administrador ya existe");
            } else {
                throw error;
            }
        }
        
        // 3. Crear DNIs válidos para prueba
        console.log("\n🆔 Creando DNIs válidos para prueba...");
        const dnisValidos = [
            { dni: "12345678", carrera: "Desarrollo de Software" },
            { dni: "87654321", carrera: "Desarrollo de Software" },
            { dni: "11111111", carrera: "Desarrollo de Software" }
        ];
        
        for (const dniData of dnisValidos) {
            try {
                await client.execute({
                    sql: "INSERT INTO DniValido (dni, carrera) VALUES (?, ?)",
                    args: [dniData.dni, dniData.carrera]
                });
                console.log(`✅ DNI válido agregado: ${dniData.dni}`);
            } catch (error) {
                if (error.message.includes("UNIQUE constraint failed")) {
                    console.log(`ℹ️  DNI ${dniData.dni} ya existe`);
                } else {
                    throw error;
                }
            }
        }
        
        // 4. Verificar datos creados
        console.log("\n📊 Resumen de datos de prueba:");
        
        const adminCount = await client.execute("SELECT COUNT(*) as count FROM Administrador");
        const carreraCount = await client.execute("SELECT COUNT(*) as count FROM Carrera");
        const dniCount = await client.execute("SELECT COUNT(*) as count FROM DniValido");
        
        console.log(`   👥 Administradores: ${adminCount.rows[0].count}`);
        console.log(`   📚 Carreras: ${carreraCount.rows[0].count}`);
        console.log(`   🆔 DNIs válidos: ${dniCount.rows[0].count}`);
        
        console.log("\n🎯 Datos listos para testing:");
        console.log("   Administrador:");
        console.log(`     DNI: ${adminData.dni}`);
        console.log(`     Password: ${adminData.password}`);
        console.log("   Egresados para auto-registro:");
        console.log("     DNI: 12345678 (password: cualquiera)");
        console.log("     DNI: 87654321 (password: cualquiera)");
        
    } catch (error) {
        console.error("❌ Error configurando datos de prueba:", error.message);
        console.error(error.stack);
    } finally {
        await database.disconnect();
    }
}

setupTestData().catch(console.error);