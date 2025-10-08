/**
 * Script para cargar datos de prueba en la base de datos
 * Ejecutar con: node scripts/seed-data.js
 */

import database from "../src/config/database.js";
import bcrypt from "bcryptjs";

const datosCarreras = [
    "Ingeniería en Sistemas",
    "Tecnicatura en Programación",
    "Diseño Gráfico",
    "Administración de Empresas",
    "Marketing Digital",
    "Contabilidad",
    "Recursos Humanos"
];

const datosSituacionLaboral = [
    "Empleado",
    "Freelancer", 
    "Emprendedor",
    "Buscando empleo",
    "Estudiando"
];

const datosEmpresas = [
    "Microsoft Argentina",
    "Mercado Libre",
    "Globant",
    "Accenture",
    "IBM",
    "Despegar.com",
    "Freelancer independiente",
    "Startup propia",
    "Banco Galicia",
    "YPF Tecnología"
];

const datosPuestos = [
    "Desarrollador Frontend",
    "Desarrollador Backend", 
    "Full Stack Developer",
    "Analista de Sistemas",
    "QA Tester",
    "DevOps Engineer",
    "Diseñador UX/UI",
    "Product Manager",
    "Scrum Master",
    "Data Analyst"
];

const datosEgresados = [
    {
        nombre: "María González",
        email: "maria.gonzalez@email.com",
        dni: "12345678",
        telefono: "+54 11 1234-5678",
        carrera: "Ingeniería en Sistemas",
        resumenProfesional: "Desarrolladora Full Stack con 3 años de experiencia en React y Node.js. Apasionada por crear soluciones innovadoras y trabajar en equipo.",
        situacionLaboral: "Empleado",
        urlPortfolio: "https://mariagonzalez.dev",
        experiencias: [
            {
                puesto: "Desarrolladora Frontend",
                empresa: "Mercado Libre",
                fechaInicio: "2022-03-01",
                fechaFin: null,
                descripcion: "Desarrollo de interfaces de usuario para e-commerce usando React y TypeScript"
            },
            {
                puesto: "Junior Developer",
                empresa: "Startup propia",
                fechaInicio: "2021-01-01",
                fechaFin: "2022-02-28",
                descripcion: "Desarrollo de aplicaciones web con JavaScript y Python"
            }
        ]
    },
    {
        nombre: "Carlos Rodríguez",
        email: "carlos.rodriguez@email.com",
        dni: "23456789",
        telefono: "+54 11 2345-6789",
        carrera: "Tecnicatura en Programación",
        resumenProfesional: "Backend Developer especializado en APIs REST y microservicios. Experiencia en Java, Python y bases de datos.",
        situacionLaboral: "Empleado",
        urlPortfolio: "https://github.com/carlosdev",
        experiencias: [
            {
                puesto: "Desarrollador Backend",
                empresa: "Globant",
                fechaInicio: "2023-01-15",
                fechaFin: null,
                descripcion: "Desarrollo de APIs REST y microservicios para clientes internacionales"
            }
        ]
    },
    {
        nombre: "Ana Martínez",
        email: "ana.martinez@email.com",
        dni: "34567890",
        telefono: "+54 11 3456-7890",
        carrera: "Diseño Gráfico",
        resumenProfesional: "Diseñadora UX/UI con enfoque en experiencia de usuario. Trabajo con Figma, Adobe Creative Suite y prototipado.",
        situacionLaboral: "Freelancer",
        urlPortfolio: "https://anamartinez.design",
        experiencias: [
            {
                puesto: "Diseñadora UX/UI",
                empresa: "Freelancer independiente",
                fechaInicio: "2022-06-01",
                fechaFin: null,
                descripcion: "Diseño de interfaces y experiencias de usuario para startups y PyMEs"
            },
            {
                puesto: "Diseñadora Gráfica",
                empresa: "Accenture",
                fechaInicio: "2021-03-01",
                fechaFin: "2022-05-31",
                descripcion: "Diseño de materiales gráficos y branding para proyectos corporativos"
            }
        ]
    },
    {
        nombre: "Diego López",
        email: "diego.lopez@email.com", 
        dni: "45678901",
        telefono: "+54 11 4567-8901",
        carrera: "Ingeniería en Sistemas",
        resumenProfesional: "DevOps Engineer con experiencia en AWS, Docker y Kubernetes. Automatización de procesos y CI/CD.",
        situacionLaboral: "Empleado",
        urlPortfolio: "https://diegolopez.tech",
        experiencias: [
            {
                puesto: "DevOps Engineer",
                empresa: "Microsoft Argentina",
                fechaInicio: "2023-09-01",
                fechaFin: null,
                descripcion: "Automatización de infraestructura y pipelines de CI/CD en Azure"
            },
            {
                puesto: "Analista de Sistemas",
                empresa: "IBM",
                fechaInicio: "2022-01-01",
                fechaFin: "2023-08-31",
                descripcion: "Análisis y desarrollo de sistemas empresariales"
            }
        ]
    },
    {
        nombre: "Laura Fernández",
        email: "laura.fernandez@email.com",
        dni: "56789012", 
        telefono: "+54 11 5678-9012",
        carrera: "Marketing Digital",
        resumenProfesional: "Especialista en marketing digital y growth hacking. Experiencia en Google Ads, Facebook Ads y analytics.",
        situacionLaboral: "Emprendedor",
        urlPortfolio: "https://laurafernandez.marketing",
        experiencias: [
            {
                puesto: "Growth Marketing Manager",
                empresa: "Despegar.com",
                fechaInicio: "2022-08-01",
                fechaFin: "2024-01-31",
                descripcion: "Estrategias de crecimiento y optimización de conversiones"
            },
            {
                puesto: "Marketing Digital Specialist",
                empresa: "Startup propia",
                fechaInicio: "2024-02-01",
                fechaFin: null,
                descripcion: "Consultoría en marketing digital para PyMEs"
            }
        ]
    },
    {
        nombre: "Roberto Silva",
        email: "roberto.silva@email.com",
        dni: "67890123",
        telefono: "+54 11 6789-0123",
        carrera: "Tecnicatura en Programación",
        resumenProfesional: "QA Tester con conocimientos en automatización de pruebas. Selenium, Cypress y metodologías ágiles.",
        situacionLaboral: "Buscando empleo",
        urlPortfolio: "https://github.com/robertosilva",
        experiencias: [
            {
                puesto: "QA Tester",
                empresa: "YPF Tecnología",
                fechaInicio: "2021-11-01",
                fechaFin: "2024-03-31",
                descripcion: "Testing manual y automatizado de aplicaciones web y móviles"
            }
        ]
    }
];

