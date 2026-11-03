
// =========================================
// CUBEX - MÓDULO DE REPORTES
// =========================================

const API_REPORTES_INVENTARIO =
    'http://localhost:3008/api/v1/reportes/inventario';

let productosInventario = [];
let reporteInventario = null;

// ELEMENTOS
const btnActualizar = document.getElementById('btnActualizar');
const btnExportarInventario = document.getElementById('btnExportarInventario');

const mensajeInventario = document.getElementById('mensajeInventario');
const tablaInventario = document.getElementById('tablaInventario');

const filtroStock = document.getElementById('filtroStock');
const buscarProducto = document.getElementById('buscarProducto');

const totalProductos = document.getElementById('totalProductos');
const totalUnidades = document.getElementById('totalUnidades');
const productosStockBajo = document.getElementById('productosStockBajo');
const valorInventario = document.getElementById('valorInventario');

const contadorProductos = document.getElementById('contadorProductos');
const fechaReporte = document.getElementById('fechaReporte');

// FORMATO DE MONEDA
function formatoMoneda(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2
    }).format(Number(valor || 0));
}

// FORMATO DE CANTIDADES
function formatoNumero(valor) {
    return new Intl.NumberFormat('es-MX').format(Number(valor || 0));
}

// MENSAJES
function mostrarMensaje(mensaje, tipo = '') {
    mensajeInventario.textContent = mensaje;
    mensajeInventario.className = 'mensaje-reporte';

    if (tipo) {
        mensajeInventario.classList.add(tipo);
    }
}

// CARGAR REPORTE DE INVENTARIO
async function cargarReporteInventario() {
    mostrarMensaje('Consultando información del inventario...');

    tablaInventario.innerHTML = `
        <tr>
            <td colspan="8" class="tabla-vacia">
                Cargando productos...
            </td>
        </tr>
    `;

    btnActualizar.disabled = true;

    try {
        const respuesta = await fetch(API_REPORTES_INVENTARIO, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            cache: 'no-store'
        });

        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();

        if (!resultado.data) {
            throw new Error('La respuesta del reporte no contiene información.');
        }

        reporteInventario = resultado.data;
        productosInventario = Array.isArray(resultado.data.productos)
            ? resultado.data.productos
            : [];

        mostrarResumen(resultado.data.resumen || {});
        aplicarFiltros();

        const fecha = resultado.data.generadoEn
            ? new Date(resultado.data.generadoEn)
            : new Date();

        fechaReporte.textContent =
            `Última actualización: ${fecha.toLocaleString('es-MX')}`;

        mostrarMensaje('Reporte de inventario actualizado correctamente.', 'exito');

    } catch (error) {
        console.error('Error al cargar el reporte:', error);

        mostrarMensaje(
            'No fue posible consultar el reporte. Verifica que el servicio de inventario esté activo en el puerto 3008.',
            'error'
        );

        tablaInventario.innerHTML = `
            <tr>
                <td colspan="8" class="tabla-vacia">
                    No se pudo cargar la información del inventario.
                </td>
            </tr>
        `;

        totalProductos.textContent = '--';
        totalUnidades.textContent = '--';
        productosStockBajo.textContent = '--';
        valorInventario.textContent = '--';

        contadorProductos.textContent = '0 productos';

    } finally {
        btnActualizar.disabled = false;
    }
}

// MOSTRAR TARJETAS DE RESUMEN
function mostrarResumen(resumen) {
    totalProductos.textContent =
        formatoNumero(resumen.totalProductos);

    totalUnidades.textContent =
        formatoNumero(resumen.totalUnidades);

    productosStockBajo.textContent =
        formatoNumero(resumen.productosStockBajo);

    valorInventario.textContent =
        formatoMoneda(resumen.valorInventario);
}

// DETERMINAR CLASE DEL ESTADO
function obtenerClaseEstado(producto) {
    if (producto.stockBajo) {
        return 'bajo';
    }

    if (producto.stockExcedido) {
        return 'excedido';
    }

    return 'normal';
}

// APLICAR FILTROS Y BÚSQUEDA
function aplicarFiltros() {
    const filtro = filtroStock.value;
    const busqueda = buscarProducto.value.trim().toLowerCase();

    let productosFiltrados = [...productosInventario];

    if (filtro === 'bajo') {
        productosFiltrados = productosFiltrados.filter(
            producto => producto.stockBajo
        );
    }

    if (filtro === 'normal') {
        productosFiltrados = productosFiltrados.filter(
            producto => !producto.stockBajo && !producto.stockExcedido
        );
    }

    if (filtro === 'excedido') {
        productosFiltrados = productosFiltrados.filter(
            producto => producto.stockExcedido
        );
    }

    if (filtro === 'sin-stock') {
        productosFiltrados = productosFiltrados.filter(
            producto => Number(producto.stock) === 0
        );
    }

    if (busqueda) {
        productosFiltrados = productosFiltrados.filter(producto =>
            String(producto.nombre || '').toLowerCase().includes(busqueda)
        );
    }

    mostrarProductos(productosFiltrados);
}

