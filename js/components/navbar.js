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
            initialized: false  // Bandera de inicialización
        };
        
        // Crear un nuevo objeto con handlers de limpieza global
        window.navbarCleanupHandlers = window.navbarCleanupHandlers || [];
    
        // Configurar eventos de inicialización
        this.setupInitListeners();
    }
    
    /**
     * Configura los listeners para inicialización
     */
    setupInitListeners() {
        // Intentar inicializar inmediatamente
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(() => this.initElements(), 100);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.initElements(), 100);
            });
        }
        
        // Intento adicional después de eventos específicos
        document.addEventListener('components:loaded', () => {
            if (!this.state.initialized) {
                console.log('Evento components:loaded recibido, intentando inicializar navbar');
                setTimeout(() => this.initElements(), 100);
            }
        });
        
        window.addEventListener('load', () => {
            if (!this.state.initialized) {
                console.log('Evento load disparado, intentando inicializar navbar');
                setTimeout(() => this.initElements(), 100);
            }
        });
        
        // Listener para manejar recargas o cambios de página con SPA
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.state.initialized) {
                console.log('Página visible de nuevo, verificando inicialización del navbar');
                setTimeout(() => this.initElements(), 100);
            }
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
        
        // Buscar elemento navbar principal con selector más amplio
        this.elements.navbar = document.querySelector('nav, .navbar, .stunning-navbar, .custom-navbar');
        
        if (this.elements.navbar) {
            console.log('Navbar encontrado en el DOM:', this.elements.navbar);
            
            // Buscar dropdowns de manera más consistente
            this.elements.dropdowns = this.elements.navbar.querySelectorAll('.dropdown-toggle');
            this.elements.cotizacionBtn = document.getElementById('cotizacionBtn');
            
            // Inicializar solo si no está ya inicializado
            if (!this.state.initialized) {
                this.init();
            } else {
                console.log('Navbar ya inicializado, verificando estado del catálogo dropdown');
                // Reinicializar específicamente el dropdown de catálogo si es necesario
                setTimeout(() => this.setupCatalogoDropdown(), 200);
            }
        } else {
            console.warn('Navbar no encontrado en la página, reintentando en 300ms');
            setTimeout(() => {
                this.elements.navbar = document.querySelector('nav, .navbar, .stunning-navbar, .custom-navbar');
                if (this.elements.navbar) {
                    console.log('Navbar encontrado en segundo intento');
                    this.elements.dropdowns = this.elements.navbar.querySelectorAll('.dropdown-toggle');
                    this.elements.cotizacionBtn = document.getElementById('cotizacionBtn');
                    this.init();
                }
            }, 300);
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
        // Usar un retraso para asegurar que el DOM está listo
        setTimeout(() => {
            this.setupCatalogoDropdown();
        }, 200);
        
        // Actualizar elementos activos
        this.updateActiveItem();
        
        console.log('Componente Navbar inicializado correctamente');
        
        // Notificar que el navbar está listo
        document.dispatchEvent(new CustomEvent('navbar:ready', { 
            detail: { timestamp: Date.now() } 
        }));
    }
    
    /**
     * Configura el efecto de scroll para el navbar
     */
    setupScrollEffect() {
        // Código existente para el efecto de scroll
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
        // Código existente para setup de dropdowns
        if (!this.elements.dropdowns || this.elements.dropdowns.length === 0) {
            console.warn('No se encontraron dropdowns para configurar');
            return;
        }
        
        // Función para manejar el comportamiento en móvil
        const handleMobileDropdown = (e, dropdown) => {
            if (window.innerWidth < 992) {
                // Detener completamente la propagación y el comportamiento por defecto
                e.preventDefault();
                e.stopPropagation();
                
                // Encontrar el menú desplegable asociado
                const dropdownMenu = dropdown.nextElementSibling;
                if (!dropdownMenu) return false;
                
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
            if (dropdown.closest('#catalogo-dropdown') || 
                dropdown.id === 'catalogo-btn' || 
                dropdown.textContent.trim().includes('Catálogo')) {
                console.log('Dropdown de catálogo detectado, se configurará por separado');
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
     * Configura específicamente el dropdown de Catálogo con una solución robusta
     */
    setupCatalogoDropdown() {
        console.log('Configurando manejo específico del dropdown de Catálogo');
        
        // --------- ENCONTRAR ELEMENTOS POR MÚLTIPLES MÉTODOS ---------
        
        // 1. Buscar por ID específico
        let catalogoDropdown = document.getElementById('catalogo-dropdown');
        let catalogoBtn = document.getElementById('catalogo-btn');
        let catalogoMenu = document.getElementById('catalogo-menu');
        
        // 2. Si no encuentra por ID, buscar por contenido de texto
        if (!catalogoDropdown || !catalogoBtn || !catalogoMenu) {
            console.log('No se encontraron elementos por ID, buscando por texto "Catálogo"');
            
            // Buscar el item del navbar que contenga el texto "Catálogo"
            const navItems = document.querySelectorAll('.nav-item');
            for (let item of navItems) {
                const textContent = item.textContent.trim();
                if (textContent.includes('Catálogo')) {
                    catalogoDropdown = item;
                    catalogoBtn = item.querySelector('.dropdown-toggle, [data-bs-toggle="dropdown"]');
                    catalogoMenu = item.querySelector('.dropdown-menu');
                    console.log('Dropdown de catálogo encontrado por texto:', catalogoDropdown);
                    break;
                }
            }
        }
        
        // 3. Método de respaldo: buscar por estructura
        if (!catalogoDropdown || !catalogoBtn || !catalogoMenu) {
            console.log('Buscando dropdown por estructura', this.elements.dropdowns);
            
            // Buscar cualquier dropdown en el navbar
            if (this.elements.dropdowns && this.elements.dropdowns.length > 0) {
                for (let dropdown of this.elements.dropdowns) {
                    const menu = dropdown.nextElementSibling;
                    if (menu && menu.classList.contains('dropdown-menu')) {
                        // Verificar si contiene items que parecen categorías (sala, comedor, etc.)
                        const menuItems = menu.querySelectorAll('a');
                        for (let item of menuItems) {
                            const itemText = item.textContent.trim().toLowerCase();
                            if (itemText.includes('sala') || 
                                itemText.includes('comedor') || 
                                itemText.includes('recámara') || 
                                itemText.includes('cabecera')) {
                                
                                catalogoDropdown = dropdown.closest('.nav-item') || dropdown.parentElement;
                                catalogoBtn = dropdown;
                                catalogoMenu = menu;
                                console.log('Dropdown de catálogo encontrado por estructura:', catalogoDropdown);
                                break;
                            }
                        }
                    }
                    
                    if (catalogoBtn) break;
                }
            }
        }
        
        // Verificar si encontramos los elementos
        if (!catalogoDropdown || !catalogoBtn || !catalogoMenu) {
            console.error('No se encontraron elementos del dropdown de Catálogo');
            return;
        }
        
        // --------- ASIGNAR IDS PARA REFERENCIA FUTURA ---------
        if (!catalogoDropdown.id) catalogoDropdown.id = 'catalogo-dropdown';
        if (!catalogoBtn.id) catalogoBtn.id = 'catalogo-btn';
        if (!catalogoMenu.id) catalogoMenu.id = 'catalogo-menu';
        
        console.log('Elementos del dropdown de Catálogo encontrados y con IDs asignados');
        
        // --------- REMOVER CONFIGURACIÓN EXISTENTE ---------
        
        // 1. Eliminar cualquier instancia de Bootstrap
        if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
            const instance = bootstrap.Dropdown.getInstance(catalogoBtn);
            if (instance) {
                console.log('Eliminando instancia de Bootstrap Dropdown');
                instance.dispose();
            }
        }
        
        // 2. Eliminar atributos de control de Bootstrap
        catalogoBtn.removeAttribute('data-bs-toggle');
        catalogoBtn.removeAttribute('data-bs-auto-close');
        
        // 3. Clonar para eliminar eventos existentes
        const newBtn = catalogoBtn.cloneNode(true);
        if (catalogoBtn.parentNode) {
            catalogoBtn.parentNode.replaceChild(newBtn, catalogoBtn);
        }
        catalogoBtn = newBtn;
        
        // --------- REINICIAR ESTADO ---------
        
        // Ocultar el menú inicialmente
        catalogoMenu.classList.remove('show');
        catalogoBtn.setAttribute('aria-expanded', 'false');
        catalogoMenu.style.display = '';
        
        // --------- APLICAR CONFIGURACIÓN SEGÚN DISPOSITIVO ---------
        this.applyCatalogoStyles(catalogoDropdown, catalogoBtn, catalogoMenu);
        
        // --------- CONFIGURAR EVENTOS ESPECÍFICOS ---------
        
        // Función para alternar el menú
        const toggleCatalogoMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Toggle catalogo menu');
            
            const isCurrentlyOpen = catalogoMenu.classList.contains('show');
            
            // Cerrar todos los demás dropdowns primero
            document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                if (openMenu !== catalogoMenu) {
                    openMenu.classList.remove('show');
                    const openBtn = openMenu.previousElementSibling;
                    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
                    openMenu.style.display = '';
                }
            });
            
            // Alternar estado
            if (isCurrentlyOpen) {
                catalogoMenu.classList.remove('show');
                catalogoBtn.setAttribute('aria-expanded', 'false');
                catalogoMenu.style.display = '';
            } else {
                // Reconfigurar estilos antes de mostrar
                this.applyCatalogoStyles(catalogoDropdown, catalogoBtn, catalogoMenu);
                
                // Mostrar
                catalogoMenu.classList.add('show');
                catalogoBtn.setAttribute('aria-expanded', 'true');
                
                // En móvil no establecemos display:block explícitamente
                if (window.innerWidth >= 992) {
                    catalogoMenu.style.display = 'block';
                }
            }
            
            return false;
        };
        
        // Evento de click/tap
        catalogoBtn.addEventListener('click', toggleCatalogoMenu);
        
        // Prevenir eventos fantasma en móviles
        catalogoBtn.addEventListener('touchstart', (e) => {
            e.stopPropagation();
        }, {passive: true});
        
        // Manejar click fuera para cerrar
        const closeMenuHandler = (e) => {
            if (!catalogoDropdown.contains(e.target) && 
                !e.target.closest('.dropdown-menu') && 
                catalogoMenu.classList.contains('show')) {
                
                catalogoMenu.classList.remove('show');
                catalogoBtn.setAttribute('aria-expanded', 'false');
                catalogoMenu.style.display = '';
            }
        };
        
        // Registrar eventos globales
        this.registerGlobalEvent(document, 'click', closeMenuHandler);
        this.registerGlobalEvent(document, 'touchstart', closeMenuHandler, {passive: true});
        
        // Cerrar con Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && catalogoMenu.classList.contains('show')) {
                catalogoMenu.classList.remove('show');
                catalogoBtn.setAttribute('aria-expanded', 'false');
                catalogoMenu.style.display = '';
            }
        };
        
        this.registerGlobalEvent(document, 'keydown', escapeHandler);
        
        // Manejar resize
        const resizeHandler = () => {
            // Reconfigurar estilos
            this.applyCatalogoStyles(catalogoDropdown, catalogoBtn, catalogoMenu);
            
            // Cerrar menú al redimensionar
            if (catalogoMenu.classList.contains('show')) {
                catalogoMenu.classList.remove('show');
                catalogoBtn.setAttribute('aria-expanded', 'false');
                catalogoMenu.style.display = '';
            }
        };
        
        this.registerGlobalEvent(window, 'resize', resizeHandler);
        
        // Configurar delegación de eventos para los enlaces dentro del menú
        catalogoMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                // Al hacer clic en un enlace, cerrar el menú
                setTimeout(() => {
                    catalogoMenu.classList.remove('show');
                    catalogoBtn.setAttribute('aria-expanded', 'false');
                    catalogoMenu.style.display = '';
                }, 100);
            }
        });
        
        console.log('Dropdown de Catálogo configurado correctamente');
    }
    
    /**
     * Aplica estilos al dropdown de catálogo según el tamaño de la pantalla
     */
    applyCatalogoStyles(dropdown, btn, menu) {
        if (!dropdown || !btn || !menu) return;
        
        if (window.innerWidth >= 992) {
            // Estilos para desktop
            dropdown.classList.add('position-static');
            menu.classList.add('w-100');
            menu.classList.add('premium-dropdown');
            menu.style.left = '0';
            menu.style.right = '0';
        } else {
            // Estilos para móvil
            dropdown.classList.remove('position-static');
            menu.style.left = '';
            menu.style.right = '';
        }
    }
    
    /**
     * Configura el botón de cotización
     */
    setupCotizacionButton() {
        // Buscar el botón nuevamente para mayor seguridad
        this.elements.cotizacionBtn = document.getElementById('cotizacionBtn');
        
        if (!this.elements.cotizacionBtn) {
            console.warn('No se encontró el botón de cotización');
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