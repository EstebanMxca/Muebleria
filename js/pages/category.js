/**
 * Mueblería Cabañas - Lógica para páginas de categoría
 * Este módulo maneja la funcionalidad específica para las páginas de categoría
 */

class CategoryPage {
    constructor() {
        // Configuración de la página
        this.config = {
            productsPerPage: 18,
            defaultSort: 'destacado'
        };
        
        // Estado de la página
        this.state = {
            currentCategory: '',
            currentPage: 1,
            activeFilters: {
                style: '',
                sort: 'destacado'
            }
        };
    }
    
    /**
     * Inicializa la página de categoría
     */
    init() {
        console.log('Inicializando página de categoría...');
        
        // Detectar la categoría actual
        this.state.currentCategory = this.detectCurrentCategory();
        if (!this.state.currentCategory) {
            console.error('No se pudo detectar la categoría actual');
            return;
        }
        
        console.log(`Categoría detectada: ${this.state.currentCategory}`);
        
        // Obtener estado inicial de la URL
        this.syncStateWithUrl();
        
        // Configurar filtros
        this.setupFilters();
        
        // Configurar vista de productos
        this.setupProductView();
        
        // Cargar productos iniciales
        this.loadProducts();
        
        console.log('Página de categoría inicializada');
    }
    
    /**
     * Detecta la categoría actual basada en la URL o los elementos del DOM
     */
    detectCurrentCategory() {
        // Método 1: Detectar por URL
        const urlPath = window.location.pathname;
        const possibleCategories = ['salas', 'comedores', 'recamaras', 'cabeceras', 'mesas-centro'];
        
        for (const category of possibleCategories) {
            if (urlPath.includes(`${category}.html`)) {
                return category;
            }
        }
        
        // Método 2: Detectar por ID de contenedor
        for (const category of possibleCategories) {
            if (document.getElementById(category)) {
                return category;
            }
        }
        
        return null;
    }
    
    /**
     * Sincroniza el estado de la página con los parámetros de la URL
     */
    syncStateWithUrl() {
        const params = new URLSearchParams(window.location.search);
        
        // Página actual
        const page = parseInt(params.get('page'));
        this.state.currentPage = page || 1;
        
        // Filtros
        this.state.activeFilters.style = params.get('style') || '';
        this.state.activeFilters.sort = params.get('sort') || this.config.defaultSort;
        
        // Sincronizar UI con estado
        this.updateFiltersUi();
    }
    
