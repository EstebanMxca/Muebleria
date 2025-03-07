/**
 * Mueblería Cabañas - Sistema de Cotización Optimizado
 * Gestiona el modal y wizard para solicitudes de cotización
 */

class CotizacionWizard {
    constructor() {
        // Referencias a elementos del DOM
        this.elements = {
            steps: null,
            prevBtn: null,
            nextBtn: null,
            submitBtn: null,
            categoryCards: null,
            modal: null
        };
        
        // Estado del wizard
        this.state = {
            currentStep: 1,
            maxSteps: 0,
            data: {
                categoria: '',
                estilo: '',
                material: '',
                color: '',
                presupuesto: '',
                detallesAdicionales: '',
                nombre: '',
                telefono: '',
                email: '',
                contactoPreferido: 'whatsapp',
                urgente: false
            }
        };
        
        // Esperar a que el DOM esté listo y luego inicializar
        document.addEventListener('DOMContentLoaded', () => {
            this.initElements();
        });
        
        // También escuchar por si el modal se carga dinámicamente
        document.addEventListener('components:loaded', () => {
            this.initElements();
        });
        
        // Escuchar evento de mostrar modal
        document.addEventListener('shown.bs.modal', (event) => {
            if (event.target && event.target.id === 'cotizacionModal') {
                console.log('Modal de cotización mostrado, reinicializando elementos');
                this.initElements();
            }
        });
    }
    
    /**
     * Intenta obtener los elementos del DOM
     */
    initElements() {
        console.log('Intentando inicializar elementos del wizard');
        // Intentar obtener los elementos del DOM
        this.elements.modal = document.getElementById('cotizacionModal');
        if (this.elements.modal) {
            console.log('Modal de cotización encontrado en initElements');
            this.elements.steps = this.elements.modal.querySelectorAll('.cotizacion-step');
            this.elements.prevBtn = document.getElementById('prevStepBtn');
            this.elements.nextBtn = document.getElementById('nextStepBtn');
            this.elements.submitBtn = document.getElementById('submitBtn');
            this.elements.categoryCards = this.elements.modal.querySelectorAll('.category-card');
            
            console.log('Elementos encontrados:', {
                steps: this.elements.steps.length,
                prevBtn: !!this.elements.prevBtn,
                nextBtn: !!this.elements.nextBtn,
                submitBtn: !!this.elements.submitBtn,
                categoryCards: this.elements.categoryCards.length
            });
            
            // Si tenemos el modal y los elementos necesarios, inicializar
            if (this.elements.steps && this.elements.steps.length > 0) {
                console.log('Modal de cotización encontrado, inicializando wizard');
                this.init();
            } else {
                console.log('Modal de cotización encontrado pero faltan elementos internos');
            }
        } else {
            console.log('Modal de cotización no encontrado en esta página');
        }
    }
    
    /**
     * Inicializa el wizard de cotización
     */
    init() {
        console.log('Inicializando el wizard de cotización');
        
        // Establecer número máximo de pasos
        this.state.maxSteps = this.elements.steps.length;
        console.log(`Pasos del wizard: ${this.state.maxSteps}`);
        
        // Configurar botones de navegación
        this.setupNavigationButtons();
        
        // Configurar selección de categoría
        this.setupCategoryCards();
        
        // Configurar eventos del modal
        this.setupModalEvents();
        
        // Mostrar el primer paso
        this.showStep(1);
        
        console.log('Wizard de cotización inicializado correctamente');
    }
    
