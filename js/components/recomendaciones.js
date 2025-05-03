/**
 * Mueblería Cabañas - Sistema de Recomendaciones
 * Este módulo centraliza la lógica de carga de recomendaciones para categorías
 */

// Solo crear una nueva instancia si no existe
if (!window.recommendationSystem) {
    class RecommendationSystem {
        constructor() {
            // Inicialización básica
            this.initialized = false;
            this.containerSelector = '#related-categories-container';
            this.retryLimit = 5; // Aumentado a 5 para mayor tolerancia
            this.retryCount = 0;
            this.timeout = null;
            this.observer = null;
            this.globalTimeout = null;
            this.observerSetupAttempts = 0;
            this.MAX_OBSERVER_SETUP_ATTEMPTS = 5;
            
            // Datos de todas las categorías para recomendaciones
            this.categoriesInfo = {
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
            
            // Mapeo de URLs a IDs de categoría
            this.urlToCategoryMap = {
                'salas.html': 'salas',
                'comedores.html': 'comedores',
                'recamaras.html': 'recamaras',
                'cabeceras.html': 'cabeceras',
                'mesas-centro.html': 'mesas-centro'
            };
        }
        
        /**
         * Inicializa el sistema de recomendaciones
         */
        init() {
            if (this.initialized) {
                console.log('Sistema de recomendaciones ya inicializado');
                return;
            }
            
            // console.log('Inicializando sistema de recomendaciones');
            
            // Detectar si estamos en una página de categoría
            const currentCategory = this.detectCurrentCategory();
            
            if (currentCategory) {
                // Si estamos en una página de categoría, configurar el observer con retraso
                // para dar tiempo a que el DOM se cargue completamente
                setTimeout(() => {
                    this.setupRecommendationsObserver();
                }, 300);
            }
            
            this.initialized = true;
            
            // Configurar timeout global para reiniciar si no se cargan las recomendaciones
            this.setGlobalTimeout();
        }
        
        /**
         * Configura un timeout global para reiniciar el sistema si algo falla
         */
        setGlobalTimeout() {
            // Limpiar timeout anterior si existe
            if (this.globalTimeout) {
                clearTimeout(this.globalTimeout);
            }
            
            // Configurar nuevo timeout (15 segundos)
            this.globalTimeout = setTimeout(() => {
                // console.log('Timeout global alcanzado, reiniciando sistema de recomendaciones');
                this.reset();
            }, 15000);
        }
        
        /**
         * Reinicia el estado del sistema para cambios de página
         */
        reset() {
            // console.log('Reiniciando sistema de recomendaciones');
            this.retryCount = 0;
            this.observerSetupAttempts = 0;
            
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            
            if (this.globalTimeout) {
                clearTimeout(this.globalTimeout);
                this.globalTimeout = null;
            }
            
            // Reestablecer timeout global
            this.setGlobalTimeout();
            
            // Intentar configurar observer nuevamente con retraso
            setTimeout(() => {
                this.setupRecommendationsObserver();
            }, 300);
        }
        
        /**
         * Detecta la categoría actual basada en varios métodos
         * @returns {string|null} ID de la categoría o null
         */
        detectCurrentCategory() {
            // 1. Intentar detectar por URL
            const path = window.location.pathname;
            
            for (const [urlPattern, categoryId] of Object.entries(this.urlToCategoryMap)) {
                if (path.includes(urlPattern)) {
                    // console.log(`Categoría detectada por URL: ${categoryId}`);
                    // return categoryId;
                }
            }
            
            // 2. Intentar detectar por ID en el DOM
            for (const categoryId of Object.keys(this.categoriesInfo)) {
                if (document.getElementById(categoryId)) {
                    // console.log(`Categoría detectada por ID en DOM: ${categoryId}`);
                    return categoryId;
                }
            }
            
            // 3. Si estamos en product-detail.html, intentar obtener categoría de la URL
            if (path.includes('product-detail.html')) {
                // Aquí podríamos obtener el ID del producto y consultar su categoría
                // Por ahora, devolvemos null para no mostrar recomendaciones en detalle de producto
                return null;
            }
            
            console.log('No se pudo detectar una categoría válida');
            return null;
        }
        
        /**
         * Configura un IntersectionObserver para cargar las recomendaciones
         * cuando el contenedor está a punto de ser visible
         */
        setupRecommendationsObserver() {
            // Si ya existe un observer, lo desconectamos
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }
            
            // Incrementar intentos de configuración
            this.observerSetupAttempts++;
            
            // Buscar el contenedor
            const container = document.querySelector(this.containerSelector);
            if (!container) {
                console.log('Contenedor de recomendaciones no encontrado');
                
                // Si hemos superado el límite de intentos, no intentar más
                if (this.observerSetupAttempts >= this.MAX_OBSERVER_SETUP_ATTEMPTS) {
                    console.warn(`Máximo de intentos alcanzado (${this.MAX_OBSERVER_SETUP_ATTEMPTS}), deteniendo intentos de configuración`);
                    return;
                }
                
                // Intentar nuevamente después de un retraso
                setTimeout(() => {
                    this.setupRecommendationsObserver();
                }, 500);
                
                return;
            }
            
            // Resetear contador de intentos ya que encontramos el contenedor
            this.observerSetupAttempts = 0;
            
            // Crear un observer con margen amplio para precargar
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Limpiar timeout anterior si existe
                        if (this.timeout) {
                            clearTimeout(this.timeout);
                        }
                        
                        // Iniciar temporizador para evitar retrasos en la UI
                        this.timeout = setTimeout(() => {
                            const currentCategory = this.detectCurrentCategory();
                            if (currentCategory) {
                                this.loadRecommendations(currentCategory);
                            }
                            
                            // Dejar de observar después de cargar
                            if (this.observer) {
                                this.observer.unobserve(container);
                            }
                        }, 200);
                    }
                });
            }, {
                rootMargin: '200px', // Precargar cuando esté a 200px de ser visible
                threshold: 0.1
            });
            
            // Empezar a observar
            this.observer.observe(container);
            // console.log('Observer de recomendaciones configurado');
        }
        
        /**
         * Carga las recomendaciones basadas en la categoría actual
         * @param {string} currentCategory - ID de la categoría actual
         */
        loadRecommendations(currentCategory) {
            // console.log(`Cargando recomendaciones para categoría: ${currentCategory}`);
            
            // Buscar contenedor
            const container = document.querySelector(this.containerSelector);
            if (!container) {
                console.error('Contenedor de recomendaciones no encontrado en el DOM');
                
                // Si no encontramos el contenedor, intentar nuevamente después de un retraso
                if (this.retryCount < this.retryLimit) {
                    this.retryCount++;
                    console.log(`Reintentando búsqueda de contenedor (${this.retryCount}/${this.retryLimit})...`);
                    
                    setTimeout(() => {
                        this.loadRecommendations(currentCategory);
                    }, 500);
                }
                
                return;
            }
            
            // Normalizar categoría actual
            const normalizedCategory = this.normalizeCategory(currentCategory);
            
            // Filtrar categorías para no mostrar la actual
            const categoriesToShow = Object.keys(this.categoriesInfo)
                .filter(cat => cat !== normalizedCategory)
                .slice(0, 4); // Limitar a 4 recomendaciones
            
            // Verificar si tenemos categorías para mostrar
            if (categoriesToShow.length === 0) {
                container.innerHTML = '<div class="row"><div class="col-12 text-center py-4"><p>No hay recomendaciones disponibles</p></div></div>';
                return;
            }
            
            try {
                // Generar HTML para recomendaciones
                const recomendacionesHTML = categoriesToShow.map((categoria) => {
                    const info = this.categoriesInfo[categoria];
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
                
                // Insertar HTML en el contenedor
                container.innerHTML = `<div class="row">${recomendacionesHTML}</div>`;
                
                // Reiniciar contador de reintentos
                this.retryCount = 0;
                
                // Limpiar timeout global ya que las recomendaciones se cargaron correctamente
                if (this.globalTimeout) {
                    clearTimeout(this.globalTimeout);
                    this.globalTimeout = null;
                }
                
                // Reiniciar AOS si está disponible
                if (typeof AOS !== 'undefined') {
                    setTimeout(() => {
                        AOS.refresh();
                    }, 100);
                }
            } catch (error) {
                console.error('Error al cargar recomendaciones:', error);
                
                // Incrementar contador de reintentos
                this.retryCount++;
                
                if (this.retryCount <= this.retryLimit) {
                    console.log(`Reintentando cargar recomendaciones (${this.retryCount}/${this.retryLimit})...`);
                    
                    // Mostrar indicador de reintento
                    container.innerHTML = `
                        <div class="row">
                            <div class="col-12 text-center py-4">
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">Reintentando cargar recomendaciones...</span>
                                </div>
                                <p class="mt-2 small text-muted">Reintentando cargar recomendaciones...</p>
                            </div>
                        </div>
                    `;
                    
                    // Reintentar después de un retraso
                    setTimeout(() => {
                        this.loadRecommendations(currentCategory);
                    }, 1000);
                } else {
                    // Mostrar mensaje de error después de agotar reintentos
                    container.innerHTML = `
                        <div class="row">
                            <div class="col-12 text-center py-4">
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    No se pudieron cargar las recomendaciones.
                                    <button class="btn btn-sm btn-outline-primary ms-2" id="retry-recommendations">
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Configurar botón de reintento
                    const retryButton = document.getElementById('retry-recommendations');
                    if (retryButton) {
                        retryButton.addEventListener('click', () => {
                            this.retryCount = 0;
                            this.loadRecommendations(currentCategory);
                        });
                    }
                }
            }
        }
        
        /**
         * Normaliza el ID de una categoría para garantizar consistencia
         * @param {string} categoryId - ID de la categoría a normalizar
         * @returns {string} - ID normalizado
         */
        normalizeCategory(categoryId) {
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
    }

    // Crear instancia global del sistema de recomendaciones
    window.recommendationSystem = new RecommendationSystem();

    // Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', () => {
        // Esperar un momento para asegurar que todos los componentes estén cargados
        setTimeout(() => {
            if (window.recommendationSystem && !window.recommendationSystem.initialized) {
                window.recommendationSystem.init();
            }
        }, 500);
    });
    
    // Configurar controlador para cuando la página se haya cargado completamente
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (window.recommendationSystem) {
                // Verificar si el sistema ya está inicializado
                if (!window.recommendationSystem.initialized) {
                    window.recommendationSystem.init();
                } else {
                    // Si ya está inicializado, reiniciar para asegurar que todo funcione
                    window.recommendationSystem.reset();
                }
            }
        }, 1000);
    });
} else {
    console.log('Sistema de recomendaciones ya está instanciado');
}