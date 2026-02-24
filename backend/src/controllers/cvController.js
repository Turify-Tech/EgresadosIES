/**
 * Controlador para generar y descargar CV en PDF
 * Sistema de Gestión de Egresados IES
 */

import PDFDocument from "pdfkit";
import database from "../config/database.js";

/**
 * Descarga una imagen desde URL y retorna el buffer
 * @param {string} url - URL de la imagen
 * @returns {Promise<Buffer|null>} Buffer de la imagen o null si falla
 */
async function descargarImagen(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Error descargando imagen:", error);
        return null;
    }
}

/**
 * Genera y descarga el CV de un egresado específico por su ID (público)
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function downloadCVPublico(req, res) {
    try {
        const { id } = req.params;
        const usuarioId = parseInt(id);

        if (!id || isNaN(usuarioId)) {
            return res.status(400).json({
                success: false,
                error: "ID de egresado inválido",
            });
        }

        const client = database.getClient();

        // Verificar que el egresado existe y tiene perfil
        const verifyQuery = `
            SELECT 
                u.id as userId,
                u.nombre,
                u.apellido,
                u.email,
                e.dni,
                e.telefono,
                p.id as perfilId,
                p.resumenProfesional,
                p.urlPortfolio,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.fechaNacimiento,
                p.direccion,
                p.ciudad,
                p.provincia,
                p.pais,
                c.id as carreraId,
                c.nombre as carreraNombre
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            WHERE u.id = ?
        `;

        const perfilResult = await client.execute({
            sql: verifyQuery,
            args: [usuarioId],
        });

        if (perfilResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Egresado no encontrado",
            });
        }

        const perfil = perfilResult.rows[0];
        const perfilId = perfil.perfilId;

        // Si no tiene "Acerca de mí" (resumenProfesional), no puede descargar CV
        if (!perfil.resumenProfesional) {
            return res.status(400).json({
                success: false,
                error: "El egresado no tiene cargado su perfil profesional",
            });
        }

        // Obtener experiencias laborales
        let experiencias = [];
        if (perfilId) {
            const experienciasResult = await client.execute({
                sql: "SELECT * FROM ExperienciaLaboral WHERE perfilId = ? ORDER BY fechaInicio DESC",
                args: [perfilId],
            });
            experiencias = experienciasResult.rows;
        }

        // Obtener formación académica
        let formaciones = [];
        if (perfilId) {
            const formacionResult = await client.execute({
                sql: "SELECT * FROM FormacionAcademica WHERE perfilId = ? ORDER BY anioFinalizacion DESC",
                args: [perfilId],
            });
            formaciones = formacionResult.rows;
        }

        // Obtener cursos
        let cursos = [];
        if (perfilId) {
            const cursosResult = await client.execute({
                sql: "SELECT * FROM Curso WHERE perfilId = ? ORDER BY nombre ASC",
                args: [perfilId],
            });
            cursos = cursosResult.rows;
        }

        // Obtener habilidades
        let habilidades = [];
        const habilidadesResult = await client.execute({
            sql: "SELECT * FROM Habilidades WHERE usuarioId = ? ORDER BY tipo ASC, nombre ASC",
            args: [usuarioId],
        });
        habilidades = habilidadesResult.rows;

        // Generar PDF
        const doc = new PDFDocument();

        // Configurar headers para descarga
        const nombreCompleto = `${perfil.nombre}${
            perfil.apellido ? " " + perfil.apellido : ""
        }`;
        const fileName = `CV_${nombreCompleto.replace(/\s+/g, "_")}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // Generar contenido del PDF
        await generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos, habilidades);

        // Finalizar el documento
        doc.end();
    } catch (error) {
        console.error("❌ Error generando CV público:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor al generar el CV",
        });
    }
}

/**
 * Genera y descarga el CV del usuario en formato PDF
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function downloadMiCV(req, res) {
    try {
        const usuarioId = req.user.id;
        const client = database.getClient();

        // Obtener toda la información del perfil del usuario
        const perfilQuery = `
            SELECT 
                u.id as userId,
                u.nombre,
                u.apellido,
                u.email,
                e.dni,
                e.telefono,
                p.id as perfilId,
                p.resumenProfesional,
                p.urlPortfolio,
                p.situacionLaboral,
                p.urlFotoPerfil,
                p.fechaNacimiento,
                p.direccion,
                p.ciudad,
                p.provincia,
                p.pais,
                c.id as carreraId,
                c.nombre as carreraNombre
            FROM Usuario u
            INNER JOIN Egresado e ON u.id = e.id
            LEFT JOIN Perfil p ON e.perfilId = p.id
            LEFT JOIN Carrera c ON e.carreraId = c.id
            WHERE u.id = ?
        `;

        const perfilResult = await client.execute({
            sql: perfilQuery,
            args: [usuarioId],
        });

        if (perfilResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Perfil no encontrado",
            });
        }

        const perfil = perfilResult.rows[0];
        const perfilId = perfil.perfilId;

        // Obtener experiencias laborales
        let experiencias = [];
        if (perfilId) {
            const experienciasResult = await client.execute({
                sql: "SELECT * FROM ExperienciaLaboral WHERE perfilId = ? ORDER BY fechaInicio DESC",
                args: [perfilId],
            });
            experiencias = experienciasResult.rows;
        }

        // Obtener formación académica
        let formaciones = [];
        if (perfilId) {
            const formacionResult = await client.execute({
                sql: "SELECT * FROM FormacionAcademica WHERE perfilId = ? ORDER BY anioFinalizacion DESC",
                args: [perfilId],
            });
            formaciones = formacionResult.rows;
        }

        // Obtener cursos
        let cursos = [];
        if (perfilId) {
            const cursosResult = await client.execute({
                sql: "SELECT * FROM Curso WHERE perfilId = ? ORDER BY nombre ASC",
                args: [perfilId],
            });
            cursos = cursosResult.rows;
        }

        // Obtener habilidades
        let habilidades = [];
        const habilidadesResult = await client.execute({
            sql: "SELECT * FROM Habilidades WHERE usuarioId = ? ORDER BY tipo ASC, nombre ASC",
            args: [usuarioId],
        });
        habilidades = habilidadesResult.rows;

        // Generar PDF
        const doc = new PDFDocument();

        // Configurar headers para descarga
        const nombreCompleto = `${perfil.nombre}${
            perfil.apellido ? " " + perfil.apellido : ""
        }`;
        const fileName = `CV_${nombreCompleto.replace(/\s+/g, "_")}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        // Pipe del PDF a la respuesta
        doc.pipe(res);

        // Generar contenido del PDF
        await generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos, habilidades);

        // Finalizar el documento
        doc.end();
    } catch (error) {
        console.error("❌ Error generando CV:", error);
        res.status(500).json({
            success: false,
            error: "Error interno del servidor al generar el CV",
        });
    }
}

/**
 * Función auxiliar para generar el contenido del PDF
 */
