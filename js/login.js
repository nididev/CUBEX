
const formulario = document.getElementById("formulario-login");
const mensaje = document.getElementById("mensaje");
const boton = formulario.querySelector('button[type="submit"]');

console.log("LOGIN.JS ACTUALIZADO: EJECUTANDO");

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nombreUsuario = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    mensaje.textContent = "Conectando...";
    boton.disabled = true;

    try {
        // 1. Iniciar sesión
        const respuesta = await fetch(
            "http://localhost:3000/api/v1/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombreUsuario,
                    contrasena
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

        if (!usuario || !usuario.token || !usuario.idUsuario) {
            throw new Error(
                "Faltan datos del usuario en la respuesta del servidor."
            );
        }

        console.log("Inicio de sesión correcto:", usuario);

        // 2. Guardar token para consultar el rol
        sessionStorage.setItem("cubex_token", usuario.token);

        // 3. Consultar el rol actualizado en el microservicio
        const respuestaRol = await fetch(
            `http://localhost:3003/usuarios/${usuario.idUsuario}/rol`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${usuario.token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const datosRol = await respuestaRol.json();

        console.log("Respuesta del servicio de roles:", datosRol);

        if (!respuestaRol.ok) {
            throw new Error(
                datosRol.error || "No se pudo consultar el rol del usuario."
            );
        }

        const rolActual = String(datosRol.rol || "")
            .trim()
            .toUpperCase();

        if (!rolActual) {
            throw new Error("El servicio no devolvió un rol válido.");
        }

        console.log("ROL FINAL DETECTADO:", rolActual);

        // 4. Guardar los datos del usuario
        const usuarioSesion = {
            idUsuario: usuario.idUsuario,
            nombreUsuario: usuario.nombreUsuario,
            nombreCompleto: usuario.nombreCompleto,
            email: usuario.email,
            rol: rolActual
        };

        sessionStorage.setItem(
            "cubex_usuario",
            JSON.stringify(usuarioSesion)
        );

        // 5. Redireccionar según el rol
        if (rolActual === "ADMIN") {
            console.log("REDIRIGIENDO AL PANEL ADMINISTRATIVO");
            window.location.replace("admin.html");

        } else {
            console.log("REDIRIGIENDO A LA TIENDA");
            window.location.replace("index.html");
        }

    } catch (error) {
        console.error("ERROR DE INICIO DE SESIÓN:", error);

        mensaje.textContent = error.message;

    } finally {
        boton.disabled = false;
    }
});