// MOSTRAR TABLA
function mostrarProductos(productos) {
    contadorProductos.textContent =
        `${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}`;

    if (productos.length === 0) {
        tablaInventario.innerHTML = `
            <tr>
                <td colspan="8" class="tabla-vacia">
                    No se encontraron productos con esos filtros.
                </td>
            </tr>
        `;
        return;
    }

    tablaInventario.innerHTML = productos.map(producto => {
        const clase = obtenerClaseEstado(producto);

        return `
            <tr>
                <td>${escaparHTML(producto.idProducto)}</td>

                <td>
                    <strong>${escaparHTML(producto.nombre)}</strong>
                </td>

                <td>${formatoMoneda(producto.precioUnitario)}</td>

                <td>${formatoNumero(producto.stock)}</td>

                <td>${formatoNumero(producto.stockMinimo)}</td>

                <td>${formatoNumero(producto.stockMaximo)}</td>

                <td>
                    <strong>${formatoMoneda(producto.valorTotal)}</strong>
                </td>

                <td>
                    <span class="estado-stock ${clase}">
                        ${escaparHTML(producto.estado || 'Normal')}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

// EVITAR INSERTAR TEXTO COMO HTML
function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => {
        const equivalencias = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return equivalencias[caracter];
    });
}

// EXPORTAR INVENTARIO A CSV
function exportarInventarioCSV() {
    const filtro = filtroStock.value;
    const busqueda = buscarProducto.value.trim().toLowerCase();

    let productos = [...productosInventario];

    if (filtro === 'bajo') {
        productos = productos.filter(p => p.stockBajo);
    }

    if (filtro === 'normal') {
        productos = productos.filter(
            p => !p.stockBajo && !p.stockExcedido
        );
    }

    if (filtro === 'excedido') {
        productos = productos.filter(p => p.stockExcedido);
    }

    if (filtro === 'sin-stock') {
        productos = productos.filter(p => Number(p.stock) === 0);
    }

    if (busqueda) {
        productos = productos.filter(p =>
            String(p.nombre || '').toLowerCase().includes(busqueda)
        );
    }

    if (productos.length === 0) {
        mostrarMensaje('No hay productos para exportar con los filtros seleccionados.', 'error');
        return;
    }

    const encabezados = [
        'ID',
        'Producto',
        'Precio unitario',
        'Stock actual',
        'Stock minimo',
        'Stock maximo',
        'Valor total',
        'Estado'
    ];

    const filas = productos.map(p => [
        p.idProducto,
        p.nombre,
        p.precioUnitario,
        p.stock,
        p.stockMinimo,
        p.stockMaximo,
        p.valorTotal,
        p.estado
    ]);

    const contenido = [encabezados, ...filas]
        .map(fila =>
            fila.map(valor =>
                `"${String(valor ?? '').replace(/"/g, '""')}"`
            ).join(',')
        )
        .join('\r\n');

    const archivo = new Blob(
        ['\uFEFF' + contenido],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = 'reporte_inventario_cubex.csv';

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
}

// CAMBIAR ENTRE LOS DOS REPORTES
document.querySelectorAll('.opcion-reporte').forEach(boton => {
    boton.addEventListener('click', () => {
        document.querySelectorAll('.opcion-reporte').forEach(opcion => {
            opcion.classList.remove('activa');
        });

        boton.classList.add('activa');

        const tipoReporte = boton.dataset.reporte;

        document.getElementById('reporteInventario')
            .classList.toggle('oculto', tipoReporte !== 'inventario');

        document.getElementById('reporteCompras')
            .classList.toggle('oculto', tipoReporte !== 'compras');

        if (tipoReporte === 'inventario' && !reporteInventario) {
            cargarReporteInventario();
        }
    });
});

// EVENTOS
btnActualizar.addEventListener('click', cargarReporteInventario);

btnExportarInventario.addEventListener('click', exportarInventarioCSV);

filtroStock.addEventListener('change', aplicarFiltros);

buscarProducto.addEventListener('input', aplicarFiltros);

// CARGA INICIAL
document.addEventListener('DOMContentLoaded', cargarReporteInventario);
