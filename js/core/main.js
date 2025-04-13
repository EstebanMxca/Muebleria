/**
 * Inicializador central para Mueblería Cabañas
 * Este archivo centraliza y coordina la inicialización de todos los componentes
 */

// Imports (comentados porque estamos usando carga tradicional de scripts)
// import { ProductService } from './product-service.js';
// import { UIUtils } from './ui-utils.js';
// import { Loader } from './loader.js';

// Referencias a componentes
const components = {
    productService: null,
    uiUtils: null,
    loader: null,
    navbarComponent: null,
    productModal: null,
    contactForm: null,
    cotizacionWizard: null,
    lightweightAnimations: null
};

// Páginas específicas
const pages = {
    index: null,
    category: null,
    admin: null
};

// Detectar tipo de página
function detectPageType() {
    const path = window.location.pathname;
    
    if (path.endsWith('index.html') || path.endsWith('/')) {
        return 'home';
    } else if (path.includes('admin-productos-destacados.html')) {
        return 'admin';
    } else if (path.match(/salas|comedores|recamaras|cabeceras|mesas-centro/)) {
        return 'category';
    } else {
        return 'other';
    }
}

// Inicializar componentes según la página
function initializeComponents(pageType) {
    console.log(`Inicializando componentes para página: ${pageType}`);
    
    // Componentes comunes a todas las páginas
    components.lightweightAnimations = window.lightweightAnimations;
    components.uiUtils = window.uiUtils;
    components.loader = window.loader;
    components.productModal = window.productModal;
    
    // Inicializar según tipo de página
    switch (pageType) {
        case 'home':
            components.productService = window.productService;
            if (components.productService) components.productService.init();
            pages.index = window.indexPage;
            if (pages.index) pages.index.init();
            break;
            
        case 'category':
            components.productService = window.productService;
            if (components.productService) components.productService.init();
            pages.category = window.categoryPage;
            if (pages.category) pages.category.init();
            break;
            
        case 'admin':
            pages.admin = window.adminPage;
            if (pages.admin) pages.admin.init();
            break;
    }
    
    // Componentes que siempre se inicializan después de cargar contenido
    document.addEventListener('components:loaded', () => {
        components.navbarComponent = window.navbarComponent;
        if (components.navbarComponent && !components.navbarComponent.initialized) {
            components.navbarComponent.init();
        }
        
        components.contactForm = window.contactForm;
        if (components.contactForm && !components.contactForm.initialized) {
            components.contactForm.init();
        }
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const pageType = detectPageType();
    initializeComponents(pageType);
    console.log('Inicialización central completada');
});

// Exportar para uso global
window.appMain = {
    components,
    pages,
    detectPageType
};