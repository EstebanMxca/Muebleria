/**
 * Mueblería Cabañas - Servicio de Productos
 * Este módulo centraliza la gestión de datos de productos y su presentación
 * Reemplaza al antiguo products.js con una implementación más modular
 */

class ProductService {
    constructor() {
        // Configuración del servicio
        this.config = {
            apiUrl: 'http://localhost:3000/api',
            imagePlaceholder: 'assets/placeholder.jpg',
            maxImagesPerProduct: 4
        };
        
        // Caché de productos por categoría
        this.cache = {
            products: {},
            categories: null,
            featuredProducts: null
        };
    }
    
    /**
     * Inicializa el servicio de productos
     */
    init() {
        console.log('Inicializando servicio de productos...');
        
        // Cargar categorías si estamos en cualquier página
        this.loadCategories();
        
        // Detectar si estamos en la página principal
        const isIndex = window.location.pathname.endsWith('/') || 
                        window.location.pathname.endsWith('index.html');
        
        if (isIndex) {
            // Configurar contenedores para lazy loading en la página principal
            this.setupIndexPage();
        } else {
            // Configurar página de categoría
            this.setupCategoryPage();
        }
    }
    
    /**
     * Configura la página principal
     */
    setupIndexPage() {
        // Configurar el contenedor de productos destacados para lazy loading
        const featuredContainer = document.getElementById('featured-products-container');
        if (featuredContainer) {
            if (!featuredContainer.hasAttribute('data-lazy-container')) {
                featuredContainer.setAttribute('data-lazy-container', 'true');
                featuredContainer.setAttribute('data-lazy-function', 'loadFeaturedProducts');
            }
        }
        
        // Configurar el contenedor de categorías para lazy loading
        const categoriesContainer = document.getElementById('categories-showcase-container');
        if (categoriesContainer) {
            if (!categoriesContainer.hasAttribute('data-lazy-container')) {
                categoriesContainer.setAttribute('data-lazy-container', 'true');
                categoriesContainer.setAttribute('data-lazy-function', 'loadCategoriesShowcase');
            }
        }
    }
    
    /**
     * Configura una página de categoría
     */
    setupCategoryPage() {
        // Detectar la categoría actual basada en la URL o el ID de contenedor
        const categoryId = this.detectCurrentCategory();
        
        if (categoryId) {
            // Cargar productos de la categoría desde la URL o con valores predeterminados
            const urlParams = new URLSearchParams(window.location.search);
            const page = parseInt(urlParams.get('page')) || 1;
            const style = urlParams.get('style') || '';
            const sort = urlParams.get('sort') || 'destacado';
            
            // Sincronizar filtros con parámetros URL
            this.syncFiltersWithUrl(style, sort);
            
            // Si tenemos un cargador, utilizarlo para cargar los productos
            if (window.loader) {
                window.loader.loadCategoryProducts(categoryId, page, { style, sort });
            }
            
            // Configurar eventos de filtros
            this.setupFilterEvents(categoryId);
        }
    }
    
    /**
     * Sincroniza los filtros de la UI con los parámetros de la URL
     */
    syncFiltersWithUrl(style, sort) {
        const styleFilter = document.getElementById('filterStyle');
        const sortSelect = document.getElementById('sortBy');
        
        if (styleFilter && style) {
            styleFilter.value = style;
        }
        
        if (sortSelect && sort) {
            sortSelect.value = sort;
        }
    }
    
