/**
 * Mueblería Cabañas - Servicio de Productos
 * Este módulo centraliza la gestión de datos de productos y su presentación
 * Reemplaza al antiguo products.js con una implementación más modular
 */

class ProductService {
    constructor() {
        // Configuración del servicio
        this.config = {
            apiUrl: '/api',
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
        console.log(`Configurando página para la categoría: ${categoryId}`);
        
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
        
        // Configurar el observer para recomendaciones
        this.setupRecommendationsObserver();
    } else {
        console.warn('No se pudo detectar la categoría actual');
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
 * Renderiza los productos destacados en un contenedor de manera optimizada
 */
renderFeaturedProducts(container, products) {
    console.log("Renderizando productos destacados con versión optimizada");
    
    // Verificar si hay productos
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    No se encontraron productos destacados. Por favor, revisa más tarde.
                </div>
            </div>
        `;
        return;
    }
    
    // Modificar la clase del contenedor
    const parentSection = container.closest('section');
    if (parentSection) {
        parentSection.classList.add('optimized-featured-section');
    }
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear el contenedor de la cuadrícula
    const gridContainer = document.createElement('div');
    gridContainer.className = 'optimized-featured-grid';
    
    // Generar HTML para cada producto de forma eficiente
    const productsHTML = products.map(product => {
        // Obtener la URL de la imagen de manera segura
        const imageUrl = this.getProductImage(product);
        
        // Obtener la URL de la categoría
        const categoryUrl = this.getCategoryUrl(product.categoria);
        
        // Preparar descripción recortada
        const shortDescription = product.descripcion ? 
            (product.descripcion.length > 100 ? 
                product.descripcion.substring(0, 100) + '...' : 
                product.descripcion) : 
            'Sin descripción disponible';
            
        // Generar etiqueta de descuento si aplica
        const discountTag = product.descuento > 0 ? 
        `<div class="discount-splash">
            <span class="discount-value">-${product.descuento}%</span>
        </div>` : '';
        
        // Retornar HTML de la tarjeta con imagen clickeable
        return `
            <div class="product-card-simple">
                <div class="product-img">
                    <a href="product-detail.html?id=${product.id}" style="display: block; height: 100%;">
                        <img src="${imageUrl}" alt="${product.nombre}" loading="lazy">
                    </a>
                    ${discountTag}
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.nombre}</h3>
                    <p class="product-description">${shortDescription}</p>
                    <div class="product-actions">
                        <button type="button" class="btn-view" data-product-id="${product.id}">
                            Ver detalles
                        </button>
                        <a href="${categoryUrl}" class="btn-category">
                            Ver colección
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Insertar el HTML en el contenedor (una sola operación DOM)
    gridContainer.innerHTML = productsHTML;
    container.appendChild(gridContainer);
    
    // Configurar eventos de manera eficiente usando delegación
    container.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.btn-view');
        if (viewButton) {
            const productId = viewButton.getAttribute('data-product-id');
            if (productId) {
                // Redirigir a la página de detalle
                window.location.href = `product-detail.html?id=${productId}`;
            }
        }
    });
    
    console.log('Productos destacados renderizados correctamente');
}

/**
 * Obtiene la imagen de un producto de manera segura
 */
