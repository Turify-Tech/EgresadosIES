import database from "../config/database.js";
import { hashPassword, verifyPassword } from "../utils/bcrypt.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Controlador de autenticación unificada
 * Maneja login para egresados y administradores
 */

/**
 * Login unificado para egresados y administradores
 * Solo permite login de usuarios ya registrados
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function login(req, res) {
    const { dni, password } = req.body;

    // Validaciones básicas
    if (!dni || !password) {
        console.warn(
            `[SECURITY] Login sin credenciales - IP: ${
                req.ip
            }, User-Agent: ${req.get("User-Agent")}`
        );
        return res.status(400).json({
            success: false,
            message: "DNI y contraseña son requeridos",
        });
    }

    // Sanitización de inputs
    const sanitizedDni = dni
        .toString()
        .trim()
        .replace(/[^0-9]/g, "");
    const sanitizedPassword = password.toString().trim();

    // Validar formato de DNI (7 u 8 dígitos)
    if (!/^\d{7,8}$/.test(sanitizedDni)) {
        console.warn(
            `[SECURITY] DNI inválido - DNI: ${sanitizedDni}, IP: ${
                req.ip
            }, User-Agent: ${req.get("User-Agent")}`
        );
        return res.status(400).json({
            success: false,
            message: "El DNI debe tener 7 u 8 dígitos",
        });
    }

    const client = database.getClient();

    try {
        // Buscar usuario existente por DNI
        const existingUser = await findExistingUser(client, sanitizedDni);

        if (existingUser) {
            // Usuario existe, validar password y hacer login
            return await handleExistingUserLogin(
                res,
                existingUser,
                sanitizedPassword,
                req
            );
        }

        // Usuario no existe - debe registrarse primero
        console.warn(
            `[SECURITY] Intento de login con DNI no registrado - DNI: ${sanitizedDni}, IP: ${
                req.ip
            }, User-Agent: ${req.get("User-Agent")}`
        );
        return res.status(401).json({
            success: false,
            message: "El DNI no está registrado. Por favor, regístrate primero.",
            requiresRegistration: true
        });
    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
}

/**
 * Busca un usuario existente por DNI en ambas tablas (Egresado y Administrador)
 */
async function findExistingUser(client, dni) {
    // Buscar en tabla Egresado
    const egresadoQuery = `
        SELECT 
            u.id, u.nombre, u.email, u.password, u.tipo_usuario,
            e.dni, e.telefono, e.carreraId,
            c.nombre as carrera_nombre
        FROM Usuario u
        INNER JOIN Egresado e ON u.id = e.id
        LEFT JOIN Carrera c ON e.carreraId = c.id
        WHERE e.dni = ?
    `;

    const egresadoResult = await client.execute({
        sql: egresadoQuery,
        args: [dni],
    });

    if (egresadoResult.rows.length > 0) {
        return {
            ...egresadoResult.rows[0],
            source: "egresado",
        };
    }

    // Buscar en tabla Administrador
    const adminQuery = `
        SELECT 
            u.id, u.nombre, u.email, u.password, u.tipo_usuario,
            a.dni
        FROM Usuario u
        INNER JOIN Administrador a ON u.id = a.id
        WHERE a.dni = ?
    `;

    const adminResult = await client.execute({
        sql: adminQuery,
        args: [dni],
    });

    if (adminResult.rows.length > 0) {
        return {
            ...adminResult.rows[0],
            source: "administrador",
        };
    }

    return null;
}

/**
 * Maneja el login de un usuario existente
 */
async function handleExistingUserLogin(res, user, password, req) {
    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
        console.warn(
            `[SECURITY] Login fallido - DNI: ${user.dni}, IP: ${
                req.ip
            }, User-Agent: ${req.get("User-Agent")}`
        );
        return res.status(401).json({
            success: false,
            message: "DNI o contraseña incorrectos",
        });
    }

    // Generar token JWT
    const token = generateToken({
        id: user.id,
        dni: user.dni,
        tipoUsuario: user.source === "egresado" ? "Egresado" : "Administrador",
        email: user.email,
    });

    // Log de login exitoso
    console.info(
        `[AUTH] Login exitoso - Usuario: ${user.id}, Tipo: ${
            user.source === "egresado" ? "Egresado" : "Administrador"
        }, IP: ${req.ip}`
    );

    // Respuesta exitosa
    return res.status(200).json({
        success: true,
        token,
        user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            tipo_usuario:
                user.source === "egresado" ? "Egresado" : "Administrador",
            ...(user.source === "egresado" && { isNewUser: false }),
        },
    });
}

/**
 * [DEPRECATED] Función de registro automático - Ya no se usa
 * El sistema ahora requiere registro completo antes del login (como Facebook/Instagram)
 * Mantenida por compatibilidad con código existente pero no se invoca
 */
