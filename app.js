// URLs base para comunicarnos con el backend de cada seccion
const URL_API = "http://localhost/GestoraStock/BACKEND/api_productos.php";
const URL_API2 = "http://localhost/GestoraStock/BACKEND/api_clientes.php";
const URL_API3 = "http://localhost/GestoraStock/BACKEND/api_pedidos.php";
const URL_API4 = "http://localhost/GestoraStock/BACKEND/api_proveedores.php";

// Apenas carga el DOM, arrancamos la fiesta: revisamos que pestana esta activa 
// y escuchamos los clicks en las tablas para manejar editar/borrar de una
document.addEventListener("DOMContentLoaded", () => {
    verificarYMostrarPestanaActiva();
    document.querySelector("#tablaClientes").addEventListener("click", manejarClientes);
    document.querySelector("#tablaProductos").addEventListener("click", manejarProductos);
    document.querySelector("#tablaProveedores").addEventListener("click", manejarProveedores);
    document.querySelector("#tablaPedidos").addEventListener("click", manejarPedidos);
});

// Funcion generica para hacer un fetch rapido de cualquier entidad y pintarla en su tabla
async function cargarEntidad(url, selectorTbody, tipo) {
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        renderizarTabla(datos, selectorTbody, tipo);
    } catch (error) {
        console.error(`Error al cargar ${tipo}:`, error);
    }
}

// Aqui armamos las filas HTML segun el tipo de entidad que nos toque mostrar
function renderizarTabla(datos, selectorTbody, tipo) {
    const cuerpo = document.querySelector(selectorTbody);
    if (!cuerpo) return; // Si no estamos en esta pantalla, nos salimos tranquilos
    
    cuerpo.innerHTML = "";
    
    datos.forEach(item => {
        const fila = document.createElement("tr");
        // Buscamos el ID correcto segun la tabla que toque
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
            let listaProductosHTML = ""; 
            if (item.productos && item.productos.length > 0) {
                // Si el pedido tiene productos, armamos una lista bonita con ellos
                listaProductosHTML = "<ul>";
                item.productos.forEach(prod => {
                    listaProductosHTML += `<li>${prod.nombre_producto} (Cant: ${prod.cantidad})</li>`; 
                });
                listaProductosHTML += "</ul>";
            } else {
                listaProductosHTML = "Sin productos"; 
            }

            fila.innerHTML = `
                <td>${item.id_pedido}</td>
                <td>${item.nombre_cliente}</td>
                <td>${item.fecha}</td>
                <td>$${item.total_pedido}</td>
                <td>${listaProductosHTML}</td>
                <td>
                    <button class="btn-borrar">Borrar</button>
                </td>
            `;
        }

        cuerpo.appendChild(fila);
    });
}

// Revisa que pestana esta abierta actualmente para cargar sus datos automaticamente
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

// Cambia de pestana de forma dinamica (oculta las demas y muestra la elegida)
function cambiarPestana(event, idTabSeleccionada) {
    const paneles = document.querySelectorAll('.pestaña');
    paneles.forEach(panel => {
        panel.classList.remove('active-content');
    });

    const botones = document.querySelectorAll('.pestaña-btn');
    botones.forEach(boton => {
        boton.classList.remove('active');
    });

    const panelSeleccionado = document.getElementById(idTabSeleccionada);
    if (panelSeleccionado) {
        panelSeleccionado.classList.add('active-content');
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }

    verificarYMostrarPestanaActiva();
}


// MANEJADORES DE EVENTOS PARA CADA TABLA

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


// FUNCION GENERAL PARA BORRAR REGISTROS (DELETE)

async function borrarRegistro(evento, urlApi) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;

    if (!confirm("Estas seguro de eliminar este registro?")) return;

    try {
        const respuesta = await fetch(`${urlApi}?id=${id}`, {
            method: "DELETE"
        });

        if (respuesta.ok) {
            fila.remove(); // Adios registro de la vista al instante
        }
    } catch (error) {
        console.error("Error al borrar el registro:", error);
    }
}


// FUNCIONES DE EDICION (PUT) CON PROMPTS

async function editarCliente(evento) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;
    const nombreActual = fila.children[1].textContent;
    const direccionActual = fila.children[2].textContent;
    const telefonoActual = fila.children[3].textContent;

    const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
    if (nuevoNombre === null) return;
    const nuevaDireccion = prompt("Nueva direccion:", direccionActual);
    if (nuevaDireccion === null) return;
    const nuevoTelefono = prompt("Nuevo telefono:", telefonoActual);
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
            // Actualizamos la fila sin recargar toda la pagina
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
    const precioActual = fila.children[3].textContent; 
    const stockActual = fila.children[5].textContent;  

    const nuevoPrecio = prompt("Nuevo precio de venta:", precioActual);
    if (nuevoPrecio === null) return;

    const nuevoStock = prompt("Actualizar stock:", stockActual);
    if (nuevoStock === null) return;

    // Validamos que lo ingresado sea numerico de verdad
    if (isNaN(nuevoPrecio) || isNaN(nuevoStock) || nuevoPrecio.trim() === "" || nuevoStock.trim() === "") {
        alert("Por favor, ingresa solo valores numericos validos.");
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


// CONTROL DE FORMULARIOS

function toggleFormulario(idContenedor) {
    const contenedor = document.getElementById(idContenedor);    
    contenedor.classList.toggle("oculto");
}