async function generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos, habilidades) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Colores profesionales
    const primaryColor = "#1a1a1a";  // Negro para nombre y títulos
    const secondaryColor = "#666666"; // Gris para subtítulos
    const lineColor = "#333333";      // Gris oscuro para líneas
    const textColor = "#000000";      // Negro para texto

    // Función helper para añadir nueva página
    const nuevaPagina = () => {
        doc.addPage();
        return margin;
    };

    // Función helper para verificar si necesitamos nueva página
    const verificarEspacio = (alturaRequerida, yActual) => {
        if (yActual + alturaRequerida > pageHeight - margin - 30) {
            return nuevaPagina();
        }
        return yActual;
    };

    // Función helper para dibujar línea de sección (ancho completo)
    const dibujarLineaSeccion = (y) => {
        doc.strokeColor(lineColor)
            .lineWidth(0.8)
            .moveTo(margin, y)
            .lineTo(pageWidth - margin, y)
            .stroke();
    };

    let yPosition = 30; // Margen superior más pequeño para reducir espacio en blanco

    // ========================================
    // HEADER - Información personal compacta
    // ========================================
    
    // Foto de perfil (si existe)
    if (perfil.urlFotoPerfil) {
        const imagenBuffer = await descargarImagen(perfil.urlFotoPerfil);
        if (imagenBuffer) {
            const fotoSize = 80; // Tamaño de la foto en puntos
            const fotoX = (pageWidth - fotoSize) / 2; // Centrar horizontalmente
            
            doc.save();
            // Crear círculo para recortar la imagen
            doc.circle(fotoX + fotoSize / 2, yPosition + fotoSize / 2, fotoSize / 2)
                .clip();
            
            // Insertar imagen
            doc.image(imagenBuffer, fotoX, yPosition, {
                width: fotoSize,
                height: fotoSize,
                fit: [fotoSize, fotoSize],
                align: 'center',
                valign: 'center'
            });
            doc.restore();
            
            yPosition += fotoSize + 10; // Espacio después de la foto
        }
    }
    
    // Nombre en MAYÚSCULAS
    const nombreCompleto = `${perfil.nombre}${perfil.apellido ? " " + perfil.apellido : ""}`.toUpperCase();
    doc.fillColor(primaryColor)
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(nombreCompleto, margin, yPosition, {
            align: "center",
            width: contentWidth
        });

    yPosition += 30;

    // Carrera o título profesional
    if (perfil.carreraNombre) {
        doc.fillColor(secondaryColor)
            .fontSize(11)
            .font("Helvetica")
            .text(perfil.carreraNombre, margin, yPosition, {
                align: "center",
                width: contentWidth
            });
        yPosition += 15;
    }

    // Información de contacto en una línea compacta (email | teléfono | ubicación)
    const contactParts = [];
    if (perfil.email) contactParts.push(perfil.email);
    if (perfil.telefono) contactParts.push(perfil.telefono);
    if (perfil.ciudad) {
        let ubicacion = perfil.ciudad;
        if (perfil.provincia) ubicacion += `, ${perfil.provincia}`;
        if (perfil.pais) ubicacion += `, ${perfil.pais}`;
        contactParts.push(ubicacion);
    }
    
    if (contactParts.length > 0) {
        doc.fillColor(textColor)
            .fontSize(9)
            .font("Helvetica")
            .text(contactParts.join(" | "), margin, yPosition, {
                align: "center",
                width: contentWidth
            });
        yPosition += 12;
    }

    // Portfolio en línea separada si existe
    if (perfil.urlPortfolio) {
        doc.fillColor(secondaryColor)
            .fontSize(8)
            .font("Helvetica")
            .text(`Portfolio: ${perfil.urlPortfolio}`, margin, yPosition, {
                align: "center",
                width: contentWidth
            });
        yPosition += 12;
    }

    yPosition += 8;

    // ========================================
    // PERFIL PROFESIONAL
    // ========================================
    if (perfil.resumenProfesional) {
        yPosition = verificarEspacio(60, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Perfil Profesional", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        doc.fillColor(textColor)
            .fontSize(9)
            .font("Helvetica")
            .text(perfil.resumenProfesional, margin, yPosition, {
                width: contentWidth,
                align: "justify",
                lineGap: 1
            });

        yPosition += doc.heightOfString(perfil.resumenProfesional, {
            width: contentWidth,
            align: "justify",
            lineGap: 1
        }) + 20;
    }

    // ========================================
    // EXPERIENCIA LABORAL
    // ========================================
    if (experiencias.length > 0) {
        yPosition = verificarEspacio(80, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Experiencia Laboral", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        experiencias.forEach((exp, index) => {
            // Estimar altura necesaria para esta experiencia
            const alturaEstimada = 50 + (exp.descripcion ? 30 : 0);
            yPosition = verificarEspacio(alturaEstimada, yPosition);

            // Guardar posición Y para la fecha
            const yPuestoFecha = yPosition;

            // Puesto en negrita
            doc.fillColor(textColor)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(exp.puesto, margin, yPosition, {
                    width: contentWidth * 0.6
                });

            // Fechas en itálica - alineadas a la derecha
            if (exp.fechaInicio) {
                const fechaInicio = new Date(exp.fechaInicio).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short"
                });
                const fechaFin = exp.fechaFin
                    ? new Date(exp.fechaFin).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short"
                      })
                    : "Presente";

                doc.fillColor(secondaryColor)
                    .fontSize(8)
                    .font("Helvetica-Oblique")
                    .text(`${fechaInicio} - ${fechaFin}`, margin, yPuestoFecha, {
                        width: contentWidth,
                        align: "right"
                    });
            }

            yPosition += 12;

            // Empresa y ubicación en gris
            doc.fillColor(secondaryColor)
                .fontSize(9)
                .font("Helvetica")
                .text(exp.empresa, margin, yPosition);

            yPosition += 11;

            // Descripción con viñetas si existe
            if (exp.descripcion) {
                // Dividir descripción en puntos si contiene saltos de línea o bullets
                const puntos = exp.descripcion.split('\n').filter(p => p.trim());
                
                puntos.forEach(punto => {
                    yPosition = verificarEspacio(18, yPosition);
                    doc.fillColor(textColor)
                        .fontSize(8)
                        .font("Helvetica")
                        .text(`• ${punto.trim()}`, margin + 8, yPosition, {
                            width: contentWidth - 8,
                            lineGap: 0.5
                        });

                    yPosition += doc.heightOfString(`• ${punto.trim()}`, {
                        width: contentWidth - 8,
                        lineGap: 0.5
                    }) + 2;
                });
            }

            yPosition += 8; // Espacio entre experiencias
        });

        yPosition += 18;
    }

    // ========================================
    // FORMACIÓN ACADÉMICA
    // ========================================
    if (formaciones.length > 0) {
        yPosition = verificarEspacio(60, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Formación Académica", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        formaciones.forEach((formacion) => {
            yPosition = verificarEspacio(30, yPosition);

            // Guardar posición Y para la fecha
            const yTituloFecha = yPosition;

            // Título en negrita
            doc.fillColor(textColor)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text(formacion.titulo, margin, yPosition, {
                    width: contentWidth * 0.6
                });

            // Año alineado a la derecha
            if (formacion.anioFinalizacion) {
                doc.fillColor(secondaryColor)
                    .fontSize(8)
                    .font("Helvetica-Oblique")
                    .text(formacion.anioFinalizacion.toString(), margin, yTituloFecha, {
                        width: contentWidth,
                        align: "right"
                    });
            }

            yPosition += 12;

            // Institución
            doc.fillColor(secondaryColor)
                .fontSize(9)
                .font("Helvetica")
                .text(formacion.institucion, margin, yPosition);

            yPosition += 13;
        });

        yPosition += 18;
    }

    // ========================================
    // CURSOS Y CERTIFICACIONES (compacto)
    // ========================================
    if (cursos.length > 0) {
        yPosition = verificarEspacio(50, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Certificaciones", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        cursos.forEach((curso) => {
            yPosition = verificarEspacio(20, yPosition);

            // Nombre del curso en negrita
            doc.fillColor(textColor)
                .fontSize(9)
                .font("Helvetica-Bold")
                .text(curso.nombre, margin, yPosition);

            yPosition += 10;

            // Institución y horas en la misma línea
            let detalleCurso = curso.institucion;
            if (curso.horasDuracion) {
                detalleCurso += ` | ${curso.horasDuracion} horas`;
            }

            doc.fillColor(secondaryColor)
                .fontSize(8)
                .font("Helvetica")
                .text(detalleCurso, margin, yPosition);

            yPosition += 11;
        });

        yPosition += 18;
    }

    // ========================================
    // HABILIDADES (divididas en técnicas y blandas)
    // ========================================
    if (habilidades.length > 0) {
        yPosition = verificarEspacio(50, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Habilidades", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        // Separar habilidades por tipo
        const habilidadesTecnicas = habilidades.filter(h => h.tipo === 'tecnica');
        const habilidadesBlandas = habilidades.filter(h => h.tipo === 'blanda');
        const idiomas = habilidades.filter(h => h.tipo === 'idioma');

        // Habilidades Técnicas
        if (habilidadesTecnicas.length > 0) {
            doc.fillColor(textColor)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Técnicas: ", margin, yPosition, { continued: true })
                .fontSize(9)
                .font("Helvetica")
                .text(habilidadesTecnicas.map(h => h.nombre).join(", "), {
                    width: contentWidth - 60,
                    lineGap: 1
                });

            yPosition += doc.heightOfString(habilidadesTecnicas.map(h => h.nombre).join(", "), {
                width: contentWidth - 60
            }) + 8;
        }

        // Habilidades Blandas
        if (habilidadesBlandas.length > 0) {
            yPosition = verificarEspacio(30, yPosition);
            
            doc.fillColor(textColor)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Blandas: ", margin, yPosition, { continued: true })
                .fontSize(9)
                .font("Helvetica")
                .text(habilidadesBlandas.map(h => h.nombre).join(", "), {
                    width: contentWidth - 60,
                    lineGap: 1
                });

            yPosition += doc.heightOfString(habilidadesBlandas.map(h => h.nombre).join(", "), {
                width: contentWidth - 60
            }) + 8;
        }

        // Idiomas (si existen)
        if (idiomas.length > 0) {
            yPosition = verificarEspacio(30, yPosition);
            
            doc.fillColor(textColor)
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Idiomas: ", margin, yPosition, { continued: true })
                .fontSize(9)
                .font("Helvetica")
                .text(idiomas.map(h => h.nombre).join(", "), {
                    width: contentWidth - 60,
                    lineGap: 1
                });

            yPosition += doc.heightOfString(idiomas.map(h => h.nombre).join(", "), {
                width: contentWidth - 60
            }) + 8;

            yPosition += 6;
        }

        yPosition += 18;
    }

    // ========================================
    // SITUACIÓN LABORAL (si aplica)
    // ========================================
    if (perfil.situacionLaboral) {
        yPosition = verificarEspacio(40, yPosition);

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("Situación Laboral", margin, yPosition, {
                align: "center",
                width: contentWidth
            });

        yPosition += 13;
        dibujarLineaSeccion(yPosition);
        yPosition += 13;

        doc.fillColor(textColor)
            .fontSize(9)
            .font("Helvetica")
            .text(perfil.situacionLaboral, margin, yPosition);
    }

}
