/**
 * Mueblería Cabañas - Utilidades de UI
 * Proporciona funciones de utilidad para la interfaz de usuario
 */

class UIUtils {
    constructor() {
        // Configuración de animaciones
        this.animationConfig = {
            duration: 300,
            easing: 'ease'
        };
        
        // Configuración de notificaciones
        this.notificationConfig = {
            duration: 5000,
            position: 'bottom-right'
        };
        
        // Contador para IDs únicos
        this.idCounter = 0;
        
        // Caché de estilos añadidos dinámicamente
        this.styleCache = new Set();
    }
    
    /**
     * Genera un ID único
     * @param {string} prefix - Prefijo para el ID
     * @returns {string} - ID único
     */
    generateUniqueId(prefix = 'ui') {
        this.idCounter++;
        return `${prefix}-${Date.now()}-${this.idCounter}`;
    }
    
    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, error, info, warning)
     * @param {Object} options - Opciones adicionales
     */
    showToast(message, type = 'info', options = {}) {
        // Combinar opciones con configuración predeterminada
        const config = { ...this.notificationConfig, ...options };
        
        // Determinar clase según tipo
        let bgClass = 'bg-info';
        let iconClass = 'bi-info-circle';
        
        switch (type) {
            case 'success':
                bgClass = 'bg-success';
                iconClass = 'bi-check-circle';
                break;
            case 'error':
                bgClass = 'bg-danger';
                iconClass = 'bi-exclamation-triangle';
                break;
            case 'warning':
                bgClass = 'bg-warning';
                iconClass = 'bi-exclamation-circle';
                break;
        }
        
        // Crear contenedor de toasts si no existe
        const position = config.position || 'bottom-right';
        let positionClass = 'bottom-0 end-0';
        
        if (position === 'top-right') positionClass = 'top-0 end-0';
        if (position === 'top-left') positionClass = 'top-0 start-0';
        if (position === 'bottom-left') positionClass = 'bottom-0 start-0';
        if (position === 'top-center') positionClass = 'top-0 start-50 translate-middle-x';
        if (position === 'bottom-center') positionClass = 'bottom-0 start-50 translate-middle-x';
        
        let toastContainer = document.querySelector(`.toast-container.${positionClass.replace(' ', '.')}`);
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = `toast-container position-fixed ${positionClass} p-3`;
            document.body.appendChild(toastContainer);
        }
        
        // Crear ID único para el toast
        const toastId = this.generateUniqueId('toast');
        
        // Crear elemento toast
        const toastEl = document.createElement('div');
        toastEl.id = toastId;
        toastEl.className = `toast align-items-center text-white ${bgClass} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${iconClass} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        
        // Mostrar el toast usando Bootstrap si está disponible
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const toast = new bootstrap.Toast(toastEl, {
                delay: config.duration,
                autohide: true
            });
            toast.show();
        } else {
            // Fallback si Bootstrap no está disponible
            toastEl.style.display = 'block';
            toastEl.style.opacity = '1';
            
            setTimeout(() => {
                toastEl.style.opacity = '0';
                setTimeout(() => {
                    if (toastEl.parentNode) {
                        toastEl.parentNode.removeChild(toastEl);
                    }
                }, 300);
            }, config.duration);
        }
        
        // Devolver el ID del toast para posibles referencias futuras
        return toastId;
    }
    
    /**
     * Muestra un diálogo de confirmación
     * @param {string} message - Mensaje del diálogo
     * @param {Object} options - Opciones del diálogo
     * @returns {Promise} - Promesa que se resuelve con la acción del usuario
     */
    showConfirmDialog(message, options = {}) {
        return new Promise((resolve) => {
            // Opciones por defecto
            const defaultOptions = {
                title: 'Confirmación',
                confirmText: 'Aceptar',
                cancelText: 'Cancelar',
                confirmButtonClass: 'btn-primary',
                cancelButtonClass: 'btn-secondary',
                icon: 'bi-question-circle'
            };
            
            // Combinar opciones
            const config = { ...defaultOptions, ...options };
            
            // Crear ID único para el modal
            const modalId = this.generateUniqueId('confirm-dialog');
            
            // Crear elemento modal
            const modalEl = document.createElement('div');
            modalEl.id = modalId;
            modalEl.className = 'modal fade';
            modalEl.setAttribute('tabindex', '-1');
            modalEl.setAttribute('aria-hidden', 'true');
            
            modalEl.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi ${config.icon} me-2"></i>${config.title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn ${config.cancelButtonClass}" data-bs-dismiss="modal">${config.cancelText}</button>
                            <button type="button" class="btn ${config.confirmButtonClass}" id="${modalId}-confirm">${config.confirmText}</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Añadir modal al body
            document.body.appendChild(modalEl);
            
            // Configurar botones
            const confirmBtn = document.getElementById(`${modalId}-confirm`);
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }
                    resolve(true);
                });
            }
            
            // Evento para cancelar
            modalEl.addEventListener('hidden.bs.modal', () => {
                // Eliminar modal después de ocultar
                setTimeout(() => {
                    if (modalEl.parentNode) {
                        modalEl.parentNode.removeChild(modalEl);
                    }
                }, 300);
                
                // Resolver con false si no se confirmó
                if (!confirmBtn.classList.contains('clicked')) {
                    resolve(false);
                }
            });
            
            // Mostrar modal
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            } else {
                // Fallback si Bootstrap no está disponible
                modalEl.style.display = 'block';
                modalEl.classList.add('show');
                modalEl.setAttribute('aria-modal', 'true');
                modalEl.removeAttribute('aria-hidden');
                document.body.classList.add('modal-open');
                
                // Backdrop fallback
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        });
    }
    
    /**
     * Añade un loader global a la página
     * @param {boolean} show - Indica si mostrar u ocultar el loader
     * @param {string} message - Mensaje opcional para mostrar durante la carga
     */
    toggleGlobalLoader(show, message = 'Cargando...') {
        const loaderId = 'global-loading-indicator';
        let loader = document.getElementById(loaderId);
        
        if (show) {
            // Crear loader si no existe
            if (!loader) {
                loader = document.createElement('div');
                loader.id = loaderId;
                loader.className = 'loading-overlay';
                
                loader.innerHTML = `
                    <div class="loading-spinner-container">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="loading-message mt-3">${message}</p>
                    </div>
                `;
                
                document.body.appendChild(loader);
                
                // Añadir estilos si no existen
                this.addStylesIfNeeded('loader-styles', `
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(255, 255, 255, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 9999;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.3s, visibility 0.3s;
                    }
                    
                    .loading-overlay.active {
                        opacity: 1;
                        visibility: visible;
                    }
                    
                    .loading-spinner-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background-color: white;
                        border-radius: 12px;
                        padding: 30px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                    }
                    
                    .loading-message {
                        color: #666;
                        font-weight: 500;
                        margin-top: 15px;
                    }
                `);
            } else {
                // Actualizar mensaje si ya existe
                const messageEl = loader.querySelector('.loading-message');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            }
            
            // Mostrar loader
            setTimeout(() => {
                loader.classList.add('active');
            }, 0);
            
        } else if (loader) {
            // Ocultar loader
            loader.classList.remove('active');
            
            // Eliminar después de la transición
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 300);
        }
    }
    
    /**
     * Añade estilos CSS dinámicamente si no existen
     * @param {string} id - ID para el elemento de estilo
     * @param {string} styles - Estilos CSS
     */
    addStylesIfNeeded(id, styles) {
        // Verificar si ya se han añadido estos estilos
        if (this.styleCache.has(id) || document.getElementById(id)) {
            return;
        }
        
        // Crear elemento de estilo
        const styleEl = document.createElement('style');
        styleEl.id = id;
        styleEl.textContent = styles;
        
        // Añadir al head
        document.head.appendChild(styleEl);
        
        // Añadir a caché
        this.styleCache.add(id);
    }
    
    /**
     * Crea una animación suave para un elemento
     * @param {HTMLElement} element - Elemento a animar
     * @param {Object} properties - Propiedades CSS a animar
     * @param {Object} options - Opciones adicionales
     * @returns {Promise} - Promesa que se resuelve cuando la animación termina
     */
    animateElement(element, properties, options = {}) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            // Combinar opciones con configuración predeterminada
            const config = { ...this.animationConfig, ...options };
            
            // Configurar animación
            element.style.transition = `all ${config.duration}ms ${config.easing}`;
            
            // Aplicar propiedades
            Object.entries(properties).forEach(([prop, value]) => {
                element.style[prop] = value;
            });
            
            // Evento para detectar fin de animación
            const handleAnimationEnd = () => {
                element.removeEventListener('transitionend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('transitionend', handleAnimationEnd);
            
            // Seguro por si la animación no dispara el evento
            setTimeout(resolve, config.duration + 50);
        });
    }
    
    /**
     * Scroll suave a un elemento o posición
     * @param {HTMLElement|number} target - Elemento o posición Y
     * @param {Object} options - Opciones adicionales
     */
    scrollTo(target, options = {}) {
        // Opciones por defecto
        const defaultOptions = {
            offset: 0,
            behavior: 'smooth'
        };
        
        // Combinar opciones
        const config = { ...defaultOptions, ...options };
        
        // Determinar posición Y
        let yPosition;
        
        if (typeof target === 'number') {
            yPosition = target;
        } else if (target instanceof HTMLElement) {
            const rect = target.getBoundingClientRect();
            yPosition = rect.top + window.pageYOffset;
        } else {
            return;
        }
        
        // Aplicar offset
        yPosition += config.offset;
        
        // Scroll
        window.scrollTo({
            top: yPosition,
            behavior: config.behavior
        });
    }
    
    /**
     * Valida un formulario HTML5
     * @param {HTMLFormElement} form - Formulario a validar
     * @returns {boolean} - Verdadero si el formulario es válido
     */
    validateForm(form) {
        if (!form || !(form instanceof HTMLFormElement)) {
            return false;
        }
        
        // Eliminar mensajes de error previos
        form.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        // Verificar validez nativa de HTML5
        const isValid = form.checkValidity();
        
        // Marcar campos inválidos
        if (!isValid) {
            const invalidFields = form.querySelectorAll(':invalid');
            
            invalidFields.forEach(field => {
                field.classList.add('is-invalid');
                
                // Crear mensaje de error si no existe
                let feedback = field.nextElementSibling;
                if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    
                    // Obtener mensaje de validación
                    if (field.validity.valueMissing) {
                        feedback.textContent = 'Este campo es obligatorio.';
                    } else if (field.validity.typeMismatch) {
                        feedback.textContent = 'Por favor, introduce un valor válido.';
                    } else if (field.validity.patternMismatch) {
                        feedback.textContent = 'El formato no es válido.';
                    } else {
                        feedback.textContent = 'Este campo no es válido.';
                    }
                    
                    field.parentNode.insertBefore(feedback, field.nextSibling);
                }
            });
        }
        
        return isValid;
    }
    
    /**
     * Crea una paginación dinámica para elementos
     * @param {Object} options - Opciones de configuración
     * @returns {Object} - Controlador de paginación
     */
    createPagination(options = {}) {
        // Opciones por defecto
        const defaultOptions = {
            container: null,
            itemsPerPage: 10,
            currentPage: 1,
            totalItems: 0,
            renderPage: null,
            onPageChange: null
        };
        
        // Combinar opciones
        const config = { ...defaultOptions, ...options };
        
        // Verificar opciones requeridas
        if (!config.container || !config.renderPage) {
            console.error('Opciones requeridas no proporcionadas: container y renderPage');
            return null;
        }
        
        // Calcular total de páginas
        const totalPages = Math.max(1, Math.ceil(config.totalItems / config.itemsPerPage));
        
        // Controlador de paginación
        const controller = {
            currentPage: config.currentPage,
            totalPages: totalPages,
            
            // Renderiza la página actual
            renderCurrentPage() {
                // Calcular índices
                const startIndex = (this.currentPage - 1) * config.itemsPerPage;
                const endIndex = Math.min(startIndex + config.itemsPerPage, config.totalItems);
                
                // Llamar a función de renderizado
                config.renderPage(startIndex, endIndex, this.currentPage);
                
                // Renderizar controles
                this.renderControls();
                
                // Llamar a callback si existe
                if (typeof config.onPageChange === 'function') {
                    config.onPageChange(this.currentPage);
                }
            },
            
            // Navega a una página específica
            goToPage(page) {
                if (page < 1 || page > this.totalPages) {
                    return;
                }
                
                this.currentPage = page;
                this.renderCurrentPage();
            },
            
            // Ir a la página siguiente
            nextPage() {
                this.goToPage(this.currentPage + 1);
            },
            
            // Ir a la página anterior
            prevPage() {
                this.goToPage(this.currentPage - 1);
            },
            
            // Renderiza los controles de paginación
            renderControls() {
                // Crear contenedor de paginación si no existe
                let paginationContainer = config.container.querySelector('.ui-pagination');
                
                if (!paginationContainer) {
                    paginationContainer = document.createElement('nav');
                    paginationContainer.className = 'ui-pagination';
                    paginationContainer.setAttribute('aria-label', 'Navegación de páginas');
                    config.container.appendChild(paginationContainer);
                }
                
                // Generar HTML para paginación
                let paginationHTML = '<ul class="pagination justify-content-center">';
                
                // Botón anterior
                paginationHTML += `
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link" aria-label="Anterior" ${this.currentPage === 1 ? 'disabled' : ''}>
                            <span aria-hidden="true">&laquo;</span>
                        </button>
                    </li>
                `;
                
                // Generar enlaces de página
                const maxVisiblePages = 5;
                let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
                
                if (endPage - startPage < maxVisiblePages - 1) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                    paginationHTML += `
                        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                            <button class="page-link" data-page="${i}">${i}</button>
                        </li>
                    `;
                }
                
                // Botón siguiente
                paginationHTML += `
                    <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                        <button class="page-link" aria-label="Siguiente" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                            <span aria-hidden="true">&raquo;</span>
                        </button>
                    </li>
                `;
                
                paginationHTML += '</ul>';
                
                // Actualizar HTML
                paginationContainer.innerHTML = paginationHTML;
                
                // Configurar eventos
                const prevBtn = paginationContainer.querySelector('.page-item:first-child .page-link');
                const nextBtn = paginationContainer.querySelector('.page-item:last-child .page-link');
                
                if (prevBtn) {
                    prevBtn.addEventListener('click', () => {
                        if (this.currentPage > 1) {
                            this.prevPage();
                        }
                    });
                }
                
                if (nextBtn) {
                    nextBtn.addEventListener('click', () => {
                        if (this.currentPage < this.totalPages) {
                            this.nextPage();
                        }
                    });
                }
                
                // Configurar botones de página
                const pageButtons = paginationContainer.querySelectorAll('.page-link[data-page]');
                pageButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const page = parseInt(button.getAttribute('data-page'));
                        if (page && page !== this.currentPage) {
                            this.goToPage(page);
                        }
                    });
                });
            }
        };
        
        // Renderizar página inicial
        controller.renderCurrentPage();
        
        return controller;
    }
}

// Crear instancia global de utilidades de UI
window.uiUtils = new UIUtils();