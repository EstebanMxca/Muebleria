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

        // NUEVO: Transformar a Map
        this.cache.products = new Map();
    }

    // Añadir después del constructor en ProductService
preloadFeaturedProducts() {
    console.log('Intentando precargar productos destacados...');
    if (this.cache.featuredProducts) {
        console.log('Ya hay productos destacados en caché');
        return Promise.resolve(this.cache.featuredProducts);
    }
    
    return fetch(`${this.config.apiUrl}/productos-destacados`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Productos destacados precargados exitosamente');
            this.cache.featuredProducts = data;
            return data;
        })
        .catch(error => {
            console.error('Error precargando productos destacados:', error);
            return null;
        });
}

    async getProductDetails(productId) {
        // Primero, verificar si el producto ya está en caché
        if (this.cache.products.has(productId)) {
            console.log('Producto obtenido desde caché');
            return this.cache.products.get(productId);
        }

        try {
            // Si no está en caché, hacer la solicitud a la API
            const response = await fetch(`${this.config.apiUrl}/productos/detalle/${productId}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const producto = await response.json();
            
            // Almacenar en caché
            this.cache.products.set(productId, producto);

            return producto;
        } catch (error) {
            console.error('Error al cargar detalles del producto:', error);
            throw error;
        }
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
            // Precargar productos destacados en la página principal
            this.preloadFeaturedProducts();
            
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

        console.log("loadFeaturedProducts llamado", { 
            hasLoader: !!window.loader, 
            hasLoaderFunction: window.loader && typeof window.loader.loadFeaturedProducts === 'function' 
        });
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
    /**
 * Renderiza los productos destacados en un contenedor
 */
/**
 * Renderiza los productos destacados en un contenedor
 */
/**
 * Renderiza los productos destacados en un contenedor con un diseño de vanguardia
 */
renderFeaturedProducts(container, products) {
    console.log("renderFeaturedProducts con optimización máxima");
    
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
    
    // Limitar a solo 3 productos para rendimiento máximo
    const productosLimitados = products.slice(0, 3);
    
    // Configurar contenedor
    const sectionParent = container.parentElement.parentElement;
    if (sectionParent) {
        sectionParent.classList.add('featured-section');
    }
    
    // Crear encabezado sin animaciones
    const existingHeader = sectionParent?.querySelector('.featured-header');
    
    // Limpiar contenedor
    container.innerHTML = '';
    
    // Crear encabezado si no existe
    if (!existingHeader && sectionParent) {
        const headerHTML = `
            <div class="featured-header">
                <h2 class="featured-title">Diseños <span class="featured-title-accent">Selectos</span></h2>
                <p class="featured-subtitle">Piezas excepcionales meticulosamente seleccionadas por nuestros expertos en diseño</p>
            </div>
        `;
        container.insertAdjacentHTML('beforebegin', headerHTML);
    }
    
    // Crear contenedor simplificado
    container.className = 'featured-showcase featured-optimized';
    
    // Crear HTML simplificado de todos los productos (reduciendo DOM nodes)
    let allProductsHTML = '';
    
    productosLimitados.forEach((producto, index) => {
        const descripcion = producto.descripcion 
            ? (producto.descripcion.length > 80 ? producto.descripcion.substring(0, 80) + '...' : producto.descripcion) 
            : 'Descripción no disponible.';
            
        const categoriaURL = this.getCategoryUrl(producto.categoria);
        const imagenProducto = producto.imagen_principal || this.config.imagePlaceholder;
        
        // HTML ultra simplificado
        allProductsHTML += `
        <div class="featured-card-simple">
            <div class="featured-img">
                <img src="${imagenProducto}" alt="${producto.nombre}" loading="lazy" width="300" height="200">
                ${producto.descuento > 0 ? `<span class="featured-tag">-${producto.descuento}%</span>` : ''}
            </div>
            <div class="featured-info">
                <h3>${producto.nombre}</h3>
                <p>${descripcion}</p>
                <div class="featured-btns">
                    <button type="button" class="ver-detalles" data-producto-id="${producto.id}">Ver detalles</button>
                    <a href="${categoriaURL}">Ver colección</a>
                </div>
            </div>
        </div>`;
    });
    
    // Insertar todo el HTML de una sola vez (mejor rendimiento)
    container.innerHTML = allProductsHTML;
    
    // Configurar eventos de manera optimizada
    const detallesBtns = container.querySelectorAll('.ver-detalles');
    detallesBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productoId = e.currentTarget.getAttribute('data-producto-id');
            if (productoId) {
                window.location.href = `product-detail.html?id=${productoId}`;
            }
        });
    });
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
            //this.generateProductModal(producto);
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
    
  


setupProductEvents(container) {

    
    if (!container) return;

    const verDetallesButtons = container.querySelectorAll('.ver-detalles');
    
    verDetallesButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productoId = e.currentTarget.getAttribute('data-producto-id');
            
            if (productoId) {
                // Opcional: Pre-cargar datos del producto en caché
                this.getProductDetails(productoId)
                    .catch(error => {
                        console.error('Error pre-cargando producto:', error);
                    });
                
                // Redirigir a la página de detalles
                window.location.href = `product-detail.html?id=${productoId}`;
            }
        });
    });
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