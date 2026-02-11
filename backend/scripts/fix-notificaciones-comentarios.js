/**
 * Script: Agregar comentarioId a notificaciones de comentarios existentes
 * Este script busca notificaciones de tipo 'comentario' y 'mencion' que no tengan
 * el parámetro comentarioId en su URL y lo agrega basándose en el comentario más reciente
 */

import dotenv from 'dotenv';
import database from '../src/config/database.js';

dotenv.config();

async function fixNotificacionesComentarios() {
    try {
        console.log('🔄 Iniciando corrección de notificaciones de comentarios...\n');

        await database.connect();
        console.log('✓ Conectado a la base de datos\n');

        const db = database.getClient();

        // 1. Obtener todas las notificaciones de comentarios sin comentarioId
        const result = await db.execute({
            sql: `SELECT n.id, n.url_destino, n.tipo, n.mensaje, n.origen_usuario_id
                  FROM Notificacion n
                  WHERE (n.tipo = 'comentario' OR n.tipo = 'mencion')
                    AND n.url_destino LIKE '%?publicacion=%'
                    AND n.url_destino NOT LIKE '%&comentario=%'`,
            args: []
        });

        const notificaciones = result.rows;
        
        if (notificaciones.length === 0) {
            console.log('✅ No hay notificaciones de comentarios que corregir.\n');
            return;
        }

        console.log(`📊 Encontradas ${notificaciones.length} notificaciones de comentarios sin comentarioId\n`);

        let corregidas = 0;
        let sinComentario = 0;

        // 2. Para cada notificación, encontrar el comentario correspondiente
        for (const notif of notificaciones) {
            try {
                const urlAntigua = notif.url_destino || notif.urlDestino;
                
                // Extraer publicacionId de la URL
                const match = urlAntigua.match(/publicacion=(\d+)/);
                if (!match) {
                    console.log(`⚠️  No se pudo parsear URL: ${urlAntigua}`);
                    continue;
                }

                const publicacionId = match[1];
                const origenUsuarioId = notif.origen_usuario_id || notif.origenUsuarioId;

                // Buscar el comentario más reciente de ese usuario en esa publicación
                const comentarioResult = await db.execute({
                    sql: `SELECT id FROM Comentario 
                          WHERE publicacionId = ? 
                            AND autorId = ?
                          ORDER BY fechaCreacion DESC 
                          LIMIT 1`,
                    args: [publicacionId, origenUsuarioId]
                });

                if (comentarioResult.rows.length === 0) {
                    console.log(`⚠️  Notificación ${notif.id}: No se encontró comentario asociado`);
                    sinComentario++;
                    continue;
                }

                const comentarioId = comentarioResult.rows[0].id;
                const nuevaUrl = `/?publicacion=${publicacionId}&comentario=${comentarioId}`;

                // Actualizar la notificación
                await db.execute({
                    sql: 'UPDATE Notificacion SET url_destino = ? WHERE id = ?',
                    args: [nuevaUrl, notif.id]
                });

                console.log(`✓ Notificación ${notif.id}: ${urlAntigua} → ${nuevaUrl}`);
                corregidas++;

            } catch (error) {
                console.error(`✗ Error al corregir notificación ${notif.id}:`, error.message);
            }
        }

        // 3. Resumen
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMEN DE CORRECCIÓN');
        console.log('='.repeat(60));
        console.log(`Total encontradas:       ${notificaciones.length}`);
        console.log(`Corregidas:              ${corregidas}`);
        console.log(`Sin comentario asociado: ${sinComentario}`);
        console.log('='.repeat(60) + '\n');

        if (corregidas > 0) {
            console.log('✅ Corrección completada exitosamente!\n');
        }

    } catch (error) {
        console.error('❌ Error en la corrección:', error);
        throw error;
    }
}

// Ejecutar corrección
fixNotificacionesComentarios()
    .then(() => {
        console.log('🎉 Proceso finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
