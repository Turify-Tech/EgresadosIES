/**
 * Script para crear notificaciones de prueba con diferentes fechas
 * Ejecutar con: node scripts/crear-notificaciones-prueba.js
 */

import database from "../src/config/database.js";

async function crearNotificacionesPrueba() {
    try {
        const db = database.getClient();
        
        console.log('🚀 Creando notificaciones de prueba...');
        
        // Obtener el primer usuario de la base de datos
        const usuariosResult = await db.execute('SELECT id FROM Usuario LIMIT 2');
        
        if (usuariosResult.rows.length < 2) {
            console.error('❌ Se necesitan al menos 2 usuarios en la base de datos');
            return;
        }
        
        const usuario1 = usuariosResult.rows[0].id;
        const usuario2 = usuariosResult.rows[1].id;
        
        console.log(`📍 Creando notificaciones para usuario ${usuario1}`);
        console.log(`📍 Notificaciones del usuario ${usuario2}`);
        
        // Obtener fecha actual
        const ahora = new Date();
        
        // Crear notificaciones con diferentes fechas
        const notificaciones = [
            {
                tipo: 'like',
                titulo: 'Le gustó tu publicación',
                mensaje: 'Le gustó tu publicación sobre tecnología',
                fecha: new Date(ahora.getTime() - 10 * 1000), // Hace 10 segundos
                descripcion: 'Hace 10 segundos'
            },
            {
                tipo: 'comentario',
                titulo: 'Comentó tu publicación',
                mensaje: 'Dejó un comentario en tu publicación',
                fecha: new Date(ahora.getTime() - 5 * 60 * 1000), // Hace 5 minutos
                descripcion: 'Hace 5 minutos'
            },
            {
                tipo: 'mencion',
                titulo: 'Te mencionó en un comentario',
                mensaje: 'Te mencionó en un comentario',
                fecha: new Date(ahora.getTime() - 30 * 60 * 1000), // Hace 30 minutos
                descripcion: 'Hace 30 minutos'
            },
            {
                tipo: 'like',
                titulo: 'Le gustó tu publicación',
                mensaje: 'Le gustó tu publicación sobre desarrollo web',
                fecha: new Date(ahora.getTime() - 2 * 60 * 60 * 1000), // Hace 2 horas
                descripcion: 'Hace 2 horas'
            },
            {
                tipo: 'comentario',
                titulo: 'Comentó tu publicación',
                mensaje: 'Comentó: "Excelente artículo"',
                fecha: new Date(ahora.getTime() - 5 * 60 * 60 * 1000), // Hace 5 horas
                descripcion: 'Hace 5 horas'
            },
            {
                tipo: 'like',
                titulo: 'Le gustó tu publicación',
                mensaje: 'Le gustó tu publicación sobre bases de datos',
                fecha: new Date(ahora.getTime() - 24 * 60 * 60 * 1000), // Hace 1 día
                descripcion: 'Hace 1 día'
            },
            {
                tipo: 'comentario',
                titulo: 'Comentó tu publicación',
                mensaje: 'Dejó un comentario interesante',
                fecha: new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000), // Hace 3 días
                descripcion: 'Hace 3 días'
            },
            {
                tipo: 'mencion',
                titulo: 'Te mencionó',
                mensaje: 'Te mencionó en una discusión',
                fecha: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días (1 semana)
                descripcion: 'Hace 1 semana'
            },
            {
                tipo: 'like',
                titulo: 'Le gustó tu publicación',
                mensaje: 'Le gustó tu publicación antigua',
                fecha: new Date(ahora.getTime() - 15 * 24 * 60 * 60 * 1000), // Hace 15 días
                descripcion: 'Hace 2 semanas'
            },
            {
                tipo: 'comentario',
                titulo: 'Comentó tu publicación',
                mensaje: 'Comentó tu publicación del mes pasado',
                fecha: new Date(ahora.getTime() - 35 * 24 * 60 * 60 * 1000), // Hace 35 días
                descripcion: 'Hace 1 mes'
            }
        ];
        
        console.log('\n📝 Insertando notificaciones...\n');
        
        for (const notif of notificaciones) {
            const fechaISO = notif.fecha.toISOString().slice(0, 19).replace('T', ' ');
            
            await db.execute({
                sql: `INSERT INTO Notificacion 
                      (usuario_id, tipo, titulo, mensaje, url_destino, origen_usuario_id, fecha_creacion, leida)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [
                    usuario1,
                    notif.tipo,
                    notif.titulo,
                    notif.mensaje,
                    '/publicaciones',
                    usuario2,
                    fechaISO,
                    0 // No leída
                ]
            });
            
            console.log(`✅ ${notif.descripcion}: ${notif.titulo}`);
        }
        
        console.log('\n🎉 Notificaciones de prueba creadas exitosamente!');
        console.log(`\n📊 Se crearon ${notificaciones.length} notificaciones para el usuario ${usuario1}`);
        console.log('\n💡 Puedes verificarlas en el frontend abriendo el modal de notificaciones');
        
        // Mostrar un resumen
        const resultado = await db.execute({
            sql: 'SELECT COUNT(*) as total FROM Notificacion WHERE usuario_id = ?',
            args: [usuario1]
        });
        
        console.log(`\n📈 Total de notificaciones del usuario: ${resultado.rows[0].total}`);
        
    } catch (error) {
        console.error('❌ Error al crear notificaciones de prueba:', error);
        throw error;
    }
}

// Ejecutar
crearNotificacionesPrueba()
    .then(() => {
        console.log('\n✅ Script completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
