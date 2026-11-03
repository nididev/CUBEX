
const API_INVENTARIO = 'http://localhost:3005/api/stock';

// Elementos del HTML
const tablaInventario = document.getElementById('tablaInventario');
const btnActualizar = document.getElementById('btnActualizar');
const modalStock = document.getElementById('modalStock');
const formStock = document.getElementById('formStock');
const btnCancelar = document.getElementById('btnCancelar');

let productosInventario = [];

// Mostrar mensajes dentro de la página
function mostrarMensaje(texto, tipo = 'exito') {
    const mensaje = document.getElementById('mensajeInventario');

    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;

    setTimeout(() => {
        mensaje.textContent = '';
        mensaje.className = 'mensaje';
    }, 4000);
}

// Consultar inventario desde el microservicio
async function cargarInventario() {
    tablaInventario.innerHTML = `
        <tr>
            <td colspan="6" class="mensaje-tabla">
                Cargando productos...
            </td>
        </tr>
    `;

    try {
        const respuesta = await fetch(API_INVENTARIO);
        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'No se pudo consultar el inventario');
        }

        productosInventario = resultado.data || [];

        mostrarInventario(productosInventario);
        actualizarResumen(productosInventario);

    } catch (error) {
        console.error('Error al cargar inventario:', error);

        tablaInventario.innerHTML = `
            <tr>
                <td colspan="6" class="mensaje-tabla">
                    No se pudo cargar el inventario. Verifica que el microservicio
                    esté funcionando en el puerto 3005.
                </td>
            </tr>
        `;

        actualizarResumen([]);
        mostrarMensaje('Error al consultar el inventario.', 'error');
    }
}

// Determinar el estado de las existencias
function obtenerEstado(producto) {
    const actual = Number(producto.stock_actual ?? 0);
    const minimo = producto.stock_minimo;
    const maximo = producto.stock_maximo;

    if (minimo === null || maximo === null ||
        minimo === undefined || maximo === undefined) {
        return {
            texto: 'Sin configurar',
            clase: 'sin-configurar'
        };
    }

    if (actual <= Number(minimo)) {
        return {
            texto: 'Stock bajo',
            clase: 'stock-bajo'
        };
    }

    if (actual >= Number(maximo)) {
        return {
            texto: 'Stock excedido',
            clase: 'stock-excedido'
        };
    }

    return {
        texto: 'Stock normal',
        clase: 'stock-normal'
    };
}

// Mostrar productos en la tabla
function mostrarInventario(productos) {
    if (!productos.length) {
        tablaInventario.innerHTML = `
            <tr>
                <td colspan="6" class="mensaje-tabla">
                    No hay productos registrados.
                </td>
            </tr>
        `;
        return;
    }

    tablaInventario.innerHTML = productos.map(producto => {
        const estado = obtenerEstado(producto);

        return `
            <tr>
                <td>${escaparHTML(producto.nombre || 'Sin nombre')}</td>

                <td>${Number(producto.stock_actual ?? 0)}</td>

                <td>
                    ${producto.stock_minimo ?? '—'}
                </td>

                <td>
                    ${producto.stock_maximo ?? '—'}
                </td>

                <td>
                    <span class="estado ${estado.clase}">
                        ${estado.texto}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="btn-configurar"
                        onclick="abrirModal(${Number(producto.id_producto)})">
                        Configurar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Evitar insertar texto HTML proveniente de la base de datos
function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caracter => {
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

// Actualizar las tarjetas de resumen
function actualizarResumen(productos) {
    let bajos = 0;
    let normales = 0;
    let excedidos = 0;

    productos.forEach(producto => {
        const estado = obtenerEstado(producto);

        if (estado.clase === 'stock-bajo') bajos++;
        if (estado.clase === 'stock-normal') normales++;
        if (estado.clase === 'stock-excedido') excedidos++;
    });

    document.getElementById('totalProductos').textContent = productos.length;
    document.getElementById('totalBajo').textContent = bajos;
    document.getElementById('totalNormal').textContent = normales;
    document.getElementById('totalExceso').textContent = excedidos;
}

// Abrir modal para configurar los límites
function abrirModal(idProducto) {
    const producto = productosInventario.find(
        p => Number(p.id_producto) === Number(idProducto)
    );

    if (!producto) {
        mostrarMensaje('No se encontró el producto seleccionado.', 'error');
        return;
    }

    document.getElementById('idProducto').value = producto.id_producto;

    document.getElementById('nombreProducto').textContent =
        producto.nombre || 'Producto';

    document.getElementById('stockMinimo').value =
        producto.stock_minimo ?? 0;

    document.getElementById('stockMaximo').value =
        producto.stock_maximo ?? 0;

    modalStock.style.display = 'flex';
    document.body.classList.add('modal-abierto');
}

// Cerrar modal
function cerrarModal() {
    modalStock.style.display = 'none';
    document.body.classList.remove('modal-abierto');
}

// Guardar los límites de stock
async function guardarStock(evento) {
    evento.preventDefault();

    const idProducto = document.getElementById('idProducto').value;

    const stockMinimo = Number(
        document.getElementById('stockMinimo').value
    );

    const stockMaximo = Number(
        document.getElementById('stockMaximo').value
    );

    const producto = productosInventario.find(
        p => Number(p.id_producto) === Number(idProducto)
    );

    if (!producto) {
        mostrarMensaje('No se encontró el producto.', 'error');
        return;
    }

    if (
        !Number.isInteger(stockMinimo) ||
        !Number.isInteger(stockMaximo) ||
        stockMinimo < 0 ||
        stockMaximo < 0
    ) {
        mostrarMensaje('Las cantidades deben ser números enteros no negativos.', 'error');
        return;
    }

    if (stockMaximo < stockMinimo) {
        mostrarMensaje('El stock máximo no puede ser menor que el mínimo.', 'error');
        return;
    }

    // Conservar las existencias actuales del producto
    const stockActual = Number(producto.stock_actual ?? 0);

    const datos = {
        stock_actual: stockActual,
        stock_minimo: stockMinimo,
        stock_maximo: stockMaximo
    };

    const botonGuardar = formStock.querySelector(
        'button[type="submit"]'
    );

    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando...';

    try {
        const respuesta = await fetch(
            `${API_INVENTARIO}/${idProducto}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(
                resultado.message || 'No se pudieron guardar los límites.'
            );
        }

        cerrarModal();

        await cargarInventario();

        mostrarMensaje(
            'Los límites de inventario se guardaron correctamente.',
            'exito'
        );

    } catch (error) {
        console.error('Error al guardar stock:', error);

        mostrarMensaje(
            error.message || 'Error al guardar los límites de inventario.',
            'error'
        );

    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = 'Guardar cambios';
    }
}

// Eventos
btnActualizar.addEventListener('click', cargarInventario);

btnCancelar.addEventListener('click', cerrarModal);

formStock.addEventListener('submit', guardarStock);

// Cerrar al hacer clic fuera del cuadro
modalStock.addEventListener('click', evento => {
    if (evento.target === modalStock) {
        cerrarModal();
    }
});

// Cerrar con la tecla Escape
document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape' && modalStock.style.display === 'flex') {
        cerrarModal();
    }
});

// Cargar inventario al abrir la página
document.addEventListener('DOMContentLoaded', cargarInventario);
