// =========================================
// CUBEX - ADMINISTRACIÓN DE PEDIDOS
// =========================================

const API_PEDIDOS = 'http://localhost:3011/api/Pedidos';

let listaPedidos = [];

// Elementos HTML
const tablaPedidos = document.getElementById('tablaPedidos');
const totalPedidos = document.getElementById('totalPedidos');
const pedidosPendientes = document.getElementById('pedidosPendientes');
const pedidosConfirmados = document.getElementById('pedidosConfirmados');
const buscarPedido = document.getElementById('buscarPedido');
const filtroEstado = document.getElementById('filtroEstado');
const mensajePedidos = document.getElementById('mensajePedidos');

// =========================================
// MENSAJES
// =========================================

function mostrarMensaje(texto, tipo = 'exito') {
    mensajePedidos.textContent = texto;
    mensajePedidos.className = `pedidos-mensaje ${tipo}`;

    setTimeout(() => {
        mensajePedidos.className = 'pedidos-mensaje';
        mensajePedidos.textContent = '';
    }, 4000);
}

// =========================================
// ESCAPAR TEXTO HTML
// =========================================

function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[caracter]);
}

// =========================================
// CONSULTAR PEDIDOS
// =========================================

async function cargarPedidos() {
    tablaPedidos.innerHTML = `
        <tr>
            <td colspan="5" class="pedidos-vacio">
                Cargando pedidos...
            </td>
        </tr>
    `;

    try {
        const respuesta = await fetch(API_PEDIDOS);

        if (!respuesta.ok) {
            throw new Error('No fue posible consultar los pedidos.');
        }

        const resultado = await respuesta.json();

        if (resultado.exitoso === false) {
            throw new Error(resultado.mensaje || 'Error al consultar pedidos.');
        }

        listaPedidos = Array.isArray(resultado)
            ? resultado
            : (resultado.datos || []);

        actualizarEstadisticas();
        mostrarPedidos();

    } catch (error) {
        console.error('Error al cargar pedidos:', error);

        tablaPedidos.innerHTML = `
            <tr>
                <td colspan="5" class="pedidos-vacio">
                    No se pudieron cargar los pedidos.
                    Verifica que el microservicio esté funcionando.
                </td>
            </tr>
        `;

        mostrarMensaje(error.message, 'error');
    }
}

// =========================================
// ESTADÍSTICAS
// =========================================

function actualizarEstadisticas() {
    totalPedidos.textContent = listaPedidos.length;

    pedidosPendientes.textContent = listaPedidos.filter(
        pedido => pedido.estado === 'Pendiente'
    ).length;

    pedidosConfirmados.textContent = listaPedidos.filter(
        pedido => pedido.estado === 'Confirmado'
    ).length;
}

// =========================================
// FORMATO DE FECHA
// =========================================

