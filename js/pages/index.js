/**
 * Mueblería Cabañas - Lógica para página principal (index)
 * Este módulo maneja la funcionalidad específica de la página principal
 */

class IndexPage {
    constructor() {
        // Referencias a elementos de la página principal
        this.elements = {
            heroSlider: document.querySelector('.hero-slider'),
            sliderDots: document.querySelectorAll('.dot'),
            sliderArrows: {
                prev: document.querySelector('.arrow-prev'),
                next: document.querySelector('.arrow-next')
            },
            featuredContainer: document.getElementById('featured-products-container'),
            categoriesContainer: document.getElementById('categories-showcase-container'),
            contactForm: document.querySelector('#contacto form'),
            parallaxSection: document.querySelector('#parallax')
        };
        
        // Estado de la página
        this.state = {
            currentSlide: 0,
            slideInterval: null,
            isAnimating: false
        };
    }
    
    /**
     * Inicializa la página principal
     */
    init() {
        // console.log('Inicializando página principal...');
        
        // Configurar slider del hero
        if (this.elements.heroSlider) {
            this.initHeroSlider();
        }
        
        // Configurar secciones de carga perezosa
        this.setupLazySections();
        
        // Configurar efectos de scroll
        this.setupScrollEffects();
        
        // Configurar parallax
        if (this.elements.parallaxSection) {
            this.setupParallax();
        }
        
        // console.log('Página principal inicializada');
    }
    