    /**
     * Actualiza los controles de filtro en la UI basado en el estado actual
     */
    updateFiltersUi() {
        // Filtro de estilo
        const styleFilter = document.getElementById('filterStyle');
        if (styleFilter) {
            styleFilter.value = this.state.activeFilters.style;
        }
        
        // Filtro de ordenamiento
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.value = this.state.activeFilters.sort;
        }
    }
    
    /**
     * Configura los eventos para los filtros
     */
    setupFilters() {
        // Filtro de estilo
        const styleFilter = document.getElementById('filterStyle');
        if (styleFilter) {
            styleFilter.addEventListener('change', () => {
                this.state.activeFilters.style = styleFilter.value;
                this.state.currentPage = 1; // Volver a la primera página al cambiar filtros
                this.loadProducts();
            });
        }
        
        // Filtro de ordenamiento
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.state.activeFilters.sort = sortSelect.value;
                this.loadProducts();
            });
        }
    }
    
    /**
     * Configura la vista de productos (grid/lista)
     */
    setupProductView() {
        // Botón de vista en grid
        const gridViewBtn = document.querySelector('.view-grid');
        // Botón de vista en lista
        const listViewBtn = document.querySelector('.view-list');
        
        if (!gridViewBtn || !listViewBtn) return;
        
        // Obtener vista guardada o usar grid por defecto
        const savedView = localStorage.getItem('productView') || 'grid';
        
        // Aplicar vista inicial
        if (savedView === 'grid') {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
        
        // Evento para cambiar a vista de grid
        gridViewBtn.addEventListener('click', () => {
            this.changeProductView('grid');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        });
        
        // Evento para cambiar a vista de lista
        listViewBtn.addEventListener('click', () => {
            this.changeProductView('list');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        });
    }
    
    /**
     * Cambia la vista de productos entre grid y lista
     */
    changeProductView(viewType) {
        // Guardar preferencia
        localStorage.setItem('productView', viewType);
        
        // Aplicar vista usando el servicio de productos si está disponible
        if (window.productService && typeof window.productService.applyProductView === 'function') {
            window.productService.applyProductView(viewType);
        } else {
            this.applyProductViewFallback(viewType);
        }
    }
    
    /**
     * Implementación alternativa para aplicar vista de productos
     */
    applyProductViewFallback(viewType) {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const col = card.closest('.col-md-4, .col-12');
            
            if (viewType === 'grid') {
                // Cambiar a vista de cuadrícula
                if (col) col.className = 'col-md-4 mb-4';
                card.classList.remove('flex-row', 'product-card-list');
                
                // Resetear layout interno
                const imgElement = card.querySelector('.card-img-top');
                if (imgElement) {
                    imgElement.classList.remove('product-img-list');
                    imgElement.style.width = '';
                }
                
                const cardBody = card.querySelector('.card-body');
                if (cardBody) {
                    cardBody.classList.remove('d-flex', 'flex-column', 'justify-content-between', 'w-100');
                }
            } else {
                // Cambiar a vista de lista
                if (col) col.className = 'col-12 mb-3';
                card.classList.add('flex-row', 'product-card-list');
                
                // Modificar layout interno
                const imgElement = card.querySelector('.card-img-top');
                if (imgElement) {
                    imgElement.classList.add('product-img-list');
                    imgElement.style.width = '200px';
                }
                
                const cardBody = card.querySelector('.card-body');
                if (cardBody) {
                    cardBody.classList.add('d-flex', 'flex-column', 'justify-content-between', 'w-100');
                }
            }
        });
    }
    
    /**
     * Carga los productos con los filtros y paginación actuales
     */
    loadProducts() {
        // Usar loader si está disponible
        if (window.loader && typeof window.loader.loadCategoryProducts === 'function') {
            window.loader.loadCategoryProducts(
                this.state.currentCategory,
                this.state.currentPage,
                this.state.activeFilters
            );
        } else {
            console.error('No se encontró el cargador de productos');
            this.showErrorMessage('No se puede cargar los productos. Por favor, recarga la página.');
        }
        
        // Actualizar URL con los parámetros actuales
        this.updateUrl();
    }
    
    /**
     * Actualiza la URL con el estado actual sin recargar la página
     */
    updateUrl() {
        const url = new URL(window.location.href);
        
        // Actualizar parámetros
        url.searchParams.set('page', this.state.currentPage.toString());
        
        if (this.state.activeFilters.style) {
            url.searchParams.set('style', this.state.activeFilters.style);
        } else {
            url.searchParams.delete('style');
        }
        
        if (this.state.activeFilters.sort !== this.config.defaultSort) {
            url.searchParams.set('sort', this.state.activeFilters.sort);
        } else {
            url.searchParams.delete('sort');
        }
        
        // Actualizar URL sin recargar página
        window.history.replaceState(null, '', url.toString());
    }
    
    /**
     * Muestra un mensaje de error en el contenedor de productos
     */
    showErrorMessage(message) {
        const container = document.getElementById(this.state.currentCategory);
        if (!container) return;
        
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="error-container">
                    <i class="bi bi-exclamation-triangle fs-1 text-danger mb-3"></i>
                    <h4>Ha ocurrido un error</h4>
                    <p class="text-muted">${message}</p>
                    <button class="btn btn-primary mt-2" onclick="window.location.reload()">
                        <i class="bi bi-arrow-clockwise me-2"></i>Intentar nuevamente
                    </button>
                </div>
            </div>
        `;
    }
}

// Inicializar la página de categoría cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en una página de categoría
    const urlPath = window.location.pathname;
    const isCategoryPage = /salas|comedores|recamaras|cabeceras|mesas-centro/.test(urlPath);
    
    if (isCategoryPage) {
        window.categoryPage = new CategoryPage();
        window.categoryPage.init();
    }
});