/**
 * Manejador de búsqueda avanzada para perfiles
 * Gestiona la interacción con filtros, autocompletado y resultados
 */

import { searchService, publicProfilesService, apiRequest } from "./api.js";
import { SearchBar } from "./searchBar.js";

export class AdvancedSearchManager {
    constructor(options = {}) {
        this.options = {
            searchInputId: "search-input",
            resultsContainerId: "perfiles-grid",
            filtersContainerId: "filtros-busqueda",
            paginationContainerId: "pagination-container",
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
        this.isSearching = false;

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
        this.setupSearchBar();
        this.bindEvents();

        // Realizar búsqueda inicial si hay parámetros
        if (this.hasActiveFilters()) {
            await this.performSearch();
        } else {
            await this.loadDefaultResults();
        }
    }

    setupSearchBar() {
        if (this.elements.searchInput) {
            this.searchBar = new SearchBar(this.options.searchInputId, {
                enableAutocomplete: true,
                onSearch: (query) => {
                    this.updateFilter("query", query);
                },
                onClear: () => {
                    this.updateFilter("query", "");
                },
            });
        }
    }

    bindElements() {
        this.elements = {
            searchInput: document.getElementById(this.options.searchInputId),
            resultsContainer: document.getElementById(
                this.options.resultsContainerId
            ),
            filtersContainer: document.getElementById(
                this.options.filtersContainerId
            ),
            paginationContainer: document.getElementById(
                this.options.paginationContainerId
            ),
            resultsCount: document.getElementById(this.options.resultsCountId),

            // Filtros básicos
            carreraFilter: document.getElementById("carrera-filter"),
            situacionFilter: document.getElementById("situacion-filter"),
            orderFilter: document.getElementById("order-filter"),

            // Filtros avanzados
            empresaFilter: document.getElementById("empresa-filter"),
            puestoFilter: document.getElementById("puesto-filter"),

            // Controles
            toggleAdvanced: document.getElementById("toggle-advanced"),
            advancedFilters: document.getElementById("filtros-avanzados"),
            clearFilters: document.getElementById("clear-filters"),
            applyFilters: document.getElementById("apply-filters"),

            // Loading y errores
            loadingIndicator: document.getElementById("loading-indicator"),
            errorMessage: document.getElementById("error-message"),
            noResults: document.getElementById("no-results"),
        };
    }

    bindEvents() {
        // Los eventos de búsqueda principal los maneja SearchBar

        // Filtros básicos
        if (this.elements.carreraFilter) {
            this.elements.carreraFilter.addEventListener("change", (e) => {
                this.updateFilter("carrera", e.target.value);
            });
        }

        if (this.elements.situacionFilter) {
            this.elements.situacionFilter.addEventListener("change", (e) => {
                this.updateFilter("situacionLaboral", e.target.value);
            });
        }

        if (this.elements.orderFilter) {
            this.elements.orderFilter.addEventListener("change", (e) => {
                this.updateFilter("orderBy", e.target.value);
            });
        }

        // Filtros avanzados
        if (this.elements.empresaFilter) {
            this.elements.empresaFilter.addEventListener("input", (e) => {
                this.handleAdvancedFilterInput("empresa", e.target.value);
            });
        }

        if (this.elements.puestoFilter) {
            this.elements.puestoFilter.addEventListener("input", (e) => {
                this.handleAdvancedFilterInput("puesto", e.target.value);
            });
        }

        // Toggle filtros avanzados
        if (this.elements.toggleAdvanced) {
            this.elements.toggleAdvanced.addEventListener("click", () => {
                this.toggleAdvancedFilters();
            });
        }

        // Botones de acción
        if (this.elements.clearFilters) {
            this.elements.clearFilters.addEventListener("click", () => {
                this.clearAllFilters();
            });
        }

        if (this.elements.applyFilters) {
            this.elements.applyFilters.addEventListener("click", () => {
                this.performSearch();
            });
        }

        // Eventos del historial del navegador
        if (this.options.enableUrlParams) {
            window.addEventListener("popstate", () => {
                this.loadUrlParams();
                this.updateFilterUI();
                this.performSearch();
            });
        }
    }

    handleAdvancedFilterInput(filterName, value) {
        this.currentFilters[filterName] = value;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        if (this.options.enableAutoSearch) {
            this.debounceTimer = setTimeout(() => {
                this.performSearch();
            }, this.options.debounceTime + 200); // Un poco más de delay para filtros avanzados
        }
    }

    updateFilter(filterName, value) {
        this.currentFilters[filterName] = value;

        if (this.options.enableAutoSearch) {
            this.performSearch();
        }
    }

    async loadFilterOptions() {
        try {
            const response = await apiRequest(() =>
                searchService.getFilterOptions()
            );

            // Cargar carreras en el select
            if (this.elements.carreraFilter && response.carreras) {
                this.populateCarrerasSelect(response.carreras);
            }
        } catch (error) {
            console.error("Error cargando opciones de filtros:", error);
        }
    }

    populateCarrerasSelect(carreras) {
        const select = this.elements.carreraFilter;
        if (!select) return;

        // Limpiar opciones existentes (excepto la primera)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }

        // Agregar carreras
        carreras.forEach((carrera) => {
            const option = document.createElement("option");
            option.value = carrera.nombre;
            option.textContent = carrera.nombre;
            if (this.currentFilters.carrera === carrera.nombre) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    async performSearch() {
        if (this.isSearching) return;

        try {
            this.isSearching = true;
            this.showLoading();

            const response = await apiRequest(() =>
                searchService.searchProfiles(this.currentFilters)
            );

            this.results = response.perfiles || [];
            this.totalResults = response.total || 0;

            this.renderResults();
            this.updateResultsCount();
            this.updateUrlParams();
            this.hideLoading();
        } catch (error) {
            console.error("Error en búsqueda:", error);
            this.showError(error.message || "Error al realizar la búsqueda");
        } finally {
            this.isSearching = false;
        }
    }

    async loadDefaultResults() {
        try {
            this.showLoading();

            const response = await apiRequest(() =>
                publicProfilesService.getPublicProfiles(1, 20)
            );

            this.results = response.data || [];
            this.totalResults = response.pagination?.totalRecords || 0;

            this.renderResults();
            this.updateResultsCount();
            this.hideLoading();
        } catch (error) {
            console.error("Error cargando perfiles por defecto:", error);
            this.showError("Error al cargar los perfiles");
        }
    }

    renderResults() {
        const container = this.elements.resultsContainer;
        if (!container) return;

        if (this.results.length === 0) {
            this.showNoResults();
            return;
        }

        this.hideNoResults();
        container.innerHTML = "";

        this.results.forEach((perfil) => {
            const card = this.createPerfilCard(perfil);
            container.appendChild(card);
        });
    }

    createPerfilCard(perfil) {
        const card = document.createElement("div");
        card.className = "perfil-card";

        const avatarUrl = perfil.urlFotoPerfil || "/default-avatar.svg";
        const situacionClass = this.getSituacionClass(perfil.situacionLaboral);
        const resumen = perfil.resumenProfesional
            ? perfil.resumenProfesional.length > 150
                ? perfil.resumenProfesional.substring(0, 150) + "..."
                : perfil.resumenProfesional
            : "Sin descripción disponible";

        card.innerHTML = `
            <div class="card-header">
                <div class="avatar">
                    <img src="${avatarUrl}" alt="Foto de ${
            perfil.nombre
        }" onerror="this.src='/default-avatar.svg'">
                </div>
                <div class="card-info">
                    <h3 class="card-name">${perfil.nombre}</h3>
                    <p class="card-carrera">${perfil.carrera}</p>
                    ${
                        perfil.situacionLaboral
                            ? `<span class="situacion-badge ${situacionClass}">${perfil.situacionLaboral}</span>`
                            : ""
                    }
                </div>
            </div>
            
            <div class="card-content">
                <p class="card-resumen">${resumen}</p>
                
                ${
                    perfil.experiencias
                        ? `
                    <div class="experiencia-preview">
                        <strong>Experiencia:</strong> ${perfil.experiencias}
                    </div>
                `
                        : ""
                }
            </div>
            
            <div class="card-actions">
                <a href="/perfiles/${
                    perfil.id
                }" class="btn-ver-perfil">Ver perfil completo</a>
                ${
                    perfil.urlPortfolio
                        ? `<a href="${perfil.urlPortfolio}" target="_blank" class="btn-portfolio">Portfolio</a>`
                        : ""
                }
            </div>
        `;

        return card;
    }

    getSituacionClass(situacion) {
        const classes = {
            Empleado: "empleado",
            Desempleado: "desempleado",
            Estudiando: "estudiando",
            Emprendedor: "emprendedor",
            Freelancer: "freelancer",
        };
        return classes[situacion] || "default";
    }

    updateResultsCount() {
        if (this.elements.resultsCount) {
            const count = this.totalResults;
            const text =
                count === 1
                    ? "1 perfil encontrado"
                    : `${count} perfiles encontrados`;
            this.elements.resultsCount.textContent = text;
        }
    }

    toggleAdvancedFilters() {
        const container = this.elements.advancedFilters;
        const toggle = this.elements.toggleAdvanced;

        if (!container || !toggle) return;

        const isExpanded = toggle.getAttribute("aria-expanded") === "true";
        const newState = !isExpanded;

        toggle.setAttribute("aria-expanded", newState.toString());
        container.style.display = newState ? "block" : "none";
    }

    clearAllFilters() {
        // Resetear filtros
        this.currentFilters = {
            query: "",
            carrera: "",
            situacionLaboral: "",
            empresa: "",
            puesto: "",
            orderBy: "nombre_asc",
        };

        // Actualizar UI
        this.updateFilterUI();

        // Limpiar searchBar
        if (this.searchBar) {
            this.searchBar.clear();
        }

        // Realizar búsqueda
        this.performSearch();
    }

    updateFilterUI() {
        if (this.searchBar) {
            this.searchBar.setValue(this.currentFilters.query);
        }
        if (this.elements.carreraFilter) {
            this.elements.carreraFilter.value = this.currentFilters.carrera;
        }
        if (this.elements.situacionFilter) {
            this.elements.situacionFilter.value =
                this.currentFilters.situacionLaboral;
        }
        if (this.elements.orderFilter) {
            this.elements.orderFilter.value = this.currentFilters.orderBy;
        }
        if (this.elements.empresaFilter) {
            this.elements.empresaFilter.value = this.currentFilters.empresa;
        }
        if (this.elements.puestoFilter) {
            this.elements.puestoFilter.value = this.currentFilters.puesto;
        }
    }

    loadUrlParams() {
        if (!this.options.enableUrlParams) return;

        const params = new URLSearchParams(window.location.search);

        this.currentFilters.query = params.get("q") || "";
        this.currentFilters.carrera = params.get("carrera") || "";
        this.currentFilters.situacionLaboral = params.get("situacion") || "";
        this.currentFilters.empresa = params.get("empresa") || "";
        this.currentFilters.puesto = params.get("puesto") || "";
        this.currentFilters.orderBy = params.get("orden") || "nombre_asc";
    }

    updateUrlParams() {
        if (!this.options.enableUrlParams) return;

        const params = new URLSearchParams();

        if (this.currentFilters.query)
            params.set("q", this.currentFilters.query);
        if (this.currentFilters.carrera)
            params.set("carrera", this.currentFilters.carrera);
        if (this.currentFilters.situacionLaboral)
            params.set("situacion", this.currentFilters.situacionLaboral);
        if (this.currentFilters.empresa)
            params.set("empresa", this.currentFilters.empresa);
        if (this.currentFilters.puesto)
            params.set("puesto", this.currentFilters.puesto);
        if (this.currentFilters.orderBy !== "nombre_asc")
            params.set("orden", this.currentFilters.orderBy);

        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
    }

    hasActiveFilters() {
        return Object.values(this.currentFilters).some(
            (value) => value !== "" && value !== "nombre_asc"
        );
    }

    showLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = "flex";
        }
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = "none";
        }
        if (this.elements.noResults) {
            this.elements.noResults.style.display = "none";
        }
    }

    hideLoading() {
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = "none";
        }
    }

    showError(message) {
        this.hideLoading();
        if (this.elements.errorMessage) {
            this.elements.errorMessage.style.display = "block";
            const errorText =
                this.elements.errorMessage.querySelector("#error-text");
            if (errorText) {
                errorText.textContent = message;
            }
        }
    }

    showNoResults() {
        if (this.elements.noResults) {
            this.elements.noResults.style.display = "flex";
        }
        if (this.elements.resultsContainer) {
            this.elements.resultsContainer.innerHTML = "";
        }
    }

    hideNoResults() {
        if (this.elements.noResults) {
            this.elements.noResults.style.display = "none";
        }
    }

    // API pública
    getResults() {
        return this.results;
    }

    getFilters() {
        return { ...this.currentFilters };
    }

    setFilter(name, value) {
        this.currentFilters[name] = value;
        this.updateFilterUI();
        if (this.options.enableAutoSearch) {
            this.performSearch();
        }
    }

    search() {
        return this.performSearch();
    }

    clear() {
        this.clearAllFilters();
    }
}