    /**
     * Inicializa el slider del hero
     */
    initHeroSlider() {
        const { heroSlider, sliderDots, sliderArrows } = this.elements;
        const slides = heroSlider.querySelectorAll('.hero-slide');
        
        if (!slides.length) return;
        
        // Función para cambiar slide
        const goToSlide = (index) => {
            // Evitar animaciones simultáneas
            if (this.state.isAnimating) return;
            this.state.isAnimating = true;
            
            // Remover clase activa de todos los slides y dots
            slides.forEach(slide => slide.classList.remove('active'));
            sliderDots.forEach(dot => dot.classList.remove('active'));
            
            // Activar el slide y dot correspondiente
            slides[index].classList.add('active');
            if (sliderDots.length > index) {
                sliderDots[index].classList.add('active');
            }
            
            // Actualizar índice actual
            this.state.currentSlide = index;
            
            // Permitir nueva animación después de un tiempo
            setTimeout(() => {
                this.state.isAnimating = false;
            }, 1000); // Duración de transición + margen
        };
        
        // Configurar eventos para los dots
        sliderDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                clearInterval(this.state.slideInterval);
                goToSlide(index);
                this.startSlideShow();
            });
        });
        
        // Configurar botones de navegación
        if (sliderArrows.prev) {
            sliderArrows.prev.addEventListener('click', () => {
                clearInterval(this.state.slideInterval);
                const newIndex = this.state.currentSlide === 0 ? slides.length - 1 : this.state.currentSlide - 1;
                goToSlide(newIndex);
                this.startSlideShow();
            });
        }
        
        if (sliderArrows.next) {
            sliderArrows.next.addEventListener('click', () => {
                clearInterval(this.state.slideInterval);
                const newIndex = this.state.currentSlide === slides.length - 1 ? 0 : this.state.currentSlide + 1;
                goToSlide(newIndex);
                this.startSlideShow();
            });
        }
        
        // Iniciar slideshow automático
        this.startSlideShow = () => {
            this.state.slideInterval = setInterval(() => {
                const newIndex = this.state.currentSlide === slides.length - 1 ? 0 : this.state.currentSlide + 1;
                goToSlide(newIndex);
            }, 5000); // Cambiar slide cada 5 segundos
        };
        
        // Iniciar automáticamente
        this.startSlideShow();
        
        // Mejorar interactividad en móviles
        this.setupSwipeGestures(heroSlider, (direction) => {
            clearInterval(this.state.slideInterval);
            
            if (direction === 'left') {
                const newIndex = this.state.currentSlide === slides.length - 1 ? 0 : this.state.currentSlide + 1;
                goToSlide(newIndex);
            } else if (direction === 'right') {
                const newIndex = this.state.currentSlide === 0 ? slides.length - 1 : this.state.currentSlide - 1;
                goToSlide(newIndex);
            }
            
            this.startSlideShow();
        });
    }
    
    /**
     * Configura las secciones con carga lazy
     */
    setupLazySections() {
        // Configurar contenedor de productos destacados
        if (this.elements.featuredContainer) {
            if (!this.elements.featuredContainer.hasAttribute('data-lazy-container')) {
                this.elements.featuredContainer.setAttribute('data-lazy-container', 'true');
                this.elements.featuredContainer.setAttribute('data-lazy-function', 'loadFeaturedProducts');
            }
        }
        
        // Configurar contenedor de showcase de categorías
        if (this.elements.categoriesContainer) {
            if (!this.elements.categoriesContainer.hasAttribute('data-lazy-container')) {
                this.elements.categoriesContainer.setAttribute('data-lazy-container', 'true');
                this.elements.categoriesContainer.setAttribute('data-lazy-function', 'loadCategoriesShowcase');
            }
        }
    }
    
    /**
     * Configura efectos de scroll
     */
    setupScrollEffects() {
        // Detectar elementos que necesitan animación al scroll
        const elementsToAnimate = [
            '.main-visual',
            '.main-content',
            '.process-step',
            '.value-item',
            '.gallery-item',
            '.founder-quote',
            '.featured-product-item',
            '.category-card'
        ];
        
        // Función para determinar si un elemento está en el viewport
        const isInViewport = (element) => {
            const rect = element.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85
            );
        };
        
        // Función para aplicar clases de animación a elementos visibles
        const checkVisibility = () => {
            elementsToAnimate.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (isInViewport(element) && !element.classList.contains('visible')) {
                        element.classList.add('visible');
                        
                        // Añadir una clase diferente para los elementos de proceso
                        if (element.classList.contains('process-step')) {
                            setTimeout(() => {
                                element.classList.add('animated');
                            }, 200 * Array.from(document.querySelectorAll('.process-step')).indexOf(element));
                        }
                    }
                });
            });
        };
        
        // Verificar al cargar y al hacer scroll
        window.addEventListener('scroll', checkVisibility);
        window.addEventListener('load', checkVisibility);
        
        // Verificar visibilidad inicial
        setTimeout(checkVisibility, 100);
    }
    
    /**
     * Configura el efecto parallax para la sección correspondiente
     */
    setupParallax() {
        const parallaxContainer = this.elements.parallaxSection.querySelector('.parallax-container');
        if (!parallaxContainer) return;
        
        // Función para actualizar la posición de fondo
        const updateParallax = () => {
            const scrollPosition = window.pageYOffset;
            const containerTop = parallaxContainer.offsetTop;
            const containerHeight = parallaxContainer.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // Solo aplicar parallax cuando la sección esté en el viewport
            if (scrollPosition + windowHeight > containerTop && scrollPosition < containerTop + containerHeight) {
                const yPos = (scrollPosition - containerTop) * 0.5;
                parallaxContainer.style.backgroundPosition = `center ${yPos}px`;
            }
        };
        
        // Actualizar al hacer scroll
        window.addEventListener('scroll', updateParallax);
        
        // Actualizar al cargar
        updateParallax();
    }
    
    /**
     * Configura detección de gestos swipe para dispositivos táctiles
     * @param {HTMLElement} element - Elemento que detectará gestos swipe
     * @param {Function} callback - Función a llamar con la dirección ('left' o 'right')
     */
    setupSwipeGestures(element, callback) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        // Umbral para considerar un swipe
        const swipeThreshold = 50;
        
        // Capturar posición inicial
        element.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        // Capturar posición final
        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            
            // Calcular diferencia
            const swipeDistance = touchEndX - touchStartX;
            
            // Determinar dirección
            if (Math.abs(swipeDistance) > swipeThreshold) {
                if (swipeDistance > 0) {
                    callback('right');
                } else {
                    callback('left');
                }
            }
        }, { passive: true });
    }
}

// Inicializar la página principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.indexPage = new IndexPage();
    window.indexPage.init();
});