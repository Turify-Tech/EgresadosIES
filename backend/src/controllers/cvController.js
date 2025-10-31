/**
 * Controlador para generar y descargar CV en PDF
 * Sistema de Gestión de Egresados IES
 */

import PDFDocument from "pdfkit";
import database from "../config/database.js";

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
        generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos);

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
function generarContenidoPDF(doc, perfil, experiencias, formaciones, cursos) {
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;

    // Colores
    const primaryColor = "#2563eb";
    const secondaryColor = "#64748b";
    const textColor = "#1e293b";

    let yPosition = margin;

    // HEADER - Información personal
    doc.fillColor(primaryColor)
        .fontSize(28)
        .font("Helvetica-Bold")
        .text(
            `${perfil.nombre}${perfil.apellido ? " " + perfil.apellido : ""}`,
            margin,
            yPosition
        );

    yPosition += 40;

    if (perfil.carreraNombre) {
        doc.fillColor(secondaryColor)
            .fontSize(16)
            .font("Helvetica")
            .text(perfil.carreraNombre, margin, yPosition);
        yPosition += 25;
    }

    // Información de contacto
    doc.fillColor(textColor).fontSize(12).font("Helvetica");

    const contactInfo = [];
    if (perfil.email) contactInfo.push(`Email: ${perfil.email}`);
    if (perfil.telefono) contactInfo.push(`Teléfono: ${perfil.telefono}`);
    if (perfil.dni) contactInfo.push(`DNI: ${perfil.dni}`);
    if (perfil.ciudad) {
        let ubicacion = perfil.ciudad;
        if (perfil.provincia) ubicacion += `, ${perfil.provincia}`;
        if (perfil.pais) ubicacion += `, ${perfil.pais}`;
        contactInfo.push(`Ubicación: ${ubicacion}`);
    }
    if (perfil.urlPortfolio)
        contactInfo.push(`Portfolio: ${perfil.urlPortfolio}`);

    contactInfo.forEach((info) => {
        doc.text(info, margin, yPosition);
        yPosition += 18;
    });

    yPosition += 10;

    // Línea separadora
    doc.strokeColor(primaryColor)
        .lineWidth(2)
        .moveTo(margin, yPosition)
        .lineTo(pageWidth - margin, yPosition)
        .stroke();

    yPosition += 25;

    // RESUMEN PROFESIONAL
    if (perfil.resumenProfesional) {
        doc.fillColor(primaryColor)
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("RESUMEN PROFESIONAL", margin, yPosition);

        yPosition += 25;

        doc.fillColor(textColor)
            .fontSize(11)
            .font("Helvetica")
            .text(perfil.resumenProfesional, margin, yPosition, {
                width: contentWidth,
                align: "justify",
            });

        yPosition +=
            doc.heightOfString(perfil.resumenProfesional, {
                width: contentWidth,
                align: "justify",
            }) + 20;
    }

    // Verificar si necesitamos nueva página
    if (yPosition > doc.page.height - 200) {
        doc.addPage();
        yPosition = margin;
    }

    // EXPERIENCIA LABORAL
    if (experiencias.length > 0) {
        doc.fillColor(primaryColor)
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("EXPERIENCIA LABORAL", margin, yPosition);

        yPosition += 25;

        experiencias.forEach((exp, index) => {
            // Verificar si necesitamos nueva página
            if (yPosition > doc.page.height - 150) {
                doc.addPage();
                yPosition = margin;
            }

            // Puesto y empresa
            doc.fillColor(textColor)
                .fontSize(13)
                .font("Helvetica-Bold")
                .text(`${exp.puesto} - ${exp.empresa}`, margin, yPosition);

            yPosition += 20;

            // Fechas
            if (exp.fechaInicio) {
                const fechaInicio = new Date(
                    exp.fechaInicio
                ).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                });
                const fechaFin = exp.fechaFin
                    ? new Date(exp.fechaFin).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                      })
                    : "Actualidad";

                doc.fillColor(secondaryColor)
                    .fontSize(11)
                    .font("Helvetica-Oblique")
                    .text(`${fechaInicio} - ${fechaFin}`, margin, yPosition);

                yPosition += 18;
            }

            // Descripción
            if (exp.descripcion) {
                doc.fillColor(textColor)
                    .fontSize(11)
                    .font("Helvetica")
                    .text(exp.descripcion, margin, yPosition, {
                        width: contentWidth,
                        align: "justify",
                    });

                yPosition +=
                    doc.heightOfString(exp.descripcion, {
                        width: contentWidth,
                        align: "justify",
                    }) + 15;
            }

            yPosition += 10;
        });
    }

    // FORMACIÓN ACADÉMICA
    if (formaciones.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > doc.page.height - 200) {
            doc.addPage();
            yPosition = margin;
        }

        doc.fillColor(primaryColor)
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("FORMACIÓN ACADÉMICA", margin, yPosition);

        yPosition += 25;

        formaciones.forEach((formacion) => {
            // Verificar si necesitamos nueva página
            if (yPosition > doc.page.height - 100) {
                doc.addPage();
                yPosition = margin;
            }

            doc.fillColor(textColor)
                .fontSize(13)
                .font("Helvetica-Bold")
                .text(formacion.titulo, margin, yPosition);

            yPosition += 18;

            doc.fillColor(secondaryColor)
                .fontSize(11)
                .font("Helvetica")
                .text(
                    `${formacion.institucion}${
                        formacion.anioFinalizacion
                            ? ` - ${formacion.anioFinalizacion}`
                            : ""
                    }`,
                    margin,
                    yPosition
                );

            yPosition += 25;
        });
    }

    // CURSOS Y CERTIFICACIONES
    if (cursos.length > 0) {
        // Verificar si necesitamos nueva página
        if (yPosition > doc.page.height - 200) {
            doc.addPage();
            yPosition = margin;
        }

        doc.fillColor(primaryColor)
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("CURSOS Y CERTIFICACIONES", margin, yPosition);

        yPosition += 25;

        cursos.forEach((curso) => {
            // Verificar si necesitamos nueva página
            if (yPosition > doc.page.height - 80) {
                doc.addPage();
                yPosition = margin;
            }

            doc.fillColor(textColor)
                .fontSize(12)
                .font("Helvetica-Bold")
                .text(curso.nombre, margin, yPosition);

            yPosition += 16;

            let detalleCurso = curso.institucion;
            if (curso.horasDuracion) {
                detalleCurso += ` - ${curso.horasDuracion} horas`;
            }

            doc.fillColor(secondaryColor)
                .fontSize(10)
                .font("Helvetica")
                .text(detalleCurso, margin, yPosition);

            yPosition += 20;
        });
    }

    // Footer con información adicional
    if (perfil.situacionLaboral) {
        yPosition += 20;

        doc.fillColor(primaryColor)
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("SITUACIÓN LABORAL ACTUAL", margin, yPosition);

        yPosition += 18;

        doc.fillColor(textColor)
            .fontSize(11)
            .font("Helvetica")
            .text(perfil.situacionLaboral, margin, yPosition);
    }

    // Footer del documento
    const footerY = doc.page.height - 50;
    doc.fillColor(secondaryColor)
        .fontSize(8)
        .font("Helvetica")
        .text(
            `Generado desde Sistema de Egresados IES - ${new Date().toLocaleDateString(
                "es-ES"
            )}`,
            margin,
            footerY,
            { align: "center", width: contentWidth }
        );
}
