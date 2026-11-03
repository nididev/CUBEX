
// ========================================
// CONFIGURACIÓN DE API
// ========================================

const API_PRODUCTOS = 'http://localhost:3005/api/productos';
const API_IMAGENES = 'http://localhost:3005';
const API_RESENAS = 'http://localhost:3007/api/resenas';


// ========================================
// ELEMENTOS DEL DOM
// ========================================

const catalogo = document.getElementById('catalogoProductos');
const seccionProductos = document.getElementById('productos');
const detalleProducto = document.getElementById('detalleProducto');
const hero = document.querySelector('.hero');

const buscarProducto = document.getElementById('buscarProducto');
const btnBuscar = document.getElementById('btnBuscar');
const btnRegresar = document.getElementById('btnRegresarCatalogo');

const formularioResena = document.getElementById('formularioResena');


// ========================================
// VARIABLES GLOBALES
// ========================================

let productosCargados = [];
let productoActual = null;

// ========================================
// MENSAJES PERSONALIZADOS
// ========================================

function mostrarMensajeResena(texto, tipo = 'info') {
    const mensaje = document.getElementById('mensajeResena');

    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.className = `mensaje-resena ${tipo}`;
    mensaje.style.display = 'block';
}

function limpiarMensajeResena() {
    const mensaje = document.getElementById('mensajeResena');

    if (!mensaje) return;

    mensaje.textContent = '';
    mensaje.className = 'mensaje-resena';
    mensaje.style.display = 'none';
}

// ========================================
// CARGAR PRODUCTOS DESDE INVENTARIO
// ========================================

async function cargarProductos() {
    try {
        if (catalogo) {
            catalogo.innerHTML = `
                <p class="mensaje-catalogo">
                    Cargando productos...
                </p>
            `;
        }

        const respuesta = await fetch(API_PRODUCTOS);
        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.message ||
                resultado.mensaje ||
                'Error al consultar productos'
            );
        }

        productosCargados = Array.isArray(resultado)
            ? resultado
            : resultado.data || [];

        if (!Array.isArray(productosCargados) ||
            productosCargados.length === 0) {

            catalogo.innerHTML = `
                <p class="mensaje-catalogo">
                    Todavía no hay productos disponibles.
                </p>
            `;

            return;
        }

        mostrarCatalogo(productosCargados);

    } catch (error) {
        console.error('Error al cargar productos:', error);

        if (catalogo) {
            catalogo.innerHTML = `
                <p class="mensaje-catalogo">
                    No fue posible cargar los productos.
                    Intenta más tarde.
                </p>
            `;
        }
    }
}


// ========================================
// MOSTRAR CATÁLOGO
// ========================================

function mostrarCatalogo(productos) {
    if (!catalogo) return;

    catalogo.innerHTML = '';

    productos.forEach(producto => {
        const tarjeta = document.createElement('article');
        tarjeta.className = 'producto-card';

        const imagen = obtenerUrlImagen(producto.imagen);

        tarjeta.innerHTML = `
            <div class="producto-card-imagen">
                ${
                    imagen
                        ? `<img src="${escaparHTML(imagen)}"
                               alt="${escaparHTML(producto.nombre)}">`
                        : '<span>Sin fotografía</span>'
                }
            </div>

            <div class="producto-card-info">
                <h3>${escaparHTML(producto.nombre)}</h3>

                <p>
                    ${escaparHTML(
                        producto.descripcion ||
                        'Descubre este producto CUBEX.'
                    )}
                </p>

                <strong class="producto-precio">
                    ${formatearPrecio(producto.precio)}
                </strong>

                <button type="button" class="btn-ver-producto">
                    Ver producto
                </button>
            </div>
        `;

        tarjeta
            .querySelector('.btn-ver-producto')
            .addEventListener('click', () => {
                mostrarDetalle(producto);
            });

        catalogo.appendChild(tarjeta);
    });
}


// ========================================
// MOSTRAR DETALLE DEL PRODUCTO
// ========================================

