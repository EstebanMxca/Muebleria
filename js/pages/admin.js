/**
 * Mueblería Cabañas - Página de Administración
 * Este módulo maneja la lógica para la página de administración de productos destacados
 */

class AdminPage {
    constructor() {
        // Referencias a elementos del DOM
        this.elements = {
            todosProductos: document.getElementById('todosProductos'),
            productosDestacados: document.getElementById('productosDestacados'),
            guardarBtn: document.getElementById('guardarDestacados'),
            errorContainer: document.getElementById('errorContainer')
        };
        
        // Configuración
        this.config = {
            apiUrl: 'http://localhost:3000/api',
            maxDestacados: 5
        };
        
        // Estado
        this.state = {
            allProducts: [],
            selectedProducts: [],
            isLoading: false
        };
    }
    
    /**
     * Inicializa la página de administración
     */
    async init() {
        console.log('Inicializando página de administración...');
        
        // Verificar elementos necesarios
        if (!this.elements.todosProductos || !this.elements.productosDestacados || !this.elements.guardarBtn) {
            this.showError('No se encontraron los elementos necesarios en la página');
            return;
        }
        
        // Cargar productos
        try {
            await this.loadProducts();
            
            // Configurar eventos
            this.setupEvents();
            
            console.log('Página de administración inicializada correctamente');
        } catch (error) {
            console.error('Error al inicializar página de administración:', error);
            this.showError('Error al inicializar la página. Por favor, recarga la página e intenta nuevamente.');
        }
    }
    
