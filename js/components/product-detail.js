/**
 * Mueblería Cabañas - Gestor de página de detalle de producto mejorado
 * Este módulo maneja la visualización detallada de productos individuales
 * con efectos visuales modernos y experiencia de usuario mejorada
 */

class ProductDetail {
    constructor() {
        // Referencias a elementos del DOM
        this.elements = {
            container: document.getElementById('product-detail-container'),
            mainImage: null,
            thumbnails: null,
            prevBtn: null,
            nextBtn: null
        };
        
        // Configuración
        this.config = {
            apiUrl: 'http://localhost:3000/api',
            defaultImage: 'assets/placeholder.jpg',
            maxImages: 4,
            animationDuration: 500,
            isZoomActive: false
        };
        
        // Estado de la visualización
        this.state = {
            product: null,
            currentImageIndex: 0,
            totalImages: 0,
            isLoading: true,
            isAnimating: false
        };
        
        // Bindear métodos al contexto actual
        this.changeMainImage = this.changeMainImage.bind(this);
        this.handleKeyNavigation = this.handleKeyNavigation.bind(this);
        this.toggleImageZoom = this.toggleImageZoom.bind(this);
        this.handleZoomMove = this.handleZoomMove.bind(this);
        this.applyButtonHoverEffect = this.applyButtonHoverEffect.bind(this);
        this.removeButtonHoverEffect = this.removeButtonHoverEffect.bind(this);
    }
    
    /**
     * Inicializa la página de detalle del producto con mejoras visuales
     */
    init() {
        console.log('Inicializando página de detalle de producto con mejoras visuales...');
        
        // Inyectar variables CSS personalizadas si no existen
        this.injectCustomStyles();
        
        // Obtener ID del producto de la URL
        const productId = this.getProductIdFromUrl();
        
        if (!productId) {
            this.showError('No se pudo determinar el producto a mostrar');
            return;
        }
        
        console.log(`Cargando detalles para producto ID: ${productId}`);
        
        // Cargar datos del producto con efecto visual mejorado
        this.showLoading(true);
        this.loadProductDetails(productId);
        
        // Agregar listener global de eventos de teclado
        document.addEventListener('keydown', this.handleKeyNavigation);
    }
    
    /**
     * Inyecta variables CSS personalizadas para el diseño mejorado
     */
    injectCustomStyles() {
        // Verificar si ya existe el elemento de estilo personalizado
        if (!document.getElementById('muebleria-custom-styles')) {
            const customStyles = document.createElement('style');
            customStyles.id = 'muebleria-custom-styles';
            
            // Definir las variables CSS para todo el sitio
            customStyles.innerHTML = `
                :root {
                    --primary: #8A6D4B;
                    --primary-dark: #6A543A;
                    --primary-light: #D4C0A7;
                    --secondary: #2C3642;
                    --secondary-light: #4D5967;
                    --accent: #C7A17A;
                    --light: #F9F7F4;
                    --light-gray: #E9E5E0;
                    --dark: #282420;
                    --text: #3E3630;
                    --text-light: #6B635D;
                    --white: #FFFFFF;
                    --success: #4A7A6D;
                    --danger: #A65B5B;
                    --transition-smooth: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes fadeInUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0);
                    }
                }
                
                @keyframes scaleIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .fade-in {
                    animation: fadeIn 0.6s ease-in-out forwards;
                }
                
                .fade-in-up {
                    animation: fadeInUp 0.6s ease-in-out forwards;
                }
                
                .scale-in {
                    animation: scaleIn 0.6s ease-in-out forwards;
                }
            `;
            
            document.head.appendChild(customStyles);
        }
    }
    
    /**
     * Obtiene el ID del producto desde los parámetros de la URL
     */
    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        console.log('ID extraído de la URL:', id, typeof id);
        
        // Adicionar validación
        if (!id) {
            console.error('No se encontró ID en la URL');
            this.showError('No se ha especificado un ID de producto válido');
            return null;
        }
        
