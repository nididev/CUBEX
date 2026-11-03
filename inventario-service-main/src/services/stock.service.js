const pool = require('../config/database');

// Consultar todos los productos y sus existencias
const obtenerInventario = async () => {
    const [productos] = await pool.query(`
        SELECT
            p.id AS id_producto,
            p.nombre,
            p.precio,
            p.imagen,
            s.stock_actual,
            s.stock_minimo,
            s.stock_maximo
        FROM productos p
        LEFT JOIN stock s
            ON p.id = s.id_producto
        ORDER BY p.nombre ASC
    `);

    return productos;
};

// Consultar el inventario de un producto
const obtenerPorId = async (idProducto) => {
    const [productos] = await pool.query(`
        SELECT
            p.id AS id_producto,
            p.nombre,
            p.precio,
            s.stock_actual,
            s.stock_minimo,
            s.stock_maximo
        FROM productos p
        LEFT JOIN stock s
            ON p.id = s.id_producto
        WHERE p.id = ?
    `, [idProducto]);

    return productos[0];
};

// Registrar o actualizar las cantidades
const guardarStock = async (
    idProducto,
    stockActual,
    stockMinimo,
    stockMaximo
) => {
    await pool.query(`
        INSERT INTO stock (
            id_producto,
            stock_actual,
            stock_minimo,
            stock_maximo
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            stock_actual = VALUES(stock_actual),
            stock_minimo = VALUES(stock_minimo),
            stock_maximo = VALUES(stock_maximo)
    `, [
        idProducto,
        stockActual,
        stockMinimo,
        stockMaximo
    ]);

    return obtenerPorId(idProducto);
};

// Verificar que el producto exista
const productoExiste = async (idProducto) => {
    const [productos] = await pool.query(
        'SELECT id FROM productos WHERE id = ?',
        [idProducto]
    );

    return productos.length > 0;
};

module.exports = {
    obtenerInventario,
    obtenerPorId,
    guardarStock,
    productoExiste
};