const URL_API = "http://localhost/GestoraStock/BACKEND/api_productos.php";
const URL_API2 = "http://localhost/GestoraStock/BACKEND/api_clientes.php";
const URL_API3 = "http://localhost/GestoraStock/BACKEND/api_pedidos.php";
const URL_API4 = "http://localhost/GestoraStock/BACKEND/api_proveedores.php";

document.addEventListener("DOMContentLoaded", () => {
    // Al cargar la página, detecta y muestra el contenido de la pestaña inicial activa
    verificarYMostrarPestanaActiva();
    document.querySelector("#tablaClientes").addEventListener("click", manejarClientes);
    document.querySelector("#tablaProductos").addEventListener("click", manejarProductos);
    document.querySelector("#tablaProveedores").addEventListener("click", manejarProveedores);
    document.querySelector("#tablaPedidos").addEventListener("click", manejarPedidos);
});

// Función unificada para hacer fetch de cualquier entidad
async function cargarEntidad(url, selectorTbody, tipo) {
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        renderizarTabla(datos, selectorTbody, tipo);
    } catch (error) {
        console.error(`Error al cargar ${tipo}:`, error);
    }
}

// Función unificada para pintar las filas en cualquier tabla según el tipo
function renderizarTabla(datos, selectorTbody, tipo) {
    const cuerpo = document.querySelector(selectorTbody);
    if (!cuerpo) return; // Si no está en esta pantalla, no hace nada
    
    cuerpo.innerHTML = "";
    
    datos.forEach(item => {
        const fila = document.createElement("tr");
        fila.dataset.id = item.id || item.id_producto || item.id_cliente || item.id_proveedor || item.id_pedido;
        
        if (tipo === "productos") {
            fila.innerHTML = `
                <td>${item.id_producto}</td>
                <td>${item.nombre}</td>
                <td>${item.precio_compra}</td>
                <td>${item.precio_venta}</td>
                <td>${item.categoria}</td>
                <td>${item.stock}</td>
                <td>${item.id_proveedor}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-borrar">Borrar</button>
                </td>
            `;
        } else if (tipo === "clientes") {
            fila.innerHTML = `
                <td>${item.id_cliente}</td>
                <td>${item.nombre_cliente}</td>
                <td>${item.direccion}</td>
                <td>${item.telefono}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-borrar">Borrar</button>
                </td>
            `;
        } else if (tipo === "proveedores") {
            fila.innerHTML = `
                <td>${item.id_proveedor}</td>
                <td>${item.nombre}</td>
                <td>${item.contacto}</td>
                <td>${item.mail}</td>
                <td>
                    <button class="btn-editar">Editar</button>
                    <button class="btn-borrar">Borrar</button>
                </td>
            `;
        } else if (tipo === "pedidos") {
            let listaProductosHTML = ""; // Variable string para almacenar la lista de productos en HTML
            if (item.productos && item.productos.length > 0) {
                // Genera la lista de productos en formato HTML
                listaProductosHTML = "<ul>";
                item.productos.forEach(prod => {
                    listaProductosHTML += `<li>${prod.nombre_producto} (Cant: ${prod.cantidad})</li>`; 
                    // Por cada producto, se agrega un <li> con su nombre y cantidad
                });
                listaProductosHTML += "</ul>";
            } else {
                listaProductosHTML = "Sin productos"; // Si no hay productos se muestra un mensaje
            }

            fila.innerHTML = `
                <td>${item.id_pedido}</td>
                <td>${item.nombre_cliente}</td>
                <td>${item.fecha}</td>
                <td>$${item.total_pedido}</td>
                <td>${listaProductosHTML}</td> <!-- Aquí se inyecta la lista generada -->
                <td>
                    <button class="btn-borrar">Borrar</button>
                </td>
            `;
        }

        cuerpo.appendChild(fila);
    });
}

// Función auxiliar que detecta qué pestaña está abierta actualmente
function verificarYMostrarPestanaActiva() {
    const panelActivo = document.querySelector('.pestaña.active-content');
    
    if (panelActivo) {
        const idTab = panelActivo.id;        
        
        if (idTab === 'inventario') {
            cargarEntidad(URL_API, '#tablaProductos', 'productos');
        } else if (idTab === 'clientes') {
            cargarEntidad(URL_API2, '#tablaClientes', 'clientes');
        } else if (idTab === 'proveedores') {
            cargarEntidad(URL_API4, '#tablaProveedores', 'proveedores');
        } else if (idTab === 'historial-pedidos') {
            cargarEntidad(URL_API3, '#tablaPedidos', 'pedidos');
        }
    }
}

