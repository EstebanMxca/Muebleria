/**
 * Mueblería Cabañas - Inicialización de la Aplicación
 * Este módulo centraliza la inicialización de todos los componentes de la aplicación
 */

class App {
    constructor() {
        // Componentes principales de la aplicación
        this.components = {
            loader: null,
            productService: null,
            recommendationSystem: null // Nuevo componente centralizado
        };
        
        // Estado de la aplicación
        this.state = {
            initialized: false,
            pageType: null
        };
    }
    
    /**
     * Inicializa la aplicación
     */
    init() {
        // console.log('Inicializando aplicación Mueblería Cabañas...');
        
        // Evitar inicialización múltiple
        if (this.state.initialized) {
            console.log('La aplicación ya está inicializada');
            return;
        }
        
        // Detectar tipo de página
        this.detectPageType();
        
        // Inicializar componentes principales
        this.initComponents();
        
        // Configurar carga de componentes HTML primero
        this.loadHtmlComponents();
        
        // Añadir un evento que espere a que los componentes se carguen
        document.addEventListener('components:loaded', () => {
            // Configurar navegación después de cargar componentes
            this.setupNavigation();
            
            // Cargar contenido específico de la página
            this.loadPageSpecificContent();
            
            // Optimizaciones de rendimiento para scroll
            let scrollTimer;
            window.addEventListener('scroll', () => {
                // No aplicar scrolling class en páginas de categoría para evitar parpadeo
                const isCategoryPage = /salas|comedores|recamaras|cabeceras|mesas-centro/.test(window.location.pathname);
                
                if (!isCategoryPage) {
                    // Aplicar optimizaciones solo en páginas que no son de categoría
                    document.documentElement.classList.add('scrolling');
                    if (scrollTimer) clearTimeout(scrollTimer);
                    
                    scrollTimer = setTimeout(() => {
                        document.documentElement.classList.remove('scrolling');
                    }, 150); // Tiempo reducido para mejor experiencia
                }
            }, { passive: true });
            
            // Marcar como inicializado
            this.state.initialized = true;
            
            // console.log('Aplicación inicializada correctamente');
        });
    }
    
    /**
     * Detecta el tipo de página actual
     */
    detectPageType() {
        const path = window.location.pathname;
        
        if (path.endsWith('index.html') || path.endsWith('/')) {
            this.state.pageType = 'home';
        } else if (path.includes('admin-productos-destacados.html')) {
            this.state.pageType = 'admin';
        } else if (path.match(/salas|comedores|recamaras|cabeceras|mesas-centro/)) {
            this.state.pageType = 'category';
        } else if (path.includes('product-detail.html')) {
            this.state.pageType = 'product';
        } else {
            this.state.pageType = 'other';
        }
        
        // console.log(`Tipo de página detectado: ${this.state.pageType}`);
    }
    
    /**
     * Inicializa los componentes principales de la aplicación
     */
    initComponents() {
        // Inicializar servicio de productos
        this.components.productService = new ProductService();
        window.productService = this.components.productService;
        
        // Inicializar cargador
        this.components.loader = new Loader();
        window.loader = this.components.loader;
        
        // Inicializar sistema de recomendaciones
        this.components.recommendationSystem = window.recommendationSystem || null;
        
        // Inicializar componentes específicos según la página
        if (this.state.pageType === 'home' || this.state.pageType === 'category') {
            this.components.productService.init();
        }
    }
    
