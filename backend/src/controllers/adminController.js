import database from "../config/database.js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

/**
 * Controlador de administración para gestión de DNIs válidos
 * Permite a los administradores gestionar la lista de DNIs válidos para registro
 */

/**
 * Validar formato de DNI argentino
 * @param {string} dni - DNI a validar
 * @returns {boolean} - true si es válido
 */
function validateDNI(dni) {
    // DNI argentino: 7-8 dígitos numéricos
    const dniRegex = /^\d{7,8}$/;
    return dniRegex.test(dni.toString().trim());
}

/**
 * Procesar archivo Excel y extraer datos de DNI y carrera
 * @param {Buffer} fileBuffer - Buffer del archivo Excel
 * @returns {Array} - Array de objetos {dni, carrera}
 */
function processExcelFile(fileBuffer) {
    try {
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a JSON
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
        });

        // Buscar las columnas DNI y Carrera (case insensitive)
        const headerRow = jsonData[0];
        if (!headerRow) {
            throw new Error('El archivo está vacío');
        }

        const dniColIndex = headerRow.findIndex(col => 
            col && col.toString().toLowerCase().includes('dni')
        );
        const carreraColIndex = headerRow.findIndex(col => 
            col && col.toString().toLowerCase().includes('carrera')
        );

        if (dniColIndex === -1 || carreraColIndex === -1) {
            throw new Error('El archivo debe contener columnas "DNI" y "Carrera"');
        }

        // Procesar datos (saltar header)
        const processedData = [];
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const dni = row[dniColIndex];
            const carrera = row[carreraColIndex];

            if (dni && carrera) {
                processedData.push({
                    dni: dni.toString().trim(),
                    carrera: carrera.toString().trim()
                });
            }
        }

        return processedData;
    } catch (error) {
        throw new Error(`Error procesando archivo Excel: ${error.message}`);
    }
}

/**
 * Validar que la carrera existe en la base de datos
 * @param {string} carrera - Nombre de la carrera
 * @returns {Promise<boolean>} - true si existe
 */
async function validateCarrera(carrera) {
    try {
        const client = database.getClient();
        const result = await client.execute({
            sql: 'SELECT id FROM Carrera WHERE LOWER(nombre) = LOWER(?)',
            args: [carrera]
        });
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error validando carrera:', error);
        return false;
    }
}

/**
 * Registrar operación en logs (opcional - para auditoria)
 * @param {number} adminId - ID del administrador
 * @param {string} operacion - Descripción de la operación
 * @param {object} detalles - Detalles adicionales
 */
async function logAdminOperation(adminId, operacion, detalles = {}) {
    try {
        console.log(`[ADMIN LOG] Usuario ${adminId}: ${operacion}`, detalles);
        // Aquí se puede implementar logging a base de datos si se requiere
    } catch (error) {
        console.error('Error registrando operación:', error);
    }
}

/**
 * Cargar DNIs desde archivo Excel
 * POST /api/admin/dnis/cargar-excel
 */
