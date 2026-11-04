const API_LOGIN = "http://localhost:3020/api/v1";

// ========================================
// ELEMENTOS DEL FORMULARIO
// ========================================

const formulario = document.getElementById("formulario-login");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("btnLogin");

// ========================================
// INICIAR SESIÓN
// ========================================

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    mensaje.textContent = "";

    const nombreUsuario = document
        .getElementById("nombreUsuario")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    // Validar campos
    if (!nombreUsuario || !password) {
        mensaje.textContent = "Ingresa tu usuario y contraseña.";
        return;
    }

    // Desactivar botón
    boton.disabled = true;
    boton.textContent = "Iniciando sesión...";

    try {

        // ========================================
        // ENVIAR CREDENCIALES AL MICROSERVICIO
        // ========================================

        const respuesta = await fetch(
            `${API_LOGIN}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nombreUsuario: nombreUsuario,
                    contrasena: password
                })
            }
        );

        const resultado = await respuesta.json();

        // ========================================
        // VALIDAR RESPUESTA
        // ========================================

        if (!respuesta.ok || !resultado.exito) {
            throw new Error(
                resultado.mensaje ||
                "Usuario o contraseña incorrectos."
            );
        }

        // ========================================
        // OBTENER DATOS DEL USUARIO
        // ========================================

        const datos = resultado.datos;

        if (!datos || !datos.token) {
            throw new Error(
                "No se recibió el token de autenticación."
            );
        }

        // ========================================
        // GUARDAR TOKEN
        // ========================================

        sessionStorage.setItem(
            "cubex_token",
            datos.token
        );

        // ========================================
        // GUARDAR INFORMACIÓN DEL USUARIO
        // ========================================

        const usuarioSesion = {

            idUsuario: datos.idUsuario,

            nombreUsuario:
                datos.nombreUsuario || nombreUsuario,

            nombreCompleto:
                datos.nombreCompleto || "",

            email:
                datos.email || "",

            rol:
                datos.rol || "CLIENTE"

        };

        sessionStorage.setItem(
            "cubex_usuario",
            JSON.stringify(usuarioSesion)
        );

        // ========================================
        // REDIRECCIONAR SEGÚN EL ROL
        // ========================================

        const rol = String(usuarioSesion.rol)
            .trim()
            .toUpperCase();

        mensaje.style.color = "#4ade80";
        mensaje.textContent = "¡Inicio de sesión exitoso!";

        if (
            rol === "ADMIN" ||
            rol === "ADMINISTRADOR"
        ) {

            // Acceso del administrador
            window.location.href = "admin.html";

        } else {

            // Acceso de clientes y otros usuarios
            window.location.href = "index.html";

        }

    } catch (error) {

        console.error(
            "Error al iniciar sesión:",
            error
        );

        mensaje.style.color = "#ff8585";

        mensaje.textContent =
            error.message || "No se pudo iniciar sesión.";

    } finally {

        boton.disabled = false;
        boton.textContent = "Iniciar sesión";

    }

});