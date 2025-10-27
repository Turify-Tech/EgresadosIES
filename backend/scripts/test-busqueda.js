/**
 * Script para probar automáticamente el motor de búsqueda
 * Ejecutar con: node scripts/test-busqueda.js
 */

const BASE_URL = "http://localhost:3000/api/buscar";

const casosDeUso = [
    {
        nombre: "Búsqueda sin filtros",
        url: BASE_URL,
        esperado: "Todos los perfiles"
    },
    {
        nombre: "Búsqueda por nombre",
        url: `${BASE_URL}?query=María`,
        esperado: "Perfiles con 'María' en el nombre"
    },
    {
        nombre: "Búsqueda por profesión",
        url: `${BASE_URL}?query=desarrollador`,
        esperado: "Perfiles relacionados con desarrollo"
    },
    {
        nombre: "Filtro por carrera",
        url: `${BASE_URL}?carrera=Ingeniería en Sistemas`,
        esperado: "Solo Ingenieros en Sistemas"
    },
    {
        nombre: "Filtro por situación laboral",
        url: `${BASE_URL}?situacionLaboral=Empleado`,
        esperado: "Solo empleados activos"
    },
    {
        nombre: "Búsqueda combinada",
        url: `${BASE_URL}?query=desarrollador&carrera=Tecnicatura en Programación`,
        esperado: "Desarrolladores con Tecnicatura"
    },
    {
        nombre: "Búsqueda sin resultados",
        url: `${BASE_URL}?query=TecnologíaInexistente`,
        esperado: "Array vacío"
    }
];

async function probarCaso(caso) {
    try {
        console.log(`\n🧪 Probando: ${caso.nombre}`);
        console.log(`📍 URL: ${caso.url}`);
        
        const response = await fetch(caso.url);
        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Status: ${response.status}`);
            console.log(`📊 Resultados: ${data.total} perfiles encontrados`);
            console.log(`🎯 Esperado: ${caso.esperado}`);
            
            // Mostrar algunos datos si hay resultados
            if (data.perfiles && data.perfiles.length > 0) {
                console.log(`👤 Primer resultado: ${data.perfiles[0].nombre}`);
                if (data.perfiles[0].experiencias) {
                    console.log(`💼 Experiencias: ${data.perfiles[0].experiencias}`);
                }
            }
        } else {
            console.log(`❌ Error ${response.status}:`, data);
        }
        
    } catch (error) {
        console.log(`💥 Error de conexión:`, error.message);
    }
}

async function ejecutarPruebas() {
    console.log("🚀 Iniciando pruebas del motor de búsqueda...");
    console.log("📋 Total de casos de uso:", casosDeUso.length);
    
    for (const caso of casosDeUso) {
        await probarCaso(caso);
        // Pequeña pausa entre pruebas
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("\n🎉 Pruebas completadas!");
    console.log("💡 Revisa los resultados arriba para verificar que todo funcione correctamente");
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    ejecutarPruebas();
}

export default ejecutarPruebas;