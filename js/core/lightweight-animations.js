/**
 * Animaciones ligeras para reemplazar AOS
 * Usa IntersectionObserver para mejor rendimiento
 */
class LightweightAnimations {
    constructor() {
        this.animationClasses = {
            'fade-up': 'animation-fade-up',
            'fade-down': 'animation-fade-down',
            'fade-left': 'animation-fade-left',
            'fade-right': 'animation-fade-right',
            'zoom-in': 'animation-zoom-in',
            'fade': 'animation-fade'
        };
        
        // Añadir estilos para animaciones
        this.addStyles();
        
        // Observador de intersecciones para animaciones
        this.observer = null;
    }
    
    init() {
        // Crear observer con opciones óptimas
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: 0.1,
            rootMargin: '0px 0px 50px 0px'
        });
        
        // Observar todos los elementos con atributo data-animation
        document.querySelectorAll('[data-animation]').forEach(el => {
            this.observer.observe(el);
            
            // Asegurarse de que el elemento está inicialmente oculto
            const animationType = el.getAttribute('data-animation');
            if (animationType && this.animationClasses[animationType]) {
                el.classList.add('pre-animation');
            }
        });
        
        // Compatibilidad con elementos que usan atributo data-aos
        document.querySelectorAll('[data-aos]').forEach(el => {
            // Convertir data-aos a data-animation
            const animationType = el.getAttribute('data-aos');
            if (animationType && this.animationClasses[animationType]) {
                el.setAttribute('data-animation', animationType);
                el.classList.add('pre-animation');
                this.observer.observe(el);
            }
        });
        
        console.log('Lightweight animations initialized');
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationType = element.getAttribute('data-animation');
                const delay = element.getAttribute('data-animation-delay') || 0;
                
                if (animationType && this.animationClasses[animationType]) {
                    // Aplicar animación con retraso si es necesario
                    setTimeout(() => {
                        element.classList.remove('pre-animation');
                        element.classList.add(this.animationClasses[animationType]);
                    }, delay);
                    
                    // Si queremos que la animación se ejecute solo una vez
                    if (element.getAttribute('data-animation-once') !== 'false') {
                        this.observer.unobserve(element);
                    }
                }
            } else {
                // Para elementos que deben animarse nuevamente al salir y volver a entrar
                const element = entry.target;
                if (element.getAttribute('data-animation-once') === 'false') {
                    const animationType = element.getAttribute('data-animation');
                    
                    if (animationType && this.animationClasses[animationType]) {
                        element.classList.remove(this.animationClasses[animationType]);
                        element.classList.add('pre-animation');
                    }
                }
            }
        });
    }
    
    addStyles() {
        // Crear elemento de estilo para animaciones
        const style = document.createElement('style');
        style.textContent = `
            /* Clase para elementos pre-animación */
            .pre-animation {
                opacity: 0;
            }
            
            /* Animaciones */
            .animation-fade-up {
                animation: fadeUp 0.6s ease forwards;
            }
            
            .animation-fade-down {
                animation: fadeDown 0.6s ease forwards;
            }
            
            .animation-fade-left {
                animation: fadeLeft 0.6s ease forwards;
            }
            
            .animation-fade-right {
                animation: fadeRight 0.6s ease forwards;
            }
            
            .animation-zoom-in {
                animation: zoomIn 0.6s ease forwards;
            }
            
            .animation-fade {
                animation: fade 0.6s ease forwards;
            }
            
            /* Keyframes */
            @keyframes fadeUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeDown {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes fadeLeft {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes fadeRight {
                from {
                    opacity: 0;
                    transform: translateX(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes zoomIn {
                from {
                    opacity: 0;
                    transform: scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            @keyframes fade {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Crear instancia global
window.lightweightAnimations = new LightweightAnimations();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.lightweightAnimations.init();
});