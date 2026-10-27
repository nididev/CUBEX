
const formulario = document.getElementById("formulario-registro");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("btnRegistro");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombreUsuario =
        document.getElementById("nombreUsuario").value.trim();

    const nombreCompleto =
        document.getElementById("nombre").value.trim();

    const email =
        document.getElementById("correo").value.trim();

    const contrasena =
        document.getElementById("contrasena").value;

    const confirmar =
        document.getElementById("confirmar").value;

    if (contrasena.length < 8) {
        mensaje.textContent =
            "La contraseña debe tener al menos 8 caracteres.";
        return;
    }

    if (contrasena !== confirmar) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        return;
    }

    boton.disabled = true;
    mensaje.textContent = "Registrando cuenta...";

    try {
        const respuesta = await fetch(
            "http://localhost:3000/api/v1/auth/registro",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombreUsuario,
                    contrasena,
                    email,
                    nombreCompleto
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || "No se pudo crear la cuenta."
            );
        }

        const usuario = resultado.datos;

        // El registro puede crear la cuenta aunque no devuelva un token.
        if (usuario?.token) {
            sessionStorage.setItem("cubex_token", usuario.token);

            sessionStorage.setItem(
                "cubex_usuario",
                JSON.stringify({
                    idUsuario: usuario.idUsuario,
                    nombreUsuario: usuario.nombreUsuario,
                    nombreCompleto: usuario.nombreCompleto,
                    email: usuario.email,
                    rol: usuario.rol
                })
            );

            mensaje.textContent = "¡Cuenta creada! Entrando a CUBEX...";

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            mensaje.textContent =
                "Cuenta creada correctamente. Ahora puedes iniciar sesión.";

            formulario.reset();
        }

    } catch (error) {
        console.error("Error al registrar:", error);

        mensaje.textContent =
            error.message === "Failed to fetch"
                ? "No se pudo conectar con el servidor. Comprueba que el microservicio esté activo."
                : error.message;
    } finally {
        boton.disabled = false;
    }
});