async function handleNewUserRegistration(res, client, dni, password, req) {
    // 1. Validar DNI en tabla DniValido
    const dniValidoQuery = `
        SELECT dni, carrera 
        FROM DniValido 
        WHERE dni = ?
    `;

    const dniValidoResult = await client.execute({
        sql: dniValidoQuery,
        args: [dni],
    });

    if (dniValidoResult.rows.length === 0) {
        console.warn(
            `[SECURITY] Intento de registro con DNI no autorizado - DNI: ${dni}, IP: ${
                req.ip
            }, User-Agent: ${req.get("User-Agent")}`
        );
        return res.status(400).json({
            success: false,
            message: "DNI no está autorizado para registrarse como egresado",
        });
    }

    const dniValido = dniValidoResult.rows[0];

    // 2. Buscar la carrera por nombre
    const carreraQuery = `
        SELECT id, nombre 
        FROM Carrera 
        WHERE nombre = ?
    `;

    const carreraResult = await client.execute({
        sql: carreraQuery,
        args: [dniValido.carrera],
    });

    if (carreraResult.rows.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Carrera asociada al DNI no encontrada en el sistema",
        });
    }

    const carrera = carreraResult.rows[0];

    // 3. Crear nuevo egresado
    try {
        // Hashear contraseña
        const hashedPassword = await hashPassword(password);

        // Email temporal
        const tempEmail = `${dni}@temp.ies.edu.ar`;

        // Crear usuario
        const usuarioQuery = `
            INSERT INTO Usuario (nombre, email, password, tipo_usuario)
            VALUES (?, ?, ?, ?)
        `;

        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [`Egresado ${dni}`, tempEmail, hashedPassword, "Egresado"],
        });

        const usuarioId = Number(usuarioResult.lastInsertRowid);

        // Crear perfil vacío
        const perfilQuery = `
            INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral)
            VALUES (?, ?, ?)
        `;

        const perfilResult = await client.execute({
            sql: perfilQuery,
            args: [null, null, null],
        });

        const perfilId = Number(perfilResult.lastInsertRowid);

        // Crear egresado
        const egresadoQuery = `
            INSERT INTO Egresado (id, dni, telefono, perfilId, carreraId)
            VALUES (?, ?, ?, ?, ?)
        `;

        await client.execute({
            sql: egresadoQuery,
            args: [usuarioId, dni, null, perfilId, carrera.id],
        });

        // Crear preferencias de notificaciones con valores por defecto
        const preferenciasQuery = `
            INSERT INTO PreferenciasNotificacion (
                usuario_id, 
                email_comentarios, 
                email_likes, 
                email_menciones
            )
            VALUES (?, 1, 1, 1)
        `;

        await client.execute({
            sql: preferenciasQuery,
            args: [usuarioId],
        });

        // Generar token JWT
        const token = generateToken({
            id: usuarioId,
            dni: dni,
            tipoUsuario: "Egresado",
            email: tempEmail,
        });

        // Log de registro exitoso
        console.info(
            `[AUTH] Registro automático exitoso - Usuario: ${usuarioId}, DNI: ${dni}, IP: ${req.ip}`
        );

        // Respuesta exitosa
        return res.status(201).json({
            success: true,
            token,
            user: {
                id: usuarioId,
                nombre: `Egresado ${dni}`,
                email: tempEmail,
                tipo_usuario: "Egresado",
                isNewUser: true,
            },
        });
    } catch (error) {
        // En caso de error, intentar limpiar cualquier dato parcial creado
        console.error("Error en registro automático:", error);
        throw error;
    }
}

