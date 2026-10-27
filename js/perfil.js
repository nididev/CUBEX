
const token = sessionStorage.getItem("cubex_token");
const mensaje = document.getElementById("mensaje");

if (!token) {
    window.location.replace("login.html");
} else {
    cargarPerfil();
}

async function cargarPerfil() {
    try {
        const respuesta = await fetch(
            "http://localhost:3000/api/v1/auth/perfil",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            if (respuesta.status === 401) {
                sessionStorage.removeItem("cubex_token");
                sessionStorage.removeItem("cubex_usuario");
                window.location.replace("login.html");
                return;
            }

            throw new Error(
                resultado.mensaje || "No se pudo cargar el perfil."
            );
        }

        // Combinar datos de la API con los guardados en el navegador.
        const usuarioGuardado = JSON.parse(
            sessionStorage.getItem("cubex_usuario") || "{}"
        );

        const usuarioAPI = resultado.datos || {};

        const usuario = {
            ...usuarioGuardado,
            ...usuarioAPI,
            nombreCompleto:
                usuarioAPI.nombreCompleto ||
                usuarioGuardado.nombreCompleto ||
                "",
            email:
                usuarioAPI.email ||
                usuarioGuardado.email ||
                ""
        };

        document.getElementById("nombreUsuario").textContent =
            usuario.nombreUsuario || "No disponible";

        document.getElementById("nombreCompleto").textContent =
            usuario.nombreCompleto || "No registrado";

        document.getElementById("email").textContent =
            usuario.email || "No registrado";

        document.getElementById("rol").textContent =
            usuario.rol || "CLIENTE";

    } catch (error) {
        mensaje.textContent =
            "No se pudo cargar tu perfil. Verifica la conexión con el servidor.";
        console.error("Error al cargar el perfil:", error);
    }
}

document.getElementById("cerrarSesion").addEventListener("click", () => {
    sessionStorage.removeItem("cubex_token");
    sessionStorage.removeItem("cubex_usuario");
    window.location.replace("login.html");
});
