
document.addEventListener("DOMContentLoaded", () => {

    // =========================================
    // 1. VALIDAR SESIÓN Y ROL
    // =========================================

    const token = sessionStorage.getItem("cubex_token");
    const usuarioGuardado = sessionStorage.getItem("cubex_usuario");

    if (!token || !usuarioGuardado) {
        window.location.replace("login.html");
        return;
    }

    let usuario;

    try {
        usuario = JSON.parse(usuarioGuardado);
    } catch (error) {
        sessionStorage.removeItem("cubex_token");
        sessionStorage.removeItem("cubex_usuario");
        window.location.replace("login.html");
        return;
    }

    if (!usuario || usuario.rol !== "VENDEDOR") {
        if (usuario?.rol === "ADMIN") {
            window.location.replace("admin.html");
        } else {
            window.location.replace("index.html");
        }
        return;
    }


    // =========================================
    // 2. DATOS DEL EMPLEADO
    // =========================================

    const nombreCompleto =
        usuario.nombreCompleto ||
        usuario.nombreUsuario ||
        "Empleado";

    const nombreUsuario = usuario.nombreUsuario || "empleado";
    const correo = usuario.email || usuario.correo || "No disponible";
    const rol = usuario.rol || "VENDEDOR";

    const inicial = nombreCompleto.trim().charAt(0).toUpperCase();

    function colocarTexto(id, texto) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = texto;
        }
    }

    // Barra lateral
    colocarTexto("nombreEmpleado", "@" + nombreUsuario);
    colocarTexto("inicialEmpleado", inicial);

    // Modal de perfil
    colocarTexto("inicialModal", inicial);
    colocarTexto("modalNombre", nombreCompleto);
    colocarTexto("modalNombreCompleto", nombreCompleto);
    colocarTexto("modalUsuario", "@" + nombreUsuario);
    colocarTexto("modalCorreo", correo);
    colocarTexto("modalRol", rol);

    // Perfil adicional, si existe en el HTML
    colocarTexto("inicialPerfil", inicial);
    colocarTexto("perfilNombre", nombreCompleto);
    colocarTexto("perfilNombreCompleto", nombreCompleto);
    colocarTexto("perfilCorreo", correo);
    colocarTexto("perfilRol", rol);


    // =========================================
    // 3. NOTIFICACIONES
    // =========================================

    function notificar(mensaje, tipo = "exito") {

        const contenedor = document.getElementById(
            "contenedorNotificaciones"
        );

        if (!contenedor) {
            console.log(mensaje);
            return;
        }

        const notificacion = document.createElement("div");

        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;

        contenedor.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add("ocultar");

            setTimeout(() => {
                notificacion.remove();
            }, 300);

        }, 2500);
    }


    // =========================================
    // 4. MODAL DE PERFIL
    // =========================================

    const modalPerfil = document.getElementById("modalPerfil");

    function abrirModalPerfil() {

        if (!modalPerfil) {
            console.error("No se encontró el modal #modalPerfil.");
            return;
        }

        modalPerfil.classList.add("mostrar");
        modalPerfil.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
    }

    function cerrarModalPerfil() {

        if (!modalPerfil) return;

        modalPerfil.classList.remove("mostrar");
        modalPerfil.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
    }

    // Abrir perfil
    document.getElementById("abrirPerfil")
        ?.addEventListener("click", function (evento) {
            evento.preventDefault();
            abrirModalPerfil();
        });

    document.getElementById("abrirPerfilTarjeta")
        ?.addEventListener("click", function (evento) {
            evento.preventDefault();
            abrirModalPerfil();
        });


    // =========================================
    // 5. CERRAR MODAL DE PERFIL
    // =========================================

    // Reconocer los identificadores de la X
    const botonX = document.querySelector(
        "#cerrarModal, #cerrarModalPerfil"
    );

    // Reconocer los identificadores del botón inferior
    const botonCerrarPerfil = document.querySelector(
        "#botonCerrarModal, #botonCerrarPerfil"
    );

    // Evitar que los botones envíen formularios
    if (botonX) {
        botonX.type = "button";
    }

    if (botonCerrarPerfil) {
        botonCerrarPerfil.type = "button";
    }

    // Delegación de eventos: funciona aunque se haga clic
    // directamente sobre el texto o el icono del botón.
    document.addEventListener("click", function (evento) {

        const clicEnX = evento.target.closest(
            "#cerrarModal, #cerrarModalPerfil"
        );

        const clicEnCerrar = evento.target.closest(
            "#botonCerrarModal, #botonCerrarPerfil"
        );

        if (clicEnX || clicEnCerrar) {

            evento.preventDefault();
            evento.stopPropagation();

            cerrarModalPerfil();
        }

    }, true);

    // Cerrar al hacer clic fuera del cuadro
    modalPerfil?.addEventListener("click", function (evento) {

        if (evento.target === modalPerfil) {
            cerrarModalPerfil();
        }

    });


    // =========================================
    // 6. MODAL DE CERRAR SESIÓN
    // =========================================

    const modalCerrarSesion = document.getElementById(
        "modalCerrarSesion"
    );

    const botonCerrarSesion = document.getElementById(
        "cerrarSesion"
    );

    const cancelarCerrarSesion = document.getElementById(
        "cancelarCerrarSesion"
    );

    const confirmarCerrarSesion = document.getElementById(
        "confirmarCerrarSesion"
    );

    function abrirModalCerrarSesion() {

        if (!modalCerrarSesion) return;

        modalCerrarSesion.classList.add("mostrar");
        modalCerrarSesion.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";
    }

    function cerrarModalCerrarSesion() {

        if (!modalCerrarSesion) return;

        modalCerrarSesion.classList.remove("mostrar");
        modalCerrarSesion.setAttribute("aria-hidden", "true");

        document.body.style.overflow = "";
    }

    botonCerrarSesion?.addEventListener("click", function (evento) {

        evento.preventDefault();
        abrirModalCerrarSesion();

    });

    cancelarCerrarSesion?.addEventListener("click", function () {

        cerrarModalCerrarSesion();

    });

    confirmarCerrarSesion?.addEventListener("click", function () {

        sessionStorage.removeItem("cubex_token");
        sessionStorage.removeItem("cubex_usuario");

        cerrarModalCerrarSesion();

        window.location.replace("login.html");

    });

    modalCerrarSesion?.addEventListener("click", function (evento) {

        if (evento.target === modalCerrarSesion) {
            cerrarModalCerrarSesion();
        }

    });


    // =========================================
    // 7. NAVEGACIÓN Y SECCIÓN ACTIVA
    // =========================================

    const enlaces = document.querySelectorAll(
        ".navegacion .enlace-menu"
    );

    function actualizarMenuActivo() {

        const seccion =
            window.location.hash.replace("#", "") || "resumen";

        enlaces.forEach(enlace => {

            const destino = enlace.dataset.seccion;

            enlace.classList.toggle(
                "activo",
                destino === seccion
            );

        });
    }

    enlaces.forEach(enlace => {

        enlace.addEventListener("click", function () {

            const destino = this.dataset.seccion;

            if (destino) {

                enlaces.forEach(item => {
                    item.classList.remove("activo");
                });

                this.classList.add("activo");
            }

        });

    });

    // Accesos desde las tarjetas del resumen
    document.querySelectorAll(".funcion[href^='#']").forEach(enlace => {

        enlace.addEventListener("click", function () {

            const destino = this.getAttribute("href").substring(1);

            const enlaceMenu = document.querySelector(
                `.enlace-menu[data-seccion="${destino}"]`
            );

            if (enlaceMenu) {
                enlaces.forEach(item => {
                    item.classList.remove("activo");
                });

                enlaceMenu.classList.add("activo");
            }

        });

    });

    window.addEventListener("hashchange", actualizarMenuActivo);

    actualizarMenuActivo();


    // =========================================
    // 8. CERRAR MODALES CON ESCAPE
    // =========================================

    document.addEventListener("keydown", function (evento) {

        if (evento.key === "Escape") {

            cerrarModalPerfil();
            cerrarModalCerrarSesion();

        }

    });

});