/**
 * Registro completo de nuevos egresados
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function register(req, res) {
    const { nombre, apellido, dni, email, password } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !dni || !email || !password) {
        console.warn(
            `[SECURITY] Registro incompleto - IP: ${req.ip}, User-Agent: ${req.get(
                "User-Agent"
            )}`
        );
        return res.status(400).json({
            success: false,
            message: "Todos los campos son requeridos",
        });
    }

    // Sanitización de inputs
    const sanitizedNombre = nombre.toString().trim();
    const sanitizedApellido = apellido.toString().trim();
    const sanitizedDni = dni
        .toString()
        .trim()
        .replace(/[^0-9]/g, "");
    const sanitizedEmail = email.toString().trim().toLowerCase();
    const sanitizedPassword = password.toString().trim();

    // Validaciones de formato
    if (!/^\d{7,8}$/.test(sanitizedDni)) {
        return res.status(400).json({
            success: false,
            message: "El DNI debe tener 7 u 8 dígitos",
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "El email no es válido",
        });
    }

    if (sanitizedPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "La contraseña debe tener al menos 6 caracteres",
        });
    }

    if (sanitizedNombre.length < 2 || sanitizedApellido.length < 2) {
        return res.status(400).json({
            success: false,
            message: "Nombre y apellido deben tener al menos 2 caracteres",
        });
    }

    const client = database.getClient();

    try {
        // 1. Validar que el DNI esté autorizado en DniValido
        const dniValidoQuery = `
            SELECT dni, carrera 
            FROM DniValido 
            WHERE dni = ?
        `;

        const dniValidoResult = await client.execute({
            sql: dniValidoQuery,
            args: [sanitizedDni],
        });

        if (dniValidoResult.rows.length === 0) {
            console.warn(
                `[SECURITY] Intento de registro con DNI no autorizado - DNI: ${sanitizedDni}, IP: ${req.ip}`
            );
            return res.status(400).json({
                success: false,
                message:
                    "DNI no está autorizado para registrarse. Contacte al administrador.",
            });
        }

        const dniValido = dniValidoResult.rows[0];

        // 2. Verificar que el email no esté registrado
        const emailCheckQuery = `
            SELECT id FROM Usuario WHERE email = ?
        `;

        const emailCheckResult = await client.execute({
            sql: emailCheckQuery,
            args: [sanitizedEmail],
        });

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "El email ya está registrado",
            });
        }

        // 3. Verificar que el DNI no esté registrado
        const dniCheckQuery = `
            SELECT id FROM Egresado WHERE dni = ?
        `;

        const dniCheckResult = await client.execute({
            sql: dniCheckQuery,
            args: [sanitizedDni],
        });

        if (dniCheckResult.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: "El DNI ya está registrado",
            });
        }

        // 4. Buscar la carrera asociada al DNI
        const carreraQuery = `
            SELECT id, nombre 
            FROM Carrera 
            WHERE nombre = ?
        `;

        const carreraResult = await client.execute({
            sql: carreraQuery,
            args: [dniValido.carrera],
        });

        if (carreraResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Carrera asociada al DNI no encontrada en el sistema",
            });
        }

        const carrera = carreraResult.rows[0];

        // 5. Crear nuevo usuario egresado
        const hashedPassword = await hashPassword(sanitizedPassword);

        // Crear usuario
        const usuarioQuery = `
            INSERT INTO Usuario (nombre, apellido, email, password, tipo_usuario)
            VALUES (?, ?, ?, ?, ?)
        `;

        const usuarioResult = await client.execute({
            sql: usuarioQuery,
            args: [
                sanitizedNombre,
                sanitizedApellido,
                sanitizedEmail,
                hashedPassword,
                "Egresado",
            ],
        });

        const usuarioId = Number(usuarioResult.lastInsertRowid);

        // Crear perfil vacío
        const perfilQuery = `
            INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral)
            VALUES (?, ?, ?)
        `;

        const perfilResult = await client.execute({
            sql: perfilQuery,
            args: [null, null, null],
        });

        const perfilId = Number(perfilResult.lastInsertRowid);

        // Crear egresado
        const egresadoQuery = `
            INSERT INTO Egresado (id, dni, telefono, perfilId, carreraId)
            VALUES (?, ?, ?, ?, ?)
        `;

        await client.execute({
            sql: egresadoQuery,
            args: [usuarioId, sanitizedDni, null, perfilId, carrera.id],
        });

        // Crear preferencias de notificaciones con valores por defecto
        const preferenciasQuery = `
            INSERT INTO PreferenciasNotificacion (
                usuario_id, 
                email_comentarios, 
                email_likes, 
                email_menciones
            )
            VALUES (?, 1, 1, 1)
        `;

        await client.execute({
            sql: preferenciasQuery,
            args: [usuarioId],
        });

        // Generar token JWT
        const token = generateToken({
            id: usuarioId,
            dni: sanitizedDni,
            tipoUsuario: "Egresado",
            email: sanitizedEmail,
        });

        // Log de registro exitoso
        console.info(
            `[AUTH] Registro completo exitoso - Usuario: ${usuarioId}, DNI: ${sanitizedDni}, Email: ${sanitizedEmail}, IP: ${req.ip}`
        );

        // Respuesta exitosa
        return res.status(201).json({
            success: true,
            token,
            user: {
                id: usuarioId,
                nombre: sanitizedNombre,
                apellido: sanitizedApellido,
                email: sanitizedEmail,
                tipo_usuario: "Egresado",
                isNewUser: true,
            },
            message: "Registro exitoso",
        });
    } catch (error) {
        console.error("Error en registro:", error);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor",
        });
    }
}

export default {
    login,
    register,
};