export async function cargarExcel(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se ha subido ningún archivo'
            });
        }

        // Validar tipo de archivo
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Solo se permiten archivos Excel (.xlsx, .xls)'
            });
        }

        // Procesar archivo Excel
        const dniData = processExcelFile(req.file.buffer);
        
        if (dniData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se encontraron datos válidos en el archivo'
            });
        }

        // Estadísticas de procesamiento
        let procesados = 0;
        let exitosos = 0;
        let duplicados = 0;
        const errores = [];

        // Procesar cada DNI
        for (const item of dniData) {
            procesados++;
            
            // Validar DNI
            if (!validateDNI(item.dni)) {
                errores.push(`Fila ${procesados}: DNI "${item.dni}" tiene formato inválido`);
                continue;
            }

            // Validar carrera
            const carreraValida = await validateCarrera(item.carrera);
            if (!carreraValida) {
                errores.push(`Fila ${procesados}: Carrera "${item.carrera}" no existe`);
                continue;
            }

            try {
                const client = database.getClient();
                
                // Verificar si el DNI ya existe
                const existente = await client.execute({
                    sql: 'SELECT dni FROM DniValido WHERE dni = ?',
                    args: [item.dni]
                });

                if (existente.rows.length > 0) {
                    duplicados++;
                    continue;
                }

                // Insertar DNI válido
                await client.execute({
                    sql: 'INSERT INTO DniValido (dni, carrera) VALUES (?, ?)',
                    args: [item.dni, item.carrera]
                });
                
                exitosos++;
            } catch (error) {
                errores.push(`Fila ${procesados}: Error insertando DNI "${item.dni}": ${error.message}`);
            }
        }

        // Log de la operación
        await logAdminOperation(req.user.id, 'Carga masiva de DNIs', {
            archivo: req.file.originalname,
            procesados,
            exitosos,
            duplicados,
            errores: errores.length
        });

        res.status(200).json({
            success: true,
            message: 'Carga masiva completada',
            data: {
                procesados,
                exitosos,
                duplicados,
                errores
            }
        });

    } catch (error) {
        console.error('Error en carga masiva:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno procesando archivo Excel',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Agregar DNI individual
 * POST /api/admin/dnis/agregar
 */
export async function agregarDNI(req, res) {
    try {
        const { dni, carrera } = req.body;

        // Validaciones básicas
        if (!dni || !carrera) {
            return res.status(400).json({
                success: false,
                message: 'DNI y carrera son requeridos'
            });
        }

        // Validar formato DNI
        if (!validateDNI(dni)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de DNI inválido. Debe contener 7-8 dígitos'
            });
        }

        const client = database.getClient();

        // Verificar si el DNI ya existe
        const existente = await client.execute({
            sql: 'SELECT dni FROM DniValido WHERE dni = ?',
            args: [dni]
        });

        if (existente.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El DNI ya existe en la lista de válidos'
            });
        }

        // Validar carrera
        const carreraValida = await validateCarrera(carrera);
        if (!carreraValida) {
            return res.status(400).json({
                success: false,
                message: 'La carrera especificada no existe'
            });
        }

        // Insertar DNI
        await client.execute({
            sql: 'INSERT INTO DniValido (dni, carrera) VALUES (?, ?)',
            args: [dni, carrera]
        });

        // Log de la operación
        await logAdminOperation(req.user.id, 'Agregar DNI individual', { dni, carrera });

        res.status(201).json({
            success: true,
            message: 'DNI agregado exitosamente',
            data: { dni, carrera }
        });

    } catch (error) {
        console.error('Error agregando DNI:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno agregando DNI',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Listar DNIs válidos con paginación
 * GET /api/admin/dnis
 */
export async function listarDNIs(req, res) {
    try {
        // Usar parámetros directamente desde query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const carreraFilter = req.query.carrera || '';

        // Validaciones básicas
        if (page < 1 || limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Parámetros de paginación inválidos'
            });
        }

        const offset = (page - 1) * limit;
        const client = database.getClient();
        
        // Construir query con filtros
        let whereClause = '';
        const params = [];
        
        if (search || carreraFilter) {
            const conditions = [];
            
            if (search) {
                conditions.push('dni LIKE ?');
                params.push(`%${search}%`);
            }
            
            if (carreraFilter) {
                conditions.push('LOWER(carrera) = LOWER(?)');
                params.push(carreraFilter);
            }
            
            whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        // Contar total
        const countQuery = `SELECT COUNT(*) as total FROM DniValido ${whereClause}`;
        const countResult = await client.execute({
            sql: countQuery,
            args: params
        });
        const total = countResult.rows[0].total;

        // Obtener datos paginados
        const dataQuery = `
            SELECT dni, carrera 
            FROM DniValido 
            ${whereClause}
            ORDER BY dni ASC 
            LIMIT ? OFFSET ?
        `;
        const dataParams = [...params, limit, offset];
        const dnis = await client.execute({
            sql: dataQuery,
            args: dataParams
        });

        // Obtener lista de carreras para filtros
        const carreras = await client.execute('SELECT nombre FROM Carrera ORDER BY nombre');

        res.status(200).json({
            success: true,
            data: {
                dnis: dnis.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                },
                filters: {
                    carreras: carreras.rows.map(c => c.nombre)
                }
            }
        });

    } catch (error) {
        console.error('Error listando DNIs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno obteniendo lista de DNIs'
        });
    }
}

