/**
 * Manejador de búsqueda avanzada adaptado para layout sidebar
 * Gestiona la interacción con filtros, autocompletado y resultados
 */

import { searchService, publicProfilesService } from "./api.js";
import { SearchBar } from "./searchBar.js";

export class AdvancedSearchManagerSidebar {
    constructor(options = {}) {
        this.options = {
            searchInputId: "search-input",
            resultsContainerId: "perfiles-grid",
            resultsCountId: "results-count",
            debounceTime: 500,
            enableAutoSearch: true,
            enableUrlParams: true,
            ...options,
        };

        // Estado de búsqueda
        this.currentFilters = {
            query: "",
            carrera: "",
            situacionLaboral: "",
            empresa: "",
            puesto: "",
            orderBy: "nombre_asc",
        };

        // Estado de resultados
        this.results = [];
        this.totalResults = 0;
        this.isLoading = false;

        // Elementos del DOM
        this.elements = {};

        // Timer para debounce
        this.debounceTimer = null;
        this.searchBar = null;

        this.init();
    }

    async init() {
        this.bindElements();
        this.loadUrlParams();
        await this.loadFilterOptions();
        this.bindEvents();

        // Búsqueda inicial
        if (this.options.enableAutoSearch) {
            this.search();
        }
    }

    bindElements() {
        this.elements = {
            resultsContainer: document.getElementById(
                this.options.resultsContainerId
            ),
            resultsCount: document.getElementById(this.options.resultsCountId),

            // Estados
            loadingIndicator: document.getElementById("loading-indicator"),
            errorMessage: document.getElementById("error-message"),
            noResults: document.getElementById("no-results"),

            // Controles
            clearAllButton: document.getElementById("clear-all-filters"),

            // Elementos para mostrar/ocultar filtros
            toggleFiltersBtn: document.getElementById("toggle-filters-btn"),
            filtersSidebar: document.querySelector(".filters-sidebar"),
            sidebarOverlay: document.getElementById("sidebar-overlay"),
            mainContent: document.querySelector(".main-content"),
        };
    }

    bindEvents() {
        // Botón para mostrar/ocultar filtros
        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.addEventListener("click", () => {
                this.toggleFilters();
            });
        }

