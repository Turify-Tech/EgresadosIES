/**
 * Script para crear índices de optimización para búsquedas
 * Ejecutar con: node scripts/create-search-indexes.js
 */

import database from "../src/config/database.js";
import dotenv from "dotenv";

dotenv.config();

const indices = [
    {
        nombre: "idx_usuario_tipo_nombre",
        sql: "CREATE INDEX IF NOT EXISTS idx_usuario_tipo_nombre ON Usuario(tipo_usuario, nombre)",
        descripcion: "Índice para filtrar por tipo de usuario y ordenar por nombre"
    },
    {
        nombre: "idx_perfil_situacion",
        sql: "CREATE INDEX IF NOT EXISTS idx_perfil_situacion ON Perfil(situacionLaboral)",
        descripcion: "Índice para filtrar por situación laboral"
    },
    {
        nombre: "idx_experiencia_perfil",
        sql: "CREATE INDEX IF NOT EXISTS idx_experiencia_perfil ON ExperienciaLaboral(perfilId)",
        descripcion: "Índice para JOIN con experiencias laborales"
    },
    {
        nombre: "idx_experiencia_empresa",
        sql: "CREATE INDEX IF NOT EXISTS idx_experiencia_empresa ON ExperienciaLaboral(empresa)",
        descripcion: "Índice para filtrar por empresa"
    },
    {
        nombre: "idx_experiencia_puesto",
        sql: "CREATE INDEX IF NOT EXISTS idx_experiencia_puesto ON ExperienciaLaboral(puesto)",
        descripcion: "Índice para filtrar por puesto"
    },
    {
        nombre: "idx_curso_perfil",
        sql: "CREATE INDEX IF NOT EXISTS idx_curso_perfil ON Curso(perfilId)",
        descripcion: "Índice para JOIN con cursos"
    },
    {
        nombre: "idx_egresado_carrera",
        sql: "CREATE INDEX IF NOT EXISTS idx_egresado_carrera ON Egresado(carreraId)",
        descripcion: "Índice para filtrar por carrera"
    },
    {
        nombre: "idx_carrera_nombre",
        sql: "CREATE INDEX IF NOT EXISTS idx_carrera_nombre ON Carrera(nombre)",
        descripcion: "Índice para filtrar por nombre de carrera"
    }
];

async function crearIndices() {
    try {
        console.log("🔧 CREANDO ÍNDICES PARA OPTIMIZACIÓN DE BÚSQUEDAS...");
        
        await database.connect();
        const client = database.getClient();
        console.log("📡 Conectado a la base de datos");
        
        for (const indice of indices) {
            try {
                await client.execute({ sql: indice.sql });
                console.log(`✅ ${indice.nombre}: ${indice.descripcion}`);
            } catch (error) {
                console.log(`⚠️  ${indice.nombre}: ${error.message}`);
            }
        }
        
        console.log("\n📊 ANÁLISIS DE PERFORMANCE:");
        
        // Verificar que las tablas tengan datos suficientes para beneficiarse de los índices
        const stats = await Promise.all([
            client.execute({ sql: "SELECT COUNT(*) as count FROM Usuario WHERE tipo_usuario = 'Egresado'" }),
            client.execute({ sql: "SELECT COUNT(*) as count FROM ExperienciaLaboral" }),
            client.execute({ sql: "SELECT COUNT(*) as count FROM Curso" }),
            client.execute({ sql: "SELECT COUNT(*) as count FROM Carrera" })
        ]);
        
        const [usuarios, experiencias, cursos, carreras] = stats.map(s => s.rows[0].count);
        
        console.log(`📋 Egresados: ${usuarios}`);
        console.log(`💼 Experiencias: ${experiencias}`);
        console.log(`📚 Cursos: ${cursos}`);
        console.log(`🎓 Carreras: ${carreras}`);
        
        if (usuarios < 100) {
            console.log("\n💡 NOTA: Con pocos registros, los índices no afectarán mucho el performance.");
            console.log("   Los índices serán más útiles cuando tengas cientos o miles de egresados.");
        }
        
        console.log("\n🎉 ¡Índices creados exitosamente!");
        console.log("\n🚀 PRÓXIMOS PASOS:");
        console.log("1. Ejecutar búsquedas y medir performance");
        console.log("2. Usar EXPLAIN QUERY PLAN para verificar uso de índices");
        console.log("3. Monitorear tiempos de respuesta en producción");
        
        // Mostrar ejemplo de análisis de query
        console.log("\n🔍 EJEMPLO DE ANÁLISIS DE QUERY:");
        console.log("Para ver si una query usa índices:");
        console.log("EXPLAIN QUERY PLAN SELECT ... FROM Usuario WHERE tipo_usuario = 'Egresado' ORDER BY nombre;");
        
    } catch (error) {
        console.error("💥 Error general:", error);
    } finally {
        process.exit(0);
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    crearIndices();
}

export default crearIndices;