    /**
     * Configura eventos para los filtros en páginas de categoría
     */
    setupFilterEvents(categoryId) {
        // Filtro de estilo
        const styleFilter = document.getElementById('filterStyle');
        if (styleFilter) {
            styleFilter.addEventListener('change', () => {
                this.applyFilters(categoryId);
            });
        }
        
        // Filtro de ordenamiento
        const sortSelect = document.getElementById('sortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.applyFilters(categoryId);
            });
        }
        
        // Configurar botones de vista (grid/list)
        this.setupViewButtons();
    }
    
    /**
     * Configura los botones de vista de grid/lista
     */
    setupViewButtons() {
        const gridViewBtn = document.querySelector('.view-grid');
        const listViewBtn = document.querySelector('.view-list');
        
        if (gridViewBtn && listViewBtn) {
            // Estado actual
            let currentView = localStorage.getItem('productView') || 'grid';
            
            // Aplicar vista guardada
            this.applyProductView(currentView);
            
            // Actualizar clases activas
            if (currentView === 'grid') {
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            } else {
                gridViewBtn.classList.remove('active');
                listViewBtn.classList.add('active');
            }
            
            // Eventos para cambiar vista
            gridViewBtn.addEventListener('click', () => {
                this.changeProductView('grid');
                gridViewBtn.classList.add('active');
                listViewBtn.classList.remove('active');
            });
            
            listViewBtn.addEventListener('click', () => {
                this.changeProductView('list');
                gridViewBtn.classList.remove('active');
                listViewBtn.classList.add('active');
            });
        }
    }
    
    /**
     * Cambia la vista de productos entre grid y lista
     */
    changeProductView(viewType) {
        // Guardar preferencia
        localStorage.setItem('productView', viewType);
        
        // Aplicar vista
        this.applyProductView(viewType);
    }
    
    /**
     * Aplica la vista de productos (grid o lista)
     */
    applyProductView(viewType) {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => {
            const col = card.closest('.col-md-4, .col-12');
            
            if (viewType === 'grid') {
                // Cambiar a vista de cuadrícula
                if (col) {
                    col.className = 'col-md-4 mb-4';
                }
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
                if (col) {
                    col.className = 'col-12 mb-3';
                }
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
     * Aplica los filtros actuales y recarga los productos
     */
    applyFilters(categoryId) {
        // Obtener valores de filtros
        const style = document.getElementById('filterStyle')?.value || '';
        const sort = document.getElementById('sortBy')?.value || 'destacado';
        
        // Si existe el cargador, usarlo para cargar productos filtrados
        if (window.loader) {
            window.loader.loadCategoryProducts(categoryId, 1, { style, sort });
        }
    }
    
    /**
     * Detecta la categoría actual basada en la URL o los contenedores
     */
    detectCurrentCategory() {
        // 1. Intenta detectar por URL
        const urlPath = window.location.pathname;
        const possibleCategories = ['salas', 'comedores', 'recamaras', 'cabeceras', 'mesas-centro'];
        
        for (const category of possibleCategories) {
            if (urlPath.includes(`${category}.html`)) {
                return category;
            }
        }
        
        // 2. Intenta detectar por contenedor en el DOM
        for (const category of possibleCategories) {
            if (document.getElementById(category)) {
                return category;
            }
        }
        
        return null;
    }
    
    /**
     * Carga las categorías disponibles
     */
    async loadCategories() {
        if (this.cache.categories) {
            return this.cache.categories;
        }
        
        try {
            const response = await fetch(`${this.config.apiUrl}/categorias`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const categories = await response.json();
            this.cache.categories = categories;
            return categories;
        } catch (error) {
            console.error('Error al cargar categorías:', error);
            return [];
        }
    }
    
    /**
     * Carga los productos destacados
     */
    async loadFeaturedProducts(container) {
        // Si tenemos un loader, utilizarlo (prioridad)
        if (window.loader && typeof window.loader.loadFeaturedProducts === 'function') {
            return window.loader.loadFeaturedProducts(container);
        }
        
        // Implementación alternativa si no hay loader disponible
        try {
            // Verificar si ya tenemos los productos en caché
            if (this.cache.featuredProducts) {
                this.renderFeaturedProducts(container, this.cache.featuredProducts);
                return this.cache.featuredProducts;
            }
            
            // Mostrar indicador de carga
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando productos destacados...</p>
                </div>
            `;
            
            // Cargar productos destacados desde la API
            const response = await fetch(`${this.config.apiUrl}/productos-destacados`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const productosDestacados = await response.json();
            this.cache.featuredProducts = productosDestacados;
            
            // Renderizar productos destacados
            this.renderFeaturedProducts(container, productosDestacados);
            
            return productosDestacados;
        } catch (error) {
            console.error("Error al cargar productos destacados:", error);
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Ocurrió un error al cargar los productos destacados. Por favor, intenta más tarde.
                    </div>
                </div>
            `;
            return [];
        }
    }
    
    /**
     * Renderiza los productos destacados en un contenedor
     */
    renderFeaturedProducts(container, products) {
        // Verificar si hay productos
        if (!products || products.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert" style="background-color: rgba(166, 124, 82, 0.1); border-left: 4px solid var(--primary); border-radius: 0;">
                        <i class="bi bi-info-circle me-2"></i>
                        <span>No se encontraron productos destacados. Por favor, regresa más tarde para descubrir nuestra selección.</span>
                    </div>
                </div>
            `;
            return;
        }
        
        // Transformar el diseño y estructura del contenedor
        const sectionParent = container.parentElement.parentElement;
        if (sectionParent) {
            sectionParent.classList.add('featured-section');
        }
        
        // Buscar si ya existe el encabezado para evitar duplicaciones
        const existingHeader = sectionParent?.querySelector('.featured-header');
        
        // Limpiar contenedor actual
        container.innerHTML = '';
        
        // Crear nueva estructura HTML para el encabezado solo si no existe
        if (!existingHeader && sectionParent) {
            const headerHTML = `
                <div class="featured-header">
                    <h2 class="featured-title">Productos Destacados</h2>
                    <p class="featured-subtitle">Descubre nuestras piezas más exclusivas seleccionadas para ti</p>
                </div>
            `;
            
            // Insertar encabezado antes del contenedor
            container.insertAdjacentHTML('beforebegin', headerHTML);
        }
        
        // Crear contenedor para la nueva estructura de grid
        container.className = 'featured-products';
        
        // Generar HTML para cada producto destacado con nuevo diseño
        let productosHTML = '';
        
        // Generar todos los productos con el mismo tamaño en una grid 2x2
        for (let i = 0; i < Math.min(products.length, 4); i++) {
            const producto = products[i];
            
            const categoriaURL = this.getCategoryUrl(producto.categoria);
            const descripcionCorta = producto.descripcion ? 
                (producto.descripcion.length > 100 ? producto.descripcion.substring(0, 100) + '...' : producto.descripcion) : 
                'Descripción no disponible.';
            
            // Asegurar imagen principal
            const imagenPrincipal = producto.imagen_principal || this.config.imagePlaceholder;
            
            productosHTML += `
            <div class="featured-product-item" data-aos="fade-up" data-aos-delay="${i * 100}">
                <div class="featured-product-img-wrap">
                    ${this.generateProductTagHTML(producto)}
                    ${this.generateDiscountBadgeHTML(producto.descuento)}
                    <img src="${imagenPrincipal}" alt="${producto.nombre}" class="featured-product-img">
                </div>
                <div class="featured-product-info">
                    <div class="featured-product-category">${producto.categoria}</div>
                    <h3 class="featured-product-title">${producto.nombre}</h3>
                    <p class="featured-product-desc">${descripcionCorta}</p>
                    <div class="featured-product-attributes">
                        ${this.generateAttributesHTML(producto.caracteristicas)}
                    </div>
                    <div class="featured-product-actions">
                        <button type="button" class="featured-action-btn featured-action-btn-secondary ver-detalles" 
                            data-producto-id="${producto.id}">
                            <i class="bi bi-eye"></i>Ver detalles
                        </button>
                        <a href="${categoriaURL}" class="featured-action-btn featured-action-btn-primary">
                            <i class="bi bi-arrow-right-circle"></i>Ver más
                        </a>
                    </div>
                </div>
            </div>`;
        }
        
        // Agregar elementos decorativos
        productosHTML += `
            <div class="featured-decor-dot featured-decor-dot-1"></div>
            <div class="featured-decor-dot featured-decor-dot-2"></div>
        `;
        
        // Insertar HTML en el contenedor
        container.innerHTML = productosHTML;
        
        // Generar modales para los productos destacados
        products.forEach(producto => {
            this.generateProductModal(producto);
        });
        
        // Configurar eventos para botones de detalles
        this.setupProductEvents(container);
        
        // Inicializar AOS si está disponible
        if (typeof AOS !== 'undefined') {
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        }
    }
    
    /**
     * Renderiza productos en el contenedor de una categoría
     */
    renderProducts(container, products, categoryId) {
        if (!container) return;
        
        // Verificar si hay productos
        if (!products || products.length === 0) {
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
                    
                    // Recargar productos sin filtros
                    if (window.loader) {
                        window.loader.loadCategoryProducts(categoryId, 1, {
                            style: '',
                            sort: 'destacado'
                        });
                    }
                });
            }
            
            return;
        }
        
        // Crear fila para productos
        const productsRow = document.createElement('div');
        productsRow.className = 'row productos-container';
        
        // Generar HTML para cada producto
        products.forEach(producto => {
            const productCardHTML = `
                <div class="col-md-4 mb-4">
                    <div class="card product-card h-100 position-relative">
                        ${this.generateProductTagHTML(producto)}
                        <img src="${producto.imagen_principal || this.config.imagePlaceholder}" class="card-img-top img-fluid" alt="${producto.nombre}">
                        <div class="card-body">
                            <h5 class="card-title">${producto.nombre}</h5>
                            <p class="card-text">${producto.descripcion || ''}</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary ver-detalles" 
                                            data-producto-id="${producto.id}">Ver detalles</button>
                                    <button type="button" class="btn btn-sm btn-outline-primary consultar-disponibilidad"
                                            data-producto-id="${producto.id}">Consultar disponibilidad</button>
                                    ${this.generateDiscountSpanHTML(producto.descuento)}
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
        
        // Aplicar vista actual (grid o lista)
        const savedView = localStorage.getItem('productView') || 'grid';
        this.applyProductView(savedView);
        
        // Inicializar AOS si está disponible
        if (typeof AOS !== 'undefined') {
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        }
    }
    
    /**
     * Configura eventos para elementos de producto
     */
    setupProductEvents(container) {
        // Configurar eventos para botones de detalles
        container.querySelectorAll('.ver-detalles').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productoId = e.currentTarget.getAttribute('data-producto-id');
                const modalElement = document.getElementById(`modal${productoId}`);
                if (modalElement && typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            });
        });
        
        // Configurar eventos para botones de consultar disponibilidad
        container.querySelectorAll('.consultar-disponibilidad').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productoId = e.currentTarget.getAttribute('data-producto-id');
                // Intentar obtener el nombre del producto del DOM cercano
                const productCard = e.currentTarget.closest('.product-card, .featured-product-item');
                let nombreProducto = 'un producto';
                
                if (productCard) {
                    nombreProducto = productCard.querySelector('.card-title, .featured-product-title')?.textContent || 'un producto';
                }
                
                window.open(`https://wa.me/1234567890?text=Hola,%20me%20interesa%20conocer%20la%20disponibilidad%20de:%20${encodeURIComponent(nombreProducto)}`, '_blank');
            });
        });
    }
    
    /**
     * Genera un modal para un producto
     */
    generateProductModal(producto) {
        // Verificar si el modal ya existe
        if (document.getElementById(`modal${producto.id}`)) {
            return;
        }
        
        // Determinar el contenido de las imágenes (carrusel o imagen única)
        let imagesHTML = '';
        
        // Si el producto tiene múltiples imágenes
        if (Array.isArray(producto.imagenes) && producto.imagenes.length > 1) {
            // Limitar a máximo 4 imágenes
            const imagenes = producto.imagenes.slice(0, this.config.maxImagesPerProduct);
            
            // Generar indicadores para el carrusel
            const indicators = imagenes.map((_, index) => `
                <button type="button" data-bs-target="#carousel${producto.id}" data-bs-slide-to="${index}" 
                ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>
            `).join('');
            
            // Generar elementos del carrusel
            const items = imagenes.map((img, index) => `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100" alt="${producto.nombre} - Vista ${index + 1}">
                </div>
            `).join('');
            
            // Construir el carrusel completo
            imagesHTML = `
            <div id="carousel${producto.id}" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                    ${indicators}
                </div>
                <div class="carousel-inner">
                    ${items}
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#carousel${producto.id}" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Anterior</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#carousel${producto.id}" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Siguiente</span>
                </button>
            </div>
            `;
        } 
        // Si solo hay una imagen o imagen_principal
        else {
            const imagen = (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) 
                ? producto.imagenes[0] 
                : (producto.imagen_principal || this.config.imagePlaceholder);
                
            imagesHTML = `<img src="${imagen}" class="img-fluid rounded" alt="${producto.nombre}">`;
        }
        
        // Características del producto
        const caracteristicasHTML = Array.isArray(producto.caracteristicas) && producto.caracteristicas.length > 0 
            ? `
            <div class="mt-4">
                <h6>Características:</h6>
                <ul class="caracteristicas-lista">
                    ${producto.caracteristicas.map(car => `<li>${car}</li>`).join('')}
                </ul>
            </div>`
            : '';
        
        // Etiquetas del producto
        const etiquetasHTML = Array.isArray(producto.etiquetas) && producto.etiquetas.length > 0
            ? producto.etiquetas.map(tag => `<span class="badge bg-primary me-2">${tag}</span>`).join('')
            : '';
        
        // Información de descuento
        const descuentoHTML = producto.descuento > 0 
            ? `<div class="descuento-container mt-3">
                <span class="descuento ${this.getDiscountClass(producto.descuento)}">
                    -${producto.descuento}% OFF
                </span>
              </div>`
            : '';
        
        // Determinar si estamos en la página de la misma categoría que el producto
        const currentCategory = this.detectCurrentCategory();
        const isOnCategoryPage = currentCategory === this.getNormalizedCategoryId(producto.categoria);
        
        // Botón para ver más productos de la categoría (solo si no estamos en esa categoría)
        const categoriaBtn = !isOnCategoryPage ? `
            <a href="${this.getCategoryUrl(producto.categoria)}" class="btn btn-primary">
                <i class="bi bi-list me-2"></i>Ver más en ${producto.categoria}
            </a>
        ` : '';
        
        // Crear el modal HTML
        const modalHTML = `
        <div class="modal fade" id="modal${producto.id}" tabindex="-1" aria-labelledby="modalLabel${producto.id}" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabel${producto.id}">${producto.nombre}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                ${imagesHTML}
                            </div>
                            <div class="col-md-6">
                                <p>${producto.descripcion || 'Sin descripción disponible.'}</p>
                                ${descuentoHTML}
                                ${caracteristicasHTML}
                                <div class="mt-4">
                                    <span class="badge bg-${producto.disponible ? 'success' : 'danger'} me-2">
                                        ${producto.disponible ? 'Disponible' : 'No disponible'}
                                    </span>
                                    ${etiquetasHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${categoriaBtn}
                        <a href="https://wa.me/1234567890?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(producto.nombre)}" 
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
        
        // Buscar en el mapeo
        if (categoriasMapping[categoria]) {
            return categoriasMapping[categoria];
        }
        
        // Si no está en el mapeo, normalizar y devolver
        return this.getNormalizedCategoryId(categoria) + '.html';
    }
    
    /**
     * Normaliza el ID de una categoría para URLs
     */
    getNormalizedCategoryId(categoriaName) {
        // Mapeo de nombres de categorías a IDs
        const categoriasMapping = {
            'Salas': 'salas',
            'Comedores': 'comedores',
            'Recámaras': 'recamaras',
            'Cabeceras': 'cabeceras',
            'Mesas de Centro': 'mesas-centro'
        };
        
        // Buscar en el mapeo
        if (categoriasMapping[categoriaName]) {
            return categoriasMapping[categoriaName];
        }
        
        // Si no está en el mapeo, normalizar manualmente
        return categoriaName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
    }
    
    /**
     * Genera el HTML para la etiqueta de un producto
     */
    generateProductTagHTML(producto) {
        if (!producto.etiquetas || producto.etiquetas.length === 0) return '';
        
        const etiqueta = producto.etiquetas[0];
        let claseEtiqueta = '';
        
        if (etiqueta.toLowerCase().includes('promoción')) {
            claseEtiqueta = 'sale';
        } else if (etiqueta.toLowerCase().includes('último')) {
            claseEtiqueta = 'last';
        } else {
            claseEtiqueta = 'new';
        }
        
        return `<div class="product-tag ${claseEtiqueta}">${etiqueta}</div>`;
    }
    
    /**
     * Genera el HTML para la etiqueta de un producto en formato especial para productos destacados
     */
    generateProductTagFeaturedHTML(producto) {
        if (!producto.etiquetas || producto.etiquetas.length === 0) return '';
        
        const etiqueta = producto.etiquetas[0];
        let claseEtiqueta = '';
        
        if (etiqueta.toLowerCase().includes('promoción')) {
            claseEtiqueta = 'sale';
        } else if (etiqueta.toLowerCase().includes('último')) {
            claseEtiqueta = 'last';
        } else {
            claseEtiqueta = 'new';
        }
        
        return `<div class="featured-product-tag ${claseEtiqueta}">${etiqueta}</div>`;
    }
    
    /**
     * Genera el HTML para el badge de descuento en productos destacados
     */
    generateDiscountBadgeHTML(descuento) {
        if (!descuento || descuento <= 0) return '';
        return `<div class="featured-discount">-${descuento}%</div>`;
    }
    
    /**
     * Genera el HTML para el span de descuento en tarjetas de producto normales
     */
    generateDiscountSpanHTML(descuento) {
        if (!descuento || descuento <= 0) return '';
        return `<span class="descuento ${this.getDiscountClass(descuento)}">-${descuento}% </span>`;
    }
    
    /**
     * Obtiene la clase CSS para un porcentaje de descuento
     */
    getDiscountClass(descuento) {
        if (descuento >= 30) return 'high-discount';
        if (descuento >= 15) return 'medium-discount';
        return 'low-discount';
    }
    
    /**
     * Genera el HTML para las características de un producto en formato destacado
     */
    generateAttributesHTML(caracteristicas) {
        if (!caracteristicas || !Array.isArray(caracteristicas) || caracteristicas.length === 0) {
            return '';
        }
        
        return caracteristicas.slice(0, 3).map(car => 
            `<div class="featured-attribute">
                <i class="bi bi-check-circle-fill"></i>
                <span>${car}</span>
            </div>`
        ).join('');
    }
    
    /**
     * Carga el showcase de categorías para la página principal
     */
    async loadCategoriesShowcase(container) {
        try {
            // Verificar si el contenedor existe
            if (!container) {
                console.error("No se encontró el contenedor para showcase de categorías");
                return;
            }
            
            // Mostrar indicador de carga
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2">Cargando colecciones...</p>
                </div>
            `;
            
            // Configuración de categorías con sus imágenes y detalles
            const categorias = [
                {
                    id: 'salas',
                    nombre: 'Salas',
                    imagen: 'assets/img-rec/sala_recomendacion.webp',
                    descripcion: 'Diseños exclusivos que transformarán el centro de convivencia de tu hogar'
                },
                {
                    id: 'comedores',
                    nombre: 'Comedores',
                    imagen: 'assets/img-rec/comedores_recomendacion.webp',
                    descripcion: 'Espacios para compartir momentos especiales con diseños contemporáneos'
                },
                {
                    id: 'recamaras',
                    nombre: 'Recámaras',
                    imagen: 'assets/img-rec/recamara-recomendacion.jpg',
                    descripcion: 'Espacios de descanso con estilo que harán de tu habitación un santuario'
                },
                {
                    id: 'cabeceras',
                    nombre: 'Cabeceras',
                    imagen: 'assets/img-rec/cabaceras_recomendacion.jpg',
                    descripcion: 'El toque elegante para tu habitación que transformará tu espacio de descanso'
                },
                {
                    id: 'mesas-centro',
                    nombre: 'Mesas de Centro',
                    imagen: 'assets/img-rec/mesa-centro-recomendacion.webp',
                    descripcion: 'Complementos perfectos para tu sala que combinan funcionalidad y diseño'
                }
            ];
            
            // Crear estructura HTML para las categorías
            let categoriesHTML = '';
            
            // Generar cada tarjeta de categoría
            categorias.forEach((categoria, index) => {
                categoriesHTML += `
                <div class="category-card ${categoria.id}" data-aos="fade-up" data-aos-delay="${index * 100}">
                    <div class="category-img-wrap">
                        <img src="${categoria.imagen}" alt="${categoria.nombre}" class="category-img">
                        <div class="category-overlay">
                            <h3 class="category-floating-title">${categoria.nombre}</h3>
                        </div>
                    </div>
                    <div class="category-content">
                        <p class="category-description">${categoria.descripcion}</p>
                        <a href="${categoria.id}.html" class="category-btn">
                            <span>Explorar colección</span>
                            <span class="category-btn-icon">
                                <i class="bi bi-arrow-right"></i>
                            </span>
                        </a>
                    </div>
                </div>
                `;
            });
            
            // Insertar HTML en el contenedor
            container.innerHTML = categoriesHTML;
            
            // Inicializar AOS si está disponible
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
            
            return categorias;
        } catch (error) {
            console.error("Error al cargar showcase de categorías:", error);
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        Ocurrió un error al cargar las colecciones. Por favor, intenta más tarde.
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * Carga recomendaciones para una categoría específica
     */
    loadRecommendations(currentCategory) {
        console.log('Cargando recomendaciones para categoría:', currentCategory);
        
        // Buscar contenedor de recomendaciones
        const container = document.getElementById('related-categories-container');
        if (!container) {
            console.log('No se encontró el contenedor de recomendaciones');
            return;
        }
        
        // Información de todas las categorías para recomendaciones
        const infoCategoria = {
            'salas': {
                nombre: 'Salas',
                descripcion: 'Diseños elegantes para convertir tu sala en un espacio acogedor',
                imagen: 'assets/img-rec/sala_recomendacion.webp'
            },
            'comedores': {
                nombre: 'Comedores',
                descripcion: 'Espacios para compartir momentos especiales con diseños contemporáneos',
                imagen: 'assets/img-rec/comedores_recomendacion.webp'
            },
            'recamaras': {
                nombre: 'Recámaras',
                descripcion: 'Espacios de descanso con estilo que harán de tu habitación un santuario',
                imagen: 'assets/img-rec/recamara-recomendacion.jpg'
            },
            'cabeceras': {
                nombre: 'Cabeceras',
                descripcion: 'El toque elegante para tu habitación que transformará tu espacio de descanso',
                imagen: 'assets/img-rec/cabaceras_recomendacion.jpg'
            },
            'mesas-centro': {
                nombre: 'Mesas de Centro',
                descripcion: 'Complementos perfectos para tu sala que combinan funcionalidad y diseño',
                imagen: 'assets/img-rec/mesa-centro-recomendacion.webp'
            }
        };
        
        // Filtrar para no mostrar la categoría actual
        const categoriasAMostrar = Object.keys(infoCategoria)
            .filter(cat => cat !== currentCategory)
            .slice(0, 4);
        
        console.log('Categorías a mostrar:', categoriasAMostrar);
        
        // Si no hay recomendaciones, salir
        if (categoriasAMostrar.length === 0) {
            console.log('No hay categorías para recomendar');
            return;
        }
        
        // Generar HTML para recomendaciones
        const recomendacionesHTML = categoriasAMostrar.map((categoria, index) => {
            const info = infoCategoria[categoria];
            return `
                <div class="col-md-3 mb-4" data-aos="fade-up" data-aos-delay="${(index+1) * 100}">
                    <div class="related-category-card shadow-sm h-100">
                        <div class="related-image">
                            <img src="${info.imagen}" alt="${info.nombre}" class="img-fluid">
                            <div class="overlay">
                                <a href="${categoria}.html" class="stretched-link"></a>
                            </div>
                        </div>
                        <div class="related-content p-3">
                            <h4 class="h5 mb-2">${info.nombre}</h4>
                            <p class="mb-3 small text-muted">${info.descripcion}</p>
                            <a href="${categoria}.html" class="btn btn-elegant">Ver colección</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Insertar HTML
        container.innerHTML = recomendacionesHTML;
        
        // Reiniciar AOS si está disponible
        if (typeof AOS !== 'undefined') {
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        }
    }
}