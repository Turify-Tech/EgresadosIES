import database from "../src/config/database.js";

/**
 * Script de migración para la tabla ImagenPublicacion
 * Crea la tabla si no existe para almacenar imágenes de publicaciones
 */

async function migrarImagenesPublicacion() {
    const client = database.getClient();
    
    try {
        console.log("🔄 Iniciando migración de ImagenPublicacion...");

        // Verificar si la tabla ya existe
        const checkTableQuery = `
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='ImagenPublicacion'
        `;
        
        const tableExists = await client.execute(checkTableQuery);
        
        if (tableExists.rows.length > 0) {
            console.log("✅ La tabla ImagenPublicacion ya existe");
            return;
        }

        // Crear la tabla ImagenPublicacion
        const createTableQuery = `
            CREATE TABLE ImagenPublicacion (
                id INTEGER PRIMARY KEY,
                url TEXT NOT NULL,
                publicacionId INTEGER NOT NULL,
                FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
            )
        `;

        await client.execute(createTableQuery);
        console.log("✅ Tabla ImagenPublicacion creada exitosamente");

        // Crear índice para mejorar el rendimiento de las consultas
        const createIndexQuery = `
            CREATE INDEX idx_imagen_publicacion_id 
            ON ImagenPublicacion(publicacionId)
        `;
        
        await client.execute(createIndexQuery);
        console.log("✅ Índice creado para ImagenPublicacion");

        console.log("✨ Migración completada exitosamente");

    } catch (error) {
        console.error("❌ Error en la migración:", error);
        throw error;
    }
}

// Ejecutar migración
migrarImagenesPublicacion()
    .then(() => {
        console.log("✅ Script de migración finalizado");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Error fatal:", error);
        process.exit(1);
    });