function mostrarDetalle(producto) {
    productoActual = producto;

    const imagen = obtenerUrlImagen(producto.imagen);

    const elementoImagen = document.getElementById('detalleImagen');
    const elementoNombre = document.getElementById('detalleNombre');
    const elementoDescripcion = document.getElementById('detalleDescripcion');
    const elementoPrecio = document.getElementById('detallePrecio');

    // Información del producto

    if (elementoImagen) {
        elementoImagen.src = imagen || '';
        elementoImagen.alt = producto.nombre || 'Producto CUBEX';
        elementoImagen.hidden = !imagen;
    }

    if (elementoNombre) {
        elementoNombre.textContent = producto.nombre || '';
    }

    if (elementoDescripcion) {
        elementoDescripcion.textContent =
            producto.descripcion || 'Sin descripción disponible.';
    }

    if (elementoPrecio) {
        elementoPrecio.textContent = formatearPrecio(producto.precio);
    }

    // Ocultar página principal

    if (hero) {
        hero.hidden = true;
    }

    if (seccionProductos) {
        seccionProductos.hidden = true;
    }

    // Mostrar detalle

    if (detalleProducto) {
        detalleProducto.hidden = false;
    }

    // Limpiar mensaje anterior del formulario

    const mensaje = document.getElementById('mensajeResena');

    if (mensaje) {
        mensaje.textContent = '';
    }

    // Cargar reseñas del producto seleccionado

    cargarResenas(producto.id);

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// ========================================
// REGRESAR AL CATÁLOGO
// ========================================

function regresarAlCatalogo() {
    if (detalleProducto) {
        detalleProducto.hidden = true;
    }

    if (seccionProductos) {
        seccionProductos.hidden = false;
    }

    productoActual = null;

    if (hero) {
        hero.hidden = false;
    }

    mostrarCatalogo(productosCargados);

    window.scrollTo({
        top: seccionProductos.offsetTop - 100,
        behavior: 'smooth'
    });
}

if (btnRegresar) {
    btnRegresar.addEventListener('click', regresarAlCatalogo);
}


// ========================================
// BUSCADOR
// ========================================

function buscarEnCatalogo() {
    const texto = buscarProducto.value.trim().toLowerCase();

    const filtrados = productosCargados.filter(producto => {
        const nombre = String(producto.nombre || '').toLowerCase();
        const descripcion = String(producto.descripcion || '').toLowerCase();

        return nombre.includes(texto) ||
            descripcion.includes(texto);
    });

    // Si estaba viendo un producto, regresar al catálogo

    if (detalleProducto) {
        detalleProducto.hidden = true;
    }

    if (seccionProductos) {
        seccionProductos.hidden = false;
    }

    productoActual = null;

    if (hero) {
        hero.hidden = false;
    }

    if (filtrados.length === 0) {
        catalogo.innerHTML = `
            <p class="mensaje-catalogo">
                No se encontraron productos con ese nombre.
            </p>
        `;
    } else {
        mostrarCatalogo(filtrados);
    }

    window.scrollTo({
        top: seccionProductos.offsetTop - 100,
        behavior: 'smooth'
    });
}

if (btnBuscar && buscarProducto) {
    btnBuscar.addEventListener('click', buscarEnCatalogo);

    buscarProducto.addEventListener('keydown', evento => {
        if (evento.key === 'Enter') {
            buscarEnCatalogo();
        }
    });
}


// ========================================
// PUBLICAR RESEÑA
// ========================================

// ========================================
// PUBLICAR RESEÑA
// ========================================

if (formularioResena) {

    formularioResena.addEventListener('submit', async evento => {

        evento.preventDefault();

        const token = sessionStorage.getItem('cubex_token');

        // Verificar sesión

        if (!token) {
            mostrarMensajeResena(
                'Debes iniciar sesión para publicar una reseña.',
                'info'
            );
            return;
        }

        // Obtener información del usuario

        let usuario = {};

        try {
            usuario = JSON.parse(
                sessionStorage.getItem('cubex_usuario') || '{}'
            );

        } catch (error) {
            console.error('Error al leer los datos del usuario:', error);
        }

        // Verificar rol

        if (usuario.rol !== 'CLIENTE') {
            mostrarMensajeResena(
                'Solo los clientes pueden publicar reseñas.',
                'advertencia'
            );
            return;
        }

        // Verificar producto seleccionado

        if (!productoActual || !productoActual.id) {
            mostrarMensajeResena(
                'No se encontró el producto seleccionado.',
                'error'
            );
            return;
        }

        const elementoCalificacion =
            document.getElementById('calificacionResena');

        const elementoComentario =
            document.getElementById('comentarioResena');

        const calificacion = Number(elementoCalificacion.value);
        const comentario = elementoComentario.value.trim();

        // Validar comentario

        if (!comentario) {
            mostrarMensajeResena(
                'Escribe un comentario antes de publicar.',
                'advertencia'
            );
            elementoComentario.focus();
            return;
        }

        if (comentario.length > 500) {
            mostrarMensajeResena(
                'El comentario no puede superar los 500 caracteres.',
                'advertencia'
            );
            return;
        }

        // Validar calificación

        if (
            !Number.isInteger(calificacion) ||
            calificacion < 1 ||
            calificacion > 5
        ) {
            mostrarMensajeResena(
                'Selecciona una calificación válida.',
                'advertencia'
            );
            return;
        }

        const boton = formularioResena.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        const textoOriginal = boton
            ? boton.textContent
            : 'Publicar comentario';

        try {

            if (boton) {
                boton.disabled = true;
                boton.textContent = 'Publicando...';
            }

            mostrarMensajeResena(
                'Publicando tu reseña...',
                'info'
            );

            // Enviar reseña al microservicio

            const respuesta = await fetch(API_RESENAS, {

                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },

                body: JSON.stringify({
                    id_producto: productoActual.id,
                    calificacion: calificacion,
                    comentario: comentario
                })

            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.mensaje ||
                    resultado.message ||
                    resultado.error ||
                    'No se pudo publicar la reseña.'
                );
            }

            // Limpiar comentario

            elementoComentario.value = '';

            // Mostrar confirmación

            mostrarMensajeResena(
                '¡Tu reseña se publicó correctamente!',
                'exito'
            );

            // Actualizar reseñas del producto

            await cargarResenas(productoActual.id);

            // Mantener visible el mensaje de éxito

            mostrarMensajeResena(
                '¡Tu reseña se publicó correctamente!',
                'exito'
            );

        } catch (error) {

            console.error('Error al publicar reseña:', error);

            mostrarMensajeResena(
                error.message || 'Ocurrió un error al publicar tu reseña.',
                'error'
            );

        } finally {

            if (boton) {
                boton.disabled = false;
                boton.textContent = textoOriginal;
            }

        }

    });

}