        return id;
    }
    
    /**
     * Maneja navegación con teclado para una experiencia más accesible
     */
    handleKeyNavigation(e) {
        if (this.state.isLoading || !this.state.product) return;
        
        // Solo procesar si no estamos en un campo de texto
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Si el zoom está activo, la tecla Escape lo desactiva
        if (e.key === 'Escape' && this.config.isZoomActive) {
            this.toggleImageZoom();
            return;
        }
        
        // Si el zoom está activo, no permitir cambiar imágenes
        if (this.config.isZoomActive) return;
        
        if (e.key === 'ArrowLeft') {
            let newIndex = this.state.currentImageIndex - 1;
            if (newIndex < 0) newIndex = this.state.totalImages - 1;
            this.changeMainImage(newIndex);
            
            // Agregar sensación de feedback
            const prevBtn = document.querySelector('.image-nav-prev');
            if (prevBtn) {
                prevBtn.classList.add('active-nav');
                setTimeout(() => prevBtn.classList.remove('active-nav'), 200);
            }
        } else if (e.key === 'ArrowRight') {
            let newIndex = this.state.currentImageIndex + 1;
            if (newIndex >= this.state.totalImages) newIndex = 0;
            this.changeMainImage(newIndex);
            
            // Agregar sensación de feedback
            const nextBtn = document.querySelector('.image-nav-next');
            if (nextBtn) {
                nextBtn.classList.add('active-nav');
                setTimeout(() => nextBtn.classList.remove('active-nav'), 200);
            }
        }
    }
    
    /**
     * Carga los detalles del producto desde la API con mejoras visuales
     */
    async loadProductDetails(productId) {
        try {
            this.state.isLoading = true;
            
            // Usar el servicio de productos para obtener detalles
            const productService = window.productService || new ProductService();
            
            console.log(`Cargando detalles para producto ID: ${productId}`);
            
            // Medir tiempo de carga
            const startTime = performance.now();
            
            // Obtener producto usando método con caché
            const producto = await productService.getProductDetails(productId);
            
            const endTime = performance.now();
            console.log(`Tiempo de carga del producto: ${(endTime - startTime).toFixed(2)} ms`);
            
            if (!producto || !producto.id) {
                throw new Error('Producto no encontrado');
            }
            
            this.state.product = producto;
            
            // Animar la aparición del contenido gradualmente
            this.renderProductDetails();
            setTimeout(() => this.fadeInContent(), 100);
            
        } catch (error) {
            console.error('Error al cargar datos del producto:', error);
            this.showError(`No se pudo cargar el producto: ${error.message}`);
        } finally {
            this.state.isLoading = false;
        }
    }
    
    /**
     * Efecto de aparición gradual para el contenido
     */
    fadeInContent() {
        const sections = document.querySelectorAll('.product-detail-left, .product-detail-right');
        sections.forEach((section, index) => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            // Retrasar la animación para crear efecto escalonado
            setTimeout(() => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            }, 100 + (index * 150));
        });
    }
    
    /**
     * Muestra un indicador de carga con efecto visual mejorado
     */
    showLoading(animated = false) {
        const container = document.getElementById('product-detail-container');
        if (container) {
            const animationClass = animated ? 'fade-in' : '';
            container.innerHTML = `
                <div class="text-center py-5 ${animationClass}">
                    <div class="spinner">
                        <div class="spinner-border spinner-border-lg text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <svg class="spinner-track" viewBox="0 0 50 50">
                            <circle cx="25" cy="25" r="20" fill="none" stroke-width="4" stroke-linecap="round" stroke="rgba(138, 109, 75, 0.1)"></circle>
                        </svg>
                    </div>
                    <p class="mt-3 loading-text">Preparando detalles del producto...</p>
                </div>
            `;
            
            // Agregar estilos inline para el spinner personalizado
            const style = document.createElement('style');
            style.innerHTML = `
                .spinner {
                    position: relative;
                    width: 50px;
                    height: 50px;
                    margin: 0 auto;
                }
                .spinner-border {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-color: var(--primary);
                    border-right-color: transparent;
                }
                .spinner-track {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
                .loading-text {
                    color: var(--text);
                    font-weight: 500;
                    opacity: 0.8;
                }
                .fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        } else {
            console.error('Contenedor de producto no encontrado para mostrar carga');
        }
    }
    
    /**
     * Muestra un mensaje de error con diseño mejorado
     */
    showError(message) {
        if (this.elements.container) {
            this.elements.container.innerHTML = `
                <div class="alert-custom">
                    <div class="alert-icon">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div class="alert-content">
                        <h4 class="alert-title">Algo salió mal</h4>
                        <p class="alert-message">${message}</p>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <a href="javascript:history.back()" class="product-action-btn btn-primary-action">
                        <i class="bi bi-arrow-left me-2"></i>Volver atrás
                    </a>
                </div>
            `;
            
            // Agregar estilos inline para el mensaje de error personalizado
            const style = document.createElement('style');
            style.innerHTML = `
                .alert-custom {
                    display: flex;
                    align-items: center;
                    background-color: #FFF6F6;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 10px 30px rgba(166, 91, 91, 0.1);
                    margin-bottom: 30px;
                    animation: scaleIn 0.5s ease-in-out;
                }
                .alert-icon {
                    flex-shrink: 0;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    background-color: rgba(166, 91, 91, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 20px;
                    color: var(--danger);
                    font-size: 1.5rem;
                }
                .alert-content {
                    flex-grow: 1;
                }
                .alert-title {
                    font-weight: 600;
                    color: var(--danger);
                    margin-bottom: 8px;
                    font-size: 1.2rem;
                }
                .alert-message {
                    color: var(--text);
                    margin-bottom: 0;
                    line-height: 1.5;
                }
                .product-action-btn {
                    display: inline-flex;
                    align-items: center;
                    padding: 15px 28px;
                    border-radius: 50px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                    font-size: 0.95rem;
                    text-decoration: none;
                }
                .btn-primary-action {
                    background-color: var(--primary);
                    color: white;
                    border: none;
                    box-shadow: 0 8px 20px rgba(138, 109, 75, 0.25);
                }
                .btn-primary-action:hover {
                    background-color: var(--primary-dark);
                    transform: translateY(-3px);
                    box-shadow: 0 12px 25px rgba(138, 109, 75, 0.35);
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    /**
     * Renderiza los detalles del producto en la página con diseño mejorado
     * Incluye elementos visuales modernos y efectos sutiles
     */
    renderProductDetails() {
        if (!this.state.product) {
            this.showError('No se pudo cargar la información del producto');
            return;
        }
        
        const product = this.state.product;
        console.log('Renderizando producto:', product);
        
        // Preparar imágenes del producto
        let productImages = [];
        
        // Si el producto tiene múltiples imágenes, usarlas
        if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
            productImages = product.imagenes.slice(0, this.config.maxImages);
        } 
        // Si solo tiene imagen principal, usarla como única
        else if (product.imagen_principal) {
            productImages = [product.imagen_principal];
        } 
        // Si no hay imágenes, usar placeholder
        else {
            productImages = [this.config.defaultImage];
        }
        
        // Actualizar estado con total de imágenes
        this.state.totalImages = productImages.length;
        
        // Preparar la URL de la categoría
        const categoryUrl = this.getCategoryUrl(product.categoria);
        
        // Preparar efecto de paralaje para la imagen
        const parallaxEffect = `
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const mainImage = document.querySelector('.product-main-image');
                    const mainImageImg = mainImage ? mainImage.querySelector('img') : null;
                    
                    if (mainImageImg && mainImage) {
                        mainImage.addEventListener('mousemove', (e) => {
                            // Solo aplicar si no está en modo zoom
                            if (!mainImage.classList.contains('zoomed')) {
                                const rect = mainImage.getBoundingClientRect();
                                const x = (e.clientX - rect.left) / rect.width - 0.5;
                                const y = (e.clientY - rect.top) / rect.height - 0.5;
                                
                                // Efecto sutil de paralaje para la imagen
                                mainImageImg.style.transform = \`translate(\${x * -15}px, \${y * -15}px) scale(1.05)\`;
                            }
                        });
                        
                        mainImage.addEventListener('mouseleave', () => {
                            // Solo resetear si no está en modo zoom
                            if (!mainImage.classList.contains('zoomed')) {
                                mainImageImg.style.transform = '';
                            }
                        });
                    }
                });
            </script>
        `;
        
        // Construir HTML para características del producto
        let featuresHtml = '';
        if (Array.isArray(product.caracteristicas) && product.caracteristicas.length > 0) {
            featuresHtml = `
                <div class="product-features">
                    <h4 class="features-title">Características</h4>
                    <ul class="features-list">
                        ${product.caracteristicas.map(feature => `
                            <li class="feature-item">
                                <span class="feature-icon"><i class="bi bi-check"></i></span>
                                <span class="feature-text">${feature}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Construir HTML para etiquetas del producto
        let tagsHtml = '';
        if (Array.isArray(product.etiquetas) && product.etiquetas.length > 0) {
            tagsHtml = product.etiquetas.map(tag => `
                <span class="status-badge badge-tag">
                    <i class="bi bi-bookmark me-1"></i>${tag}
                </span>
            `).join('');
        }
        
        // Construir HTML para descuento si aplica
        let discountHtml = '';
        if (product.descuento && product.descuento > 0) {
            discountHtml = `
                <div class="product-discount-section">
                    <div class="discount-splash discount-splash-large">
                        <span class="discount-value">-${product.descuento}%</span>
                    </div>
                </div>
            `;
        }
        
        // Construir HTML para la galería de imágenes con mejoras visuales
        const galleryHtml = `
            <div class="product-image-gallery">
                <div class="product-main-image">
                    <img src="${productImages[0]}" alt="${product.nombre}">
                    ${productImages.length > 1 ? `
                        <div class="image-nav-btn image-nav-prev"><i class="bi bi-chevron-left"></i></div>
                        <div class="image-nav-btn image-nav-next"><i class="bi bi-chevron-right"></i></div>
                    ` : ''}
                    <div class="zoom-indicator"><i class="bi bi-zoom-in"></i></div>
                </div>
                ${productImages.length > 1 ? `
                    <div class="product-thumbnails">
                        ${productImages.map((img, index) => `
                            <div class="product-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                                <img src="${img}" alt="${product.nombre} - Vista ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Construir el HTML completo con mejoras visuales
        const productDetailHtml = `
            <div class="product-breadcrumb">
                <a href="index.html"><i class="bi bi-house-door me-1"></i>Inicio</a>
                <span class="separator"><i class="bi bi-chevron-right"></i></span>
                <a href="${categoryUrl}">${product.categoria}</a>
                <span class="separator"><i class="bi bi-chevron-right"></i></span>
                <span>${product.nombre}</span>
            </div>
            
            <div class="product-detail-container">
                <div class="product-detail-grid">
                    <div class="product-detail-left">
                        ${galleryHtml}
                    </div>
                    
                    <div class="product-detail-right">
                        <div class="product-info">
                            <span class="product-category">${product.categoria}</span>
                            <h1 class="product-title">${product.nombre}</h1>
                            
                            <div class="product-status">
                                <span class="status-badge badge-availability ${product.disponible ? 'available' : 'unavailable'}">
                                    <i class="bi bi-${product.disponible ? 'check-circle' : 'x-circle'} me-1"></i>
                                    ${product.disponible ? 'Disponible' : 'No disponible'}
                                </span>
                                <span class="status-badge badge-style">
                                    <i class="bi bi-star me-1"></i>
                                    Estilo moderno
                                </span>
                                ${tagsHtml}
                            </div>
                            
                            ${discountHtml}
                            
                            <p class="product-description">${product.descripcion || 'Sin descripción disponible.'}</p>
                            
                            ${featuresHtml}
                            
                            <div class="product-actions">
                                <a href="https://wa.me/1234567890?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.nombre)}" 
                                   class="product-action-btn btn-whatsapp-action" target="_blank">
                                    <i class="bi bi-whatsapp"></i>Consultar por WhatsApp
                                </a>
                                <a href="${categoryUrl}" class="product-action-btn btn-primary-action">
                                    <i class="bi bi-arrow-left"></i>Volver a ${product.categoria}
                                </a>
                                <button type="button" id="cotizarProductoBtn" class="product-action-btn btn-secondary-action">
                                    <i class="bi bi-clipboard-check"></i>Solicitar cotización
                                </button>
                            </div>
                            
                            <div class="product-accordion accordion" id="productAccordion">
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                                data-bs-target="#collapseSpecs" aria-expanded="false" aria-controls="collapseSpecs">
                                            Especificaciones adicionales
                                        </button>
                                    </h2>
                                    <div id="collapseSpecs" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                                        <div class="accordion-body">
                                            <p>Este elegante mueble está fabricado con los más altos estándares de calidad:</p>
                                            <ul>
                                                <li>Materiales seleccionados con cuidado para garantizar durabilidad.</li>
                                                <li>Cada pieza es revisada individualmente por nuestros expertos antes de salir de fábrica.</li>
                                                <li>Diseñado pensando en la ergonomía y funcionalidad para el usuario.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                                data-bs-target="#collapseDelivery" aria-expanded="false" aria-controls="collapseDelivery">
                                            Envío y entrega
                                        </button>
                                    </h2>
                                    <div id="collapseDelivery" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                                        <div class="accordion-body">
                                            <p>Información importante sobre el envío y entrega de tu mueble:</p>
                                            <ul>
                                                <li>Envío disponible a toda la república mexicana.</li>
                                                <li>Tiempo estimado de entrega: 5-7 días hábiles.</li>
                                                <li>Nuestro equipo te contactará para coordinar el día y hora de entrega.</li>
                                                <li>El servicio incluye instalación básica y retiro de empaques.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="accordion-item">
                                    <h2 class="accordion-header">
                                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                                data-bs-target="#collapseWarranty" aria-expanded="false" aria-controls="collapseWarranty">
                                            Garantía
                                        </button>
                                    </h2>
                                    <div id="collapseWarranty" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                                        <div class="accordion-body">
                                            <p>Todos nuestros productos cuentan con garantía:</p>
                                            <ul>
                                                <li>12 meses contra defectos de fabricación.</li>
                                                <li>La garantía cubre reemplazo de piezas y reparación.</li>
                                                <li>No cubre daños por mal uso o modificaciones no autorizadas.</li>
                                            </ul>
                                            <p>Para hacer válida tu garantía, conserva tu factura y contacta con nuestro departamento de atención al cliente.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar contenido del contenedor
        if (this.elements.container) {
            this.elements.container.innerHTML = productDetailHtml + parallaxEffect;
            
            // Agregar las clases para estilos mejorados
            this.injectProductDetailStyles();
            
            // Actualizar referencias a elementos del DOM
            this.elements.mainImage = document.querySelector('.product-main-image img');
            this.elements.thumbnails = document.querySelectorAll('.product-thumbnail');
            this.elements.prevBtn = document.querySelector('.image-nav-prev');
            this.elements.nextBtn = document.querySelector('.image-nav-next');
            
            // Configurar eventos para la galería de imágenes
            this.setupImageGallery(productImages);
            
            // Configurar evento para el botón de cotización
            const cotizarBtn = document.getElementById('cotizarProductoBtn');
            if (cotizarBtn) {
                cotizarBtn.addEventListener('click', () => {
                    this.openCotizacionModal();
                });
            }
            
            // Inicializar AOS para animaciones si está disponible
            if (typeof AOS !== 'undefined') {
                setTimeout(() => {
                    AOS.refresh();
                }, 100);
            }
        } else {
            console.error('No se encontró el contenedor para el detalle del producto');
        }
    }
    
    /**
     * Inyecta estilos CSS específicos para el detalle de producto
     */
    injectProductDetailStyles() {
        const styleId = 'product-detail-enhanced-styles';
        
        // Verificar si ya existe el elemento de estilo
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            
            style.innerHTML = `
                /* Breadcrumb mejorado */
                .product-breadcrumb {
                    margin-bottom: 25px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-light);
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    background-color: var(--light);
                    padding: 8px 16px;
                    border-radius: 30px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
                }
                
                .product-breadcrumb a {
                    color: var(--text);
                    text-decoration: none;
                    transition: var(--transition-smooth);
                    position: relative;
                }
                
                .product-breadcrumb a:hover {
                    color: var(--primary);
                }
                
                .product-breadcrumb a:after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 0;
                    height: 1px;
                    background-color: var(--primary);
                    transition: var(--transition-smooth);
                }
                
                .product-breadcrumb a:hover:after {
                    width: 100%;
                }
                
                .product-breadcrumb .separator {
                    margin: 0 10px;
                    color: var(--text-light);
                    opacity: 0.5;
                }
                
                /* Estilos para el efecto de zoom */
                .product-main-image {
                  overflow: hidden;
                  cursor: zoom-in;
                  position: relative;
                }

                .product-main-image img {
                  width: 100%;
                  height: 100%;
                  object-fit: contain;
                  transition: transform 0.5s ease-out;
                  transform-origin: center center;
                }

                .product-main-image.zoomed {
                  cursor: zoom-out;
                }

                .product-main-image.zoomed::after {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  z-index: 2;
                  background-color: rgba(0, 0, 0, 0.1);
                  pointer-events: none;
                }

                .product-main-image.zoomed img {
                  will-change: transform; /* Optimización para rendimiento */
                }

                /* Ocultar controles de navegación durante el zoom */
                .product-main-image.zoomed .image-nav-btn {
                  opacity: 0;
                  pointer-events: none;
                }

                /* Indicador de zoom personalizado */
                .zoom-indicator {
                  position: absolute;
                  bottom: 20px;
                  right: 20px;
                  background-color: rgba(255, 255, 255, 0.8);
                  color: var(--primary);
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.2rem;
                  opacity: 0;
                  transition: opacity 0.3s ease, background-color 0.3s ease;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                  z-index: 5;
                }

                .product-main-image:hover .zoom-indicator {
                  opacity: 0.8;
                }

                .product-main-image.zoomed .zoom-indicator {
                  opacity: 0.8;
                  background-color: var(--primary);
                  color: white;
                }
            `;
            
            document.head.appendChild(style);
        }
    }
    
    /**
     * Configura los eventos para la galería de imágenes con interacciones mejoradas
     */
    setupImageGallery(images) {
        // Configurar eventos para las miniaturas y navegación solo si hay más de una imagen
        if (images.length > 1) {
            // Configurar eventos para las miniaturas con efecto hover
            this.elements.thumbnails.forEach(thumbnail => {
                // Evento clic
                thumbnail.addEventListener('click', () => {
                    const index = parseInt(thumbnail.getAttribute('data-index'));
                    this.changeMainImage(index);
                });
                
                // Efectos hover
                thumbnail.addEventListener('mouseenter', () => {
                    if (!thumbnail.classList.contains('active')) {
                        thumbnail.style.transform = 'translateY(-4px) scale(1.05)';
                    }
                });
                
                thumbnail.addEventListener('mouseleave', () => {
                    if (!thumbnail.classList.contains('active')) {
                        thumbnail.style.transform = '';
                    }
                });
            });
            
            // Configurar botones de navegación con tooltips
            if (this.elements.prevBtn) {
                this.elements.prevBtn.setAttribute('title', 'Imagen anterior');
                this.elements.prevBtn.addEventListener('click', () => {
                    let newIndex = this.state.currentImageIndex - 1;
                    if (newIndex < 0) newIndex = images.length - 1;
                    this.changeMainImage(newIndex);
                });
                
                // Efecto hover para botones
                this.elements.prevBtn.addEventListener('mouseenter', this.applyButtonHoverEffect);
                this.elements.prevBtn.addEventListener('mouseleave', this.removeButtonHoverEffect);
            }
            
            if (this.elements.nextBtn) {
                this.elements.nextBtn.setAttribute('title', 'Imagen siguiente');
                this.elements.nextBtn.addEventListener('click', () => {
                    let newIndex = this.state.currentImageIndex + 1;
                    if (newIndex >= images.length) newIndex = 0;
                    this.changeMainImage(newIndex);
                });
                
                // Efecto hover para botones
                this.elements.nextBtn.addEventListener('mouseenter', this.applyButtonHoverEffect);
                this.elements.nextBtn.addEventListener('mouseleave', this.removeButtonHoverEffect);
            }
        }
        
        // Configurar clic en imagen principal para activar zoom (para cualquier número de imágenes)
        const mainImage = document.querySelector('.product-main-image');
        if (mainImage) {
            mainImage.addEventListener('click', this.toggleImageZoom);
            
            // Obtener el zoom indicator que ya creamos en el HTML
            const zoomIndicator = mainImage.querySelector('.zoom-indicator');
            
            // Crear el zoom indicator si no existe
            if (!zoomIndicator) {
                const newZoomIndicator = document.createElement('div');
                newZoomIndicator.className = 'zoom-indicator';
                newZoomIndicator.innerHTML = '<i class="bi bi-zoom-in"></i>';
                mainImage.appendChild(newZoomIndicator);
            }
            
            // Mostrar indicador al pasar el mouse
            mainImage.addEventListener('mouseenter', () => {
                if (zoomIndicator) zoomIndicator.style.opacity = '0.8';
            });
            
            mainImage.addEventListener('mouseleave', () => {
                if (zoomIndicator && !this.config.isZoomActive) zoomIndicator.style.opacity = '0';
            });
        }
    }
    
    /**
     * Aplica efecto hover a los botones de navegación
     */
    applyButtonHoverEffect(e) {
        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
    }
    
    /**
     * Elimina efecto hover de los botones de navegación
     */
    removeButtonHoverEffect(e) {
        e.currentTarget.style.transform = 'translateY(-50%)';
    }
    
    /**
     * Activa/desactiva el zoom en la imagen principal
     */
    toggleImageZoom() {
        if (this.state.isAnimating) return;
        
        const mainImageContainer = document.querySelector('.product-main-image');
        const mainImage = mainImageContainer?.querySelector('img');
        
        if (!mainImageContainer || !mainImage) return;
        
        this.state.isAnimating = true;
        
        if (this.config.isZoomActive) {
            // Desactivar zoom
            mainImage.style.transform = '';
            mainImageContainer.classList.remove('zoomed');
            
            // Cambiar ícono del zoom
            const zoomIndicator = mainImageContainer.querySelector('.zoom-indicator i');
            if (zoomIndicator) {
                zoomIndicator.classList.remove('bi-zoom-out');
                zoomIndicator.classList.add('bi-zoom-in');
            }
            
            // Actualizar cursor
            mainImageContainer.style.cursor = 'zoom-in';
            
            // Eliminar listener de movimiento
            mainImageContainer.removeEventListener('mousemove', this.handleZoomMove);
            
            this.config.isZoomActive = false;
        } else {
            // Activar zoom
            mainImageContainer.classList.add('zoomed');
            
            // Aplicar zoom inicial centrado
            mainImage.style.transform = 'scale(2.5)';
            
            // Cambiar ícono del zoom
            const zoomIndicator = mainImageContainer.querySelector('.zoom-indicator i');
            if (zoomIndicator) {
                zoomIndicator.classList.remove('bi-zoom-in');
                zoomIndicator.classList.add('bi-zoom-out');
            }
            
            // Actualizar cursor
            mainImageContainer.style.cursor = 'zoom-out';
            
            // Agregar listener para mover la imagen según la posición del mouse
            mainImageContainer.addEventListener('mousemove', this.handleZoomMove);
            
            this.config.isZoomActive = true;
        }
        
        // Restablecer el estado de animación después del tiempo de transición
        setTimeout(() => {
            this.state.isAnimating = false;
        }, this.config.animationDuration);
    }
    
    /**
     * Maneja el movimiento de la imagen durante el zoom
     */
    handleZoomMove(e) {
        const container = e.currentTarget;
        const img = container.querySelector('img');
        
        if (!img || !container.classList.contains('zoomed')) return;
        
        // Cálculo de posición relativa dentro del contenedor
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // Calcular desplazamiento para centrar el punto del cursor
        const translateX = (0.5 - x) * 100;
        const translateY = (0.5 - y) * 100;
        
        // Aplicar transformación limitando el desplazamiento
        img.style.transform = `scale(2.5) translate(${translateX}px, ${translateY}px)`;
    }
    
    /**
     * Cambia la imagen principal en la galería con animación suave
     */
    changeMainImage(index) {
        if (index < 0 || index >= this.state.totalImages || this.state.isAnimating) return;
        
        // Si el zoom está activo, desactivarlo primero
        if (this.config.isZoomActive) {
            this.toggleImageZoom();
        }
        
        // Evitar cambios durante animaciones
        this.state.isAnimating = true;
        
        // Actualizar estado
        this.state.currentImageIndex = index;
        
        // Actualizar imagen principal con animación
        if (this.elements.mainImage) {
            const newImageSrc = this.elements.thumbnails[index].querySelector('img').src;
            
            // Animación de transición
            this.elements.mainImage.style.opacity = '0';
            this.elements.mainImage.style.transform = 'scale(0.95)';
            
            setTimeout(() => {
                this.elements.mainImage.src = newImageSrc;
                
                // Esperar a que la imagen cargue para restaurar opacidad
                this.elements.mainImage.onload = () => {
                    this.elements.mainImage.style.opacity = '1';
                    this.elements.mainImage.style.transform = '';
                    this.state.isAnimating = false;
                };
                
                // Por si la imagen ya está en caché y el evento onload no se dispara
                setTimeout(() => {
                    if (this.state.isAnimating) {
                        this.elements.mainImage.style.opacity = '1';
                        this.elements.mainImage.style.transform = '';
                        this.state.isAnimating = false;
                    }
                }, 100);
            }, 300);
        }
        
        // Actualizar clases de las miniaturas con animación
        this.elements.thumbnails.forEach(thumbnail => {
            thumbnail.classList.remove('active');
            thumbnail.style.transform = '';
        });
        
        // Aplicar clase activa y agregar un efecto de zoom suave
        this.elements.thumbnails[index].classList.add('active');
        this.elements.thumbnails[index].style.transform = 'translateY(-2px) scale(1.05)';
    }
    
    /**
     * Abre el modal de cotización con efecto mejorado
     */
    openCotizacionModal() {
        // Usar el modal de cotización existente si está disponible
        if (window.app && typeof window.app.openCotizacionModal === 'function') {
            window.app.openCotizacionModal();
        } else {
            // Alternativa: buscar el modal y abrirlo directamente
            const cotizacionModal = document.getElementById('cotizacionModal');
            if (cotizacionModal && typeof bootstrap !== 'undefined') {
                // Aplicar transición suave antes de mostrar el modal
                cotizacionModal.classList.add('fade-in-animation');
                
                const modal = new bootstrap.Modal(cotizacionModal);
                modal.show();
                
                // Establecer estilo para la transición modal
                if (!document.getElementById('modal-transition-style')) {
                    const modalStyle = document.createElement('style');
                    modalStyle.id = 'modal-transition-style';
                    modalStyle.innerHTML = `
                        .fade-in-animation {
                            animation: modalFadeIn 0.3s ease-out forwards;
                        }
                        
                        @keyframes modalFadeIn {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        
                        .modal-content {
                            box-shadow: 0 15px 50px rgba(40, 36, 32, 0.15);
                            border: none;
                            border-radius: 12px;
                            overflow: hidden;
                        }
                        
                        .modal-header {
                            background-color: var(--light);
                            border-bottom: none;
                            padding: 25px 25px 15px;
                        }
                        
                        .modal-body {
                            padding: 20px 25px 30px;
                        }
                        
                        .modal-title {
                            font-family: 'Playfair Display', serif;
                            color: var(--dark);
                            font-weight: 600;
                        }
                        
                        .modal-footer {
                            border-top: none;
                            padding: 0 25px 25px;
                        }
                    `;
                    document.head.appendChild(modalStyle);
                }
            } else {
                console.error('No se pudo abrir el modal de cotización');
            }
        }
    }
    
    /**
     * Obtiene la URL para una categoría específica con mejora visual en el formato
     */
    getCategoryUrl(categoria) {
        // Verificar si la categoría es válida
        if (!categoria) {
            console.warn('Nombre de categoría indefinido');
            return 'categorias.html';  // Redireccionar a página principal de categorías
        }
        
        // Normalizar nombres de categoría
        const categoriasMapping = {
            'Salas': 'salas',
            'Comedores': 'comedores',
            'Recámaras': 'recamaras',
            'Cabeceras': 'cabeceras',
            'Mesas de Centro': 'mesas-centro'
        };
        
        const normalizedCategoria = categoriasMapping[categoria] || 
            categoria.toLowerCase().normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-');
        
        return `${normalizedCategoria}.html`;
    }
    
    /**
     * Normaliza el ID de una categoría para URLs mejorando consistencia
     */
    getNormalizedCategoryId(categoriaName) {
        // Verificar si categoriaName está definido
        if (!categoriaName) {
            console.warn('Nombre de categoría indefinido');
            return 'categoria';  // Valor por defecto
        }
        
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
        
        // Si no está en el mapeo, normalizar manualmente de forma consistente
        return categoriaName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')  // Eliminar caracteres especiales adicionales
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');  // Evitar múltiples guiones consecutivos
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.productDetail = new ProductDetail();
    window.productDetail.init();
    
    // Aplicar fondo con patrón sutil si no existe
    if (!document.getElementById('background-pattern-style')) {
        const patternStyle = document.createElement('style');
        patternStyle.id = 'background-pattern-style';
        patternStyle.innerHTML = `
            body {
                background-color: var(--light);
                position: relative;
            }
            
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4c0a7' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                opacity: 0.4;
                z-index: -1;
                pointer-events: none;
            }
        `;
        document.head.appendChild(patternStyle);
    }
});