    /**
     * Configura los botones de navegación entre pasos
     */
    setupNavigationButtons() {
        console.log('Configurando botones de navegación');
        
        // Botón anterior
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => {
                console.log('Botón anterior clickeado');
                this.goToPrevStep();
            });
            console.log('Evento para botón anterior configurado');
        } else {
            console.warn('Botón anterior no encontrado');
        }
        
        // Botón siguiente
        if (this.elements.nextBtn) {
            // Primero removemos listeners anteriores para evitar duplicados
            const newNextBtn = this.elements.nextBtn.cloneNode(true);
            if (this.elements.nextBtn.parentNode) {
                this.elements.nextBtn.parentNode.replaceChild(newNextBtn, this.elements.nextBtn);
            }
            this.elements.nextBtn = newNextBtn;
            
            this.elements.nextBtn.addEventListener('click', () => {
                console.log('Botón siguiente clickeado');
                this.goToNextStep();
            });
            console.log('Evento para botón siguiente configurado');
        } else {
            console.warn('Botón siguiente no encontrado');
        }
        
        // Botón enviar
        if (this.elements.submitBtn) {
            // Primero removemos listeners anteriores para evitar duplicados
            const newSubmitBtn = this.elements.submitBtn.cloneNode(true);
            if (this.elements.submitBtn.parentNode) {
                this.elements.submitBtn.parentNode.replaceChild(newSubmitBtn, this.elements.submitBtn);
            }
            this.elements.submitBtn = newSubmitBtn;
            
            this.elements.submitBtn.addEventListener('click', () => {
                console.log('Botón enviar clickeado');
                this.submitForm();
            });
            console.log('Evento para botón enviar configurado');
        } else {
            console.warn('Botón enviar no encontrado');
        }
    }
    
    /**
     * Configura los eventos de selección de categoría
     */
    setupCategoryCards() {
        console.log('Configurando tarjetas de categoría');
        if (this.elements.categoryCards && this.elements.categoryCards.length > 0) {
            this.elements.categoryCards.forEach(card => {
                // Primero removemos listeners anteriores para evitar duplicados
                const newCard = card.cloneNode(true);
                if (card.parentNode) {
                    card.parentNode.replaceChild(newCard, card);
                }
                
                newCard.addEventListener('click', () => {
                    console.log('Categoría clickeada:', newCard.getAttribute('data-category'));
                    this.selectCategory(newCard);
                });
            });
            
            // Actualizar la referencia a las tarjetas
            this.elements.categoryCards = this.elements.modal.querySelectorAll('.category-card');
            console.log('Eventos para tarjetas de categoría configurados');
        } else {
            console.warn('No se encontraron tarjetas de categoría');
        }
    }
    
    /**
     * Configura los eventos del modal
     */
    setupModalEvents() {
        if (!this.elements.modal) {
            console.error('No se pueden configurar eventos del modal: modal no encontrado');
            return;
        }
        
        console.log('Configurando eventos del modal');
        
        // Resetear wizard cuando se abre el modal
        this.elements.modal.addEventListener('show.bs.modal', () => {
            console.log('Evento show.bs.modal detectado, reseteando wizard');
            this.resetWizard();
        });
        
        // Limpiar estado del modal al cerrar (evitar problemas con Bootstrap)
        this.elements.modal.addEventListener('hidden.bs.modal', () => {
            console.log('Evento hidden.bs.modal detectado, limpiando modal');
            this.cleanupModalBackdrop();
        });
        
        console.log('Eventos del modal configurados correctamente');
    }
    
    /**
     * Limpia el backdrop del modal y restaura el scroll
     */
    cleanupModalBackdrop() {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Eliminar cualquier backdrop que pueda haber quedado
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.parentNode.removeChild(backdrop);
        });
    }
    
    /**
     * Resetea el wizard a su estado inicial
     */
    resetWizard() {
        console.log('Reseteando wizard');
        // Volver al primer paso
        this.state.currentStep = 1;
        this.showStep(1);
        
        // Limpiar datos anteriores
        this.state.data = {
            categoria: '',
            estilo: '',
            material: '',
            color: '',
            presupuesto: '',
            detallesAdicionales: '',
            nombre: '',
            telefono: '',
            email: '',
            contactoPreferido: 'whatsapp',
            urgente: false
        };
        
        // Resetear UI
        if (this.elements.categoryCards) {
            this.elements.categoryCards.forEach(card => {
                card.classList.remove('selected');
            });
        }
        
        // Resetear formularios
        const forms = this.elements.modal.querySelectorAll('form');
        forms.forEach(form => {
            form.reset();
        });
        
        console.log('Wizard reseteado correctamente');
    }
    
    /**
     * Abre el modal del wizard
     */
    openModal() {
        if (this.elements.modal && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(this.elements.modal);
            modal.show();
        }
    }
    
    /**
     * Muestra el paso especificado
     * @param {number} stepNumber - Número de paso a mostrar
     */
    showStep(stepNumber) {
        console.log(`Mostrando paso ${stepNumber}`);
        // Ocultar todos los pasos
        if (this.elements.steps) {
            this.elements.steps.forEach(step => {
                step.classList.remove('active');
            });
        }
        
        // Mostrar el paso actual
        const currentStepElement = this.elements.modal.querySelector(`.cotizacion-step[data-step="${stepNumber}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
            console.log(`Paso ${stepNumber} activado`);
        } else {
            console.error(`No se encontró el elemento del paso ${stepNumber}`);
        }
        
        // Actualizar botones de navegación
        this.updateNavigationButtons();
    }
    
    /**
     * Actualiza la visibilidad de los botones de navegación según el paso actual
     */
    updateNavigationButtons() {
        console.log(`Actualizando botones de navegación para paso ${this.state.currentStep}`);
        
        // Botón anterior
        if (this.elements.prevBtn) {
            this.elements.prevBtn.style.display = this.state.currentStep > 1 ? 'inline-block' : 'none';
        }
        
        // Botones siguiente y enviar
        if (this.elements.nextBtn && this.elements.submitBtn) {
            if (this.state.currentStep < this.state.maxSteps - 1) {
                this.elements.nextBtn.style.display = 'inline-block';
                this.elements.submitBtn.style.display = 'none';
                console.log('Mostrando botón Siguiente, ocultando Enviar');
            } else if (this.state.currentStep === this.state.maxSteps - 1) {
                this.elements.nextBtn.style.display = 'none';
                this.elements.submitBtn.style.display = 'inline-block';
                console.log('Mostrando botón Enviar, ocultando Siguiente');
            } else {
                this.elements.nextBtn.style.display = 'none';
                this.elements.submitBtn.style.display = 'none';
                this.elements.prevBtn.style.display = 'none';
                console.log('Ocultando todos los botones de navegación');
            }
        }
    }
    
    /**
     * Navega al paso anterior
     */
    goToPrevStep() {
        console.log(`Retrocediendo del paso ${this.state.currentStep}`);
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.showStep(this.state.currentStep);
        }
    }
    
    /**
     * Navega al paso siguiente
     */
    goToNextStep() {
        console.log(`Avanzando desde el paso ${this.state.currentStep}`);
        if (this.validateCurrentStep()) {
            this.collectStepData();
            this.state.currentStep++;
            this.showStep(this.state.currentStep);
        } else {
            this.showToast('Por favor, complete todos los campos obligatorios antes de continuar.');
        }
    }
    
    /**
     * Valida el paso actual
     * @returns {boolean} - Verdadero si el paso es válido
     */
    validateCurrentStep() {
        console.log('Validando paso actual:', this.state.currentStep);
        
        switch (this.state.currentStep) {
            case 1:
                // Validar selección de categoría
                const isValid = this.state.data.categoria !== '';
                console.log('Validación categoría:', isValid, 'Categoría:', this.state.data.categoria);
                return isValid;
            case 2:
                // El paso 2 no tiene campos obligatorios
                console.log('Paso 2: no requiere validación');
                return true;
            case 3:
                // Validar campos de contacto
                const nombre = document.getElementById('nombreCliente')?.value.trim() || '';
                const telefono = document.getElementById('telefonoCliente')?.value.trim() || '';
                const email = document.getElementById('emailCliente')?.value.trim() || '';
                
                const contactoValido = nombre !== '' && (telefono !== '' || email !== '');
                console.log('Validación contacto:', contactoValido, {nombre, telefono, email});
                return contactoValido;
            default:
                return true;
        }
    }
    
    /**
     * Recopila los datos del paso actual
     */
    collectStepData() {
        console.log(`Recopilando datos del paso ${this.state.currentStep}`);
        
        switch (this.state.currentStep) {
            case 1:
                // Datos ya recopilados al hacer clic en la categoría
                console.log('Datos de categoría ya recopilados:', this.state.data.categoria);
                break;
            case 2:
                // Recopilar datos de características
                this.state.data.estilo = document.getElementById('estiloMueble')?.value || '';
                this.state.data.material = document.getElementById('materialMueble')?.value || '';
                this.state.data.color = document.getElementById('colorMueble')?.value || '';
                this.state.data.presupuesto = document.getElementById('presupuesto')?.value || '';
                this.state.data.detallesAdicionales = document.getElementById('detallesAdicionales')?.value || '';
                console.log('Datos de características recopilados:', {
                    estilo: this.state.data.estilo,
                    material: this.state.data.material,
                    color: this.state.data.color,
                    presupuesto: this.state.data.presupuesto,
                    detallesAdicionales: this.state.data.detallesAdicionales
                });
                break;
            case 3:
                // Recopilar datos de contacto
                this.state.data.nombre = document.getElementById('nombreCliente')?.value || '';
                this.state.data.telefono = document.getElementById('telefonoCliente')?.value || '';
                this.state.data.email = document.getElementById('emailCliente')?.value || '';
                this.state.data.contactoPreferido = document.getElementById('contactPreferido')?.value || 'whatsapp';
                this.state.data.urgente = document.getElementById('urgente')?.checked || false;
                console.log('Datos de contacto recopilados:', {
                    nombre: this.state.data.nombre,
                    telefono: this.state.data.telefono,
                    email: this.state.data.email,
                    contactoPreferido: this.state.data.contactoPreferido,
                    urgente: this.state.data.urgente
                });
                break;
        }
    }
    
    /**
     * Selecciona una categoría
     * @param {HTMLElement} card - Card de categoría seleccionada
     */
    selectCategory(card) {
        console.log('Seleccionando categoría:', card.getAttribute('data-category'));
        
        // Eliminar selección anterior
        if (this.elements.categoryCards) {
            this.elements.categoryCards.forEach(c => {
                c.classList.remove('selected');
            });
        }
        
        // Marcar selección actual
        card.classList.add('selected');
        
        // Guardar categoría seleccionada
        this.state.data.categoria = card.getAttribute('data-category') || '';
        console.log('Categoría seleccionada:', this.state.data.categoria);
    }
    
    /**
     * Envía el formulario
     */
    submitForm() {
        console.log('Procesando envío del formulario');
        if (this.validateCurrentStep()) {
            this.collectStepData();
            
            // Preparar mensaje para WhatsApp
            const whatsappMessage = this.createWhatsAppMessage();
            
            // Guardar el mensaje para usar en el botón de WhatsApp
            this.state.data.whatsappMessage = whatsappMessage;
            
            // Avanzar al paso de confirmación
            this.state.currentStep++;
            this.showStep(this.state.currentStep);
            
            // Actualizar resumen
            this.updateSummary();
            
            console.log('Formulario enviado correctamente');
        } else {
            this.showToast('Por favor, complete todos los campos obligatorios antes de enviar.');
        }
    }
    
    /**
     * Actualiza el resumen de cotización
     */
    updateSummary() {
        console.log('Actualizando resumen de cotización');
        const summaryList = document.getElementById('cotizacionResumen');
        if (!summaryList) {
            console.error('No se encontró el elemento cotizacionResumen');
            return;
        }
        
        // Mapeo de categorías a nombres más amigables
        const categoriasMap = {
            'salas': 'Sala',
            'comedores': 'Comedor',
            'recamaras': 'Recámara',
            'cabeceras': 'Cabecera',
            'mesas-centro': 'Mesa de Centro',
            'otros': 'Otro tipo de mueble'
        };
        
        // Crear HTML para el resumen
        let summaryHTML = '';
        
        // Categoría
        if (this.state.data.categoria) {
            const categoriaNombre = categoriasMap[this.state.data.categoria] || this.state.data.categoria;
            summaryHTML += `<li><strong>Tipo de mueble:</strong> ${categoriaNombre}</li>`;
        }
        
        // Características
        if (this.state.data.estilo) {
            summaryHTML += `<li><strong>Estilo:</strong> ${this.state.data.estilo}</li>`;
        }
        if (this.state.data.material) {
            summaryHTML += `<li><strong>Material principal:</strong> ${this.state.data.material}</li>`;
        }
        if (this.state.data.color) {
            summaryHTML += `<li><strong>Colores:</strong> ${this.state.data.color}</li>`;
        }
        if (this.state.data.presupuesto) {
            summaryHTML += `<li><strong>Presupuesto aproximado:</strong> ${this.state.data.presupuesto}</li>`;
        }
        if (this.state.data.detallesAdicionales) {
            summaryHTML += `<li><strong>Detalles adicionales:</strong> ${this.state.data.detallesAdicionales}</li>`;
        }
        
        // Contacto
        if (this.state.data.nombre) {
            summaryHTML += `<li><strong>Nombre:</strong> ${this.state.data.nombre}</li>`;
        }
        if (this.state.data.telefono) {
            summaryHTML += `<li><strong>Teléfono:</strong> ${this.state.data.telefono}</li>`;
        }
        if (this.state.data.email) {
            summaryHTML += `<li><strong>Email:</strong> ${this.state.data.email}</li>`;
        }
        if (this.state.data.contactoPreferido) {
            let contactoPref = 'WhatsApp';
            if (this.state.data.contactoPreferido === 'telefono') contactoPref = 'Llamada telefónica';
            if (this.state.data.contactoPreferido === 'email') contactoPref = 'Email';
            summaryHTML += `<li><strong>Método de contacto preferido:</strong> ${contactoPref}</li>`;
        }
        if (this.state.data.urgente) {
            summaryHTML += `<li><strong>Solicitud urgente:</strong> Sí</li>`;
        }
        
        // Actualizar el contenido del resumen
        summaryList.innerHTML = summaryHTML;
        
        // Añadir enlace para ir a WhatsApp
        const finalizarBtn = this.elements.modal.querySelector('.cotizacion-step[data-step="4"] .btn-primary');
        if (finalizarBtn) {
            // Remover botón de WhatsApp existente si lo hay
            const existingWhatsappBtn = finalizarBtn.nextElementSibling;
            if (existingWhatsappBtn && existingWhatsappBtn.classList.contains('btn-success')) {
                existingWhatsappBtn.parentNode.removeChild(existingWhatsappBtn);
            }
            
            // Crear nuevo botón
            const whatsappButton = document.createElement('a');
            whatsappButton.href = `https://wa.me/1234567890?text=${encodeURIComponent(this.state.data.whatsappMessage)}`;
            whatsappButton.className = 'btn btn-success mt-3 ms-2';
            whatsappButton.target = '_blank';
            whatsappButton.innerHTML = '<i class="bi bi-whatsapp me-2"></i>Contactar ahora';
            
            // Insertar al lado del botón finalizar
            finalizarBtn.parentNode.insertBefore(whatsappButton, finalizarBtn.nextSibling);
            console.log('Botón de WhatsApp creado e insertado');
        } else {
            console.warn('No se encontró el botón de finalizar');
        }
        
        console.log('Resumen actualizado correctamente');
    }
    
    /**
     * Crea un mensaje para WhatsApp con los datos de la cotización
     * @returns {string} - Mensaje formateado para WhatsApp
     */
    createWhatsAppMessage() {
        console.log('Creando mensaje para WhatsApp');
        const categoriasMap = {
            'salas': 'Sala',
            'comedores': 'Comedor',
            'recamaras': 'Recámara',
            'cabeceras': 'Cabecera',
            'mesas-centro': 'Mesa de Centro',
            'otros': 'Otro tipo de mueble'
        };
        
        const categoriaNombre = categoriasMap[this.state.data.categoria] || this.state.data.categoria;
        
        let mensaje = `Hola, quisiera solicitar una cotización para ${categoriaNombre}.\n\n`;
        
        mensaje += "Características:\n";
        if (this.state.data.estilo) mensaje += `- Estilo: ${this.state.data.estilo}\n`;
        if (this.state.data.material) mensaje += `- Material: ${this.state.data.material}\n`;
        if (this.state.data.color) mensaje += `- Color: ${this.state.data.color}\n`;
        if (this.state.data.presupuesto) mensaje += `- Presupuesto aproximado: ${this.state.data.presupuesto}\n`;
        if (this.state.data.detallesAdicionales) mensaje += `- Detalles adicionales: ${this.state.data.detallesAdicionales}\n`;
        
        mensaje += "\nMis datos de contacto:\n";
        mensaje += `- Nombre: ${this.state.data.nombre}\n`;
        if (this.state.data.telefono) mensaje += `- Teléfono: ${this.state.data.telefono}\n`;
        if (this.state.data.email) mensaje += `- Email: ${this.state.data.email}\n`;
        
        if (this.state.data.urgente) {
            mensaje += "\nNecesito esta cotización con urgencia (24-48 horas).";
        }
        
        console.log('Mensaje para WhatsApp creado');
        return mensaje;
    }
    
    /**
     * Muestra un mensaje toast
     * @param {string} message - Mensaje a mostrar
     */
    showToast(message) {
        console.log('Mostrando toast:', message);
        // Crear contenedor de toasts si no existe
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Crear elemento toast
        const toastId = 'toast-' + Math.random().toString(36).substr(2, 9);
        const toastEl = document.createElement('div');
        toastEl.id = toastId;
        toastEl.className = 'toast align-items-center text-white bg-danger border-0';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');
        
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `;
        
        toastContainer.appendChild(toastEl);
        
        // Mostrar el toast usando Bootstrap si está disponible
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const toast = new bootstrap.Toast(toastEl, {
                delay: 5000,
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
            }, 5000);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cargando CotizacionWizard...');
    window.cotizacionWizard = new CotizacionWizard();
    console.log('CotizacionWizard creado');
});