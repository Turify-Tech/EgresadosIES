/**
 * Script de Migración: Actualizar URLs de Notificaciones
 * Actualiza las URLs antiguas (/feed#publicacion-X) a las nuevas (/dashboard?publicacion=X)
 */

import dotenv from 'dotenv';
import database from '../src/config/database.js';

// Cargar variables de entorno
dotenv.config();

async function migrarNotificaciones() {
    try {
        console.log('🔄 Iniciando migración de URLs de notificaciones...\n');

        // Conectar a la base de datos
        await database.connect();
        console.log('✓ Conectado a la base de datos\n');

        const db = database.getClient();

        // 1. Obtener todas las notificaciones con URLs antiguas
        const result = await db.execute({
            sql: `SELECT id, url_destino 
                  FROM Notificacion 
                  WHERE url_destino LIKE '%/feed#publicacion-%' 
                     OR url_destino LIKE '%feed#publicacion-%'`,
            args: []
        });

        const notificaciones = result.rows;
        
        if (notificaciones.length === 0) {
            console.log('✅ No hay notificaciones que migrar. Todas las URLs están actualizadas.\n');
            return;
        }

        console.log(`📊 Encontradas ${notificaciones.length} notificaciones para migrar\n`);

        let migradasExitosamente = 0;
        let errores = 0;

        // 2. Actualizar cada notificación
        for (const notif of notificaciones) {
            try {
                const urlAntigua = notif.url_destino || notif.urlDestino;
                
                // Extraer el ID de la publicación de la URL antigua
                // Formatos posibles:
                // - http://localhost:4321/feed#publicacion-9
                // - /feed#publicacion-9
                const match = urlAntigua.match(/publicacion-(\d+)/);
                
                if (!match) {
                    console.log(`⚠️  No se pudo parsear URL: ${urlAntigua}`);
                    errores++;
                    continue;
                }

                const publicacionId = match[1];
                const nuevaUrl = `/dashboard?publicacion=${publicacionId}`;

                // Actualizar la notificación
                await db.execute({
                    sql: 'UPDATE Notificacion SET url_destino = ? WHERE id = ?',
                    args: [nuevaUrl, notif.id]
                });

                console.log(`✓ Notificación ${notif.id}: ${urlAntigua} → ${nuevaUrl}`);
                migradasExitosamente++;

            } catch (error) {
                console.error(`✗ Error al migrar notificación ${notif.id}:`, error.message);
                errores++;
            }
        }

        // 3. Resumen
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(60));
        console.log(`Total encontradas:       ${notificaciones.length}`);
        console.log(`Migradas exitosamente:   ${migradasExitosamente}`);
        console.log(`Errores:                 ${errores}`);
        console.log('='.repeat(60) + '\n');

        if (migradasExitosamente > 0) {
            console.log('✅ Migración completada exitosamente!\n');
        }

    } catch (error) {
        console.error('❌ Error en la migración:', error);
        throw error;
    }
}

// Ejecutar migración
migrarNotificaciones()
    .then(() => {
        console.log('🎉 Proceso finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
