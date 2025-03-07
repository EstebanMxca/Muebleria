/**
 * Mueblería Cabañas - Formulario de Contacto Optimizado
 * Este módulo maneja el envío del formulario de contacto mediante EmailJS
 */

class ContactForm {
    constructor() {
        // Configuración del servicio de email
        this.config = {
            emailjsPublicKey: 'RLj0ZVIXbko8T8nhA',
            emailjsServiceId: 'service_54u196n',
            emailjsTemplateId: 'template_jx2bird',
            statusTimeout: 5000 // Tiempo en ms para ocultar mensajes de estado
        };
        
        // Referencia al formulario
        this.form = document.querySelector('#contacto form');
        
        // Estado del formulario
        this.state = {
            sending: false,
            emailjsLoaded: false
        };
        
        // Contenedor para mensajes de estado
        this.statusContainer = null;
    }
    
    /**
     * Inicializa el formulario de contacto
     */
    init() {
        // Si no hay formulario en la página, salir
        if (!this.form) {
            console.log('No se encontró formulario de contacto en esta página');
            return;
        }
        
        // Añadir clase para identificar
        this.form.classList.add('contact-form-js');
        
        // Crear contenedor para mensajes de estado si no existe
        this.statusContainer = this.form.querySelector('.contact-form-status');
        
        if (!this.statusContainer) {
            this.statusContainer = document.createElement('div');
            this.statusContainer.className = 'contact-form-status mt-3';
            this.form.appendChild(this.statusContainer);
        }
        
        // Cargar EmailJS
        this.loadEmailJS()
            .then(() => {
                // Configurar manejo de envío del formulario
                this.setupFormSubmission();
                console.log('Formulario de contacto inicializado correctamente');
            })
            .catch(error => {
                console.error('Error al cargar EmailJS:', error);
                this.showStatus('error', 'No se pudo inicializar el servicio de envío de email. Por favor, intenta más tarde.');
            });
    }
    
    /**
     * Carga la biblioteca EmailJS
     */
    loadEmailJS() {
        return new Promise((resolve, reject) => {
            // Si ya está cargado, resolver inmediatamente
            if (window.emailjs || this.state.emailjsLoaded) {
                this.state.emailjsLoaded = true;
                resolve();
                return;
            }
            
            // Crear script
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            script.async = true;
            
            // Eventos de carga
            script.onload = () => {
                if (window.emailjs) {
                    // Inicializar EmailJS
                    window.emailjs.init(this.config.emailjsPublicKey);
                    this.state.emailjsLoaded = true;
                    resolve();
                } else {
                    reject(new Error('EmailJS no disponible después de cargar script'));
                }
            };
            
            script.onerror = () => {
                reject(new Error('Error al cargar script de EmailJS'));
            };
            
            // Añadir script al documento
            document.head.appendChild(script);
        });
    }
    
    /**
     * Configura el manejo del envío del formulario
     */
    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Evitar envíos múltiples
            if (this.state.sending) {
                return;
            }
            
            // Validar formulario
            if (!this.validateForm()) {
                return;
            }
            
            // Actualizar estado
            this.state.sending = true;
            
            // Mostrar mensaje de carga
            this.showStatus('loading', 'Enviando tu mensaje...');
            
            // Obtener datos del formulario
            const formData = this.getFormData();
            