function obtenerIdUsuarioSesion() {
    try {
        const token = sessionStorage.getItem('cubex_token');

        if (!token) return null;

        const payload = JSON.parse(
            atob(
                token.split('.')[1]
                    .replace(/-/g, '+')
                    .replace(/_/g, '/')
            )
        );

        return Number(payload.sub) || null;

    } catch (error) {
        console.error('No se pudo obtener el usuario del token:', error);
        return null;
    }
}





// ========================================
// CARGAR RESEÑAS DE UN PRODUCTO
// ==


async function cargarResenas(idProducto) {
    const lista = document.getElementById('listaResenas');
    if (!lista) return;

    try {
        lista.innerHTML = `<p>Cargando reseñas...</p>`;

        const respuesta = await fetch(
            `${API_RESENAS}/${encodeURIComponent(idProducto)}`
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                resultado.message ||
                resultado.error ||
                'No se pudieron cargar las reseñas.'
            );
        }

        const resenas = Array.isArray(resultado)
            ? resultado
            : resultado.data || [];

        if (resenas.length === 0) {
            lista.innerHTML = `
                <p>Las reseñas de este producto aparecerán aquí.</p>
            `;
            return;
        }

        const idUsuario = obtenerIdUsuarioSesion();
        let indiceActual = 0;
        let resenaActual = null;

        function mostrarResena() {
            resenaActual = resenas[indiceActual];

            const esPropietario =
                idUsuario !== null &&
                Number(resenaActual.id_cliente) === idUsuario;

            const calificacion = Math.min(
                5,
                Math.max(0, Number(resenaActual.calificacion) || 0)
            );

            const fecha = resenaActual.fecha
                ? new Date(resenaActual.fecha).toLocaleDateString('es-MX')
                : '';

            lista.innerHTML = `
                <div class="carrusel-resenas">

                    <button
                        class="flecha-resena"
                        id="resenaAnterior"
                        ${resenas.length === 1 ? 'disabled' : ''}
                    >&#10094;</button>

                    <article class="resena-item">

                        <strong>
                            ${escaparHTML(resenaActual.nombre_usuario || 'Cliente')}
                        </strong>

                        <p class="resena-estrellas">
                            ${'★'.repeat(calificacion)}${'☆'.repeat(5 - calificacion)}
                        </p>

                        <p>
                            ${escaparHTML(resenaActual.comentario || '')}
                        </p>

                        ${fecha
                            ? `<small>${escaparHTML(fecha)}</small>`
                            : ''
                        }

                        ${esPropietario ? `
                            <div class="acciones-resena">
                                <button
                                    type="button"
                                    class="btn-editar-resena"
                                    id="editarResena"
                                >✏️ Editar</button>

                                <button
                                    type="button"
                                    class="btn-eliminar-resena"
                                    id="eliminarResena"
                                >🗑 Eliminar</button>
                            </div>
                        ` : ''}

                    </article>

                    <button
                        class="flecha-resena"
                        id="resenaSiguiente"
                        ${resenas.length === 1 ? 'disabled' : ''}
                    >&#10095;</button>

                </div>

                <p class="contador-resenas">
                    ${indiceActual + 1} de ${resenas.length} reseñas
                </p>
            `;

            document.getElementById('resenaAnterior')
                .addEventListener('click', () => {
                    indiceActual =
                        (indiceActual - 1 + resenas.length) % resenas.length;
                    mostrarResena();
                });

            document.getElementById('resenaSiguiente')
                .addEventListener('click', () => {
                    indiceActual =
                        (indiceActual + 1) % resenas.length;
                    mostrarResena();
                });

            const editar = document.getElementById('editarResena');
            if (editar) {
                editar.addEventListener('click', mostrarFormularioEdicion);
            }

            const eliminar = document.getElementById('eliminarResena');
            if (eliminar) {
                eliminar.addEventListener('click', eliminarResena);
            }
        }

        // EDITAR
        function mostrarFormularioEdicion() {
            const tarjeta = lista.querySelector('.resena-item');

            tarjeta.innerHTML = `
                <h3>Editar mi reseña</h3>

                <label for="editarCalificacion">Calificación</label>

                <select id="editarCalificacion">
                    ${[5, 4, 3, 2, 1].map(valor => `
                        <option
                            value="${valor}"
                            ${Number(resenaActual.calificacion) === valor ? 'selected' : ''}
                        >${valor} estrellas</option>
                    `).join('')}
                </select>

                <label for="editarComentario">Comentario</label>

                <textarea
                    id="editarComentario"
                    maxlength="500"
                    rows="4"
                >${escaparHTML(resenaActual.comentario || '')}</textarea>

                <div class="acciones-resena">
                    <button
                        type="button"
                        class="btn-editar-resena"
                        id="guardarEdicion"
                    >Guardar cambios</button>

                    <button
                        type="button"
                        class="btn-eliminar-resena"
                        id="cancelarEdicion"
                    >Cancelar</button>
                </div>
            `;

            document.getElementById('cancelarEdicion')
                .addEventListener('click', mostrarResena);

            document.getElementById('guardarEdicion')
                .addEventListener('click', guardarEdicion);
        }

        async function guardarEdicion() {
            const token = sessionStorage.getItem('cubex_token');

            const calificacion = Number(
                document.getElementById('editarCalificacion').value
            );

            const comentario = document.getElementById(
                'editarComentario'
            ).value.trim();

            if (!comentario || comentario.length > 500) {
                mostrarMensajeResena(
                    'Escribe un comentario de máximo 500 caracteres.',
                    'advertencia'
                );
                return;
            }

            const boton = document.getElementById('guardarEdicion');

            try {
                boton.disabled = true;
                boton.textContent = 'Guardando...';

                const respuesta = await fetch(
                    `${API_RESENAS}/${encodeURIComponent(resenaActual.id)}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            calificacion,
                            comentario
                        })
                    }
                );

                const resultado = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        resultado.mensaje ||
                        resultado.message ||
                        resultado.error ||
                        'No se pudo actualizar la reseña.'
                    );
                }

                mostrarMensajeResena(
                    '¡Tu reseña se actualizó correctamente!',
                    'exito'
                );

                await cargarResenas(idProducto);

            } catch (error) {
                console.error('Error al editar reseña:', error);

                mostrarMensajeResena(error.message, 'error');

                boton.disabled = false;
                boton.textContent = 'Guardar cambios';
            }
        }

        // ELIMINAR CON VENTANA PERSONALIZADA
        async function eliminarResena() {
            const modal = document.createElement('div');

            modal.className = 'modal-confirmacion-resena';

            modal.innerHTML = `
                <div class="modal-resena-contenido">
                    <div class="icono-eliminar-resena">!</div>

                    <h3>¿Eliminar reseña?</h3>

                    <p>
                        Esta acción eliminará tu opinión permanentemente.
                        ¿Deseas continuar?
                    </p>

                    <div class="modal-resena-acciones">
                        <button type="button" id="cancelarEliminar">
                            Cancelar
                        </button>

                        <button type="button" id="confirmarEliminar">
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('cancelarEliminar')
                .addEventListener('click', () => modal.remove());

            document.getElementById('confirmarEliminar')
                .addEventListener('click', async () => {
                    const boton = document.getElementById('confirmarEliminar');
                    const token = sessionStorage.getItem('cubex_token');

                    try {
                        boton.disabled = true;
                        boton.textContent = 'Eliminando...';

                        const respuesta = await fetch(
                            `${API_RESENAS}/${encodeURIComponent(resenaActual.id)}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            }
                        );

                        const resultado = await respuesta.json();

                        if (!respuesta.ok) {
                            throw new Error(
                                resultado.mensaje ||
                                resultado.message ||
                                resultado.error ||
                                'No se pudo eliminar la reseña.'
                            );
                        }

                        modal.remove();

                        mostrarMensajeResena(
                            'Tu reseña se eliminó correctamente.',
                            'exito'
                        );

                        await cargarResenas(idProducto);

                    } catch (error) {
                        console.error('Error al eliminar reseña:', error);

                        modal.remove();

                        mostrarMensajeResena(error.message, 'error');
                    }
                });
        }

        mostrarResena();

    } catch (error) {
        console.error('Error al cargar reseñas:', error);

        lista.innerHTML = `
            <p>No fue posible cargar las reseñas.</p>
        `;
    }
}

// ========================================
// FUNCIONES AUXILIARES
// ========================================

// Obtener dirección de imagen

function obtenerUrlImagen(imagen) {

    if (!imagen) return '';

    if (imagen.startsWith('http')) {
        return imagen;
    }

    return `${API_IMAGENES}${imagen.startsWith('/') ? '' : '/'}${imagen}`;
}


// Formatear precios

function formatearPrecio(precio) {

    const numero = Number(precio);

    if (!Number.isFinite(numero)) {
        return 'Precio no disponible';
    }

    return numero.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}


// Evitar insertar HTML no deseado

function escaparHTML(valor) {

    return String(valor).replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caracter]);
}


// ========================================
// INICIAR CATÁLOGO
// ========================================

cargarProductos();
