/**
 * Sistema de Menciones con @
 * Gestiona el autocomplete de egresados al escribir @
 */

import { API_URL, API_BASE_URL } from '../config/env.js';

class MentionSystem {
    constructor(textareaId, options = {}) {
        this.textarea = document.getElementById(textareaId);
        if (!this.textarea) {
            console.error(`Textarea con ID "${textareaId}" no encontrado`);
            return;
        }

        this.options = {
            minChars: 0, // Mostrar inmediatamente al escribir @
            maxResults: 10,
            debounceMs: 300,
            containerClass: 'mention-autocomplete-container',
            itemClass: 'mention-autocomplete-item',
            activeClass: 'mention-active',
            onSelect: options.onSelect || null,
            ...options
        };

        this.autocompleteContainer = null;
        this.selectedIndex = -1;
        this.results = [];
        this.isOpen = false;
        this.currentMentionStart = -1;
        this.searchTimeout = null;
        this.abortController = null;

        this.init();
    }

    init() {
        // Crear contenedor del autocomplete
        this.createAutocompleteContainer();

        // Event listeners
        this.textarea.addEventListener('input', (e) => this.handleInput(e));
        this.textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!this.textarea.contains(e.target) && !this.autocompleteContainer.contains(e.target)) {
                this.closeAutocomplete();
            }
        });

        // Cerrar al hacer scroll
        this.textarea.addEventListener('blur', () => {
            setTimeout(() => this.closeAutocomplete(), 200);
        });
    }

    createAutocompleteContainer() {
        this.autocompleteContainer = document.createElement('div');
        this.autocompleteContainer.className = this.options.containerClass;
        this.autocompleteContainer.style.display = 'none';
        
        // Insertar después del textarea
        this.textarea.parentNode.style.position = 'relative';
        this.textarea.parentNode.appendChild(this.autocompleteContainer);
    }

    handleInput(e) {
        const text = this.textarea.value;
        const cursorPos = this.textarea.selectionStart;

        // Buscar el último @ antes del cursor
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex === -1) {
            this.closeAutocomplete();
            return;
        }

        // Verificar que no haya espacios después del @
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
            this.closeAutocomplete();
            return;
        }

        // Búsqueda
        this.currentMentionStart = lastAtIndex;
        const query = textAfterAt;

        if (query.length >= this.options.minChars) {
            this.searchEgresados(query);
        } else if (query.length === 0) {
            // Mostrar todos al escribir solo @
            this.searchEgresados('');
        }
    }

    async searchEgresados(query) {
        // Cancelar búsqueda anterior
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        // Debounce
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No hay token de autenticación');
                    return;
                }

                const url = `${API_URL}/egresados/buscar?query=${encodeURIComponent(query)}&limit=${this.options.maxResults}`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: this.abortController.signal
                });

                if (!response.ok) {
                    throw new Error('Error al buscar egresados');
                }

                const data = await response.json();
                this.results = data.egresados || [];
                this.showAutocomplete();

            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error al buscar egresados:', error);
                }
            }
        }, this.options.debounceMs);
    }

    showAutocomplete() {
        if (this.results.length === 0) {
            this.closeAutocomplete();
            return;
        }

        this.autocompleteContainer.innerHTML = '';
        this.selectedIndex = -1;

        this.results.forEach((egresado, index) => {
            const item = document.createElement('div');
            item.className = this.options.itemClass;
            item.dataset.index = index;

            item.innerHTML = `
                <div class="mention-item-content">
                    ${egresado.fotoPerfil 
                        ? `<img src="${egresado.fotoPerfil}" alt="${egresado.nombreCompleto}" class="mention-avatar">`
                        : `<div class="mention-avatar-placeholder">${egresado.nombre[0]}</div>`
                    }
                    <div class="mention-info">
                        <div class="mention-name">${egresado.nombreCompleto}</div>
                        ${egresado.carrera ? `<div class="mention-career">${egresado.carrera}</div>` : ''}
                    </div>
                </div>
            `;

            item.addEventListener('click', () => this.selectItem(index));
            item.addEventListener('mouseenter', () => this.setActiveItem(index));

            this.autocompleteContainer.appendChild(item);
        });

        this.positionAutocomplete();
        this.autocompleteContainer.style.display = 'block';
        this.isOpen = true;
    }

    positionAutocomplete() {
        // Posicionar debajo del textarea
        const rect = this.textarea.getBoundingClientRect();
        this.autocompleteContainer.style.width = `${rect.width}px`;
    }

    handleKeyDown(e) {
        if (!this.isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
                this.updateActiveItem();
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateActiveItem();
                break;

            case 'Enter':
                if (this.selectedIndex >= 0) {
                    e.preventDefault();
                    this.selectItem(this.selectedIndex);
                }
                break;

            case 'Escape':
                e.preventDefault();
                this.closeAutocomplete();
                break;
        }
    }

    setActiveItem(index) {
        this.selectedIndex = index;
        this.updateActiveItem();
    }

    updateActiveItem() {
        const items = this.autocompleteContainer.querySelectorAll(`.${this.options.itemClass}`);
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add(this.options.activeClass);
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove(this.options.activeClass);
            }
        });
    }

    selectItem(index) {
        const egresado = this.results[index];
        if (!egresado) return;

        // Reemplazar @query con la mención
        const text = this.textarea.value;
        const beforeMention = text.substring(0, this.currentMentionStart);
        const afterCursor = text.substring(this.textarea.selectionStart);

        // Formato: @[id:123] para que el backend lo procese
        const mention = `@[id:${egresado.id}]`;
        const newText = beforeMention + mention + ' ' + afterCursor;

        this.textarea.value = newText;
        
        // Posicionar cursor después de la mención
        const newCursorPos = beforeMention.length + mention.length + 1;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        this.textarea.focus();

        // Callback personalizado
        if (this.options.onSelect) {
            this.options.onSelect(egresado);
        }

        this.closeAutocomplete();

        // Trigger input event para que otros sistemas lo detecten
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    closeAutocomplete() {
        this.autocompleteContainer.style.display = 'none';
        this.autocompleteContainer.innerHTML = '';
        this.isOpen = false;
        this.selectedIndex = -1;
        this.results = [];
        this.currentMentionStart = -1;

        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    destroy() {
        this.closeAutocomplete();
        if (this.autocompleteContainer) {
            this.autocompleteContainer.remove();
        }
    }
}

// Exportar para uso global
window.MentionSystem = MentionSystem;

export default MentionSystem;
