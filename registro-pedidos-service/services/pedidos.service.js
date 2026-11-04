
const pool = require('../config/database');

// Consultar todos los pedidos
const obtenerPedidos = async () => {
    const [pedidos] = await pool.query(`
        SELECT *
        FROM pedidos
        ORDER BY fecha DESC
    `);

    return pedidos;
};

// Consultar un pedido por ID
const obtenerPedido = async (id) => {
    const [pedidos] = await pool.query(
        'SELECT * FROM pedidos WHERE id = ?',
        [id]
    );

    return pedidos[0] || null;
};

// Registrar un pedido pendiente
const registrarPedido = async (datos) => {
    const conexion = await pool.getConnection();

    try {
        await conexion.beginTransaction();

        const { id_usuario, id_direccion, productos } = datos;

        // 1. Validar los datos recibidos
        if (!id_usuario || !id_direccion) {
            const error = new Error(
                'Falta el usuario o el domicilio del pedido'
            );
            error.status = 400;
            throw error;
        }

        if (!Array.isArray(productos) || productos.length === 0) {
            const error = new Error(
                'El carrito no contiene productos'
            );
            error.status = 400;
            throw error;
        }

        // 2. Buscar el cliente asociado al usuario
        const [clientes] = await conexion.query(
            `SELECT id
             FROM clientes
             WHERE id_usuario = ?
             LIMIT 1`,
            [id_usuario]
        );

        if (clientes.length === 0) {
            const error = new Error(
                'No existe un cliente asociado a este usuario'
            );
            error.status = 404;
            throw error;
        }

        const id_cliente = clientes[0].id;

        // 3. Verificar que el domicilio pertenezca al cliente
        const [direcciones] = await conexion.query(
            `SELECT id
             FROM direcciones
             WHERE id = ? AND id_cliente = ?
             LIMIT 1`,
            [id_direccion, id_cliente]
        );

        if (direcciones.length === 0) {
            const error = new Error(
                'El domicilio no existe o no pertenece al cliente'
            );
            error.status = 400;
            throw error;
        }

        // 4. Obtener el tipo de pago Tarjeta
        const [tiposPago] = await conexion.query(
            `SELECT id
             FROM tipos_pago
             WHERE nombre = 'Tarjeta'
             LIMIT 1`
        );

        if (tiposPago.length === 0) {
            const error = new Error(
                'No está registrado el tipo de pago Tarjeta'
            );
            error.status = 400;
            throw error;
        }

        const id_tipo_pago = tiposPago[0].id;

        // 5. Validar los productos y sus cantidades
        const productosValidados = [];

        for (const producto of productos) {
            const id_producto = Number(producto.id);
            const cantidad = Number(producto.cantidad);

            if (
                !Number.isInteger(id_producto) ||
                id_producto <= 0 ||
                !Number.isInteger(cantidad) ||
                cantidad <= 0
            ) {
                const error = new Error(
                    'Hay productos o cantidades no válidas'
                );
                error.status = 400;
                throw error;
            }

            // Comprobar que el producto exista
            const [existentes] = await conexion.query(
                `SELECT id
                 FROM productos
                 WHERE id = ?
                 LIMIT 1`,
                [id_producto]
            );

            if (existentes.length === 0) {
                const error = new Error(
                    `El producto ${id_producto} no existe`
                );
                error.status = 400;
                throw error;
            }

            productosValidados.push({
                id: id_producto,
                cantidad
            });
        }

        // 6. Crear el carrito cerrado en MySQL
        const [nuevoCarrito] = await conexion.query(
            `INSERT INTO carrito (id_cliente, estado)
             VALUES (?, 'cerrado')`,
            [id_cliente]
        );

        const id_carrito = nuevoCarrito.insertId;

        // 7. Guardar los productos en detalle_carrito
        for (const producto of productosValidados) {
            await conexion.query(
                `INSERT INTO detalle_carrito
                    (id_carrito, id_producto, cantidad)
                 VALUES (?, ?, ?)`,
                [
                    id_carrito,
                    producto.id,
                    producto.cantidad
                ]
            );
        }

        // 8. Crear el pedido pendiente, sin tarjeta asignada
        const [resultadoPedido] = await conexion.query(
            `INSERT INTO pedidos
                (id_carrito, id_cliente, id_direccion,
                 id_tipo_pago, id_tarjeta, fecha, estado)
             VALUES (?, ?, ?, ?, NULL, NOW(), 'pendiente')`,
            [
                id_carrito,
                id_cliente,
                id_direccion,
                id_tipo_pago
            ]
        );

        const id_pedido = resultadoPedido.insertId;

        // 9. Confirmar todas las operaciones
        await conexion.commit();

        // 10. Devolver el pedido creado
        return await obtenerPedido(id_pedido);

    } catch (error) {
        await conexion.rollback();

        throw error;

    } finally {
        conexion.release();
    }
};

// Actualizar el estado de un pedido
const actualizarEstado = async (id, estado) => {
    const estadosPermitidos = [
        'pendiente',
        'pagado',
        'confirmado',
        'cancelado'
    ];

    if (!estadosPermitidos.includes(String(estado).toLowerCase())) {
        const error = new Error('El estado del pedido no es válido');
        error.status = 400;
        throw error;
    }

    const [resultado] = await pool.query(
        `UPDATE pedidos
         SET estado = ?
         WHERE id = ?`,
        [String(estado).toLowerCase(), id]
    );

    if (resultado.affectedRows === 0) {
        return null;
    }

    return await obtenerPedido(id);
};

module.exports = {
    obtenerPedidos,
    obtenerPedido,
    registrarPedido,
    actualizarEstado
};
