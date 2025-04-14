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
            mobileMenuOpen: false,
            initialized: false  // Agregar bandera de inicialización
        };
        
        // Crear un nuevo objeto con handlers de limpieza global
        window.navbarCleanupHandlers = window.navbarCleanupHandlers || [];
    
        // Intentar inicializar inmediatamente
        this.initElements();
        
        // Eventos para asegurar inicialización
        document.addEventListener('components:loaded', () => {
            console.log('Evento components:loaded recibido en NavbarComponent');
            if (!this.state.initialized) {
                this.initElements();
            }
        });
    
        document.addEventListener('component:loaded', (event) => {
            if (event.detail && event.detail.component === 'templates/navbar.html' && !this.state.initialized) {
                console.log('Evento específico de carga del navbar recibido');
                this.initElements();
            }
        });
    
        document.addEventListener('DOMContentLoaded', () => {
            if (!this.state.initialized) {
                setTimeout(() => {
                    this.initElements();
                }, 100);
            }
        });
        
        // Intento adicional después de que todo esté cargado
        window.addEventListener('load', () => {
            if (!this.state.initialized) {
                this.initElements();
            }
            
            // Configurar event listener para click en enlace de salas dentro del dropdown
            const setupLinks = () => {
                const dropdownLinks = document.querySelectorAll('#catalogo-menu a, .premium-dropdown a');
                dropdownLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        // Cerrar el menú después de hacer clic en un elemento
                        const catalogoMenu = document.querySelector('#catalogo-menu, .premium-dropdown');
                        const catalogoBtn = document.querySelector('#catalogo-btn, .dropdown-toggle');
                        
                        if (catalogoMenu) {
                            catalogoMenu.classList.remove('show');
                        }
                        
                        if (catalogoBtn) {
                            catalogoBtn.setAttribute('aria-expanded', 'false');
                        }
                    });
                });
            };
            
            // Ejecutar configuración de enlaces
            setupLinks();
            
            // Si se realiza navegación por SPA o se cambia contenido dinámicamente
            document.addEventListener('navbar:ready', () => {
                setupLinks();
            });
        });
    }
    
    /**
     * Helper para registrar eventos globales que necesitarán limpieza
     */
    registerGlobalEvent(target, type, callback, options) {
        target.addEventListener(type, callback, options);
        window.navbarCleanupHandlers.push({ target, type, callback });
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
            
            // Inicializar componente
            this.init();
        } else {
            console.warn('Navbar no encontrado en la página');
            // Intentar nuevamente después de un breve retraso
            setTimeout(() => {
                this.elements.navbar = document.querySelector('.stunning-navbar, .custom-navbar, nav');
                if (this.elements.navbar) {
                    console.log('Navbar encontrado en segundo intento');
                    this.elements.dropdowns = this.elements.navbar.querySelectorAll('.dropdown-toggle');
                    this.elements.cotizacionBtn = document.getElementById('cotizacionBtn');
                    this.init();
                }
            }, 500);
        }
    }
    
    /**
     * Limpia eventos globales previos para evitar conflictos entre páginas
     */
    cleanupPreviousEvents() {
        // Limpiar manejadores de eventos anteriores
        if (window.navbarCleanupHandlers && window.navbarCleanupHandlers.length > 0) {
            console.log('Limpiando manejadores de eventos anteriores del navbar');
            window.navbarCleanupHandlers.forEach(handler => {
                if (handler.target && handler.type && handler.callback) {
                    handler.target.removeEventListener(handler.type, handler.callback);
                }
            });
            
            // Reiniciar el arreglo
            window.navbarCleanupHandlers = [];
        }
    }
    
    /**
     * Inicializa el componente
     */
    init() {
        console.log('Inicializando componente Navbar');
        
        // Marcar como inicializado
        this.state.initialized = true;
        
        // Limpiar eventos globales previos
        this.cleanupPreviousEvents();
        
        // Configurar scroll del navbar
        this.setupScrollEffect();
        
        // Configurar dropdowns
        this.setupDropdowns();
        
        // Configurar botón de cotización
        this.setupCotizacionButton();
        
        // Cerrar menú al hacer clic en un enlace (móvil)
        this.setupMobileMenuClose();
        
        // Configuración especial para el dropdown de catálogo
        // Es importante que se ejecute después de un pequeño retraso
        setTimeout(() => {
            this.setupCatalogoDropdown();
        }, 50);
        
        // Actualizar elementos activos
        this.updateActiveItem();
        
        console.log('Componente Navbar inicializado correctamente');
        
        // Notificar que el navbar está listo
        document.dispatchEvent(new CustomEvent('navbar:ready', { 
            detail: { timestamp: Date.now() } 
        }));
        
        // Técnica de depuración: Agregar un mensaje visual en modo desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const debugEl = document.createElement('div');
            debugEl.style.position = 'fixed';
            debugEl.style.bottom = '10px';
            debugEl.style.right = '10px';
            debugEl.style.background = 'rgba(0,255,0,0.2)';
            debugEl.style.padding = '5px';
            debugEl.style.borderRadius = '5px';
            debugEl.style.fontSize = '10px';
            debugEl.style.zIndex = '9999';
            debugEl.textContent = 'Navbar inicializado ✓';
            document.body.appendChild(debugEl);
            
            setTimeout(() => {
                debugEl.style.opacity = '0';
                setTimeout(() => {
                    if (debugEl.parentNode) {
                        debugEl.parentNode.removeChild(debugEl);
                    }
                }, 500);
            }, 3000);
        }
    }
    
    /**
     * Configura el efecto de scroll para el navbar
     */
    setupScrollEffect() {
        const scrollHandler = () => {
            const scrolled = window.scrollY > 50;
            
            if (scrolled !== this.state.scrolled) {
                this.state.scrolled = scrolled;
                
                if (scrolled) {
                    this.elements.navbar.classList.add('scrolled');
                } else {
                    this.elements.navbar.classList.remove('scrolled');
                }
            }
        };
        
        // Usar el método de registro global para este evento
        this.registerGlobalEvent(window, 'scroll', scrollHandler);
        
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
        if (!this.elements.dropdowns) return;
        
        // Función para manejar el comportamiento en móvil
        const handleMobileDropdown = (e, dropdown) => {
            if (window.innerWidth < 992) {
                // Detener completamente la propagación y el comportamiento por defecto
                e.preventDefault();
                e.stopPropagation();
                
                // Encontrar el menú desplegable asociado
                const dropdownMenu = dropdown.nextElementSibling;
                
                // Cerrar todos los otros menús abiertos primero
                this.elements.dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        const otherMenu = otherDropdown.nextElementSibling;
                        if (otherMenu && otherMenu.classList.contains('show')) {
                            otherMenu.classList.remove('show');
                            otherDropdown.setAttribute('aria-expanded', 'false');
                        }
                    }
                });
                
                // Alternar visibilidad del menú actual
                if (dropdownMenu.classList.contains('show')) {
                    dropdownMenu.classList.remove('show');
                    dropdown.setAttribute('aria-expanded', 'false');
                } else {
                    dropdownMenu.classList.add('show');
                    dropdown.setAttribute('aria-expanded', 'true');
                }
                
                return false;
            }
        };
        
        // Eliminar listeners de Bootstrap si existen
        this.elements.dropdowns.forEach(dropdown => {
            // Obtener cualquier instancia de dropdown de Bootstrap si existe
            if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                const instance = bootstrap.Dropdown.getInstance(dropdown);
                if (instance) {
                    instance.dispose();
                }
            }
        });
        
        // Agregar nuestros propios listeners para móvil
        this.elements.dropdowns.forEach(dropdown => {
            // No procesamos el dropdown de catálogo aquí, tiene su propia gestión
            if (dropdown.closest('#catalogo-dropdown')) {
                return;
            }
            
            // Limpiar eventos existentes clonando el elemento
            const newDropdown = dropdown.cloneNode(true);
            if (dropdown.parentNode) {
                dropdown.parentNode.replaceChild(newDropdown, dropdown);
            }
            
            // Configurar el nuevo evento
            newDropdown.addEventListener('click', (e) => handleMobileDropdown(e, newDropdown));
            
            // También añadir al elemento padre para capturar mejor los clicks en móvil
            const parentItem = newDropdown.closest('.nav-item');
            if (parentItem) {
                parentItem.addEventListener('click', (e) => {
                    // Solo procesar si el click fue directamente en el dropdown, no en sus hijos
                    if (e.target === newDropdown || newDropdown.contains(e.target)) {
                        handleMobileDropdown(e, newDropdown);
                    }
                });
            }
        });
        
        // Actualizar referencia a dropdowns después de clonarlos
        this.elements.dropdowns = this.elements.navbar.querySelectorAll('.dropdown-toggle');
        
        // Configuración para escritorio - efectos de hover
        if (window.innerWidth >= 992) {
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
        
        // Listener para cambio de tamaño de ventana
        const resizeHandler = () => {
            if (window.innerWidth >= 992) {
                // Cerrar cualquier menú abierto en móvil al cambiar a desktop
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        };
        
        this.registerGlobalEvent(window, 'resize', resizeHandler);
        
        // Agregar un listener global para cerrar menús cuando se hace clic fuera
        const documentClickHandler = (e) => {
            if (window.innerWidth < 992) {
                // Verificar si el clic fue fuera de cualquier menú desplegable
                const isClickInsideDropdown = Array.from(this.elements.dropdowns).some(dropdown => 
                    dropdown.contains(e.target) || dropdown === e.target
                );
                
                if (!isClickInsideDropdown) {
                    // Cerrar todos los menús abiertos
                    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                        menu.classList.remove('show');
                        const dropdown = menu.previousElementSibling;
                        if (dropdown) {
                            dropdown.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
            }
        };
        
        this.registerGlobalEvent(document, 'click', documentClickHandler);
    }
    
    /**
     * Configura específicamente el dropdown de Catálogo con una solución a prueba de fallos
     */
    setupCatalogoDropdown() {
        console.log('Configurando manejo especial para dropdown de Catálogo');
        
        // Primero intentar con los IDs específicos
        let catalogoDropdown = document.getElementById('catalogo-dropdown');
        let catalogoBtn = document.getElementById('catalogo-btn');
        let catalogoMenu = document.getElementById('catalogo-menu');
        
        // Si no se encuentran por ID, buscar por selector más genérico
        if (!catalogoDropdown || !catalogoBtn || !catalogoMenu) {
            console.log('No se encontraron elementos por ID, buscando por selector');
            
            // Buscar el item del navbar que contenga el texto "Catálogo"
            const navItems = document.querySelectorAll('.nav-item');
            for (let item of navItems) {
                const text = item.textContent.trim();
                if (text.includes('Catálogo')) {
                    catalogoDropdown = item;
                    catalogoBtn = item.querySelector('.dropdown-toggle');
                    catalogoMenu = item.querySelector('.dropdown-menu');
                    break;
                }
            }
        }
        
        if (!catalogoDropdown || !catalogoBtn || !catalogoMenu) {
            console.warn('No se encontraron elementos del dropdown de Catálogo');
            return;
        }
        
        // IMPORTANTE: Inicializar correctamente - el menú debe estar cerrado por defecto
        catalogoMenu.classList.remove('show');
        catalogoBtn.setAttribute('aria-expanded', 'false');
        
        // Eliminar cualquier estilo inline que pueda estar causando problemas
        catalogoMenu.style.display = '';
        
        // Aplicar configuraciones específicas según el tamaño de pantalla
        if (window.innerWidth >= 992) {
            // Configuraciones para escritorio
            catalogoDropdown.classList.add('position-static');
            catalogoMenu.classList.add('w-100');
            catalogoMenu.classList.add('premium-dropdown');
            
            // Estilos para posicionamiento correcto
            catalogoMenu.style.left = '0';
            catalogoMenu.style.right = '0';
        } else {
            // Configuraciones para móvil - eliminar estilos que causan problemas
            catalogoMenu.style.left = '';
            catalogoMenu.style.right = '';
            
            // Asegurarnos que el menú esté realmente cerrado en móvil
            catalogoMenu.style.display = '';
        }
        
        // Clave de la solución: Asegurar que solo tengamos un event listener
        // Remover cualquier event listener existente creando un clon
        const newBtn = catalogoBtn.cloneNode(true);
        if (catalogoBtn.parentNode) {
            catalogoBtn.parentNode.replaceChild(newBtn, catalogoBtn);
        }
        catalogoBtn = newBtn;
        
        // Eliminar cualquier clase o atributo Bootstrap que pueda interferir
        catalogoBtn.removeAttribute('data-bs-toggle');
        catalogoBtn.removeAttribute('data-bs-auto-close');
        
        // Comportamiento diferente para móvil y desktop pero SOLO con clic
        const toggleCatalogoMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // En dispositivos móviles, simplemente alternar la clase show
            if (window.innerWidth < 992) {
                if (catalogoMenu.classList.contains('show')) {
                    catalogoMenu.classList.remove('show');
                    catalogoBtn.setAttribute('aria-expanded', 'false');
                    // Eliminar display inline para móvil
                    catalogoMenu.style.display = '';
                } else {
                    catalogoMenu.classList.add('show');
                    catalogoBtn.setAttribute('aria-expanded', 'true');
                    // No establecer display block en móvil, dejar que el CSS lo maneje
                }
            } else {
                // En dispositivos de escritorio
                if (catalogoMenu.classList.contains('show')) {
                    catalogoMenu.classList.remove('show');
                    catalogoBtn.setAttribute('aria-expanded', 'false');
                    catalogoMenu.style.display = '';
                } else {
                    // Aplicar configuración para escritorio
                    catalogoMenu.style.left = '0';
                    catalogoMenu.style.right = '0';
                    catalogoDropdown.classList.add('position-static');
                    catalogoMenu.classList.add('w-100');
                    catalogoMenu.classList.add('premium-dropdown');
                    
                    // Mostrar el menú
                    catalogoMenu.classList.add('show');
                    catalogoBtn.setAttribute('aria-expanded', 'true');
                    catalogoMenu.style.display = 'block';
                }
            }
            
            return false;
        };
        
        // Agregar evento directamente al botón - SOLO CLICK (NO HOVER)
        catalogoBtn.addEventListener('click', toggleCatalogoMenu);
        catalogoBtn.addEventListener('touchstart', toggleCatalogoMenu, {passive: false});
        
        // Ya no configuramos eventos de hover aquí
        
        // Cerrar el menú al hacer clic en cualquier otro lugar
        const closeMenuHandler = (e) => {
            if (catalogoDropdown && !catalogoDropdown.contains(e.target)) {
                if (catalogoMenu && catalogoMenu.classList.contains('show')) {
                    catalogoMenu.classList.remove('show');
                    if (catalogoBtn) {
                        catalogoBtn.setAttribute('aria-expanded', 'false');
                    }
                    catalogoMenu.style.display = '';
                }
            }
        };
        
        // Registrar eventos globales usando nuestro método de limpieza
        this.registerGlobalEvent(document, 'click', closeMenuHandler);
        this.registerGlobalEvent(document, 'touchstart', closeMenuHandler, {passive: true});
        
        // Cerrar el menú al presionar la tecla Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && catalogoMenu && catalogoMenu.classList.contains('show')) {
                catalogoMenu.classList.remove('show');
                if (catalogoBtn) {
                    catalogoBtn.setAttribute('aria-expanded', 'false');
                }
                catalogoMenu.style.display = '';
            }
        };
        
        this.registerGlobalEvent(document, 'keydown', escapeHandler);
        
        // Añadir manejador de redimensionamiento para mantener las clases correctas
        const resizeHandler = () => {
            // Ajustar posicionamiento al cambiar tamaño de ventana
            if (window.innerWidth >= 992) {
                // Ajustes para escritorio
                catalogoDropdown.classList.add('position-static');
                catalogoMenu.classList.add('w-100');
                catalogoMenu.classList.add('premium-dropdown');
                catalogoMenu.style.left = '0';
                catalogoMenu.style.right = '0';
            } else {
                // Ajustes para móvil - quitar estilos inline
                catalogoMenu.style.left = '';
                catalogoMenu.style.right = '';
                catalogoMenu.style.display = '';
            }
            
            // Cerrar menú si está abierto cuando se redimensiona
            if (catalogoMenu.classList.contains('show')) {
                catalogoMenu.classList.remove('show');
                catalogoBtn.setAttribute('aria-expanded', 'false');
            }
        };
        
        this.registerGlobalEvent(window, 'resize', resizeHandler);
        
        console.log('Dropdown de Catálogo configurado con gestión personalizada (solo clic)');
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