// Función para cambiar de pestaña
function cambiarPestana(event, idTabSeleccionada) {
    // Oculta todos los contenidos de las pestañas
    const paneles = document.querySelectorAll('.pestaña');
    paneles.forEach(panel => {
        panel.classList.remove('active-content');
    });

    // Desactiva la clase 'active' de todos los botones
    const botones = document.querySelectorAll('.pestaña-btn');
    botones.forEach(boton => {
        boton.classList.remove('active');
    });

    // Muestra el contenido de la pestaña seleccionada
    const panelSeleccionado = document.getElementById(idTabSeleccionada);
    if (panelSeleccionado) {
        panelSeleccionado.classList.add('active-content');
    }

    // Marca el botón de la pestaña seleccionada como activo
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    // Cada vez que cambia de pestaña, detecta el panel activo y carga sus datos
    verificarYMostrarPestanaActiva();
}




// MANEJADORES DE EVENTOS

function manejarClientes(evento) {
    if (evento.target.classList.contains("btn-borrar")) borrarRegistro(evento, URL_API2);
    if (evento.target.classList.contains("btn-editar")) editarCliente(evento);
}

function manejarProductos(evento) {
    if (evento.target.classList.contains("btn-borrar")) borrarRegistro(evento, URL_API);
    if (evento.target.classList.contains("btn-editar")) editarProducto(evento);
}

function manejarProveedores(evento) {
    if (evento.target.classList.contains("btn-borrar")) borrarRegistro(evento, URL_API4);
    if (evento.target.classList.contains("btn-editar")) editarProveedor(evento);
}

function manejarPedidos(evento) {
    if (evento.target.classList.contains("btn-borrar")) borrarRegistro(evento, URL_API3);
}


// FUNCION DELETE

async function borrarRegistro(evento, urlApi) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;

    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
        const respuesta = await fetch(`${urlApi}?id=${id}`, {
            method: "DELETE"
        });

        if (respuesta.ok) {
            fila.remove(); // Borra la fila visualmente de la tabla
        }
    } catch (error) {
        console.error("Error al borrar el registro:", error);
    }
}



// FUNCIONES DE EDICIÓN (PUT)

async function editarCliente(evento) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;
    const nombreActual = fila.children[1].textContent;
    const direccionActual = fila.children[2].textContent;
    const telefonoActual = fila.children[3].textContent;

    const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
    if (nuevoNombre === null) return;
    const nuevaDireccion = prompt("Nueva dirección:", direccionActual);
    if (nuevaDireccion === null) return;
    const nuevoTelefono = prompt("Nuevo teléfono:", telefonoActual);
    if (nuevoTelefono === null) return;

    try {
        const respuesta = await fetch(`${URL_API2}?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre_cliente: nuevoNombre,
                direccion: nuevaDireccion,
                telefono: nuevoTelefono
            })
        });

        if (respuesta.ok) {
            // Actualiza la vista sin recargar
            fila.children[1].textContent = nuevoNombre;
            fila.children[2].textContent = nuevaDireccion;
            fila.children[3].textContent = nuevoTelefono;
        }
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
    }
}

async function editarProducto(evento) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;
    const precioActual = fila.children[3].textContent; // Columna de precio venta
    const stockActual = fila.children[5].textContent;  // Columna de stock

    // Pedir nuevos valores
    const nuevoPrecio = prompt("Nuevo precio de venta:", precioActual);
    if (nuevoPrecio === null) return;

    const nuevoStock = prompt("Actualizar stock:", stockActual);
    if (nuevoStock === null) return;

    // Validar que sean números válidos
    if (isNaN(nuevoPrecio) || isNaN(nuevoStock) || nuevoPrecio.trim() === "" || nuevoStock.trim() === "") {
        alert("Por favor, ingresa solo valores numéricos válidos.");
        return;
    }

    try {
        const respuesta = await fetch(`${URL_API}?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                precio_venta: parseFloat(nuevoPrecio),
                stock: parseInt(nuevoStock) 
            })
        });

        if (respuesta.ok) {
            fila.children[3].textContent = nuevoPrecio;
            fila.children[5].textContent = nuevoStock;
        }
    } catch (error) {
        console.error("Error al actualizar producto:", error);
    }
}

async function editarProveedor(evento) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;
    const nombreActual = fila.children[1].textContent;
    const contactoActual = fila.children[2].textContent;
    const mailActual = fila.children[3].textContent;

    const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
    if (nuevoNombre === null) return;
    const nuevoContacto = prompt("Nuevo contacto:", contactoActual);
    if (nuevoContacto === null) return;
    const nuevoMail = prompt("Nuevo mail:", mailActual);
    if (nuevoMail === null) return;

    try {
        const respuesta = await fetch(`${URL_API4}?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: nuevoNombre,
                contacto: nuevoContacto,
                mail: nuevoMail
            })
        });

        if (respuesta.ok) {
            fila.children[1].textContent = nuevoNombre;
            fila.children[2].textContent = nuevoContacto;
            fila.children[3].textContent = nuevoMail;
        }
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
    }
}








