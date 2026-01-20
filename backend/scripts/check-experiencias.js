import database from "../src/config/database.js";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

async function checkExperiencias() {
    try {
        // Conectar a la base de datos primero
        await database.connect();
        const client = database.getClient();

        // Obtener todos los usuarios egresados con sus perfil IDs
        console.log("\n=== USUARIOS Y SUS PERFIL IDs ===");
        const usuariosResult = await client.execute(`
            SELECT 
                u.id as usuarioId,
                u.nombre,
                u.email,
                e.perfilId
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            WHERE u.tipo_usuario = 'Egresado'
        `);

        for (const usuario of usuariosResult.rows) {
            console.log(
                `\nUsuario: ${usuario.nombre} (ID: ${usuario.usuarioId}, Email: ${usuario.email})`
            );
            console.log(`Perfil ID: ${usuario.perfilId || "SIN PERFIL"}`);

            if (usuario.perfilId) {
                // Obtener experiencias de este perfil
                const experienciasResult = await client.execute({
                    sql: `
                        SELECT id, puesto, empresa, fechaInicio, fechaFin, descripcion
                        FROM ExperienciaLaboral
                        WHERE perfilId = ?
                    `,
                    args: [usuario.perfilId],
                });

                console.log(
                    `Experiencias encontradas: ${experienciasResult.rows.length}`
                );
                experienciasResult.rows.forEach((exp, idx) => {
                    console.log(`  ${idx + 1}. ${exp.puesto} en ${exp.empresa}`);
                });
            }
        }

        // Ahora verificar TODAS las experiencias en la base de datos
        console.log("\n\n=== TODAS LAS EXPERIENCIAS EN LA BD ===");
        const allExperiencias = await client.execute(`
            SELECT 
                el.id,
                el.puesto,
                el.empresa,
                el.perfilId,
                u.nombre as usuario_nombre
            FROM ExperienciaLaboral el
            LEFT JOIN Egresado e ON el.perfilId = e.perfilId
            LEFT JOIN Usuario u ON e.id = u.id
        `);

        console.log(`Total de experiencias: ${allExperiencias.rows.length}`);
        allExperiencias.rows.forEach((exp) => {
            console.log(
                `- ${exp.puesto} en ${exp.empresa} (perfilId: ${exp.perfilId}, usuario: ${exp.usuario_nombre || "N/A"})`
            );
        });
    } catch (error) {
        console.error("Error:", error);
    }
}

checkExperiencias();
