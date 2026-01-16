import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function migrateNotificaciones() {
    try {
        console.log('🚀 Iniciando migración de notificaciones...');

        // Eliminar tablas existentes si existen
        console.log('🗑️  Eliminando tablas existentes...');
        await client.execute('DROP TABLE IF EXISTS PreferenciasNotificacion');
        await client.execute('DROP TABLE IF EXISTS Notificacion');
        await client.execute('DROP INDEX IF EXISTS idx_notificacion_usuario');
        
        // Crear tabla de notificaciones
        await client.execute(`
            CREATE TABLE Notificacion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('comentario', 'like', 'mencion')),
                titulo TEXT NOT NULL,
                mensaje TEXT NOT NULL,
                url_destino TEXT,
                leida BOOLEAN DEFAULT 0,
                enviada_email BOOLEAN DEFAULT 0,
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                origen_usuario_id INTEGER,
                FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
                FOREIGN KEY (origen_usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla Notificacion creada correctamente');

        // Crear índices para mejorar el rendimiento
        await client.execute(`
            CREATE INDEX idx_notificacion_usuario 
            ON Notificacion(usuario_id, leida, fecha_creacion DESC)
        `);
        console.log('✅ Índice de notificaciones creado');

        // Crear tabla de preferencias de notificaciones
        await client.execute(`
            CREATE TABLE PreferenciasNotificacion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL UNIQUE,
                email_comentarios BOOLEAN DEFAULT 1,
                email_likes BOOLEAN DEFAULT 1,
                email_menciones BOOLEAN DEFAULT 1,
                email_resumen_diario BOOLEAN DEFAULT 0,
                fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla PreferenciasNotificacion creada correctamente');

        // Crear preferencias por defecto para usuarios existentes
        const usuariosResult = await client.execute('SELECT id FROM Usuario');
        
        for (const usuario of usuariosResult.rows) {
            await client.execute({
                sql: 'INSERT OR IGNORE INTO PreferenciasNotificacion (usuario_id) VALUES (?)',
                args: [usuario.id]
            });
        }
        console.log(`✅ Preferencias por defecto creadas para ${usuariosResult.rows.length} usuarios existentes`);

        console.log('🎉 Migración completada exitosamente');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        throw error;
    } finally {
        client.close();
    }
}

migrateNotificaciones();
