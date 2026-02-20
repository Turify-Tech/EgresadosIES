/**
 * Manejador de búsqueda avanzada adaptado para layout sidebar
 * Gestiona la interacción con filtros, autocompletado y resultados
 */

import { searchService, publicProfilesService } from "./api.js";
import { SearchBar } from "./searchBar.js";
import { API_BASE_URL } from '../config/env.js';

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

        // Estado de paginación
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 0;

        // Elementos del DOM
        this.elements = {}

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

            // Paginación
            paginationContainer: document.getElementById("pagination-container"),
            prevPageBtn: document.getElementById("prev-page"),
            nextPageBtn: document.getElementById("next-page"),
            pageInfo: document.getElementById("page-info"),
        };
    }

    bindEvents() {
        // Botón para mostrar/ocultar filtros
        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleFilters();
            });
        }

        // Overlay para cerrar filtros en móvil
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.addEventListener("click", () => {
                this.hideFilters();
            });
        }

        // Botón de cerrar en móvil
        const closeMobileBtn = document.getElementById("close-filters-mobile");
        if (closeMobileBtn) {
            closeMobileBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.hideFilters();
            });
        }

        // Cerrar filtros al hacer clic fuera del sidebar y del botón
        // Usamos setTimeout para permitir que los checkboxes procesen el click primero
        document.addEventListener("click", (e) => {
            setTimeout(() => {
                // Si el sidebar está visible
                if (this.elements.filtersSidebar && this.elements.filtersSidebar.classList.contains("show")) {
                    // En móvil, solo cerramos si se hace clic en el overlay
                    const isMobile = window.innerWidth <= 768;
                    if (isMobile) return; // En móvil, el overlay maneja el cierre
                    
                    // En desktop, verificar si el clic fue fuera del sidebar y del botón toggle
                    const clickedInsideSidebar = this.elements.filtersSidebar.contains(e.target);
                    const clickedToggleBtn = this.elements.toggleFiltersBtn && this.elements.toggleFiltersBtn.contains(e.target);
                    
                    if (!clickedInsideSidebar && !clickedToggleBtn) {
                        this.hideFilters();
                    }
                }
            }, 0);
        });

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

        // Botones de paginación
        if (this.elements.prevPageBtn) {
            this.elements.prevPageBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.previousPage();
            });
        }

        if (this.elements.nextPageBtn) {
            this.elements.nextPageBtn.addEventListener("click", (e) => {
                e.preventDefault();
                this.nextPage();
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

            // Resetear a la primera página cuando cambian los filtros
            this.currentPage = 1;

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
            const response = await searchService.searchProfiles(searchParams);

            if (response.success) {
                this.results = response.data.perfiles || [];
                this.totalResults = response.data.total || 0;
                this.totalPages = response.data.totalPaginas || Math.ceil(this.totalResults / this.itemsPerPage);
                this.renderResults();
                this.updateResultsCount();
                this.updatePagination();
                this.hideStates();
            } else {
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

        // Paginación
        params.pagina = this.currentPage;
        params.limite = this.itemsPerPage;

        return params;
    }

    renderResults() {
        const container = this.elements.resultsContainer;

        if (!container) {
            return;
        }

        if (this.results.length === 0) {
            this.showNoResults();
            return;
        }

        const html = this.results
            .map((perfil) => this.renderPerfilCard(perfil))
            .join("");

        container.innerHTML = html;
    }

    renderPerfilCard(perfil) {
        // Construir la URL completa para la foto de perfil si es una ruta relativa
        const fotoUrl = perfil.urlFotoPerfil
            ? (perfil.urlFotoPerfil.startsWith('http') 
                ? perfil.urlFotoPerfil 
                : `${API_BASE_URL}${perfil.urlFotoPerfil}`)
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
                            perfil.carrera || "Sin especificar"
                        }</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Situación laboral:</span>
                        <span class="detail-value">${
                            perfil.situacionLaboral || "No especificada"
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
                    ? "1 Resultado encontrado"
                    : `${count} Resultados encontrados`;
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

        // Resetear paginación
        this.currentPage = 1;

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

    // Métodos de paginación
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.search();
            this.scrollToTop();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.search();
            this.scrollToTop();
        }
    }

    goToPage(page) {
        const pageNum = parseInt(page);
        if (pageNum >= 1 && pageNum <= this.totalPages) {
            this.currentPage = pageNum;
            this.search();
            this.scrollToTop();
        }
    }

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updatePagination() {
        if (!this.elements.paginationContainer) return;

        const { prevPageBtn, nextPageBtn, pageInfo } = this.elements;

        // Actualizar información de página
        if (pageInfo) {
            pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        }

        // Habilitar/deshabilitar botones
        if (prevPageBtn) {
            prevPageBtn.disabled = this.currentPage === 1;
        }

        if (nextPageBtn) {
            nextPageBtn.disabled = this.currentPage >= this.totalPages;
        }

        // Mostrar/ocultar el contenedor de paginación
        if (this.totalPages <= 1) {
            this.elements.paginationContainer.style.display = 'none';
        } else {
            this.elements.paginationContainer.style.display = 'flex';
        }
    }

    // Métodos para mostrar/ocultar filtros
    toggleFilters() {
        if (!this.elements.filtersSidebar) {
            return;
        }

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

        // Mostrar overlay en móvil
        if (this.elements.sidebarOverlay && window.innerWidth <= 768) {
            this.elements.sidebarOverlay.classList.add("show");
        }

        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.classList.add("active");
        }
    }

    hideFilters() {
        if (this.elements.filtersSidebar) {
            this.elements.filtersSidebar.classList.remove("show");
        }
        
        // Ocultar overlay
        if (this.elements.sidebarOverlay) {
            this.elements.sidebarOverlay.classList.remove("show");
        }
        
        if (this.elements.toggleFiltersBtn) {
            this.elements.toggleFiltersBtn.classList.remove("active");
        }
    }
}

// Mantener compatibilidad con AdvancedSearchManager original
export class AdvancedSearchManager extends AdvancedSearchManagerSidebar {}
