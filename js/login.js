
const formulario = document.getElementById("formulario-login");
const mensaje = document.getElementById("mensaje");
const boton = formulario.querySelector('button[type="submit"]');

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombreUsuario = document
        .getElementById("correo")
        .value
        .trim();

    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Conectando...";
    boton.disabled = true;

    try {
        const respuesta = await fetch(
            "http://localhost:3000/api/v1/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombreUsuario: nombreUsuario,
                    contrasena: contrasena
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje || "Usuario o contraseña incorrectos."
            );
        }

        const usuario = resultado.datos;

        if (!usuario || !usuario.token) {
            console.error("Respuesta recibida:", resultado);
            throw new Error("El servidor no devolvió los datos de sesión.");
        }

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

        mensaje.textContent = `¡Bienvenido, ${usuario.nombreUsuario}!`;

        // Regresar a la tienda después del inicio de sesión.
        window.location.href = "index.html";

    } catch (error) {
        console.error("Error de inicio de sesión:", error);

        if (error.message === "Failed to fetch") {
            mensaje.textContent =
                "No se pudo conectar. Verifica que el microservicio esté activo y que CORS permita la página.";
        } else {
            mensaje.textContent = error.message;
        }
    } finally {
        boton.disabled = false;
    }
});
