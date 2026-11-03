
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const productoRoutes = require('./routes/producto.routes');
const stockRoutes = require('./routes/stock.routes');
const ofertasRoutes = require('./routes/ofertas.routes');
const contactoRoutes = require('./routes/contacto.routes');

const swaggerSpec = require('./config/swagger');

const {
    rutaNoEncontrada,
    manejarErrores
} = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares generales
app.use(cors());
app.use(express.json());
app.use('/api/contacto', contactoRoutes);

// Permitir consultar las imágenes de los productos
app.use(
    '/uploads',
    express.static(path.join(__dirname, '../uploads'))
);

// Documentación Swagger
app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// Health check
app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        service: 'inventario-service',
        message: 'Servicio de inventario funcionando correctamente'
    });
});

// Rutas de productos
app.use('/api/productos', productoRoutes);

// Rutas de stock
app.use('/api/stock', stockRoutes);

// Rutas de ofertas
app.use('/api/ofertas', ofertasRoutes);

// Ruta no encontrada
app.use(rutaNoEncontrada);

// Manejador general de errores
app.use(manejarErrores);

app.listen(PORT, () => {
    console.log(
        `Servidor de inventario ejecutándose en http://localhost:${PORT}`
    );

    console.log(
        `Documentación disponible en http://localhost:${PORT}/api/docs`
    );
});