    /**
     * Configura eventos para la navegación
     */
    setupNavigation() {
        // Configurar botón de solicitud de cotización
        const cotizacionBtn = document.getElementById('cotizacionBtn');
        if (cotizacionBtn) {
            cotizacionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCotizacionModal();
            });
        } else {
            console.log('Botón de cotización no encontrado');
        }
        
        // Configurar botón de WhatsApp fijo
        this.setupWhatsAppButton();
    }
    
    /**
     * Configura el botón flotante de WhatsApp
     */
    setupWhatsAppButton() {
        const whatsappBtn = document.querySelector('.whatsapp-button');
        if (!whatsappBtn) return;
        
        // Añadir efecto de hover mejorado
        whatsappBtn.addEventListener('mouseenter', () => {
            whatsappBtn.style.transform = 'translateY(-5px)';
        });
        
        whatsappBtn.addEventListener('mouseleave', () => {
            whatsappBtn.style.transform = '';
        });
        
        // Asegurar que el botón sea visible al hacer scroll
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            if (scrollY > 300) {
                whatsappBtn.style.opacity = '1';
            } else {
                whatsappBtn.style.opacity = '0.8';
            }
        });
    }
    
    /**
     * Abre el modal de cotización
     */
    openCotizacionModal() {
        console.log('Intentando abrir modal de cotización');
        
        // Verificar si el modal ya está en el DOM
        let modalElement = document.getElementById('cotizacionModal');
        
        // Si no existe el modal, intentar cargarlo
        if (!modalElement) {
            console.log('Modal no encontrado en el DOM, intentando cargarlo');
            this.loadCotizacionModal()
                .then(() => {
                    console.log('Modal cargado correctamente');
                    // Una vez cargado, abrirlo
                    modalElement = document.getElementById('cotizacionModal');
                    this.showModal(modalElement);
                    
                    // Inicializar el wizard después de cargar el modal
                    if (typeof CotizacionWizard !== 'undefined') {
                        if (!window.cotizacionWizard) {
                            window.cotizacionWizard = new CotizacionWizard();
                        } else {
                            // Si ya existe, intentar reinicializar sus elementos
                            if (typeof window.cotizacionWizard.initElements === 'function') {
                                window.cotizacionWizard.initElements();
                            }
                        }
                    }
                })
                .catch(error => {
                    console.error('Error al cargar modal de cotización:', error);
                });
            return;
        }
        
        // Si el modal ya existe, simplemente abrirlo
        console.log('Modal encontrado en el DOM, abriéndolo');
        this.showModal(modalElement);
    }

    /**
     * Muestra un modal utilizando Bootstrap o una implementación manual
     * @param {HTMLElement} modalElement - El elemento del modal a mostrar
     */
    showModal(modalElement) {
        if (!modalElement) {
            console.error('No se puede mostrar el modal: elemento no encontrado');
            return;
        }
        
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            console.log('Usando Bootstrap para mostrar el modal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.log('Bootstrap no está disponible, usando implementación manual');
            // Intentar mostrar el modal de forma manual
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
            document.body.classList.add('modal-open');
            
            // Crear un backdrop manualmente
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
            
            // Añadir evento para cerrar el modal
            const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    modalElement.style.display = 'none';
                    modalElement.classList.remove('show');
                    document.body.classList.remove('modal-open');
                    if (backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                });
            });
        }
    }
    
    /**
     * Carga el modal de cotización desde el archivo HTML
     */
    async loadCotizacionModal() {
        try {
            // Crear un contenedor para el modal
            const modalContainer = document.createElement('div');
            modalContainer.id = 'cotizacionModalContainer';
            
            // Cambiar la ruta para cargar desde el directorio correcto
            const response = await fetch('templates/cotizacion-modal.html');
            
            if (!response.ok) {
                throw new Error(`Error al cargar modal: ${response.status}`);
            }
            
            const html = await response.text();
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);
            
            // Inicializar el wizard si está disponible la clase
            if (typeof CotizacionWizard !== 'undefined') {
                window.cotizacionWizard = new CotizacionWizard();
            } else {
                // Intentar cargar dinámicamente cotizacion.js
                const script = document.createElement('script');
                script.src = 'js/components/cotizacion.js';
                script.onload = () => {
                    if (typeof CotizacionWizard !== 'undefined') {
                        window.cotizacionWizard = new CotizacionWizard();
                    }
                };
                document.head.appendChild(script);
            }
            
            return true;
        } catch (error) {
            console.error('Error al cargar el modal de cotización:', error);
            return false;
        }
    }
    
    /**
     * Carga componentes HTML (navbar, footer, etc.)
     */
    loadHtmlComponents() {
        const includes = document.getElementsByTagName('include');
        
        if (includes.length === 0) {
            // Si no hay componentes para cargar, emitir el evento inmediatamente
            document.dispatchEvent(new CustomEvent('components:loaded'));
            return;
        }
        
        // Contador para seguir el progreso de la carga
        let loadedCount = 0;
        
        // Procesar cada componente
        Array.from(includes).forEach(include => {
            const file = include.getAttribute('src');
            
            if (file) {
                // Usar XMLHttpRequest para compatibilidad
                const xhr = new XMLHttpRequest();
                
                xhr.onreadystatechange = function() {
                    if (this.readyState == 4) {
                        if (this.status == 200) {
                            // Reemplazar el elemento include con el contenido
                            const tempDiv = document.createElement('div');
                            tempDiv.innerHTML = this.responseText;
                            
                            // Si el contenido tiene un único nodo hijo, reemplazar con ese nodo
                            if (tempDiv.firstElementChild) {
                                include.parentNode.replaceChild(tempDiv.firstElementChild, include);
                            } else {
                                // Si no, reemplazar con todos los nodos
                                while (tempDiv.firstChild) {
                                    include.parentNode.insertBefore(tempDiv.firstChild, include);
                                }
                                include.parentNode.removeChild(include);
                            }
                            
                            // Incrementar contador
                            loadedCount++;
                            
                            // Emitir evento para notificar la carga del componente específico
                            document.dispatchEvent(new CustomEvent('component:loaded', {
                                detail: { component: file }
                            }));
                            
                            // Si se han cargado todos los componentes, emitir evento
                            if (loadedCount === includes.length) {
                                console.log('Todos los componentes HTML han sido cargados');
                                document.dispatchEvent(new CustomEvent('components:loaded'));
                            }
                        } else {
                            console.error(`Error al cargar componente ${file}: ${this.status}`);
                            include.innerHTML = `<div class="alert alert-danger">Error al cargar ${file}</div>`;
                            
                            // Incrementar contador incluso en caso de error
                            loadedCount++;
                            
                            // Si se han procesado todos los componentes, emitir evento
                            if (loadedCount === includes.length) {
                                console.log('Todos los componentes HTML han sido procesados (con errores)');
                                document.dispatchEvent(new CustomEvent('components:loaded'));
                            }
                        }
                    }
                };
                
                xhr.open('GET', file, true);
                xhr.send();
            }
        });
    }
    
    /**
     * Carga contenido específico para el tipo de página actual
     */
    loadPageSpecificContent() {
        switch (this.state.pageType) {
            case 'home':
                this.loadHomePageContent();
                break;
            case 'category':
                this.loadCategoryPageContent();
                break;
            case 'admin':
                this.loadAdminPageContent();
                break;
            case 'product':
                this.loadProductDetailContent();
                break;
        }
        
        // Inicializar AOS si está disponible
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true
            });
        }
    }
    
    /**
     * Carga contenido específico para la página principal
     */
    loadHomePageContent() {
        // Inicializar slider del hero
        const heroSlider = document.querySelector('.hero-slider');
        if (heroSlider) {
            this.initHeroSlider();
        }
    }
    
    /**
     * Inicializa el slider del hero en la página principal
     */
    initHeroSlider() {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.querySelector('.arrow-prev');
        const nextBtn = document.querySelector('.arrow-next');
        
        if (!slides.length) return;
        
        let currentSlide = 0;
        let slideInterval;
        
        // Función para cambiar slide
        const goToSlide = (index) => {
            // Remover clase activa de todos los slides y dots
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            // Activar el slide y dot correspondiente
            slides[index].classList.add('active');
            if (dots.length > 0) {
                dots[index].classList.add('active');
            }
            
            // Actualizar índice actual
            currentSlide = index;
        };
        
        // Configurar eventos para los dots
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                goToSlide(index);
                startSlideShow();
            });
        });
        
        // Configurar botones de navegación
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                clearInterval(slideInterval);
                currentSlide = currentSlide === 0 ? slides.length - 1 : currentSlide - 1;
                goToSlide(currentSlide);
                startSlideShow();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                clearInterval(slideInterval);
                currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
                goToSlide(currentSlide);
                startSlideShow();
            });
        }
        
        // Iniciar slideshow automático
        const startSlideShow = () => {
            slideInterval = setInterval(() => {
                currentSlide = currentSlide === slides.length - 1 ? 0 : currentSlide + 1;
                goToSlide(currentSlide);
            }, 5000); // Cambiar slide cada 5 segundos
        };
        
        // Iniciar automáticamente
        startSlideShow();
    }
    
  /**
 * Carga contenido específico para las páginas de categoría
 */