getProductImage(product) {
    // Verificar si hay imágenes en el array
    if (product.imagenes && Array.isArray(product.imagenes) && product.imagenes.length > 0) {
        return product.imagenes[0];
    }
    
    // Verificar si hay imagen principal
    if (product.imagen_principal) {
        return product.imagen_principal;
    }
    
    // Imagen por defecto
    return 'assets/placeholder.jpg';
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
            <a href="product-detail.html?id=${producto.id}" style="display: block;">
                <img src="${producto.imagen_principal || this.config.imagePlaceholder}" class="card-img-top img-fluid" alt="${producto.nombre}">
            </a>
            ${producto.descuento > 0 ? this.generateNewDiscountBadgeHTML(producto.descuento) : ''}
            <div class="card-body">
                <h5 class="card-title">${producto.nombre}</h5>
                <p class="card-text">${producto.descripcion || ''}</p>
                <div class="mt-3">
                    <button type="button" class="btn btn-primary w-100 ver-detalles" 
                            data-producto-id="${producto.id}">Ver detalles</button>
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
 * Genera el HTML para el badge de descuento - versión impactante
 */
generateNewDiscountBadgeHTML(descuento) {
    if (!descuento || descuento <= 0) return '';
    
    return `
        <div class="discount-splash">
            <span class="discount-value">-${descuento}%</span>
        </div>
    `;
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
        console.warn('No se encontró el contenedor de recomendaciones');
        return;
    }
    
    // Información de todas las categorías para recomendaciones
    const infoCategoria = {
        'salas': {
            nombre: 'Salas',
            descripcion: 'Diseños elegantes para convertir tu sala en un espacio acogedor',
            imagen: 'assets/img-categorias/sala-ct.webp'
        },
        'comedores': {
            nombre: 'Comedores',
            descripcion: 'Espacios para compartir momentos especiales con diseños contemporáneos',
            imagen: 'assets/img-categorias/comedor-ct.webp'
        },
        'recamaras': {
            nombre: 'Recámaras',
            descripcion: 'Espacios de descanso con estilo que harán de tu habitación un santuario',
            imagen: 'assets/img-categorias/recamara-ct.webp'
        },
        'cabeceras': {
            nombre: 'Cabeceras',
            descripcion: 'El toque elegante para tu habitación que transformará tu espacio de descanso',
            imagen: 'assets/img-categorias/cabecera-ct.webp'
        },
        'mesas-centro': {
            nombre: 'Mesas de Centro',
            descripcion: 'Complementos perfectos para tu sala que combinan funcionalidad y diseño',
            imagen: 'assets/img-categorias/mesa-centro-ct.webp'
        }
    };
    
    // Normalizar el ID de categoría antes de filtrar
    const normalizedCurrentCategory = this.normalizeCategoryId(currentCategory);
    console.log('Categoría normalizada:', normalizedCurrentCategory);
    
    // Filtrar para no mostrar la categoría actual
    const categoriasAMostrar = Object.keys(infoCategoria)
        .filter(cat => cat !== normalizedCurrentCategory)
        .slice(0, 4);
    
    console.log('Categorías a mostrar:', categoriasAMostrar);
    
    // Si no hay recomendaciones, salir
    if (categoriasAMostrar.length === 0) {
        console.warn('No hay categorías para recomendar');
        container.innerHTML = '<div class="row"><div class="col-12 text-center py-4"><p>No hay recomendaciones disponibles</p></div></div>';
        return;
    }
    
    // Mostrar indicador de carga
    container.innerHTML = `
        <div class="row">
            <div class="col-12 text-center py-4">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Cargando recomendaciones...</span>
                </div>
                <p class="mt-2 small text-muted">Preparando recomendaciones...</p>
            </div>
        </div>
    `;
    
    // Usar setTimeout para permitir que la interfaz se actualice primero
    setTimeout(() => {
        // Generar HTML para recomendaciones
        const recomendacionesHTML = categoriasAMostrar.map((categoria, index) => {
            const info = infoCategoria[categoria];
            return `
                <div class="col-md-3 mb-4">
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
        
        // Insertar HTML dentro de una fila
        container.innerHTML = `<div class="row">${recomendacionesHTML}</div>`;
        
        // Reiniciar AOS si está disponible
        if (typeof AOS !== 'undefined') {
            setTimeout(() => {
                AOS.refresh();
            }, 100);
        }
    }, 300); // Pequeño retraso para asegurar la actualización
}

/**
 * Función auxiliar para normalizar IDs de categoría
 * Asegura consistencia entre diferentes formatos
 */
normalizeCategoryId(categoryId) {
    // Lista de equivalencias conocidas
    const equivalencias = {
        'sala': 'salas',
        'comedor': 'comedores',
        'recamara': 'recamaras',
        'cabecera': 'cabeceras',
        'mesa-centro': 'mesas-centro',
        'mesas-de-centro': 'mesas-centro'
    };
    
    // Normalizar ID
    let normalized = categoryId ? categoryId.toLowerCase() : '';
    
    // Verificar equivalencias
    if (equivalencias[normalized]) {
        normalized = equivalencias[normalized];
    }
    
    return normalized;
}

/**
 * Función auxiliar para agregar un observer de intersección
 * que cargue las recomendaciones solo cuando están a punto de ser visibles
 */
setupRecommendationsObserver() {
    // Buscar el contenedor
    const container = document.getElementById('related-categories-container');
    if (!container) return;
    
    // Crear un observer para cargar solo cuando esté visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Cargar recomendaciones cuando esté visible
                const categoryId = this.detectCurrentCategory();
                if (categoryId) {
                    this.loadRecommendations(categoryId);
                }
                // Dejar de observar
                observer.unobserve(container);
            }
        });
    }, {
        rootMargin: '200px', // Cargar cuando esté a 200px de ser visible
        threshold: 0.1
    });
    
    // Empezar a observar
    observer.observe(container);
}

/**
 * Carga productos relacionados basados en la categoría del producto actual
 * @param {Object} currentProduct - Producto actual
 * @param {number} limit - Número máximo de productos a mostrar
 * @returns {Promise<Array>} - Promesa que resuelve a un array de productos relacionados
 */
async loadRelatedProducts(currentProduct, limit = 4) {
    if (!currentProduct || !currentProduct.categoria) {
        console.error('Se requiere un producto con categoría para cargar productos relacionados');
        return [];
    }
    
    try {
        // Primero intentamos obtener la categoría del producto para mapearla a su ID
        const categorias = await this.loadCategories();
        let categoriaId = null;
        
        // Buscar ID de categoría basado en el nombre
        for (const categoria of categorias) {
            if (categoria.nombre === currentProduct.categoria) {
                categoriaId = categoria.id;
                break;
            }
        }
        
        if (!categoriaId) {
            console.warn('No se pudo determinar el ID de la categoría:', currentProduct.categoria);
            return [];
        }
        
        // Solicitamos un número mayor de productos para tener suficientes para seleccionar al azar
        // El límite en la API lo multiplicamos por 2 para tener más opciones
        const apiLimit = limit * 2;
        const url = `${this.config.apiUrl}/productos/${categoriaId}?limit=${apiLimit}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filtrar para no incluir el producto actual
        let candidateProducts = data.productos.filter(producto => 
            producto.id !== currentProduct.id
        );
        
        // Si no hay suficientes productos, devolvemos todos los disponibles
        if (candidateProducts.length <= limit) {
            return candidateProducts;
        }
        
        // Seleccionar productos al azar usando el algoritmo Fisher-Yates (también conocido como Knuth shuffle)
        // Este algoritmo mezcla el array de manera eficiente y sin sesgo
        const shuffleArray = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]]; // Intercambio de elementos
            }
            return array;
        };
        
        // Mezclar el array y tomar los primeros 'limit' elementos
        const randomProducts = shuffleArray(candidateProducts).slice(0, limit);
        
        return randomProducts;
    } catch (error) {
        console.error('Error al cargar productos relacionados:', error);
        return [];
    }
}
}