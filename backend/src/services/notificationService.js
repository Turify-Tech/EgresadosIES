import nodemailer from 'nodemailer';
import database from '../config/database.js';

/**
 * Servicio de Notificaciones
 * Gestiona la creación de notificaciones internas y envío de emails
 */

class NotificationService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Inicializa el transportador de nodemailer (lazy initialization)
     */
    initializeTransporter() {
        if (this.initialized) return;
        
        try {
            // Verificar que las credenciales existan
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.log('⚠️  Variables SMTP no configuradas en .env');
                console.log('SMTP_USER:', process.env.SMTP_USER ? '✓' : '✗');
                console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✓' : '✗');
                this.initialized = true;
                return;
            }

            // Configuración del transportador SMTP
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                secure: false, // true para puerto 465, false para otros
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            console.log('📧 Servicio de email inicializado');
            console.log('📧 SMTP configurado para:', process.env.SMTP_USER);
            this.initialized = true;
        } catch (error) {
            console.error('❌ Error al inicializar servicio de email:', error);
            this.initialized = true;
        }
    }

    /**
     * Crea una notificación en la base de datos
     * @param {Object} datos - Datos de la notificación
     * @returns {Promise<Number>} ID de la notificación creada
     */
    async crearNotificacion({ usuarioId, tipo, titulo, mensaje, urlDestino, origenUsuarioId }) {
        try {
            const db = database.getClient();

            const result = await db.execute({
                sql: `INSERT INTO Notificacion 
                      (usuario_id, tipo, titulo, mensaje, url_destino, origen_usuario_id)
                      VALUES (?, ?, ?, ?, ?, ?)`,
                args: [usuarioId, tipo, titulo, mensaje, urlDestino || null, origenUsuarioId || null]
            });

            console.log(`✅ Notificación creada - ID: ${result.lastInsertRowid}, Usuario: ${usuarioId}, Tipo: ${tipo}`);
            return Number(result.lastInsertRowid);
        } catch (error) {
            console.error('❌ Error al crear notificación:', error);
            throw error;
        }
    }

    /**
     * Obtiene las preferencias de notificación de un usuario
     * @param {Number} usuarioId - ID del usuario
     * @returns {Promise<Object>} Preferencias del usuario
     */
    async obtenerPreferencias(usuarioId) {
        try {
            const db = database.getClient();

            const result = await db.execute({
                sql: 'SELECT * FROM PreferenciasNotificacion WHERE usuario_id = ?',
                args: [usuarioId]
            });

            if (result.rows.length === 0) {
                // Crear preferencias por defecto si no existen
                await db.execute({
                    sql: 'INSERT INTO PreferenciasNotificacion (usuario_id) VALUES (?)',
                    args: [usuarioId]
                });

                return {
                    email_comentarios: true,
                    email_likes: true,
                    email_menciones: true,
                    email_resumen_diario: false
                };
            }

            return result.rows[0];
        } catch (error) {
            console.error('❌ Error al obtener preferencias:', error);
            return null;
        }
    }

    /**
     * Obtiene información del usuario origen
     * @param {Number} origenUsuarioId - ID del usuario origen
     * @returns {Promise<Object>} Información del usuario
     */
    async obtenerInfoUsuario(origenUsuarioId) {
        try {
            const db = database.getClient();

            const result = await db.execute({
                sql: `SELECT u.id, u.nombre, u.apellido, u.email, p.urlFotoPerfil
                      FROM Usuario u
                      LEFT JOIN Egresado e ON e.id = u.id
                      LEFT JOIN Perfil p ON p.id = e.perfilId
                      WHERE u.id = ?`,
                args: [origenUsuarioId]
            });

            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ Error al obtener info usuario:', error);
            return null;
        }
    }

    /**
     * Envía un email de notificación
     * @param {String} destinatarioEmail - Email del destinatario
     * @param {String} asunto - Asunto del email
     * @param {String} htmlContent - Contenido HTML del email
     * @returns {Promise<Boolean>} True si se envió correctamente
     */
    async enviarEmail(destinatarioEmail, asunto, htmlContent) {
        // Inicializar transportador si no se ha hecho
        if (!this.initialized) {
            this.initializeTransporter();
        }
        
        if (!this.transporter) {
            console.log('⚠️  Transportador de email no configurado');
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"Egresados IES" <${process.env.SMTP_USER}>`,
                to: destinatarioEmail,
                subject: asunto,
                html: htmlContent,
            });

            console.log(`📧 Email enviado: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('❌ Error al enviar email:', error);
            return false;
        }
    }

    /**
     * Genera el HTML del email según el tipo de notificación
     * @param {String} tipo - Tipo de notificación
     * @param {Object} datos - Datos para el template
     * @returns {String} HTML del email
     */
    generarEmailHTML(tipo, datos) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';

        const templates = {
            comentario: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <!-- Container Principal -->
                                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    
                                    <!-- Header con gradiente -->
                                    <tr>
                                        <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px;">
                                            <table cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="font-size: 48px; line-height: 1; padding-bottom: 10px;">💬</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                                                        Nuevo comentario
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 35px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                                                        Hola <strong style="color: #1a202c;">${datos.destinatarioNombre}</strong>,
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 25px;">
                                                        <strong style="color: #667eea;">${datos.origenNombre}</strong> ha comentado en tu publicación:
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <!-- Cuadro de comentario -->
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; border-left: 4px solid #667eea; border-radius: 8px; margin: 20px 0;">
                                                            <tr>
                                                                <td style="padding: 20px 25px;">
                                                                    <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; font-style: italic;">
                                                                        "${datos.comentario}"
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding: 30px 0 10px 0;">
                                                        <!-- Botón -->
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td align="center" style="border-radius: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                                                    <a href="${datos.urlDestino}" target="_blank" style="display: inline-block; padding: 14px 35px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                                        Ver comentario
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f7fafc; padding: 30px 35px; border-top: 1px solid #e2e8f0;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding-bottom: 8px;">
                                                        <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2d3748;">
                                                            Egresados IES
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding-bottom: 15px;">
                                                        <p style="margin: 0; font-size: 13px; color: #718096;">
                                                            Sistema de Gestión de Egresados
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <a href="${frontendUrl}/notificaciones/preferencias" target="_blank" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                                                            ⚙️ Configurar preferencias
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            like: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); padding: 50px 30px;">
                                            <table cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="font-size: 48px; line-height: 1; padding-bottom: 10px;">❤️</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                                                        Nueva reacción
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 35px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                                                        Hola <strong style="color: #1a202c;">${datos.destinatarioNombre}</strong>,
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 25px;">
                                                        ¡Tu publicación ha recibido una nueva reacción!
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff5f5; border-left: 4px solid #ff6b6b; border-radius: 8px; margin: 20px 0;">
                                                            <tr>
                                                                <td style="padding: 20px 25px;">
                                                                    <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                                                        <strong style="color: #ff6b6b;">${datos.origenNombre}</strong> reaccionó con ❤️ a tu publicación
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding: 30px 0 10px 0;">
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td align="center" style="border-radius: 25px; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);">
                                                                    <a href="${datos.urlDestino}" target="_blank" style="display: inline-block; padding: 14px 35px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                                        Ver publicación
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f7fafc; padding: 30px 35px; border-top: 1px solid #e2e8f0;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding-bottom: 8px;">
                                                        <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2d3748;">
                                                            Egresados IES
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding-bottom: 15px;">
                                                        <p style="margin: 0; font-size: 13px; color: #718096;">
                                                            Sistema de Gestión de Egresados
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <a href="${frontendUrl}/notificaciones/preferencias" target="_blank" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                                                            ⚙️ Configurar preferencias
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
            mencion: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td align="center" style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 50px 30px;">
                                            <table cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="font-size: 48px; line-height: 1; padding-bottom: 10px;">@</td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #ffffff; font-size: 28px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
                                                        Te mencionaron
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Content -->
                                    <tr>
                                        <td style="padding: 40px 35px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                                                        Hola <strong style="color: #1a202c;">${datos.destinatarioNombre}</strong>,
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="color: #2d3748; font-size: 16px; line-height: 1.6; padding-bottom: 25px;">
                                                        <strong style="color: #f59e0b;">${datos.origenNombre}</strong> te ha mencionado en un comentario:
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
                                                            <tr>
                                                                <td style="padding: 20px 25px;">
                                                                    <p style="margin: 0; color: #4a5568; font-size: 15px; line-height: 1.6; font-style: italic;">
                                                                        "${datos.comentario}"
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding: 30px 0 10px 0;">
                                                        <table cellpadding="0" cellspacing="0" border="0">
                                                            <tr>
                                                                <td align="center" style="border-radius: 25px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);">
                                                                    <a href="${datos.urlDestino}" target="_blank" style="display: inline-block; padding: 14px 35px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                                        Ver mención
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #f7fafc; padding: 30px 35px; border-top: 1px solid #e2e8f0;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td align="center" style="padding-bottom: 8px;">
                                                        <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2d3748;">
                                                            Egresados IES
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center" style="padding-bottom: 15px;">
                                                        <p style="margin: 0; font-size: 13px; color: #718096;">
                                                            Sistema de Gestión de Egresados
                                                        </p>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="center">
                                                        <a href="${frontendUrl}/notificaciones/preferencias" target="_blank" style="color: #667eea; text-decoration: none; font-size: 13px; font-weight: 600;">
                                                            ⚙️ Configurar preferencias
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        return templates[tipo] || '';
    }


    /**
     * Notifica sobre un nuevo comentario
     * @param {Object} datos - Datos del comentario
     */
    async notificarComentario({ publicacionAutorId, comentarioAutorId, comentarioTexto, publicacionId }) {
        try {
            // No notificar si el autor del comentario es el mismo que el de la publicación
            if (publicacionAutorId === comentarioAutorId) {
                return;
            }

            const origenInfo = await this.obtenerInfoUsuario(comentarioAutorId);
            const destinatarioInfo = await this.obtenerInfoUsuario(publicacionAutorId);

            if (!destinatarioInfo) {
                console.log('⚠️  Usuario destinatario no encontrado');
                return;
            }

            const urlDestino = `${process.env.FRONTEND_URL}/feed#publicacion-${publicacionId}`;

            // Crear notificación interna
            const notifId = await this.crearNotificacion({
                usuarioId: publicacionAutorId,
                tipo: 'comentario',
                titulo: 'Nuevo comentario en tu publicación',
                mensaje: `${origenInfo?.nombre || 'Alguien'} comentó: "${comentarioTexto.substring(0, 100)}${comentarioTexto.length > 100 ? '...' : ''}"`,
                urlDestino,
                origenUsuarioId: comentarioAutorId
            });

            // Verificar preferencias y enviar email
            const preferencias = await this.obtenerPreferencias(publicacionAutorId);
            if (preferencias?.email_comentarios) {
                const htmlContent = this.generarEmailHTML('comentario', {
                    destinatarioNombre: destinatarioInfo.nombre,
                    origenNombre: `${origenInfo?.nombre || ''} ${origenInfo?.apellido || ''}`.trim(),
                    comentario: comentarioTexto,
                    urlDestino
                });

                const emailEnviado = await this.enviarEmail(
                    destinatarioInfo.email,
                    'Nuevo comentario en tu publicación - Egresados IES',
                    htmlContent
                );

                // Actualizar estado de email enviado
                if (emailEnviado) {
                    const db = database.getClient();
                    await db.execute({
                        sql: 'UPDATE Notificacion SET enviada_email = 1 WHERE id = ?',
                        args: [notifId]
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error al notificar comentario:', error);
        }
    }

    /**
     * Notifica sobre un nuevo like
     * @param {Object} datos - Datos del like
     */
    async notificarLike({ publicacionAutorId, likeAutorId, publicacionId }) {
        try {
            // No notificar si el autor del like es el mismo que el de la publicación
            if (publicacionAutorId === likeAutorId) {
                return;
            }

            const origenInfo = await this.obtenerInfoUsuario(likeAutorId);
            const destinatarioInfo = await this.obtenerInfoUsuario(publicacionAutorId);

            if (!destinatarioInfo) {
                console.log('⚠️  Usuario destinatario no encontrado');
                return;
            }

            const urlDestino = `${process.env.FRONTEND_URL}/feed#publicacion-${publicacionId}`;

            // Crear notificación interna
            const notifId = await this.crearNotificacion({
                usuarioId: publicacionAutorId,
                tipo: 'like',
                titulo: 'Nueva reacción a tu publicación',
                mensaje: `${origenInfo?.nombre || 'Alguien'} reaccionó a tu publicación`,
                urlDestino,
                origenUsuarioId: likeAutorId
            });

            // Verificar preferencias y enviar email
            const preferencias = await this.obtenerPreferencias(publicacionAutorId);
            if (preferencias?.email_likes) {
                const htmlContent = this.generarEmailHTML('like', {
                    destinatarioNombre: destinatarioInfo.nombre,
                    origenNombre: `${origenInfo?.nombre || ''} ${origenInfo?.apellido || ''}`.trim(),
                    urlDestino
                });

                const emailEnviado = await this.enviarEmail(
                    destinatarioInfo.email,
                    'Nueva reacción a tu publicación - Egresados IES',
                    htmlContent
                );

                if (emailEnviado) {
                    const db = database.getClient();
                    await db.execute({
                        sql: 'UPDATE Notificacion SET enviada_email = 1 WHERE id = ?',
                        args: [notifId]
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error al notificar like:', error);
        }
    }

    /**
     * Notifica sobre una mención en un comentario
     * @param {Object} datos - Datos de la mención
     */
    async notificarMencion({ usuarioMencionadoId, autorMencionId, comentarioTexto, publicacionId }) {
        try {
            // No notificar si se menciona a sí mismo
            if (usuarioMencionadoId === autorMencionId) {
                return;
            }

            const origenInfo = await this.obtenerInfoUsuario(autorMencionId);
            const destinatarioInfo = await this.obtenerInfoUsuario(usuarioMencionadoId);

            if (!destinatarioInfo) {
                console.log('⚠️  Usuario mencionado no encontrado');
                return;
            }

            const urlDestino = `${process.env.FRONTEND_URL}/feed#publicacion-${publicacionId}`;

            // Crear notificación interna
            const notifId = await this.crearNotificacion({
                usuarioId: usuarioMencionadoId,
                tipo: 'mencion',
                titulo: 'Te han mencionado en un comentario',
                mensaje: `${origenInfo?.nombre || 'Alguien'} te mencionó: "${comentarioTexto.substring(0, 100)}${comentarioTexto.length > 100 ? '...' : ''}"`,
                urlDestino,
                origenUsuarioId: autorMencionId
            });

            // Verificar preferencias y enviar email
            const preferencias = await this.obtenerPreferencias(usuarioMencionadoId);
            if (preferencias?.email_menciones) {
                const htmlContent = this.generarEmailHTML('mencion', {
                    destinatarioNombre: destinatarioInfo.nombre,
                    origenNombre: `${origenInfo?.nombre || ''} ${origenInfo?.apellido || ''}`.trim(),
                    comentario: comentarioTexto,
                    urlDestino
                });

                const emailEnviado = await this.enviarEmail(
                    destinatarioInfo.email,
                    'Te han mencionado - Egresados IES',
                    htmlContent
                );

                if (emailEnviado) {
                    const db = database.getClient();
                    await db.execute({
                        sql: 'UPDATE Notificacion SET enviada_email = 1 WHERE id = ?',
                        args: [notifId]
                    });
                }
            }
        } catch (error) {
            console.error('❌ Error al notificar mención:', error);
        }
    }

    /**
     * Detecta menciones en texto (@usuario) y devuelve IDs de usuarios
     * @param {String} texto - Texto a analizar
     * @returns {Promise<Array>} Array de IDs de usuarios mencionados
     */
    async detectarMenciones(texto) {
        try {
            // Detectar patrones @usuario
            const mencionesMatch = texto.match(/@(\w+)/g);
            if (!mencionesMatch) {
                return [];
            }

            const db = database.getClient();
            const usuariosMencionados = [];

            for (const mencion of mencionesMatch) {
                const username = mencion.substring(1); // Remover @
                
                // Buscar usuario por nombre (esto depende de cómo identifiques usuarios)
                const result = await db.execute({
                    sql: `SELECT u.id FROM Usuario u 
                          WHERE LOWER(u.nombre) = LOWER(?) OR LOWER(u.email) LIKE LOWER(?)`,
                    args: [username, `${username}%`]
                });

                if (result.rows.length > 0) {
                    usuariosMencionados.push(Number(result.rows[0].id));
                }
            }

            return [...new Set(usuariosMencionados)]; // Remover duplicados
        } catch (error) {
            console.error('❌ Error al detectar menciones:', error);
            return [];
        }
    }
}

// Exportar instancia única (singleton)
const notificationService = new NotificationService();
export default notificationService;