loadCategoryPageContent() {
    console.log('Cargando contenido específico para página de categoría');
    
    // Inicializar el sistema de recomendaciones
    if (window.recommendationSystem) {
        console.log('Sistema de recomendaciones disponible, reiniciando');
        window.recommendationSystem.reset();
    } else if (document.querySelector('script[data-recommendation-loader="true"]')) {
        console.log('Script de recomendaciones en proceso de carga');
        // El script se encargará de la inicialización
    } else {
        console.log('Sistema de recomendaciones no disponible, cargando script');
        const script = document.createElement('script');
        script.src = 'js/components/recomendaciones.js';
        script.dataset.recommendationLoader = "true";
        script.async = true;
        document.head.appendChild(script);
    }
}
    
    /**
     * Carga contenido específico para la página de detalle de producto
     */
    loadProductDetailContent() {
        console.log('Cargando contenido específico para página de detalle de producto');
        
        // Inicializar componentes específicos para detalle de producto
        if (window.productDetail && typeof window.productDetail.init === 'function') {
            window.productDetail.init();
        }
    }
    
    /**
     * Carga contenido específico para la página de administración
     */
    loadAdminPageContent() {
        // Inicialización específica para la página de administración
        console.log('Cargando contenido para página de administración');
    }
}

// Crear instancia de la aplicación y exportarla
window.app = new App();

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM cargado, inicializando aplicación...');
    window.app = new App();
    window.app.init();
    // console.log('Aplicación inicializada');
});

// Añadir al final de app.js
document.addEventListener('component:loaded', (event) => {
    if (event.detail && event.detail.component === 'templates/navbar.html') {
        // console.log('Navbar cargado, configurando botón de cotización');
        const cotizacionBtn = document.getElementById('cotizacionBtn');
        if (cotizacionBtn) {
            cotizacionBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.app) {
                    window.app.openCotizacionModal();
                }
            });
        } else {
            console.error('Botón de cotización no encontrado después de cargar navbar');
        }
    }
});