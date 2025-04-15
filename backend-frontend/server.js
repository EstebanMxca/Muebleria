const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
    // Si CORS_ORIGINS existe en .env, úsalo. Si no, permite todos los orígenes en producción
    origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*'
}));
app.use(express.json());

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Añadir después de crear el pool
console.log('Intentando conectar a la base de datos con configuración:', {
    host: process.env.DB_HOST || 'no definido',
    user: process.env.DB_USER || 'no definido',
    database: process.env.DB_NAME || 'no definido',
    // No mostrar la contraseña por seguridad
});

// Probar conexión al inicio
pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión a la base de datos establecida correctamente');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar con la base de datos:', err);
        console.error('Verifique sus variables de entorno en el archivo .env');
    });

// Endpoint para obtener productos por categoría con paginación
app.get('/api/productos/:categoria', async (req, res) => {
    const { categoria } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const offset = (page - 1) * limit;
    const style = req.query.style || '';
    const sort = req.query.sort || 'destacado';

    try {
        // Construir la consulta base
        let query = `
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.descuento, 
                p.imagen_principal,
                p.disponible,
                c.nombre AS categoria
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE c.id = ?
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE c.id = ?
        `;
        
        let queryParams = [categoria];
        let countQueryParams = [categoria];
        
        // Añadir filtro de estilo si está especificado
        if (style) {
            // Buscar en las características del producto
            query = `
                ${query}
                AND p.id IN (
                    SELECT cp.producto_id
                    FROM caracteristicas_producto cp
                    WHERE cp.descripcion LIKE ?
                )
            `;
            
            countQuery = `
                ${countQuery}
                AND p.id IN (
                    SELECT cp.producto_id
                    FROM caracteristicas_producto cp
                    WHERE cp.descripcion LIKE ?
                )
            `;
            
            queryParams.push(`%${style}%`);
            countQueryParams.push(`%${style}%`);
        }
        
        // Añadir ordenamiento
        switch (sort) {
            case 'nombre':
                query += ' ORDER BY p.nombre ASC';
                break;
            case 'reciente':
                query += ' ORDER BY p.id DESC'; // Asumiendo que ID más alto = más reciente
                break;
            default:
                // Para destacados, usar un orden predeterminado o randomizar
                query += ' ORDER BY p.id ASC';
                break;
        }
        
        // Añadir paginación
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);
        
        // Consultar productos
        const [productos] = await pool.query(query, queryParams);
        
        // Consultar total de productos para cálculo de páginas
        const [totalResult] = await pool.query(countQuery, countQueryParams);
        const totalProductos = totalResult[0].total;
        const totalPaginas = Math.ceil(totalProductos / limit);
        
        // Enriquecer productos con características y etiquetas
        const productosConDetalles = await Promise.all(
            productos.map(async (producto) => {
                const [caracteristicas] = await pool.query(`
                    SELECT descripcion 
                    FROM caracteristicas_producto 
                    WHERE producto_id = ?
                `, [producto.id]);

                const [etiquetas] = await pool.query(`
                    SELECT etiqueta 
                    FROM etiquetas_producto 
                    WHERE producto_id = ?
                `, [producto.id]);

                return {
                    ...producto,
                    caracteristicas: caracteristicas.map(c => c.descripcion),
                    etiquetas: etiquetas.map(e => e.etiqueta)
                };
            })
        );

        res.json({
            productos: productosConDetalles,
            totalPaginas,
            paginaActual: page
        });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener categorías
app.get('/api/categorias', async (req, res) => {
    try {
        const [categorias] = await pool.query('SELECT * FROM categorias');
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener todos los productos para selección
app.get('/api/productos-seleccion', async (req, res) => {
    try {
        const [productos] = await pool.query(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.descuento, 
                p.imagen_principal,
                p.imagenes,
                p.disponible,
                c.nombre AS categoria
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
        `);
        
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener productos destacados
app.get('/api/productos-destacados', async (req, res) => {
    try {
        // Consulta para obtener productos destacados
        const [productos] = await pool.query(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.descuento, 
                p.imagen_principal,
                p.disponible,
                c.nombre AS categoria
            FROM productos_destacados pd
            JOIN productos p ON pd.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            ORDER BY pd.orden
            LIMIT 5
        `);

        // Consulta para obtener características y etiquetas
        const productosConDetalles = await Promise.all(
            productos.map(async (producto) => {
                const [caracteristicas] = await pool.query(`
                    SELECT descripcion 
                    FROM caracteristicas_producto 
                    WHERE producto_id = ?
                `, [producto.id]);

                const [etiquetas] = await pool.query(`
                    SELECT etiqueta 
                    FROM etiquetas_producto 
                    WHERE producto_id = ?
                `, [producto.id]);

                return {
                    ...producto,
                    caracteristicas: caracteristicas.map(c => c.descripcion),
                    etiquetas: etiquetas.map(e => e.etiqueta)
                };
            })
        );

        res.json(productosConDetalles);
    } catch (error) {
        console.error('Error al obtener productos destacados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para actualizar productos destacados
app.post('/api/productos-destacados', async (req, res) => {
    const { productos } = req.body;
    
    try {
        // Limpiar productos destacados existentes
        await pool.query('DELETE FROM productos_destacados');
        
        // Insertar nuevos productos destacados
        for (let i = 0; i < productos.length; i++) {
            await pool.query('INSERT INTO productos_destacados (producto_id, orden) VALUES (?, ?)', 
                [productos[i], i + 1]
            );
        }
        
        res.json({ mensaje: 'Productos destacados actualizados' });
    } catch (error) {
        console.error('Error al actualizar productos destacados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener un producto específico por ID
app.get('/api/productos/detalle/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Consultar el producto por ID con todas sus relaciones
        const [producto] = await pool.query(`
            SELECT 
                p.id, 
                p.nombre, 
                p.descripcion, 
                p.descuento, 
                p.imagen_principal,
                p.imagenes,
                p.disponible,
                c.nombre AS categoria
            FROM productos p
            JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = ?
        `, [id]);
        
        // Obtener características
        const [caracteristicas] = await pool.query(`
            SELECT descripcion 
            FROM caracteristicas_producto 
            WHERE producto_id = ?
        `, [id]);
        
        // Obtener etiquetas
        const [etiquetas] = await pool.query(`
            SELECT etiqueta 
            FROM etiquetas_producto 
            WHERE producto_id = ?
        `, [id]);
        
        // Verificar si se encontró el producto
        if (!producto || producto.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        // Combinar toda la información
        const productoCompleto = {
            ...producto[0],
            caracteristicas: caracteristicas.map(c => c.descripcion),
            etiquetas: etiquetas.map(e => e.etiqueta),
            imagenes: JSON.parse(producto[0].imagenes || '[]')
        };
        
        res.json(productoCompleto);
        
    } catch (error) {
        console.error('Error al obtener producto por ID:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});