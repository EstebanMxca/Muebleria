/**
 * Mueblería Cabañas - Sistema Optimizado de Carga
 * Este módulo unifica la funcionalidad de lazy loading y carga AJAX
 * Reemplaza a los antiguos lazy-loading.js y ajax-loader.js
 */

class Loader {
    constructor() {
        // Configuración principal
        this.config = {
            apiUrl: '/api',
            productsPerPage: 18,
            lazyLoadThreshold: 0.1,
            lazyLoadMargin: '0px 0px 200px 0px',
            loadingIndicatorId: 'global-loading-indicator'
        };

        // Estado de carga
        this.state = {
            currentPage: 1,
            currentCategory: '',
            totalPages: 1,
            isLoading: false,
            loadedContainers: new Set()
        };
        
        // Inicializar componentes
        this.initLoadingIndicator();
        this.initLazyLoading();
    }
    
    /**
     * Inicializa el indicador de carga global
     */
    initLoadingIndicator() {
        if (!document.getElementById(this.config.loadingIndicatorId)) {
            const loaderHTML = `
                <div id="${this.config.loadingIndicatorId}" class="loading-overlay">
                    <div class="loading-spinner">
                        <div class="spinner-grow text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                </div>
            `;
            
            const loaderElement = document.createElement('div');
            loaderElement.innerHTML = loaderHTML;
            document.body.appendChild(loaderElement.firstElementChild);
            
            // Añadir estilos para el indicador si no existen
            if (!document.querySelector(`style#loading-indicator-styles`)) {
                const styleElement = document.createElement('style');
                styleElement.id = 'loading-indicator-styles';
                styleElement.textContent = `
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                        visibility: hidden;
                        opacity: 0;
                        transition: opacity 0.3s, visibility 0.3s;
                    }
                    
                    .loading-overlay.active {
                        visibility: visible;
                        opacity: 1;
                    }
                    
                    .loading-spinner {
                        width: 5rem;
                        height: 5rem;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: white;
                        border-radius: 50%;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }
                    
                    .lazy-loading {
                        opacity: 0.5;
                        transition: opacity 0.3s ease;
                    }
                    
                    .lazy-loaded {
                        opacity: 1;
                    }
                    
                    .lazy-container {
                        min-height: 200px;
                        position: relative;
                    }
                    
                    .lazy-loading-indicator {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100%;
                        min-height: 200px;
                    }
                `;
                document.head.appendChild(styleElement);
            }
        }
    }
    
