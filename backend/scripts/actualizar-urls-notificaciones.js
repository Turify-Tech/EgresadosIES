/**
 * Script de Actualización: URLs de Notificaciones Dashboard → Index
 * Actualiza todas las URLs de notificaciones de /dashboard a / (index)
 * 
 * Ejecutar con: node backend/scripts/actualizar-urls-notificaciones.js
 */

import dotenv from 'dotenv';
import database from '../src/config/database.js';

// Cargar variables de entorno
dotenv.config();

async function actualizarUrlsNotificaciones() {
    try {
        console.log('🔄 Iniciando actualización de URLs de notificaciones...\n');

        // Conectar a la base de datos
        await database.connect();
        console.log('✓ Conectado a la base de datos\n');

        const db = database.getClient();

        // 1. Obtener todas las notificaciones con URLs que contengan /dashboard
        const result = await db.execute({
            sql: `SELECT id, url_destino 
                  FROM Notificacion 
                  WHERE url_destino LIKE '%/dashboard?%'
                     OR url_destino LIKE '%/dashboard%'`,
            args: []
        });

        const notificaciones = result.rows;
        
        if (notificaciones.length === 0) {
            console.log('✅ No hay notificaciones que actualizar. Todas las URLs están correctas.\n');
            return;
        }

        console.log(`📊 Encontradas ${notificaciones.length} notificaciones para actualizar\n`);

        let actualizadasExitosamente = 0;
        let errores = 0;

        // 2. Actualizar cada notificación
        for (const notif of notificaciones) {
            try {
                const urlAntigua = notif.url_destino || notif.urlDestino;
                
                // Reemplazar /dashboard con /
                // Ejemplos:
                // - /dashboard?publicacion=7 → /?publicacion=7
                // - /dashboard?publicacion=7&comentario=50 → /?publicacion=7&comentario=50
                // - http://localhost:4321/dashboard?publicacion=7 → http://localhost:4321/?publicacion=7
                
                let nuevaUrl = urlAntigua;
                
                // Reemplazar /dashboard? con /?
                nuevaUrl = nuevaUrl.replace(/\/dashboard\?/g, '/?');
                
                // Reemplazar /dashboard (sin parámetros) con /
                nuevaUrl = nuevaUrl.replace(/\/dashboard$/g, '/');

                // Si la URL no cambió, continuar
                if (nuevaUrl === urlAntigua) {
                    console.log(`⚠️  URL no cambió: ${urlAntigua}`);
                    continue;
                }

                // Actualizar la notificación
                await db.execute({
                    sql: 'UPDATE Notificacion SET url_destino = ? WHERE id = ?',
                    args: [nuevaUrl, notif.id]
                });

                console.log(`✓ Notificación ${notif.id}:`);
                console.log(`  Antes: ${urlAntigua}`);
                console.log(`  Ahora: ${nuevaUrl}`);
                actualizadasExitosamente++;

            } catch (error) {
                console.error(`❌ Error al actualizar notificación ${notif.id}:`, error.message);
                errores++;
            }
        }

        console.log('\n📈 Resumen de actualización:');
        console.log(`   ✓ Actualizadas exitosamente: ${actualizadasExitosamente}`);
        console.log(`   ❌ Errores: ${errores}`);
        console.log(`   📊 Total procesadas: ${notificaciones.length}\n`);

        if (actualizadasExitosamente > 0) {
            console.log('✅ Actualización completada con éxito');
        } else if (errores > 0) {
            console.log('⚠️  Actualización completada con errores');
        }

    } catch (error) {
        console.error('❌ Error fatal durante la actualización:', error);
        process.exit(1);
    } finally {
        // Cerrar conexión
        process.exit(0);
    }
}

// Ejecutar actualización
actualizarUrlsNotificaciones();