        // Overlay para cerrar filtros
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.addEventListener("click", () => {
                this.hideFilters();
            });
        }

        // Cerrar filtros con Escape
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.hideFilters();
            }
        });

        // Checkboxes de carrera
        const todasCarrerasCheckbox = document.getElementById("todas-carreras");
        if (todasCarrerasCheckbox) {
            todasCarrerasCheckbox.addEventListener("change", () => {
                this.handleCarreraChange();
            });
        }

        // Checkboxes de situación laboral
        const situacionCheckboxes = document.querySelectorAll(
            'input[name="situacion"]'
        );
        situacionCheckboxes.forEach((checkbox) => {
            checkbox.addEventListener("change", () => {
                this.handleSituacionChange();
            });
        });

        // Limpiar todos los filtros
        if (this.elements.clearAllButton) {
            this.elements.clearAllButton.addEventListener("click", () => {
                this.clear();
            });
        }
    }

    handleCarreraChange() {
        const todasCheckbox = document.getElementById("todas-carreras");
        const carreraCheckboxes = document.querySelectorAll(
            'input[name="carrera"]:not(#todas-carreras)'
        );

        // Si se marca "Todas", desmarcar las demás
        if (todasCheckbox && todasCheckbox.checked) {
            carreraCheckboxes.forEach((cb) => (cb.checked = false));
            this.setFilter("carrera", "");
            return;
        }

        // Si se marca alguna carrera específica, desmarcar "Todas"
        const checkedCarreras = Array.from(carreraCheckboxes).filter(
            (cb) => cb.checked
        );
        if (checkedCarreras.length > 0) {
            if (todasCheckbox) todasCheckbox.checked = false;
            const selectedCarreras = checkedCarreras
                .map((cb) => cb.value)
                .join(",");
            this.setFilter("carrera", selectedCarreras);
        } else {
            // Si no hay ninguna marcada, marcar "Todas"
            if (todasCheckbox) todasCheckbox.checked = true;
            this.setFilter("carrera", "");
        }
    }

    handleSituacionChange() {
        const checkedBoxes = document.querySelectorAll(
            'input[name="situacion"]:checked'
        );
        const selectedSituaciones = Array.from(checkedBoxes).map(
            (cb) => cb.value
        );
        const situacionFilter = selectedSituaciones.join(",");
        this.setFilter("situacionLaboral", situacionFilter);
    }

    async loadFilterOptions() {
        try {
            const response = await searchService.getFilterOptions();

            if (response.success && response.data) {
                this.populateCarreraOptions(response.data.carreras || []);
            }
        } catch (error) {
            console.error("Error cargando opciones de filtros:", error);
        }
    }

    populateCarreraOptions(carreras) {
        const carreraGroup = document.getElementById("carrera-filter-group");
        if (!carreraGroup) return;

        // Limpiar checkboxes existentes (excepto "Todas")
        const existingCarreras = carreraGroup.querySelectorAll(
            'input[name="carrera"]:not(#todas-carreras)'
        );
        existingCarreras.forEach((input) => {
            input.parentElement.remove();
        });

        // Añadir nuevos checkboxes de carreras
        carreras.forEach((carrera) => {
            const label = document.createElement("label");
            label.className = "checkbox-item";

            label.innerHTML = `
                <input type="checkbox" value="${carrera}" name="carrera" />
                <span class="checkmark"></span>
                ${carrera}
            `;

            carreraGroup.appendChild(label);

            // Agregar event listener al nuevo checkbox
            const checkbox = label.querySelector('input[type="checkbox"]');
            checkbox.addEventListener("change", () => {
                this.handleCarreraChange();
            });
        });
    }

    setFilter(filterName, value) {
        if (this.currentFilters[filterName] !== value) {
            this.currentFilters[filterName] = value;

            if (this.options.enableUrlParams) {
                this.updateUrlParams();
            }

            // Debounced search para campos de texto
            if (
                filterName === "query" ||
                filterName === "empresa" ||
                filterName === "puesto"
            ) {
                this.debouncedSearch();
            } else {
                // Búsqueda inmediata para selects y checkboxes
                this.search();
            }
        }
    }

    debouncedSearch() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.search();
        }, this.options.debounceTime);
    }

    async search() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoading();

        try {
            const searchParams = this.buildSearchParams();
            console.log("Parámetros de búsqueda:", searchParams);

            const response = await searchService.searchProfiles(searchParams);
            console.log("Respuesta de búsqueda:", response);

            if (response.success) {
                this.results = response.data.perfiles || [];
                this.totalResults = response.data.total || 0;
                console.log("Perfiles encontrados:", this.results.length);
                console.log("Total de resultados:", this.totalResults);
                this.renderResults();
                this.updateResultsCount();
                this.hideStates();
            } else {
                console.error("Error en respuesta:", response);
                this.showError(response.message || "Error en la búsqueda");
            }
        } catch (error) {
            console.error("Error en búsqueda:", error);
            this.showError("Error al realizar la búsqueda");
        } finally {
            this.isLoading = false;
        }
    }

    buildSearchParams() {
        const params = {};

        // Añadir parámetros no vacíos
        Object.entries(this.currentFilters).forEach(([key, value]) => {
            if (value && value.toString().trim() !== "") {
                params[key] = value;
            }
        });

        return params;
    }

    renderResults() {
        const container = this.elements.resultsContainer;
        console.log("Container encontrado:", container);
        console.log("Número de resultados a renderizar:", this.results.length);

        if (!container) {
            console.error(
                "No se encontró el contenedor de resultados con ID:",
                this.options.resultsContainerId
            );
            return;
        }

        if (this.results.length === 0) {
            console.log(
                "No hay resultados, mostrando mensaje de no resultados"
            );
            this.showNoResults();
            return;
        }

        console.log("Renderizando resultados:", this.results);
        const html = this.results
            .map((perfil) => this.renderPerfilCard(perfil))
            .join("");

        console.log("HTML generado:", html);
        container.innerHTML = html;
    }

    renderPerfilCard(perfil) {
        // Construir la URL completa para la foto de perfil si es una ruta relativa
        const fotoUrl = perfil.urlFotoPerfil
            ? (perfil.urlFotoPerfil.startsWith('http') 
                ? perfil.urlFotoPerfil 
                : `http://localhost:3000${perfil.urlFotoPerfil}`)
            : null;
        
        const avatar = fotoUrl
            ? `<img src="${fotoUrl}" alt="${perfil.nombre} ${perfil.apellido}">`
            : `<div class="avatar-icon">👤</div>`;

        return `
            <div class="perfil-card">
                <div class="card-header">
                    <div class="avatar">
                        ${avatar}
                    </div>
                    <div class="card-title">
                        <h3>${perfil.nombre} ${perfil.apellido}</h3>
                        <p class="card-subtitle">${
                            perfil.carrera || "Desarrollador de Software"
                        }</p>
                    </div>
                    <div class="card-actions">
                        <a href="/perfil/${
                            perfil.id
                        }" class="btn-ver-curriculum">
                            Ver Currículum
                        </a>
                    </div>
                </div>
                
                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-label">Nombre:</span>
                        <span class="detail-value">${perfil.nombre || ""}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Apellido:</span>
                        <span class="detail-value">${
                            perfil.apellido || ""
                        }</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Correo:</span>
                        <span class="detail-value">${perfil.email || ""}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Carrera:</span>
                        <span class="detail-value">${
                            perfil.carrera || "I.E.S 9-012"
                        }</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Año de egreso:</span>
                        <span class="detail-value">${
                            perfil.ano_egreso || "2026"
                        }</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Situación laboral:</span>
                        <span class="detail-value">${
                            perfil.situacion_laboral || "Buscando empleo"
                        }</span>
                    </div>
                </div>
                
                <div class="card-footer">
                    <button class="btn-enviar-mensaje" data-user-id="${perfil.id}" data-user-name="${perfil.nombre} ${perfil.apellido}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Enviar mensaje
                    </button>
                </div>
            </div>
        `;
    }

    updateResultsCount() {
        const countElement = this.elements.resultsCount;
        if (countElement) {
            const count = this.totalResults;
            const text =
                count === 1
                    ? "1 perfil encontrado"
                    : `${count} perfiles encontrados`;
            countElement.textContent = text;
        }
    }

    showLoading() {
        this.hideStates();
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = "flex";
        }
    }

    showError(message) {
        this.hideStates();
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = "block";
            const errorText = document.getElementById("error-text");
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    showNoResults() {
        this.hideStates();
        if (this.elements.noResults) {
            this.elements.noResults.style.display = "flex";
        }
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = "";
        }
    }

    hideStates() {
        [
            this.elements.loadingIndicator,
            this.elements.errorMessage,
            this.elements.noResults,
        ].forEach((element) => {
            if (element) {
                element.style.display = "none";
            }
        });
    }

    clear() {
        // Limpiar filtros
        this.currentFilters = {
            carrera: "",
            situacionLaboral: "",
        };

        // Marcar "Todas" en carreras
        const todasCarrerasCheckbox = document.getElementById("todas-carreras");
        if (todasCarrerasCheckbox) {
            todasCarrerasCheckbox.checked = true;
        }

        // Desmarcar todas las carreras específicas
        const carreraCheckboxes = document.querySelectorAll(
            'input[name="carrera"]:not(#todas-carreras)'
        );
        carreraCheckboxes.forEach((cb) => (cb.checked = false));

        // Limpiar checkboxes de situación
        const situacionCheckboxes = document.querySelectorAll(
            'input[name="situacion"]'
        );
        situacionCheckboxes.forEach((cb) => (cb.checked = false));

        // Actualizar URL y buscar
        if (this.options.enableUrlParams) {
            this.updateUrlParams();
        }
        this.search();
    }

    loadUrlParams() {
        if (!this.options.enableUrlParams) return;

        const urlParams = new URLSearchParams(window.location.search);

        Object.keys(this.currentFilters).forEach((key) => {
            const value = urlParams.get(key);
            if (value) {
                this.currentFilters[key] = value;
            }
        });

        // Aplicar valores a los elementos del formulario
        this.applyFiltersToForm();
    }

    applyFiltersToForm() {
        // Aplicar query
        if (this.elements.searchInput && this.currentFilters.query) {
            this.elements.searchInput.value = this.currentFilters.query;
        }

        // Aplicar carrera
        if (this.elements.carreraFilter && this.currentFilters.carrera) {
            this.elements.carreraFilter.value = this.currentFilters.carrera;
        }

        // Aplicar empresa
        if (this.elements.empresaFilter && this.currentFilters.empresa) {
            this.elements.empresaFilter.value = this.currentFilters.empresa;
        }

        // Aplicar puesto
        if (this.elements.puestoFilter && this.currentFilters.puesto) {
            this.elements.puestoFilter.value = this.currentFilters.puesto;
        }

        // Aplicar orden
        if (this.elements.orderFilter && this.currentFilters.orderBy) {
            this.elements.orderFilter.value = this.currentFilters.orderBy;
        }

        // Aplicar situación laboral (checkboxes)
        if (this.currentFilters.situacionLaboral) {
            const situaciones = this.currentFilters.situacionLaboral.split(",");
            situaciones.forEach((situacion) => {
                const checkbox = document.querySelector(
                    `input[name="situacion"][value="${situacion}"]`
                );
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }

    updateUrlParams() {
        if (!this.options.enableUrlParams) return;

        const url = new URL(window.location);

        // Limpiar parámetros existentes
        Object.keys(this.currentFilters).forEach((key) => {
            url.searchParams.delete(key);
        });

        // Añadir parámetros activos
        Object.entries(this.currentFilters).forEach(([key, value]) => {
            if (value && value.toString().trim() !== "") {
                url.searchParams.set(key, value);
            }
        });

        // Actualizar URL sin recargar la página
        window.history.replaceState({}, "", url);
    }

    // Métodos de utilidad
    getFilters() {
        return { ...this.currentFilters };
    }

    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.applyFiltersToForm();

        if (this.options.enableUrlParams) {
            this.updateUrlParams();
        }
        this.search();
    }

    getResults() {
        return {
            results: this.results,
            total: this.totalResults,
            filters: this.getFilters(),
        };
    }

    // Métodos para mostrar/ocultar filtros
    toggleFilters() {
        const isVisible =
            this.elements.filtersSidebar.classList.contains("show");

        if (isVisible) {
            this.hideFilters();
        } else {
            this.showFilters();
        }
    }

    showFilters() {
        if (this.elements.filtersSidebar) {
            this.elements.filtersSidebar.classList.add("show");
        }

        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.add("show");
        }

        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.classList.add("active");
        }

        // El texto del botón permanece igual para dropdown
        // No necesitamos bloquear el scroll para un dropdown
    }

    hideFilters() {
        this.elements.filtersSidebar.classList.remove("show");
        this.elements.sidebarOverlay.classList.remove("show");
        this.elements.toggleFiltersBtn.classList.remove("active");

        // No hay cambio de texto ni bloqueo de scroll
    }
}

// Mantener compatibilidad con AdvancedSearchManager original
export class AdvancedSearchManager extends AdvancedSearchManagerSidebar {}
