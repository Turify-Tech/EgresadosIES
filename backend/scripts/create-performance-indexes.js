import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

async function createPerformanceIndexes() {
    let client = null;
    try {
        // Validar variables de entorno requeridas para Turso
        if (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN) {
            throw new Error(
                "DATABASE_URL y DATABASE_AUTH_TOKEN son requeridos para Turso"
            );
        }

        // Conectar directamente a Turso
        client = createClient({
            url: process.env.DATABASE_URL,
            authToken: process.env.DATABASE_AUTH_TOKEN,
        });

        // Activar claves foráneas
        await client.execute("PRAGMA foreign_keys = ON");
        console.log("☁️ Conectado a Turso exitosamente");
        
        console.log("🚀 Creando índices de rendimiento...");
        
        // Índices para tabla Publicacion
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_publicacion_fecha_creacion ON Publicacion(fechaCreacion DESC)
        `);
        console.log("✅ Índice idx_publicacion_fecha_creacion creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_publicacion_autor_id ON Publicacion(autorId)
        `);
        console.log("✅ Índice idx_publicacion_autor_id creado");
        
        // Índices para tabla ImagenPublicacion
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_imagen_publicacion_publicacion_id ON ImagenPublicacion(publicacionId)
        `);
        console.log("✅ Índice idx_imagen_publicacion_publicacion_id creado");
        
        // Índices para tabla Comentario
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_comentario_publicacion_id ON Comentario(publicacionId)
        `);
        console.log("✅ Índice idx_comentario_publicacion_id creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_comentario_autor_id ON Comentario(autorId)
        `);
        console.log("✅ Índice idx_comentario_autor_id creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_comentario_padre_id ON Comentario(comentarioPadreId)
        `);
        console.log("✅ Índice idx_comentario_padre_id creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_comentario_fecha_creacion ON Comentario(fechaCreacion DESC)
        `);
        console.log("✅ Índice idx_comentario_fecha_creacion creado");
        
        // Índices para tabla LikePublicacion
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_like_publicacion_publicacion_id ON LikePublicacion(publicacionId)
        `);
        console.log("✅ Índice idx_like_publicacion_publicacion_id creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_like_publicacion_egresado_id ON LikePublicacion(egresadoId)
        `);
        console.log("✅ Índice idx_like_publicacion_egresado_id creado");
        
        // Índices para tabla LikeComentario
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_like_comentario_comentario_id ON LikeComentario(comentarioId)
        `);
        console.log("✅ Índice idx_like_comentario_comentario_id creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_like_comentario_egresado_id ON LikeComentario(egresadoId)
        `);
        console.log("✅ Índice idx_like_comentario_egresado_id creado");
        
        // Índices compuestos para consultas comunes
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_comentario_pub_fecha ON Comentario(publicacionId, fechaCreacion DESC)
        `);
        console.log("✅ Índice idx_comentario_pub_fecha creado");
        
        await client.execute(`
            CREATE INDEX IF NOT EXISTS idx_like_pub_combo ON LikePublicacion(publicacionId, egresadoId)
        `);
        console.log("✅ Índice idx_like_pub_combo creado");
        
        console.log("🎉 ¡Todos los índices de rendimiento han sido creados exitosamente!");
        
            
    } catch (error) {
        console.error("❌ Error creando índices:", error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log("🔌 Conexión cerrada");
        }
    }
}

// Ejecutar el script
createPerformanceIndexes().then(() => {
    console.log("✅ Script completado");
    process.exit(0);
});