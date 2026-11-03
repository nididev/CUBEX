
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
            s.stock_maximo,
            o.activa AS oferta_activa,
            o.porcentaje_descuento,
            o.precio_oferta
        FROM productos p
        LEFT JOIN stock s
            ON p.id = s.id_producto
        LEFT JOIN ofertas o
            ON p.id = o.id_producto
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
    // Guardar las existencias y límites
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

    // Consultar si el producto tiene una oferta activa
    const [ofertas] = await pool.query(`
        SELECT activa
        FROM ofertas
        WHERE id_producto = ?
    `, [idProducto]);

    if (ofertas.length > 0 && ofertas[0].activa) {
        const actual = Number(stockActual);
        const maximo = Number(stockMaximo);

        // Si baja del 80% del máximo, desactivar la oferta
        if (maximo <= 0 || actual < maximo * 0.8) {
            await pool.query(`
                UPDATE ofertas
                SET activa = FALSE
                WHERE id_producto = ?
            `, [idProducto]);

        } else {
            // Si sigue en nivel alto, actualizar el descuento
            const porcentaje = actual >= maximo ? 20 : 10;

            const [productos] = await pool.query(
                'SELECT precio FROM productos WHERE id = ?',
                [idProducto]
            );

            if (productos.length > 0) {
                const precioOriginal = Number(productos[0].precio);

                const precioOferta = Number(
                    (precioOriginal * (1 - porcentaje / 100)).toFixed(2)
                );

                await pool.query(`
                    UPDATE ofertas
                    SET porcentaje_descuento = ?,
                        precio_oferta = ?
                    WHERE id_producto = ?
                `, [
                    porcentaje,
                    precioOferta,
                    idProducto
                ]);
            }
        }
    }

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
