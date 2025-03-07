/**
 * Mueblería Cabañas - Componente Navbar
 * Este módulo maneja la funcionalidad específica del navbar
 */

class NavbarComponent {
    constructor() {
        // Referencias a elementos del navbar
        this.elements = {
            navbar: null,
            dropdowns: null,
            cotizacionBtn: null
        };
        
        // Estado del navbar
        this.state = {
            scrolled: false,
            mobileMenuOpen: false
        };

        // Escuchar cuando los componentes HTML estén cargados
        document.addEventListener('components:loaded', () => {
            console.log('Evento components:loaded recibido en NavbarComponent');
            this.initElements();
        });

        // Escuchar específicamente cuando el navbar se cargue
        document.addEventListener('component:loaded', (event) => {
            if (event.detail && event.detail.component === 'templates/navbar.html') {
                console.log('Evento específico de carga del navbar recibido');
                this.initElements();
            }
        });

        // También intentar inicializar en DOMContentLoaded por si acaso
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                // Pequeño retraso para dar tiempo a la carga HTML
                this.initElements();
            }, 100);
        });
    }
    
    /**
     * Inicializa los elementos del navbar
     */
    initElements() {
        console.log('Intentando inicializar elementos del navbar');
        // Buscar elementos en el DOM
        this.elements.navbar = document.querySelector('.stunning-navbar, .custom-navbar, nav');
        
        if (this.elements.navbar) {
            console.log('Navbar encontrado en el DOM:', this.elements.navbar);
            this.elements.dropdowns = this.elements.navbar.querySelectorAll('.dropdown-toggle');
            this.elements.cotizacionBtn = document.getElementById('cotizacionBtn');
            
            if (this.elements.cotizacionBtn) {
                console.log('Botón de cotización encontrado en el navbar');
            } else {
                console.warn('Botón de cotización no encontrado en el navbar');
            }
            
            // Inicializar componente
            this.init();
        } else {
            console.warn('Navbar no encontrado en la página');
        }
    }
    
    /**
     * Inicializa el componente
     */
    init() {
        console.log('Inicializando componente Navbar');
        // Configurar scroll del navbar
        this.setupScrollEffect();
        
        // Configurar dropdowns
        this.setupDropdowns();
        
        // Configurar botón de cotización
        this.setupCotizacionButton();
        
        // Cerrar menú al hacer clic en un enlace (móvil)
        this.setupMobileMenuClose();
        
        console.log('Componente Navbar inicializado correctamente');
    }
    
    /**
     * Configura el efecto de scroll para el navbar
     */
    setupScrollEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY > 50;
            
            if (scrolled !== this.state.scrolled) {
                this.state.scrolled = scrolled;
                
                if (scrolled) {
                    this.elements.navbar.classList.add('scrolled');
                } else {
                    this.elements.navbar.classList.remove('scrolled');
                }
            }
        });
        
        // Aplicar estado inicial
        if (window.scrollY > 50) {
            this.elements.navbar.classList.add('scrolled');
            this.state.scrolled = true;
        }
    }
    
    /**
     * Configura los dropdowns del navbar
     */
    setupDropdowns() {
        // Verificar si estamos en dispositivo móvil
        const isMobile = window.innerWidth < 992;
        
        // Configurar comportamiento en móvil
        if (isMobile && this.elements.dropdowns) {
            this.elements.dropdowns.forEach(dropdown => {
                dropdown.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Encontrar el menú desplegable asociado
                    const dropdownMenu = dropdown.nextElementSibling;
                    
                    // Alternar visibilidad
                    if (dropdownMenu.classList.contains('show')) {
                        dropdownMenu.classList.remove('show');
                        dropdown.setAttribute('aria-expanded', 'false');
                    } else {
                        dropdownMenu.classList.add('show');
                        dropdown.setAttribute('aria-expanded', 'true');
                    }
                });
            });
        }
        
        // Mejorar interacción en escritorio
        if (!isMobile) {
            const dropdownItems = document.querySelectorAll('.dropdown-menu .premium-item');
            
            dropdownItems.forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.classList.add('hovered');
                });
                
                item.addEventListener('mouseleave', () => {
                    item.classList.remove('hovered');
                });
            });
        }
    }
    
    /**
     * Configura el botón de cotización
     */
    setupCotizacionButton() {
        if (!this.elements.cotizacionBtn) {
            console.warn('No se pudo configurar el botón de cotización: no se encontró el elemento');
            return;
        }
        
        console.log('Configurando botón de cotización');
        
        // Añadir efecto de hover mejorado
        this.elements.cotizacionBtn.addEventListener('mouseenter', () => {
            const buttonIcon = this.elements.cotizacionBtn.querySelector('.button-icon');
            if (buttonIcon) {
                buttonIcon.style.opacity = '1';
                buttonIcon.style.transform = 'translateX(0)';
            }
        });
        
        this.elements.cotizacionBtn.addEventListener('mouseleave', () => {
            const buttonIcon = this.elements.cotizacionBtn.querySelector('.button-icon');
            if (buttonIcon) {
                buttonIcon.style.opacity = '';
                buttonIcon.style.transform = '';
            }
        });
        
        // Configurar evento de clic para el botón de cotización
        this.elements.cotizacionBtn.addEventListener('click', (e) => {
            console.log('Botón de cotización clickeado');
            e.preventDefault();
            if (window.app && typeof window.app.openCotizacionModal === 'function') {
                window.app.openCotizacionModal();
            } else {
                console.error('No se encontró la función openCotizacionModal en el objeto app');
            }
        });
        
        console.log('Botón de cotización configurado correctamente');
    }
    
    /**
     * Configura el cierre del menú móvil al hacer clic en un enlace
     */
    setupMobileMenuClose() {
        if (!this.elements.navbar) return;
        
        const navLinks = this.elements.navbar.querySelectorAll('.navbar-nav .nav-link:not(.dropdown-toggle)');
        const navbarToggler = this.elements.navbar.querySelector('.navbar-toggler');
        const navbarCollapse = this.elements.navbar.querySelector('.navbar-collapse');
        
        if (!navbarToggler || !navbarCollapse) return;
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Si el menú está abierto, cerrarlo
                if (navbarCollapse.classList.contains('show')) {
                    // Usar Bootstrap API si está disponible
                    if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                        if (bsCollapse) {
                            bsCollapse.hide();
                        }
                    } else {
                        // Fallback manual
                        navbarCollapse.classList.remove('show');
                        navbarToggler.classList.add('collapsed');
                        navbarToggler.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }
    
    /**
     * Actualiza el elemento activo del navbar basado en la página actual
     */
    updateActiveItem() {
        if (!this.elements.navbar) return;
        
        // Obtener la ruta actual
        const currentPath = window.location.pathname;
        
        // Resetear todos los items
        const navItems = this.elements.navbar.querySelectorAll('.nav-item .nav-link');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Determinar qué item debe estar activo
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;
            
            // Activar el item que coincida con la página actual
            if (currentPath.includes(href) && href !== '#' && href !== '/') {
                item.classList.add('active');
            }
            
            // Caso especial para la página principal
            if ((currentPath === '/' || currentPath.includes('index.html')) && 
                (href === '/' || href === 'index.html' || href === './index.html')) {
                item.classList.add('active');
            }
        });
    }
}

// Crear instancia global
window.navbarComponent = new NavbarComponent();