async function cargarDatos() {
    try {
        console.log("🚀 Iniciando carga de datos de prueba...");
        
        // Conectar a la base de datos
        await database.connect();
        const client = database.getClient();

        // 1. Insertar carreras
        console.log("📚 Insertando carreras...");
        for (const carrera of datosCarreras) {
            await client.execute({
                sql: "INSERT OR IGNORE INTO Carrera (nombre) VALUES (?)",
                args: [carrera]
            });
        }

        // 2. Insertar usuarios y egresados
        console.log("👥 Insertando usuarios y egresados...");
        for (const egresado of datosEgresados) {
            // Hash de la contraseña (usando el DNI como contraseña por simplicidad)
            const hashedPassword = await bcrypt.hash(egresado.dni, 10);

            // Insertar usuario
            const resultUsuario = await client.execute({
                sql: `INSERT INTO Usuario (nombre, email, password, tipo_usuario) 
                      VALUES (?, ?, ?, 'Egresado')`,
                args: [egresado.nombre, egresado.email, hashedPassword]
            });

            const usuarioId = resultUsuario.lastInsertRowid;

            // Obtener ID de carrera
            const carreraResult = await client.execute({
                sql: "SELECT id FROM Carrera WHERE nombre = ?",
                args: [egresado.carrera]
            });
            const carreraId = carreraResult.rows[0]?.id;

            // Insertar perfil
            const resultPerfil = await client.execute({
                sql: `INSERT INTO Perfil (resumenProfesional, urlPortfolio, situacionLaboral) 
                      VALUES (?, ?, ?)`,
                args: [egresado.resumenProfesional, egresado.urlPortfolio, egresado.situacionLaboral]
            });

            const perfilId = resultPerfil.lastInsertRowid;

            // Insertar egresado
            await client.execute({
                sql: `INSERT INTO Egresado (id, dni, telefono, perfilId, carreraId) 
                      VALUES (?, ?, ?, ?, ?)`,
                args: [usuarioId, egresado.dni, egresado.telefono, perfilId, carreraId]
            });

            // Insertar experiencias laborales
            for (const exp of egresado.experiencias) {
                await client.execute({
                    sql: `INSERT INTO ExperienciaLaboral (puesto, empresa, fechaInicio, fechaFin, descripcion, perfilId)
                          VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [exp.puesto, exp.empresa, exp.fechaInicio, exp.fechaFin, exp.descripcion, perfilId]
                });
            }
        }

        console.log("✅ Datos de prueba cargados exitosamente!");
        console.log(`📊 Se cargaron ${datosEgresados.length} egresados con sus experiencias`);
        console.log(`🎓 Se cargaron ${datosCarreras.length} carreras`);
        
    } catch (error) {
        console.error("❌ Error cargando datos:", error);
    } finally {
        await database.disconnect();
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    cargarDatos();
}

export default cargarDatos;