    /**
     * Inicializa el sistema de lazy loading
     */
    initLazyLoading() {
        // Observer para elementos de alta prioridad
        this.priorityObserver = new IntersectionObserver(
            (entries, observer) => this.handlePriorityIntersection(entries, observer),
            {
                threshold: 0.01,
                rootMargin: '300px 0px 300px 0px' // Cargar mucho antes
            }
        );
        
        // Observer normal para el resto de elementos
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this), 
            {
                threshold: this.config.lazyLoadThreshold,
                rootMargin: this.config.lazyLoadMargin
            }
        );
        
        // Observar imágenes con lazy loading
        document.querySelectorAll('img[data-src]').forEach(img => {
            img.classList.add('lazy-loading');
            this.observer.observe(img);
        });
        
        // Observar contenedores con lazy loading y manejar prioridades
        document.querySelectorAll('[data-lazy-container]').forEach(container => {
            container.classList.add('lazy-container');
            if (container.dataset.priority === 'high') {
                this.priorityObserver.observe(container);
            } else {
                this.observer.observe(container);
            }
        });
    }
    
    // Nueva función para manejar elementos prioritarios
    handlePriorityIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const containerId = element.id || 'container-' + Math.random().toString(36).substr(2, 9);
                
                if (!this.state.loadedContainers.has(containerId)) {
                    this.state.loadedContainers.add(containerId);
                    this.loadLazyContainer(element);
                }
                
                observer.unobserve(element);
            }
        });
    }
    
    /**
     * Maneja la intersección de elementos observados
     */
    handleIntersection(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.tagName === 'IMG') {
                    this.loadLazyImage(element);
                } else if (element.hasAttribute('data-lazy-container')) {
                    const containerId = element.id || 'container-' + Math.random().toString(36).substr(2, 9);
                    
                    if (!this.state.loadedContainers.has(containerId)) {
                        this.state.loadedContainers.add(containerId);
                        this.loadLazyContainer(element);
                    }
                }
                
                observer.unobserve(element);
            }
        });
    }
    
    /**
     * Carga una imagen con lazy loading
     */
    loadLazyImage(img) {
        // Verificar si ya fue cargada
        if (img.src === img.dataset.src) {
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            return;
        }
        
        // Crear una imagen temporal para verificar la carga
        const tempImg = new Image();
        
        // Cuando la imagen se cargue, actualizar la imagen real
        tempImg.onload = () => {
            img.src = img.dataset.src;
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
        };
        
        // Si hay error, mostrar imagen de respaldo
        tempImg.onerror = () => {
            console.warn(`Error al cargar imagen: ${img.dataset.src}`);
            img.src = 'assets/placeholder.jpg';
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
        };
        
        // Iniciar carga de la imagen
        tempImg.src = img.dataset.src;
    }
    
    /**
     * Carga un contenedor con lazy loading
     */
    loadLazyContainer(container) {
        // Verificar si el contenedor tiene ID
        if (!container.id) {
            console.warn('Contenedor lazy sin ID, se le asignará uno aleatorio');
            container.id = 'lazy-container-' + Math.random().toString(36).substr(2, 9);
        }
        
        // Obtener función de carga desde atributo
        const functionName = container.dataset.lazyFunction;
        
        // Si no hay función de carga, salir
        if (!functionName) {
            console.error('Contenedor lazy sin función de carga especificada');
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Error: No se especificó una función de carga.
                </div>
            `;
            return;
        }
        
        // Mostrar indicador de carga
        const loadingHTML = `
            <div class="lazy-loading-indicator">
                <div class="spinner-grow text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando contenido...</p>
            </div>
        `;
        
        // Verificar si ya tiene contenido (evitar sobrescribir contenido existente)
        if (container.innerHTML.trim() === '' || container.innerHTML.includes('Cargando')) {
            container.innerHTML = loadingHTML;
        }
        
        // Buscar la función de carga apropiada
        let loadFunction;
        
        // 1. Buscar en el servicio de productos
        if (window.productService && typeof window.productService[functionName] === 'function') {
            loadFunction = window.productService[functionName].bind(window.productService);
        } 
        // 2. Buscar en window directamente (compatibilidad con código antiguo)
        else if (typeof window[functionName] === 'function') {
            loadFunction = window[functionName];
        }
        // 3. Buscar en módulos específicos (compatibilidad con código antiguo)
        else if (window.catalogoMuebleria && typeof window.catalogoMuebleria[functionName] === 'function') {
            loadFunction = window.catalogoMuebleria[functionName];
        }
        
        // Si encontramos una función válida, ejecutarla
        if (typeof loadFunction === 'function') {
            try {
                // Llamar a la función de carga pasando el contenedor
                const result = loadFunction(container);
                
                // Si la función devuelve una promesa, manejarla
                if (result && typeof result.then === 'function') {
                    result
                        .then(() => {
                            // Añadir clase cuando se complete la carga
                            container.classList.remove('lazy-container');
                            container.classList.add('lazy-loaded');
                            
                            // Llamar a posibles métodos adicionales según el contenedor
                            this.handleSpecificContainerCallback(container);
                        })
                        .catch(error => {
                            console.error(`Error al cargar contenido con ${functionName}:`, error);
                            container.innerHTML = `
                                <div class="alert alert-danger">
                                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                                    Error al cargar el contenido. <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Reintentar</button>
                                </div>
                            `;
                        });
                } else {
                    // Si no devuelve una promesa, asumir que es síncrona
                    container.classList.remove('lazy-container');
                    container.classList.add('lazy-loaded');
                    
                    // Llamar a posibles métodos adicionales según el contenedor
                    this.handleSpecificContainerCallback(container);
                }
                
            } catch (error) {
                console.error(`Error al ejecutar función ${functionName}:`, error);
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Error durante la carga del contenido. <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Reintentar</button>
                    </div>
                `;
            }
        } else {
            console.error(`Función de carga "${functionName}" no encontrada`);
            container.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    No se pudo encontrar la función de carga. <button class="btn btn-sm btn-outline-warning ms-2" onclick="window.location.reload()">Reintentar</button>
                </div>
            `;
        }
    }
    
    /**
     * Maneja callbacks específicos para ciertos contenedores después de cargar
     */
    handleSpecificContainerCallback(container) {
        // Establecer diferentes acciones según el ID del contenedor
        switch(container.id) {
            case 'featured-products-container':
                // Configurar eventos para productos destacados
                this.setupProductEvents(container);
                break;
            case 'related-categories-container':
                // Inicializar animaciones AOS si está disponible
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
                break;
            default:
                // Para otros contenedores, simplemente refrescar AOS
                if (typeof AOS !== 'undefined') {
                    AOS.refresh();
                }
        }
    }
    
    /**
     * Configura eventos para elementos de producto (botones, modales, etc.)
     */
    setupProductEvents(container) {
        // Si tenemos un servicio de productos moderno, delegar a él
        if (window.productService && typeof window.productService.setupProductEvents === 'function') {
            window.productService.setupProductEvents(container);
            return;
        }
        
        // Implementación alternativa (compatibilidad)
        const productCards = container.querySelectorAll('.ver-detalles, .consultar-disponibilidad');
        productCards.forEach(btn => {
            if (btn.classList.contains('ver-detalles')) {
                btn.addEventListener('click', (e) => {
                    const productoId = e.currentTarget.getAttribute('data-producto-id');
                    const modalElement = document.getElementById(`modal${productoId}`);
                    if (modalElement && typeof bootstrap !== 'undefined') {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                });
            } else if (btn.classList.contains('consultar-disponibilidad')) {
                btn.addEventListener('click', (e) => {
                    const productoId = e.currentTarget.getAttribute('data-producto-id');
                    const nombreProducto = e.currentTarget.closest('.product-card')?.querySelector('.card-title')?.textContent || 'este producto';
                    window.open(`https://wa.me/1234567890?text=Hola,%20me%20interesa%20conocer%20la%20disponibilidad%20de:%20${encodeURIComponent(nombreProducto)}`, '_blank');
                });
            }
        });
    }
    
    /**
     * Muestra u oculta el indicador de carga global
     */
    toggleGlobalLoader(show) {
        const indicator = document.getElementById(this.config.loadingIndicatorId);
        if (indicator) {
            if (show) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        }
    }
    
    /**
     * Carga productos para una categoría utilizando AJAX
     */
    async loadCategoryProducts(categoryId, page = 1, filters = {}) {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        this.toggleGlobalLoader(true);
        
        // console.log(`Cargando categoría ${categoryId}, página ${page} con filtros:`, filters);
        
        try {
            // Usar el contenedor de la categoría específica
            const productsContainer = document.getElementById(categoryId);
            if (!productsContainer) {
                throw new Error(`No se encontró el contenedor para la categoría ${categoryId}`);
            }
            
            // Mostrar indicador de carga en el contenedor
            productsContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando productos...</p>
                </div>
            `;
            
            // Construir URL con parámetros
            let url = `${this.config.apiUrl}/productos/${categoryId}?page=${page}&limit=${this.config.productsPerPage}`;
            
            // Añadir filtros a la URL si existen
            if (filters.style) url += `&style=${encodeURIComponent(filters.style)}`;
            if (filters.sort) url += `&sort=${encodeURIComponent(filters.sort)}`;
            
            // console.log(`Solicitando URL: ${url}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            // console.log(`Datos recibidos:`, {
            //     totalProductos: data.productos ? data.productos.length : 0,
            //     totalPaginas: data.totalPaginas,
            //     paginaActual: data.paginaActual
            // });
            
            // Actualizar estado
            this.state.currentPage = page;
            this.state.currentCategory = categoryId;
            this.state.totalPages = data.totalPaginas || 1;
            
            // Verificar si hay productos
            if (!data.productos || data.productos.length === 0) {
                this.showEmptyProductsMessage(productsContainer);
                this.renderPagination(categoryId, this.state.totalPages, page, filters);
                this.updateUrlParams(categoryId, page, filters);
                return;
            }
            
            // Renderizar productos usando el servicio de productos si está disponible
            if (window.productService && typeof window.productService.renderProducts === 'function') {
                window.productService.renderProducts(productsContainer, data.productos, categoryId);
            } else {
                this.renderProductsLegacy(productsContainer, data.productos);
            }
            
            // Renderizar paginación
            this.renderPagination(categoryId, data.totalPaginas, page, filters);
            
            // Actualizar URL sin recargar la página
            this.updateUrlParams(categoryId, page, filters);
            
            // Si hay un servicio de recomendaciones, cargar recomendaciones
            if (window.productService && typeof window.productService.loadRecommendations === 'function') {
                window.productService.loadRecommendations(categoryId);
            }
            
            // Inicializar AOS si está disponible
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
            
            return data;
        } catch (error) {
            console.error('Error al cargar productos:', error);
            // Asegurarse de usar el contenedor correcto
            const productsContainer = document.getElementById(categoryId);
            if (productsContainer) {
                this.showErrorMessage(productsContainer, error.message);
            }
        } finally {
            this.state.isLoading = false;
            this.toggleGlobalLoader(false);
        }
    }
    
    /**
     * Renderiza los productos en el contenedor especificado (compatibilidad)
     */
    renderProductsLegacy(container, products) {
        // Crear contenedor para productos
        const productsRow = document.createElement('div');
        productsRow.className = 'row productos-container';
        
        // Generar HTML para cada producto
        products.forEach(producto => {
            // Determinar si hay etiqueta y su clase
            let tagHTML = '';
            if (producto.etiquetas && producto.etiquetas.length > 0) {
                const tag = producto.etiquetas[0];
                let tagClass = '';
                
                if (tag.toLowerCase().includes('promoción')) {
                    tagClass = 'sale';
                } else if (tag.toLowerCase().includes('último')) {
                    tagClass = 'last';
                }
                
                tagHTML = `<div class="product-tag ${tagClass}">${tag}</div>`;
            }
            
            // Generar descuento
            const getDiscountClass = (discount) => {
                if (discount >= 30) return 'high-discount';
                if (discount >= 15) return 'medium-discount';
                return 'low-discount';
            };
            
            const discountHTML = producto.descuento > 0 
                ? `<span class="descuento ${getDiscountClass(producto.descuento)}">-${producto.descuento}% </span>`
                : '';
            
            // Generar HTML del producto
            const productCardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100 position-relative">
                        ${tagHTML}
                        <img src="${producto.imagen_principal || 'assets/placeholder.jpg'}" class="card-img-top img-fluid" alt="${producto.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text">${producto.descripcion || ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary ver-detalles" 
                                            data-producto-id="${producto.id}">Ver detalles</button>
                                    <button type="button" class="btn btn-sm btn-outline-primary consultar-disponibilidad"
                                            data-producto-id="${producto.id}">Consultar disponibilidad</button>
                                    ${discountHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            productsRow.innerHTML += productCardHTML;
        });
        
        // Limpiar contenedor y agregar productos
        container.innerHTML = '';
        container.appendChild(productsRow);
        
        // Generar modales para cada producto
        products.forEach(producto => {
            this.generateProductModal(producto);
        });
        
        // Configurar eventos para los productos
        this.setupProductEvents(container);
    }
    
    /**
     * Genera un modal para un producto (compatibilidad)
     */
    generateProductModal(product) {
        // Verificar si el modal ya existe
        if (document.getElementById(`modal${product.id}`)) {
            return;
        }
        
        // Generar carrusel de imágenes si hay más de una
        let imagesHTML = '';
        
        // Si usamos el sistema legacy de una imagen
        if (!product.imagenes && product.imagen_principal) {
            imagesHTML = `<img src="${product.imagen_principal}" class="img-fluid rounded" alt="${product.nombre}">`;
        } 
        // Si tenemos array de imágenes
        else if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
            if (product.imagenes.length === 1) {
                imagesHTML = `<img src="${product.imagenes[0]}" class="img-fluid rounded" alt="${product.nombre}">`;
            } else {
                // Carrusel para múltiples imágenes
                const carouselItems = product.imagenes.map((img, index) => `
                    <div class="carousel-item ${index === 0 ? 'active' : ''}">
                        <img src="${img}" class="d-block w-100" alt="${product.nombre} - Vista ${index + 1}">
                    </div>
                `).join('');
                
                const carouselIndicators = product.imagenes.map((_, index) => `
                    <button type="button" data-bs-target="#carousel${product.id}" data-bs-slide-to="${index}" 
                    ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>
                `).join('');
                
                imagesHTML = `
                <div id="carousel${product.id}" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-indicators">
                        ${carouselIndicators}
                    </div>
                    <div class="carousel-inner">
                        ${carouselItems}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#carousel${product.id}" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Anterior</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#carousel${product.id}" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="visually-hidden">Siguiente</span>
                    </button>
                </div>
                `;
            }
        } else {
            // Imagen por defecto si no hay imágenes
            imagesHTML = `<img src="assets/placeholder.jpg" class="img-fluid rounded" alt="${product.nombre}">`;
        }
        
        // Generar lista de características
        const caracteristicasHTML = Array.isArray(product.caracteristicas) && product.caracteristicas.length > 0 
            ? `
            <div class="mt-4">
                <h6>Características:</h6>
                <ul class="caracteristicas-lista">
                    ${product.caracteristicas.map(car => `<li>${car}</li>`).join('')}
                </ul>
            </div>`
            : '';
        
        // Generar descuento con lógica de clasificación
        const getDiscountClass = (descuento) => {
            if (descuento >= 30) return 'high-discount';
            if (descuento >= 15) return 'medium-discount';
            return 'low-discount';
        };
        
        const descuentoHTML = product.descuento > 0 
            ? `<div class="descuento-container mt-3">
                <span class="descuento ${getDiscountClass(product.descuento)}">
                    -${product.descuento}% OFF
                </span>
              </div>`
            : '';
        
        // Determinar botones específicos según si estamos en la página de la categoría o no
        const isOnCategoryPage = this.state.currentCategory === product.categoria;
        
        const categoriaBtn = !isOnCategoryPage ? `
            <a href="${this.getCategoryUrl(product.categoria)}" class="btn btn-primary">
                <i class="bi bi-list me-2"></i>Ver más en ${product.categoria}
            </a>
        ` : '';
        
        // Generar HTML del modal
        const modalHTML = `
        <div class="modal fade" id="modal${product.id}" tabindex="-1" aria-labelledby="modalLabel${product.id}" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabel${product.id}">${product.nombre}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                ${imagesHTML}
                            </div>
                            <div class="col-md-6">
                                <p>${product.descripcion || 'Sin descripción disponible.'}</p>
                                ${descuentoHTML}
                                ${caracteristicasHTML}
                                <div class="mt-4">
                                    <span class="badge bg-${product.disponible ? 'success' : 'danger'} me-2">
                                        ${product.disponible ? 'Disponible' : 'No disponible'}
                                    </span>
                                    ${product.etiquetas ? product.etiquetas.map(tag => 
                                        `<span class="badge bg-primary me-2">${tag}</span>`).join('') : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${categoriaBtn}
                        <a href="https://wa.me/1234567890?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.nombre)}" 
                           class="btn btn-success" target="_blank">
                            <i class="bi bi-whatsapp me-2"></i>Consultar por WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Añadir modal al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    /**
     * Muestra un mensaje cuando no hay productos que mostrar
     */
    showEmptyProductsMessage(container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="empty-results">
                    <i class="bi bi-search fs-1 text-muted mb-3"></i>
                    <h4>No se encontraron productos</h4>
                    <p class="text-muted">Intenta con otros filtros o criterios de búsqueda.</p>
                    <button class="btn btn-outline-primary mt-2" id="resetFilters">
                        <i class="bi bi-arrow-repeat me-2"></i>Mostrar todos los productos
                    </button>
                </div>
            </div>
        `;
        
        // Configurar evento para restablecer filtros
        const resetButton = document.getElementById('resetFilters');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Restablecer filtros en elementos UI
                const styleFilter = document.getElementById('filterStyle');
                const sortSelect = document.getElementById('sortBy');
                
                if (styleFilter) styleFilter.value = '';
                if (sortSelect) sortSelect.value = 'destacado';
                
                // Cargar la primera página sin filtros
                this.loadCategoryProducts(this.state.currentCategory, 1, {
                    style: '',
                    sort: 'destacado'
                });
            });
        }
    }
    
    /**
     * Muestra un mensaje de error en el contenedor especificado
     */
    showErrorMessage(container, message) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="error-container">
                    <i class="bi bi-exclamation-triangle fs-1 text-danger mb-3"></i>
                    <h4>Ha ocurrido un error</h4>
                    <p class="text-muted">${message}</p>
                    <button class="btn btn-primary mt-2" id="retryLoadProducts">
                        <i class="bi bi-arrow-clockwise me-2"></i>Intentar nuevamente
                    </button>
                </div>
            </div>
        `;
        
        // Configurar evento para reintentar carga
        const retryButton = document.getElementById('retryLoadProducts');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.loadCategoryProducts(this.state.currentCategory, this.state.currentPage);
            });
        }
    }
    
    /**
     * Renderiza los controles de paginación
     */
    renderPagination(categoryId, totalPages, currentPage, filters = {}) {
        const paginationContainer = document.getElementById('pagination-controls');
        if (!paginationContainer) return;
        
        // Limpiar contenedor
        paginationContainer.innerHTML = '';
        
        // Si no hay páginas o solo una, no mostrar paginación
        if (totalPages <= 1) return;
        
        // Generar HTML para paginación
        const paginationHTML = `
            <nav aria-label="Navegación de productos" class="product-pagination">
                <ul class="pagination justify-content-center">
                    ${currentPage > 1 ? 
                        `<li class="page-item">
                            <button class="page-link" data-page="${currentPage - 1}" aria-label="Anterior">
                                <span aria-hidden="true">&laquo;</span>
                            </button>
                        </li>` : ''
                    }
                    
                    ${this.generatePageLinks(currentPage, totalPages)}
                    
                    ${currentPage < totalPages ? 
                        `<li class="page-item">
                            <button class="page-link" data-page="${currentPage + 1}" aria-label="Siguiente">
                                <span aria-hidden="true">&raquo;</span>
                            </button>
                        </li>` : ''
                    }
                </ul>
            </nav>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Configurar eventos para los botones de paginación
        const paginationButtons = paginationContainer.querySelectorAll('.page-link');
        paginationButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetPage = parseInt(button.getAttribute('data-page'));
                if (targetPage && targetPage !== currentPage) {
                    // Obtener filtros actuales o usar los proporcionados
                    const styleFilter = document.getElementById('filterStyle');
                    const sortSelect = document.getElementById('sortBy');
                    
                    const activeFilters = {
                        style: styleFilter ? styleFilter.value : (filters.style || ''),
                        sort: sortSelect ? sortSelect.value : (filters.sort || 'destacado')
                    };
                    
                    // Cargar página con filtros actuales
                    this.loadCategoryProducts(categoryId, targetPage, activeFilters);
                    
                    // Scroll hasta el inicio de los productos
                    const productsContainer = document.getElementById(categoryId);
                    if (productsContainer) {
                        // Calculamos un offset para no quedar exactamente debajo del navbar
                        const headerOffset = 160; // Ajusta este valor según la altura de tu navbar
                        const elementPosition = productsContainer.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }
    
    /**
     * Genera los enlaces de página para la paginación
     */
    generatePageLinks(currentPage, totalPages) {
        let links = '';
        const maxVisiblePages = 5; // Número máximo de enlaces a mostrar
        
        // Calcular rango de páginas a mostrar
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Ajustar rango si estamos cerca del final
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // Generar enlaces
        for (let i = startPage; i <= endPage; i++) {
            links += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <button class="page-link" data-page="${i}">${i}</button>
                </li>
            `;
        }
        
        return links;
    }
    
    /**
     * Actualiza los parámetros de la URL sin recargar la página
     */
    updateUrlParams(categoryId, page, filters = {}) {
        // Crear objeto URL a partir de la URL actual
        const url = new URL(window.location.href);
        
        // Actualizar parámetros
        url.searchParams.set('page', page.toString());
        
        if (filters.style) {
            url.searchParams.set('style', filters.style);
        } else {
            url.searchParams.delete('style');
        }
        
        if (filters.sort) {
            url.searchParams.set('sort', filters.sort);
        } else {
            url.searchParams.delete('sort');
        }
        
        // Actualizar URL sin recargar página
        window.history.pushState({ path: url.toString() }, '', url.toString());
    }
    
    /**
     * Obtiene la URL para una categoría específica
     */
    getCategoryUrl(categoria) {
        // Mapeo de categorías a URLs
        const categoriasMapping = {
            'Salas': 'salas.html',
            'Comedores': 'comedores.html',
            'Recámaras': 'recamaras.html',
            'Cabeceras': 'cabeceras.html',
            'Mesas de Centro': 'mesas-centro.html'
        };
        
        return categoriasMapping[categoria] || '#';
    }
/**
 * Carga productos destacados de manera optimizada
 */
async loadFeaturedProducts(container) {
    try {
        // console.log("Iniciando carga optimizada de productos destacados");
        
        // Verificar si el contenedor existe
        if (!container) {
            console.error("No se encontró el contenedor para productos destacados");
            return;
        }
        
        // Mostrar indicador de carga minimalista
        container.innerHTML = `
            <div class="loading-indicator">
                <div class="spinner-border" style="color: var(--primary);" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando diseños destacados...</p>
            </div>
        `;
        
        // Intentar usar caché primero para respuesta inmediata
        if (window.productService && window.productService.cache.featuredProducts) {
            // console.log('Utilizando productos destacados en caché');
            window.productService.renderFeaturedProducts(container, window.productService.cache.featuredProducts);
            return window.productService.cache.featuredProducts;
        }
        
        // Cargar productos destacados desde la API con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
        
        const response = await fetch(`${this.config.apiUrl}/productos-destacados`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const productosDestacados = await response.json();
        
        // Guardar en caché para futuras solicitudes
        if (window.productService) {
            window.productService.cache.featuredProducts = productosDestacados;
        }
        
        // Verificar si hay productos
        if (!productosDestacados || productosDestacados.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle me-2"></i>
                        No se encontraron productos destacados. Por favor, revisa más tarde.
                    </div>
                </div>
            `;
            return [];
        }
        
        // Usar la implementación de productService
        window.productService.renderFeaturedProducts(container, productosDestacados);
        
        return productosDestacados;
    } catch (error) {
        // Manejo de error amigable
        console.error("Error al cargar productos destacados:", error);
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    No se pudieron cargar los productos destacados. 
                    <button class="btn btn-sm btn-outline-danger ms-2" onclick="window.location.reload()">Reintentar</button>
                </div>
            </div>
        `;
        return [];
    }
}

    
}