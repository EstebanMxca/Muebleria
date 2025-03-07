/**
 * Mueblería Cabañas - Componente de Modal de Producto
 * Este módulo gestiona la creación y manipulación de modales de producto
 * Soporta múltiples imágenes en formato carrusel o grid
 */

class ProductModal {
    constructor() {
        // Configuración del componente
        this.config = {
            maxImages: 4,
            defaultImage: 'assets/placeholder.jpg',
            modalSelector: '.product-modal',
            useGrid: false  // Si es true, muestra las imágenes en grid, si es false usa carrusel
        };
        
        // Caché de modales creados
        this.modalCache = new Set();
        
        // Eventos globales
        this.setupGlobalEvents();
    }
    
    /**
     * Configura eventos globales para los modales
     */
    setupGlobalEvents() {
        // Evento para limpiar Bootstrap Modal
        document.addEventListener('hidden.bs.modal', (event) => {
            if (event.target.classList.contains('modal')) {
                // Eliminar clases y estilos que Bootstrap puede dejar
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                
                // Eliminar cualquier backdrop que pueda haber quedado
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => {
                    backdrop.classList.add('cleanup-target');
                    setTimeout(() => {
                        if (backdrop.parentNode) {
                            backdrop.parentNode.removeChild(backdrop);
                        }
                    }, 300);
                });
            }
        });
    }
    
    /**
     * Crea o actualiza un modal para un producto
     */
    createModal(product) {
        // Verificar si el producto es válido
        if (!product || !product.id) {
            console.error('Producto inválido para crear modal');
            return null;
        }
        
        // Verificar si ya existe el modal
        const existingModal = document.getElementById(`modal${product.id}`);
        if (existingModal) {
            // Si el modal ya existe, actualizar su contenido
            return this.updateModal(existingModal, product);
        }
        
        // Determinar el contenido de las imágenes (carrusel, grid o imagen única)
        const imagesContent = this.createImagesContent(product);
        
        // Obtener características del producto
        const caracteristicasHTML = this.createCharacteristicsList(product);
        
        // Obtener etiquetas del producto
        const etiquetasHTML = this.createTagsBadges(product);
        
        // Obtener información de disponibilidad
        const disponibilidadHTML = `
            <span class="badge bg-${product.disponible ? 'success' : 'danger'} me-2">
                ${product.disponible ? 'Disponible' : 'No disponible'}
            </span>
        `;
        
        // Obtener información de descuento
        const descuentoHTML = this.createDiscountBadge(product);
        
        // Determinar si estamos en la página de la misma categoría que el producto
        const isOnCategoryPage = this.isProductInCurrentCategory(product);
        
        // Botón para ver más productos de la categoría (solo si no estamos en esa categoría)
        const categoriaBtn = !isOnCategoryPage ? `
            <a href="${this.getCategoryUrl(product.categoria)}" class="btn btn-primary">
                <i class="bi bi-list me-2"></i>Ver más en ${product.categoria}
            </a>
        ` : '';
        
        // Crear la estructura completa del modal
        const modalHTML = `
        <div class="modal fade product-modal" id="modal${product.id}" tabindex="-1" aria-labelledby="modalLabel${product.id}" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalLabel${product.id}">${product.nombre}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                ${imagesContent}
                            </div>
                            <div class="col-md-6">
                                <p>${product.descripcion || 'Sin descripción disponible.'}</p>
                                ${descuentoHTML}
                                ${caracteristicasHTML}
                                <div class="mt-4">
                                    ${disponibilidadHTML}
                                    ${etiquetasHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        ${categoriaBtn}
                        <a href="https://wa.me/1234567890?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.nombre)}" 
                           class="btn btn-success" target="_blank">
                            <i class="bi bi-whatsapp me-2"></i>Consultar por WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Añadir modal al body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Añadir a la caché de modales
        this.modalCache.add(product.id);
        
        // Devolver el elemento del modal
        return document.getElementById(`modal${product.id}`);
    }
    
    /**
     * Actualiza el contenido de un modal existente
     */
    updateModal(modalElement, product) {
        if (!modalElement || !product) return null;
        
        // Actualizar título
        const titleElement = modalElement.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = product.nombre;
        }
        
        // Actualizar imágenes
        const imagesContainer = modalElement.querySelector('.modal-body .col-md-6:first-child');
        if (imagesContainer) {
            imagesContainer.innerHTML = this.createImagesContent(product);
        }
        
        // Actualizar descripción
        const descriptionElement = modalElement.querySelector('.modal-body .col-md-6:last-child p:first-child');
        if (descriptionElement) {
            descriptionElement.textContent = product.descripcion || 'Sin descripción disponible.';
        }
        
        // Actualizar características
        const caracteristicasContainer = modalElement.querySelector('.modal-body .col-md-6:last-child');
        if (caracteristicasContainer) {
            // Eliminar la sección de características existente si hay
            const existingCaracteristicas = caracteristicasContainer.querySelector('.mt-4:not(:last-child)');
            if (existingCaracteristicas) {
                existingCaracteristicas.remove();
            }
            
            // Añadir nuevas características
            const caracteristicasHTML = this.createCharacteristicsList(product);
            if (caracteristicasHTML) {
                const descriptionElement = caracteristicasContainer.querySelector('p:first-child');
                if (descriptionElement) {
                    descriptionElement.insertAdjacentHTML('afterend', caracteristicasHTML);
                }
            }
        }
        
        // Actualizar disponibilidad y etiquetas
        const statusContainer = modalElement.querySelector('.modal-body .mt-4:last-child');
        if (statusContainer) {
            statusContainer.innerHTML = `
                <span class="badge bg-${product.disponible ? 'success' : 'danger'} me-2">
                    ${product.disponible ? 'Disponible' : 'No disponible'}
                </span>
                ${this.createTagsBadges(product)}
            `;
        }
        
        // Actualizar botón de categoría
        const isOnCategoryPage = this.isProductInCurrentCategory(product);
        const footerElement = modalElement.querySelector('.modal-footer');
        
        if (footerElement) {
            const categoryBtn = footerElement.querySelector('.btn-primary');
            if (!isOnCategoryPage) {
                // Si no estamos en la página de la categoría, añadir o actualizar botón
                const categoryUrl = this.getCategoryUrl(product.categoria);
                
                if (categoryBtn) {
                    // Actualizar botón existente
                    categoryBtn.setAttribute('href', categoryUrl);
                    categoryBtn.innerHTML = `<i class="bi bi-list me-2"></i>Ver más en ${product.categoria}`;
                } else {
                    // Añadir nuevo botón
                    const closeBtn = footerElement.querySelector('.btn-secondary');
                    if (closeBtn) {
                        closeBtn.insertAdjacentHTML('afterend', `
                            <a href="${categoryUrl}" class="btn btn-primary">
                                <i class="bi bi-list me-2"></i>Ver más en ${product.categoria}
                            </a>
                        `);
                    }
                }
            } else if (categoryBtn) {
                // Si estamos en la página de la categoría y existe el botón, eliminarlo
                categoryBtn.remove();
            }
            
            // Actualizar botón de WhatsApp
            const whatsappBtn = footerElement.querySelector('.btn-success');
            if (whatsappBtn) {
                whatsappBtn.setAttribute('href', `https://wa.me/1234567890?text=Hola,%20me%20interesa%20el%20producto:%20${encodeURIComponent(product.nombre)}`);
            }
        }
        
        return modalElement;
    }
    
    /**
     * Crea el contenido HTML para las imágenes del producto
     */
    createImagesContent(product) {
        // Verificar si tenemos múltiples imágenes
        const hasMultipleImages = Array.isArray(product.imagenes) && product.imagenes.length > 1;
        
        // Si no hay imágenes, devolver imagen por defecto
        if (!hasMultipleImages && !product.imagen_principal) {
            return `<img src="${this.config.defaultImage}" class="img-fluid rounded" alt="${product.nombre}">`;
        }
        
        // Si solo hay una imagen o imagen_principal
        if (!hasMultipleImages) {
            const imagen = (Array.isArray(product.imagenes) && product.imagenes.length === 1) 
                ? product.imagenes[0] 
                : product.imagen_principal;
                
            return `<img src="${imagen}" class="img-fluid rounded" alt="${product.nombre}">`;
        }
        
        // Si hay múltiples imágenes, limitar a máximo configurado
        const imagenes = product.imagenes.slice(0, this.config.maxImages);
        
        // Determinar si usar grid o carrusel según configuración
        if (this.config.useGrid && imagenes.length <= 4) {
            return this.createImagesGrid(imagenes, product.nombre);
        } else {
            return this.createImagesCarousel(imagenes, product.id, product.nombre);
        }
    }
    
    /**
     * Crea un carrusel para múltiples imágenes
     */
    createImagesCarousel(images, productId, productName) {
        // Generar indicadores para el carrusel
        const indicators = images.map((_, index) => `
            <button type="button" data-bs-target="#carousel${productId}" data-bs-slide-to="${index}" 
            ${index === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${index + 1}"></button>
        `).join('');
        
        // Generar elementos del carrusel
        const items = images.map((img, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${img}" class="d-block w-100" alt="${productName} - Vista ${index + 1}">
            </div>
        `).join('');
        
        // Construir el carrusel completo
        return `
        <div id="carousel${productId}" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">
                ${indicators}
            </div>
            <div class="carousel-inner">
                ${items}
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#carousel${productId}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carousel${productId}" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
            </button>
        </div>
        `;
    }
    
    /**
     * Crea un grid para múltiples imágenes
     */
    createImagesGrid(images, productName) {
        // Determinar clase de grid según número de imágenes
        let gridClass = '';
        switch (images.length) {
            case 2:
                gridClass = 'grid-2-images';
                break;
            case 3:
                gridClass = 'grid-3-images';
                break;
            case 4:
                gridClass = 'grid-4-images';
                break;
            default:
                gridClass = '';
        }
        
        // Generar HTML para cada imagen
        const imagesHTML = images.map((img, index) => `
            <div class="grid-image-item">
                <img src="${img}" class="img-fluid" alt="${productName} - Vista ${index + 1}">
            </div>
        `).join('');
        
        // Construir el grid completo
        return `
        <div class="product-images-grid ${gridClass}">
            ${imagesHTML}
        </div>
        `;
    }
    
    /**
     * Crea la lista de características para un producto
     */
    createCharacteristicsList(product) {
        if (!Array.isArray(product.caracteristicas) || product.caracteristicas.length === 0) {
            return '';
        }
        
        const items = product.caracteristicas.map(car => `<li>${car}</li>`).join('');
        
        return `
        <div class="mt-4">
            <h6>Características:</h6>
            <ul class="caracteristicas-lista">
                ${items}
            </ul>
        </div>
        `;
    }
    
    /**
     * Crea badges para las etiquetas de un producto
     */
    createTagsBadges(product) {
        if (!Array.isArray(product.etiquetas) || product.etiquetas.length === 0) {
            return '';
        }
        
        return product.etiquetas.map(tag => `<span class="badge bg-primary me-2">${tag}</span>`).join('');
    }
    
    /**
     * Crea un badge para el descuento de un producto
     */
    createDiscountBadge(product) {
        if (!product.descuento || product.descuento <= 0) {
            return '';
        }
        
        // Determinar clase según el nivel de descuento
        let discountClass = '';
        if (product.descuento >= 30) {
            discountClass = 'high-discount';
        } else if (product.descuento >= 15) {
            discountClass = 'medium-discount';
        } else {
            discountClass = 'low-discount';
        }
        
        return `
        <div class="descuento-container mt-3">
            <span class="descuento ${discountClass}">
                -${product.descuento}% OFF
            </span>
        </div>
        `;
    }
    
    /**
     * Determina si un producto está en la categoría que se está visualizando
     */
    isProductInCurrentCategory(product) {
        const currentCategory = this.getCurrentCategory();
        const productCategory = this.getNormalizedCategoryId(product.categoria);
        
        return currentCategory === productCategory;
    }
    
    /**
     * Obtiene la categoría actual basada en la URL o los contenedores
     */
    getCurrentCategory() {
        // 1. Intenta detectar por URL
        const urlPath = window.location.pathname;
        const possibleCategories = ['salas', 'comedores', 'recamaras', 'cabeceras', 'mesas-centro'];
        
        for (const category of possibleCategories) {
            if (urlPath.includes(`${category}.html`)) {
                return category;
            }
        }
        
        // 2. Intenta detectar por contenedor en el DOM
        for (const category of possibleCategories) {
            if (document.getElementById(category)) {
                return category;
            }
        }
        
        return null;
    }
    
    /**
     * Obtiene la URL para una categoría específica
     */
    getCategoryUrl(categoria) {
        // Mapeo de categorías a URLs
        const categoriasMapping = {
            'Salas': 'salas.html',
            'Comedores': 'comedores.html',
            'Recámaras': 'recamaras.html',
            'Cabeceras': 'cabeceras.html',
            'Mesas de Centro': 'mesas-centro.html'
        };
        
        // Buscar en el mapeo
        if (categoriasMapping[categoria]) {
            return categoriasMapping[categoria];
        }
        
        // Si no está en el mapeo, normalizar y devolver
        return this.getNormalizedCategoryId(categoria) + '.html';
    }
    
    /**
     * Normaliza el ID de una categoría para URLs
     */
    getNormalizedCategoryId(categoriaName) {
        // Mapeo de nombres de categorías a IDs
        const categoriasMapping = {
            'Salas': 'salas',
            'Comedores': 'comedores',
            'Recámaras': 'recamaras',
            'Cabeceras': 'cabeceras',
            'Mesas de Centro': 'mesas-centro'
        };
        
        // Buscar en el mapeo
        if (categoriasMapping[categoriaName]) {
            return categoriasMapping[categoriaName];
        }
        
        // Si no está en el mapeo, normalizar manualmente
        return categoriaName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-');
    }
    
    /**
     * Abre un modal de producto
     */
    openModal(productId) {
        const modalElement = document.getElementById(`modal${productId}`);
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error(`No se pudo abrir el modal para el producto ${productId}`);
        }
    }
    
    /**
     * Cierra un modal de producto
     */
    closeModal(productId) {
        const modalElement = document.getElementById(`modal${productId}`);
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
    }
}