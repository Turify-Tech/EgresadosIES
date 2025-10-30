/**
 * SearchBar Class - Maneja la funcionalidad de búsqueda con autocompletado
 * Se ejecuta del lado del cliente
 */

import { searchService } from "./api.js";

export class SearchBar {
    constructor(inputId, options = {}) {
        this.inputId = inputId;
        this.input = document.getElementById(inputId);
        this.searchButton = document.getElementById(`${inputId}-button`);
        this.clearButton = document.getElementById(`${inputId}-clear`);
        this.autocompleteList = document.getElementById(
            `${inputId}-autocomplete`
        );

        this.options = {
            enableAutocomplete: true,
            debounceTime: 300,
            minSearchLength: 2,
            onSearch: null,
            onClear: null,
            ...options,
        };

        this.debounceTimer = null;
        this.isSearching = false;
        this.selectedIndex = -1;
        this.autocompleteItems = [];

        this.init();
    }

    init() {
        if (!this.input) return;

        this.bindEvents();
        this.updateClearButton();
    }

    bindEvents() {
        // Eventos del input
        this.input.addEventListener("input", (e) => {
            this.handleInput(e);
        });

        this.input.addEventListener("keydown", (e) => {
            this.handleKeydown(e);
        });

        this.input.addEventListener("focus", () => {
            if (
                this.options.enableAutocomplete &&
                this.input.value.length >= this.options.minSearchLength
            ) {
                this.showAutocomplete();
            }
        });

        this.input.addEventListener("blur", (e) => {
            // Pequeño delay para permitir clicks en autocompletado
            setTimeout(() => {
                this.hideAutocomplete();
            }, 150);
        });

        // Eventos de botones
        if (this.searchButton) {
            this.searchButton.addEventListener("click", () => {
                this.performSearch();
            });
        }

        if (this.clearButton) {
            this.clearButton.addEventListener("click", () => {
                this.clearSearch();
            });
        }

        // Click fuera del componente
        document.addEventListener("click", (e) => {
            if (
                !this.input.contains(e.target) &&
                !this.autocompleteList?.contains(e.target)
            ) {
                this.hideAutocomplete();
            }
        });
    }

    handleInput(e) {
        const value = e.target.value;
        this.updateClearButton();

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            if (
                this.options.enableAutocomplete &&
                value.length >= this.options.minSearchLength
            ) {
                this.fetchAutocomplete(value);
            } else {
                this.hideAutocomplete();
            }
        }, this.options.debounceTime);
    }

    handleKeydown(e) {
        if (
            !this.autocompleteList ||
            this.autocompleteList.style.display === "none"
        ) {
            if (e.key === "Enter") {
                e.preventDefault();
                this.performSearch();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                this.navigateAutocomplete(1);
                break;
            case "ArrowUp":
                e.preventDefault();
                this.navigateAutocomplete(-1);
                break;
            case "Enter":
                e.preventDefault();
                if (
                    this.selectedIndex >= 0 &&
                    this.autocompleteItems[this.selectedIndex]
                ) {
                    this.selectAutocompleteItem(this.selectedIndex);
                } else {
                    this.performSearch();
                }
                break;
            case "Escape":
                this.hideAutocomplete();
                this.input.blur();
                break;
        }
    }

    async fetchAutocomplete(query) {
        if (this.isSearching) return;

        try {
            this.isSearching = true;
            const response = await searchService.autocomplete(query);
            this.renderAutocomplete(response.suggestions || []);
        } catch (error) {
            console.error("Error en autocompletado:", error);
            this.hideAutocomplete();
        } finally {
            this.isSearching = false;
        }
    }

    renderAutocomplete(suggestions) {
        if (!this.autocompleteList) return;

        this.autocompleteItems = suggestions;
        this.selectedIndex = -1;

        if (suggestions.length === 0) {
            this.autocompleteList.innerHTML = `
                <div class="autocomplete-no-results">
                    No se encontraron sugerencias
                </div>
            `;
        } else {
            this.autocompleteList.innerHTML = suggestions
                .map(
                    (item, index) => `
                    <div class="autocomplete-item" data-index="${index}">
                        <div class="autocomplete-item-text">${this.escapeHtml(
                            item.text
                        )}</div>
                        <div class="autocomplete-item-type">${this.getTypeLabel(
                            item.type
                        )}</div>
                    </div>
                `
                )
                .join("");

            // Bind click events
            this.autocompleteList
                .querySelectorAll(".autocomplete-item")
                .forEach((item, index) => {
                    item.addEventListener("click", () => {
                        this.selectAutocompleteItem(index);
                    });
                });
        }

        this.showAutocomplete();
    }

    navigateAutocomplete(direction) {
        if (this.autocompleteItems.length === 0) return;

        // Remover highlight anterior
        const items =
            this.autocompleteList.querySelectorAll(".autocomplete-item");
        if (this.selectedIndex >= 0) {
            items[this.selectedIndex]?.classList.remove("highlighted");
        }

        // Calcular nuevo índice
        this.selectedIndex += direction;
        if (this.selectedIndex < 0) {
            this.selectedIndex = this.autocompleteItems.length - 1;
        } else if (this.selectedIndex >= this.autocompleteItems.length) {
            this.selectedIndex = 0;
        }

        // Aplicar nuevo highlight
        items[this.selectedIndex]?.classList.add("highlighted");
        items[this.selectedIndex]?.scrollIntoView({ block: "nearest" });
    }

    selectAutocompleteItem(index) {
        const item = this.autocompleteItems[index];
        if (item) {
            this.input.value = item.text;
            this.hideAutocomplete();
            this.updateClearButton();
            this.performSearch();
        }
    }

    showAutocomplete() {
        if (this.autocompleteList) {
            this.autocompleteList.style.display = "block";
        }
    }

    hideAutocomplete() {
        if (this.autocompleteList) {
            this.autocompleteList.style.display = "none";
            this.selectedIndex = -1;
        }
    }

    performSearch() {
        const query = this.input.value.trim();
        this.hideAutocomplete();

        if (this.options.onSearch) {
            this.options.onSearch(query);
        }
    }

    clearSearch() {
        this.input.value = "";
        this.hideAutocomplete();
        this.updateClearButton();
        this.input.focus();

        if (this.options.onClear) {
            this.options.onClear();
        }
    }

    updateClearButton() {
        if (this.clearButton) {
            this.clearButton.style.display =
                this.input.value.length > 0 ? "flex" : "none";
        }
    }

    getTypeLabel(type) {
        const labels = {
            name: "Nombre",
            profession: "Profesión",
            company: "Empresa",
            position: "Puesto",
            career: "Carrera",
        };
        return labels[type] || type;
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    // API pública
    getValue() {
        return this.input.value;
    }

    setValue(value) {
        this.input.value = value;
        this.updateClearButton();
    }

    focus() {
        this.input.focus();
    }

    clear() {
        this.clearSearch();
    }
}