/**
 * Eliminar DNI de la lista
 * DELETE /api/admin/dnis/:dni
 */
export async function eliminarDNI(req, res) {
    try {
        const { dni } = req.params;

        // Validar formato DNI
        if (!validateDNI(dni)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de DNI inválido'
            });
        }

        const client = database.getClient();

        // Verificar que el DNI existe
        const existente = await client.execute({
            sql: 'SELECT dni, carrera FROM DniValido WHERE dni = ?',
            args: [dni]
        });

        if (existente.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'DNI no encontrado en la lista'
            });
        }

        // Eliminar DNI
        await client.execute({
            sql: 'DELETE FROM DniValido WHERE dni = ?',
            args: [dni]
        });

        // Log de la operación
        await logAdminOperation(req.user.id, 'Eliminar DNI', { 
            dni, 
            carrera: existente.rows[0].carrera 
        });

        res.status(200).json({
            success: true,
            message: 'DNI eliminado exitosamente',
            data: existente.rows[0]
        });

    } catch (error) {
        console.error('Error eliminando DNI:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno eliminando DNI'
        });
    }
}

/**
 * Editar carrera de un DNI
 * PUT /api/admin/dnis/:dni
 */
export async function editarDNI(req, res) {
    try {
        const { dni } = req.params;
        const { carrera } = req.body;

        // Validaciones
        if (!carrera) {
            return res.status(400).json({
                success: false,
                message: 'Carrera es requerida'
            });
        }

        if (!validateDNI(dni)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de DNI inválido'
            });
        }

        // Validar carrera
        const carreraValida = await validateCarrera(carrera);
        if (!carreraValida) {
            return res.status(400).json({
                success: false,
                message: 'La carrera especificada no existe'
            });
        }

        const client = database.getClient();

        // Verificar que el DNI existe
        const existente = await client.execute({
            sql: 'SELECT dni, carrera FROM DniValido WHERE dni = ?',
            args: [dni]
        });

        if (existente.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'DNI no encontrado en la lista'
            });
        }

        const carreraAnterior = existente.rows[0].carrera;

        // Actualizar carrera
        await client.execute({
            sql: 'UPDATE DniValido SET carrera = ? WHERE dni = ?',
            args: [carrera, dni]
        });

        // Log de la operación
        await logAdminOperation(req.user.id, 'Editar DNI', { 
            dni, 
            carreraAnterior, 
            carreraNueva: carrera 
        });

        res.status(200).json({
            success: true,
            message: 'DNI actualizado exitosamente',
            data: { dni, carrera, carreraAnterior }
        });

    } catch (error) {
        console.error('Error editando DNI:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno editando DNI'
        });
    }
}

/**
 * Obtener estadísticas de DNIs válidos
 * GET /api/admin/dnis/estadisticas
 */
export async function obtenerEstadisticas(req, res) {
    try {
        const client = database.getClient();

        // Total de DNIs
        const totalResult = await client.execute('SELECT COUNT(*) as total FROM DniValido');
        const total = totalResult.rows[0].total;

        // DNIs por carrera
        const porCarrera = await client.execute(`
            SELECT carrera, COUNT(*) as cantidad 
            FROM DniValido 
            GROUP BY carrera 
            ORDER BY cantidad DESC
        `);

        res.status(200).json({
            success: true,
            data: {
                total,
                porCarrera: porCarrera.rows
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno obteniendo estadísticas'
        });
    }
}