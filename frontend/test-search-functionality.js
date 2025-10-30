/**
 * Script de prueba para verificar la funcionalidad de búsqueda avanzada
 * Ejecutar en la consola del navegador cuando la página de perfiles esté cargada
 */

// Test 1: Verificar que las clases se carguen correctamente
console.log("🧪 Test 1: Verificando clases...");
try {
    const { AdvancedSearchManager } = await import(
        "/src/utils/advancedSearch.js"
    );
    const { SearchBar } = await import("/src/utils/searchBar.js");
    console.log("✅ Clases importadas correctamente");
    console.log("- AdvancedSearchManager:", typeof AdvancedSearchManager);
    console.log("- SearchBar:", typeof SearchBar);
} catch (error) {
    console.error("❌ Error importando clases:", error);
}

// Test 2: Verificar elementos del DOM
console.log("\n🧪 Test 2: Verificando elementos del DOM...");
const elements = {
    searchInput: document.getElementById("search-input"),
    carreraFilter: document.getElementById("carrera-filter"),
    situacionFilter: document.getElementById("situacion-filter"),
    orderFilter: document.getElementById("order-filter"),
    empresaFilter: document.getElementById("empresa-filter"),
    puestoFilter: document.getElementById("puesto-filter"),
    toggleAdvanced: document.getElementById("toggle-advanced"),
    clearFilters: document.getElementById("clear-filters"),
    applyFilters: document.getElementById("apply-filters"),
    perfilesGrid: document.getElementById("perfiles-grid"),
    resultsCount: document.getElementById("results-count"),
};

Object.entries(elements).forEach(([name, element]) => {
    if (element) {
        console.log(`✅ ${name}: encontrado`);
    } else {
        console.log(`❌ ${name}: NO encontrado`);
    }
});

// Test 3: Probar funcionalidad de autocompletado
console.log("\n🧪 Test 3: Probando autocompletado...");
async function testAutocomplete() {
    try {
        const { searchService } = await import("/src/utils/api.js");
        const response = await searchService.autocomplete("test");
        console.log("✅ Autocompletado responde:", response);
    } catch (error) {
        console.log(
            "⚠️ Autocompletado no disponible (servidor offline):",
            error.message
        );
    }
}
testAutocomplete();

// Test 4: Probar búsqueda
console.log("\n🧪 Test 4: Probando búsqueda...");
async function testSearch() {
    try {
        const { searchService } = await import("/src/utils/api.js");
        const response = await searchService.searchProfiles({ query: "test" });
        console.log("✅ Búsqueda responde:", response);
    } catch (error) {
        console.log(
            "⚠️ Búsqueda no disponible (servidor offline):",
            error.message
        );
    }
}
testSearch();

// Test 5: Simular interacciones de usuario
console.log("\n🧪 Test 5: Simulando interacciones...");

// Simular escritura en búsqueda
if (elements.searchInput) {
    console.log("✅ Simulando escritura en barra de búsqueda...");
    elements.searchInput.value = "desarrollador";
    elements.searchInput.dispatchEvent(new Event("input", { bubbles: true }));
}

// Simular cambio de filtro
if (elements.carreraFilter) {
    console.log("✅ Simulando cambio de carrera...");
    elements.carreraFilter.value = "Ingeniería en Sistemas";
    elements.carreraFilter.dispatchEvent(
        new Event("change", { bubbles: true })
    );
}

// Test 6: Verificar estado de URL
console.log("\n🧪 Test 6: Verificando URL...");
const urlParams = new URLSearchParams(window.location.search);
console.log("Parámetros actuales en URL:", Object.fromEntries(urlParams));

// Test 7: Verificar responsive
console.log("\n🧪 Test 7: Verificando responsive...");
const isMobile = window.innerWidth <= 768;
console.log(
    `Pantalla actual: ${window.innerWidth}x${window.innerHeight} (${
        isMobile ? "móvil" : "escritorio"
    })`
);

// Resultados finales
console.log("\n📊 RESUMEN DE PRUEBAS:");
console.log(
    "- Elementos DOM: " +
        Object.values(elements).filter(Boolean).length +
        "/" +
        Object.keys(elements).length
);
console.log("- Estado: Pruebas completadas");
console.log(
    "- Notas: Si hay errores de servidor offline, es normal en desarrollo"
);

console.log("\n🎯 Para pruebas manuales:");
console.log("1. Escribe en la barra de búsqueda");
console.log("2. Cambia los filtros");
console.log("3. Expande filtros avanzados");
console.log("4. Verifica que la URL se actualice");
console.log("5. Prueba en diferentes tamaños de pantalla");