            // Enviar email
            this.sendEmail(formData)
                .then(response => {
                    console.log('Email enviado correctamente:', response);
                    this.showStatus('success', '¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.');
                    this.form.reset();
                })
                .catch(error => {
                    console.error('Error al enviar email:', error);
                    this.showStatus('error', 'Ocurrió un error al enviar tu mensaje. Por favor, intenta de nuevo más tarde.');
                })
                .finally(() => {
                    this.state.sending = false;
                });
        });
    }
    
    /**
     * Valida el formulario antes de enviarlo
     */
    validateForm() {
        const requiredFields = ['nombreContacto', 'emailContacto', 'asuntoContacto', 'mensajeContacto'];
        let isValid = true;
        
        // Eliminar mensajes de error previos
        this.form.querySelectorAll('.is-invalid').forEach(field => {
            field.classList.remove('is-invalid');
        });
        
        // Verificar campos requeridos
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                if (field) {
                    field.classList.add('is-invalid');
                    
                    // Crear mensaje de error si no existe
                    let feedback = field.nextElementSibling;
                    if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                        feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback';
                        feedback.textContent = 'Este campo es obligatorio.';
                        field.parentNode.insertBefore(feedback, field.nextSibling);
                    }
                }
                isValid = false;
            }
        });
        
        // Validar formato de email
        const emailField = document.getElementById('emailContacto');
        if (emailField && emailField.value.trim() && !this.validateEmail(emailField.value)) {
            emailField.classList.add('is-invalid');
            
            // Crear mensaje de error si no existe
            let feedback = emailField.nextElementSibling;
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = 'Por favor, introduce un email válido.';
                emailField.parentNode.insertBefore(feedback, emailField.nextSibling);
            } else {
                feedback.textContent = 'Por favor, introduce un email válido.';
            }
            
            isValid = false;
        }
        
        return isValid;
    }
    
    /**
     * Valida una dirección de email
     */
    validateEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    }
    
    /**
     * Obtiene los datos del formulario
     */
    getFormData() {
        return {
            from_name: document.getElementById('nombreContacto')?.value || '',
            from_email: document.getElementById('emailContacto')?.value || '',
            subject: document.getElementById('asuntoContacto')?.value || '',
            message: document.getElementById('mensajeContacto')?.value || ''
        };
    }
    
    /**
     * Envía el email usando EmailJS
     */
    async sendEmail(params) {
        if (!window.emailjs || !this.state.emailjsLoaded) {
            throw new Error('EmailJS no está inicializado');
        }
        
        return window.emailjs.send(
            this.config.emailjsServiceId,
            this.config.emailjsTemplateId,
            params
        );
    }
    
    /**
     * Muestra mensajes de estado del formulario
     */
    showStatus(type, message) {
        // Limpiar cualquier timeout anterior
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        // Determinar clase según tipo
        let alertClass = '';
        let iconClass = '';
        
        switch (type) {
            case 'success':
                alertClass = 'alert-success';
                iconClass = 'bi-check-circle';
                break;
            case 'error':
                alertClass = 'alert-danger';
                iconClass = 'bi-exclamation-triangle';
                break;
            case 'loading':
                alertClass = 'alert-info';
                iconClass = 'bi-info-circle';
                break;
            default:
                alertClass = 'alert-info';
                iconClass = 'bi-info-circle';
        }
        
        // Contenido específico para loading
        let content = '';
        if (type === 'loading') {
            content = `
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Enviando mensaje...</span>
                    </div>
                    <div>${message}</div>
                </div>
            `;
        } else {
            content = `<i class="bi ${iconClass} me-2"></i>${message}`;
        }
        
        // Establecer HTML del mensaje
        this.statusContainer.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                ${content}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto ocultar después de un tiempo (excepto para loading)
        if (type !== 'loading') {
            this.statusTimeout = setTimeout(() => {
                const alert = this.statusContainer.querySelector('.alert');
                if (alert) {
                    // Usar Bootstrap para ocultar si está disponible
                    if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                        const bsAlert = new bootstrap.Alert(alert);
                        bsAlert.close();
                    } else {
                        // Fallback manual
                        alert.classList.remove('show');
                        setTimeout(() => {
                            if (alert.parentNode) {
                                alert.parentNode.removeChild(alert);
                            }
                        }, 150);
                    }
                }
            }, this.config.statusTimeout);
        }
    }
}

// Inicializar el formulario de contacto cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.contactForm = new ContactForm();
    window.contactForm.init();
});