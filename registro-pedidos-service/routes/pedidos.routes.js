
const express = require('express');
const router = express.Router();

const pedidosController = require('../controllers/pedidos.controller');

// Consultar todos los pedidos
router.get('/', pedidosController.obtenerPedidos);

// Consultar un pedido por ID
router.get('/:id', pedidosController.obtenerPedido);

// Registrar un pedido pendiente
router.post('/', pedidosController.registrarPedido);

// Actualizar el estado administrativo de un pedido
router.patch('/:id/estado', pedidosController.actualizarEstado);

module.exports = router;