    /**
     * Carga la lista de productos
     */
    async loadProducts() {
        try {
            this.state.isLoading = true;
            this.showLoading();
            
            // Cargar todos los productos
            const respuestaProductos = await fetch(`${this.config.apiUrl}/productos-seleccion`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Verificar respuesta
            if (!respuestaProductos.ok) {
                throw new Error(`HTTP error! status: ${respuestaProductos.status}`);
            }
            
            // Obtener productos
            const productos = await respuestaProductos.json();
            
            // Verificar que haya productos
            if (!productos || productos.length === 0) {
                throw new Error('No se encontraron productos');
            }
            
            // Guardar productos en estado
            this.state.allProducts = productos;
            
            // Cargar productos destacados actuales
            const respuestaDestacados = await fetch(`${this.config.apiUrl}/productos-destacados`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            // Si hay un error al cargar los destacados, continuar con lista vacía
            if (respuestaDestacados.ok) {
                const destacados = await respuestaDestacados.json();
                if (destacados && Array.isArray(destacados)) {
                    this.state.selectedProducts = destacados.map(p => p.id);
                }
            }
            
            // Renderizar productos
            this.renderProducts();
            
        } catch (error) {
            console.error('Error al cargar productos:', error);
            this.showError(`Error al cargar productos: ${error.message}`);
        } finally {
            this.state.isLoading = false;
            this.hideLoading();
        }
    }
    
    /**
     * Configura los eventos de la página
     */
    setupEvents() {
        // Botón para guardar productos destacados
        this.elements.guardarBtn.addEventListener('click', async () => {
            await this.saveSelectedProducts();
        });
        
        // Eventos de arrastrar y soltar
        this.setupDragAndDrop();
    }
    
    /**
     * Configura eventos de arrastrar y soltar
     */
    setupDragAndDrop() {
        // Usar librería SortableJS si está disponible
        if (typeof Sortable !== 'undefined') {
            // Lista de todos los productos
            Sortable.create(this.elements.todosProductos, {
                group: {
                    name: 'productos',
                    pull: 'clone',
                    put: false
                },
                sort: false,
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    // Si se añadió un elemento a destacados, actualizar estado
                    if (evt.to === this.elements.productosDestacados) {
                        this.updateSelectedProducts();
                    }
                }
            });
            
            // Lista de productos destacados
            Sortable.create(this.elements.productosDestacados, {
                group: 'productos',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onAdd: (evt) => {
                    // Limitar a máximo permitido
                    if (this.elements.productosDestacados.children.length > this.config.maxDestacados) {
                        evt.from.appendChild(evt.item);
                        this.showError(`Solo puedes seleccionar ${this.config.maxDestacados} productos destacados`);
                    } else {
                        this.updateSelectedProducts();
                    }
                },
                onUpdate: () => {
                    this.updateSelectedProducts();
                }
            });
        } else {
            // Implementación básica si no está disponible SortableJS
            // Configurar eventos para botones de agregar
            this.elements.todosProductos.addEventListener('click', (e) => {
                const agregarBtn = e.target.closest('.agregar-destacado');
                if (agregarBtn) {
                    const productoItem = agregarBtn.closest('.producto-item');
                    if (productoItem) {
                        // Verificar límite
                        if (this.elements.productosDestacados.children.length >= this.config.maxDestacados) {
                            this.showError(`Solo puedes seleccionar ${this.config.maxDestacados} productos destacados`);
                            return;
                        }
                        
                        // Mover a destacados
                        this.elements.productosDestacados.appendChild(productoItem.cloneNode(true));
                        
                        // Deshabilitar botón original
                        agregarBtn.disabled = true;
                        
                        // Actualizar estado
                        this.updateSelectedProducts();
                        
                        // Configurar botón para quitar
                        const quitarBtn = productoItem.querySelector('.quitar-destacado');
                        if (quitarBtn) {
                            quitarBtn.addEventListener('click', () => {
                                productoItem.remove();
                                agregarBtn.disabled = false;
                                this.updateSelectedProducts();
                            });
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Actualiza el estado con los productos destacados seleccionados
     */
    updateSelectedProducts() {
        const items = this.elements.productosDestacados.querySelectorAll('.producto-item');
        this.state.selectedProducts = Array.from(items).map(item => item.getAttribute('data-id'));
        console.log('Productos destacados actualizados:', this.state.selectedProducts);
        
        // Actualizar UI según la selección
        this.updateProductsUI();
    }
    
    /**
     * Actualiza la UI basado en los productos seleccionados
     */
    updateProductsUI() {
        // Actualizar contador
        const contador = document.querySelector('.destacados-counter');
        if (contador) {
            contador.textContent = `${this.state.selectedProducts.length}/${this.config.maxDestacados}`;
        }
        
        // Deshabilitar botón de guardar si no hay selección
        if (this.elements.guardarBtn) {
            this.elements.guardarBtn.disabled = this.state.selectedProducts.length === 0;
        }
        
        // Actualizar clases de botones en productos
        if (this.state.allProducts.length > 0) {
            this.state.allProducts.forEach(producto => {
                const isSelected = this.state.selectedProducts.includes(producto.id);
                const productElement = this.elements.todosProductos.querySelector(`.producto-item[data-id="${producto.id}"]`);
                
                if (productElement) {
                    const agregarBtn = productElement.querySelector('.agregar-destacado');
                    if (agregarBtn) {
                        agregarBtn.disabled = isSelected;
                    }
                    
                    if (isSelected) {
                        productElement.classList.add('selected');
                    } else {
                        productElement.classList.remove('selected');
                    }
                }
            });
        }
    }
    
    /**
     * Renderiza la lista de productos
     */
    renderProducts() {
        // Limpiar contenedores
        this.elements.todosProductos.innerHTML = '';
        this.elements.productosDestacados.innerHTML = '';
        
        // Renderizar todos los productos
        this.state.allProducts.forEach(producto => {
            const isSelected = this.state.selectedProducts.includes(producto.id);
            const productoHTML = this.createProductItemHTML(producto, isSelected);
            
            // Añadir a la lista correspondiente
            if (isSelected) {
                this.elements.productosDestacados.innerHTML += productoHTML;
            } else {
                this.elements.todosProductos.innerHTML += productoHTML;
            }
        });
        
        // Actualizar UI
        this.updateProductsUI();
    }
    
    /**
     * Crea el HTML para un item de producto
     */
    createProductItemHTML(producto, isSelected) {
        return `
            <div class="list-group-item list-group-item-action producto-item${isSelected ? ' selected' : ''}" data-id="${producto.id}">
                <div class="d-flex align-items-center">
                    <img src="${producto.imagen_principal || 'assets/placeholder.jpg'}" alt="${producto.nombre}" 
                         class="producto-thumbnail me-3" width="50" height="50">
                    <span class="flex-grow-1">${producto.nombre} <small class="text-muted">(${producto.categoria})</small></span>
                    ${isSelected ? 
                        `<button class="btn btn-sm btn-danger quitar-destacado">-</button>` : 
                        `<button class="btn btn-sm btn-success agregar-destacado" ${isSelected ? 'disabled' : ''}>+</button>`
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * Guarda los productos destacados seleccionados
     */
    async saveSelectedProducts() {
        try {
            this.state.isLoading = true;
            this.showLoading();
            
            // Verificar que haya selección
            if (this.state.selectedProducts.length === 0) {
                this.showError('No hay productos seleccionados para guardar');
                return;
            }
            
            // Enviar datos al servidor
            const respuesta = await fetch(`${this.config.apiUrl}/productos-destacados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productos: this.state.selectedProducts })
            });
            
            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }
            
            const resultado = await respuesta.json();
            
            // Mostrar mensaje de éxito
            this.showSuccess(resultado.mensaje || 'Productos destacados actualizados correctamente');
            
            // Recargar productos para reflejar cambios
            await this.loadProducts();
            
        } catch (error) {
            console.error('Error al guardar productos destacados:', error);
            this.showError(`Error al guardar: ${error.message}`);
        } finally {
            this.state.isLoading = false;
            this.hideLoading();
        }
    }
    
    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.innerHTML = `
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            this.elements.errorContainer.style.display = 'block';
            
            // Auto ocultar después de 5 segundos
            setTimeout(() => {
                const alertElement = this.elements.errorContainer.querySelector('.alert');
                if (alertElement) {
                    alertElement.classList.remove('show');
                    setTimeout(() => {
                        this.elements.errorContainer.style.display = 'none';
                    }, 300);
                }
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    /**
     * Muestra un mensaje de éxito
     */
    showSuccess(message) {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            this.elements.errorContainer.style.display = 'block';
            
            // Auto ocultar después de 3 segundos
            setTimeout(() => {
                const alertElement = this.elements.errorContainer.querySelector('.alert');
                if (alertElement) {
                    alertElement.classList.remove('show');
                    setTimeout(() => {
                        this.elements.errorContainer.style.display = 'none';
                    }, 300);
                }
            }, 3000);
        }
    }
    
    /**
     * Muestra indicador de carga
     */
    showLoading() {
        // Deshabilitar botón de guardar
        if (this.elements.guardarBtn) {
            this.elements.guardarBtn.disabled = true;
            this.elements.guardarBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Guardando...
            `;
        }
        
        // Añadir overlay de carga si no existe
        if (!document.getElementById('admin-loading-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'admin-loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        // Mostrar overlay
        setTimeout(() => {
            const overlay = document.getElementById('admin-loading-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        }, 0);
    }
    
    /**
     * Oculta indicador de carga
     */
    hideLoading() {
        // Restaurar botón de guardar
        if (this.elements.guardarBtn) {
            this.elements.guardarBtn.disabled = false;
            this.elements.guardarBtn.innerHTML = 'Guardar Productos Destacados';
        }
        
        // Ocultar overlay
        const overlay = document.getElementById('admin-loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
}

// Inicializar página de administración cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la página de administración
    const isAdminPage = window.location.pathname.includes('admin-productos-destacados.html');
    
    if (isAdminPage) {
        window.adminPage = new AdminPage();
        window.adminPage.init();
        
        // Añadir estilos CSS para la página de administración
        addAdminStyles();
    }
});

/**
 * Añade estilos CSS para la página de administración
 */
function addAdminStyles() {
    const styleId = 'admin-page-styles';
    
    // Verificar si ya existen los estilos
    if (document.getElementById(styleId)) return;
    
    // Crear elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .producto-item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            transition: all 0.3s ease;
            border: 1px solid #ddd;
        }
        
        .producto-item:hover {
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
        }
        
        .producto-item.selected {
            background-color: #f8f9fa;
            border-left: 3px solid var(--primary, #A67C52);
        }
        
        .producto-thumbnail {
            width: 50px;
            height: 50px;
            object-fit: contain;
            border-radius: 4px;
            background-color: #f8f8f8;
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        
        .sortable-ghost {
            opacity: 0.4;
        }
        
        .sortable-chosen {
            background-color: #f8f9fa;
        }
        
        .sortable-drag {
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .destacados-counter {
            font-size: 0.9rem;
            color: #666;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .producto-item .btn {
            min-width: 36px;
        }
    `;
    
    // Añadir al documento
    document.head.appendChild(styleElement);
}