function formatearFecha(fecha) {
    if (!fecha) return 'Sin fecha';

    const fechaObjeto = new Date(fecha);

    if (isNaN(fechaObjeto.getTime())) {
        return escaparHTML(fecha);
    }

    return fechaObjeto.toLocaleString('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

// =========================================
// MOSTRAR PEDIDOS
// =========================================

function mostrarPedidos() {
    const busqueda = buscarPedido.value.trim().toLowerCase();
    const estadoSeleccionado = filtroEstado.value;

    const pedidosFiltrados = listaPedidos.filter(pedido => {
        const coincideBusqueda =
            String(pedido.id).includes(busqueda) ||
            String(pedido.id_cliente).includes(busqueda);

        const coincideEstado =
            !estadoSeleccionado ||
            pedido.estado === estadoSeleccionado;

        return coincideBusqueda && coincideEstado;
    });

    if (pedidosFiltrados.length === 0) {
        tablaPedidos.innerHTML = `
            <tr>
                <td colspan="5" class="pedidos-vacio">
                    No hay pedidos para mostrar.
                </td>
            </tr>
        `;
        return;
    }

    tablaPedidos.innerHTML = pedidosFiltrados.map(pedido => {

        const estado = pedido.estado || 'Pendiente';

        let claseEstado = 'pendiente';

        if (estado === 'Confirmado') {
            claseEstado = 'confirmado';
        } else if (estado === 'Cancelado') {
            claseEstado = 'cancelado';
        }

        return `
            <tr>
                <td>#${escaparHTML(pedido.id)}</td>

                <td>
                    Cliente #${escaparHTML(pedido.id_cliente)}
                </td>

                <td>
                    ${formatearFecha(pedido.fecha)}
                </td>

                <td>
                    <span class="pedido-estado ${claseEstado}">
                        ${escaparHTML(estado)}
                    </span>
                </td>

                <td>
                    <div class="pedido-acciones">

                        <button
                            class="pedido-boton"
                            onclick="verDetallePedido(${Number(pedido.id)})">
                            Ver
                        </button>

                        <select
                            class="pedido-estado-select"
                            aria-label="Cambiar estado del pedido ${Number(pedido.id)}"
                            onchange="cambiarEstadoPedido(${Number(pedido.id)}, this.value)">

                            <option value="Pendiente"
                                ${estado === 'Pendiente' ? 'selected' : ''}>
                                Pendiente
                            </option>

                            <option value="Confirmado"
                                ${estado === 'Confirmado' ? 'selected' : ''}>
                                Confirmado
                            </option>

                            <option value="Cancelado"
                                ${estado === 'Cancelado' ? 'selected' : ''}>
                                Cancelado
                            </option>

                        </select>

                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================
// BUSCAR Y FILTRAR
// =========================================

buscarPedido.addEventListener('input', mostrarPedidos);
filtroEstado.addEventListener('change', mostrarPedidos);

// =========================================
// VER DETALLES DE UN PEDIDO
// =========================================

async function verDetallePedido(id) {
    const modal = document.getElementById('modalPedido');
    const contenido = document.getElementById('contenidoDetallePedido');

    contenido.innerHTML = '<p>Consultando información...</p>';
    modal.classList.add('mostrar');

    try {
        const respuesta = await fetch(`${API_PEDIDOS}/${id}`);

        if (!respuesta.ok) {
            throw new Error('No se pudo consultar el pedido.');
        }

        const resultado = await respuesta.json();

        if (resultado.exitoso === false) {
            throw new Error(resultado.mensaje || 'No se encontró el pedido.');
        }

        const pedido = resultado.datos || resultado.pedido || resultado;

        contenido.innerHTML = `
            <div class="pedido-detalle">
                <span>Número de pedido</span>
                <strong>#${escaparHTML(pedido.id)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>ID del cliente</span>
                <strong>${escaparHTML(pedido.id_cliente)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>ID del carrito</span>
                <strong>${escaparHTML(pedido.id_carrito)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>ID de dirección</span>
                <strong>${escaparHTML(pedido.id_direccion)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>Tipo de pago</span>
                <strong>${escaparHTML(pedido.id_tipo_pago)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>Fecha</span>
                <strong>${formatearFecha(pedido.fecha)}</strong>
            </div>

            <div class="pedido-detalle">
                <span>Estado</span>
                <strong>${escaparHTML(pedido.estado)}</strong>
            </div>
        `;

    } catch (error) {
        contenido.innerHTML = `
            <p>${escaparHTML(error.message)}</p>
        `;
    }
}

// =========================================
// CERRAR DETALLES
// =========================================

function cerrarDetallePedido() {
    document.getElementById('modalPedido').classList.remove('mostrar');
}

// Cerrar al hacer clic fuera del modal
document.getElementById('modalPedido').addEventListener('click', event => {
    if (event.target.id === 'modalPedido') {
        cerrarDetallePedido();
    }
});

// =========================================
// ACTUALIZAR ESTADO DEL PEDIDO
// =========================================

async function cambiarEstadoPedido(id, nuevoEstado) {
    const estadosPermitidos = [
        'Pendiente',
        'Confirmado',
        'Cancelado'
    ];

    if (!estadosPermitidos.includes(nuevoEstado)) {
        mostrarMensaje('Estado no válido.', 'error');
        return;
    }

    const confirmar = confirm(
        `¿Deseas cambiar el estado del pedido #${id} a ${nuevoEstado}?`
    );

    if (!confirmar) {
        mostrarPedidos();
        return;
    }

    try {
        const respuesta = await fetch(`${API_PEDIDOS}/${id}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estado: nuevoEstado
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.exitoso === false) {
            throw new Error(
                resultado.mensaje || 'No se pudo actualizar el pedido.'
            );
        }

        mostrarMensaje('Estado del pedido actualizado correctamente.');

        await cargarPedidos();

    } catch (error) {
        console.error('Error al actualizar estado:', error);
        mostrarMensaje(error.message, 'error');
        await cargarPedidos();
    }
}

// =========================================
// INICIAR MÓDULO
// =========================================

document.addEventListener('DOMContentLoaded', cargarPedidos);