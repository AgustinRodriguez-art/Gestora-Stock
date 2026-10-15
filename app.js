const URL_API = "./BACKEND/api_productos.php";
const URL_API2 = "./BACKEND/api_clientes.php";
const URL_API3 = "./BACKEND/api_pedidos.php";
const URL_API4 = "./BACKEND/api_proveedores.php";
const URL_API5 = "./BACKEND/api_dashboard.php";

// Objeto de estado global para guardar copias de los datos originales
const estadoApp = {
    productos: [],
    clientes: [],
    proveedores: [],
    pedidos: []
};

document.addEventListener("DOMContentLoaded", () => {
    window.firebaseAuth.observarSesion((usuario) => {
        if (usuario) {
            mostrarAplicacion();
        } else {
            document.body.classList.remove("autenticado");
        }
    });
});

async function fetchConToken(url, opciones = {}) {
    const token = await window.obtenerTokenFirebase();

    if (!token) {
        throw new Error("No se encontró una sesión de Firebase.");
    }

    const encabezados = new Headers(opciones.headers || {});
    encabezados.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
        ...opciones,
        headers: encabezados
    });
}

async function comprobarSesion() {
    try {
        const respuesta = await fetchConToken("./BACKEND/api_sesion.php", { credentials: "same-origin" });
        const datos = await respuesta.json();
        if (datos.logueado) mostrarAplicacion();
    } catch (error) {
        document.querySelector("#mensaje-login").textContent =
            "No se pudo conectar con el servidor. Abrí la aplicación desde XAMPP (http://localhost/...) y no con Live Server.";
    }
}

async function iniciarSesion(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const boton = document.querySelector("#btn-iniciar-sesion");
    const mensaje = document.querySelector("#mensaje-login");
    mensaje.textContent = "";
    boton.disabled = true;

    try {
        const respuesta = await fetchConToken("./BACKEND/api_login.php", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                usuario: formulario.usuario.value.trim(),
                contrasena: formulario.contrasena.value
            })
        });
        const datos = await respuesta.json();
        if (!respuesta.ok) throw new Error(datos.error || "No se pudo iniciar sesión.");
        formulario.reset();
        mostrarAplicacion();
    } catch (error) {
        mensaje.textContent = error.message || "No se pudo conectar con el servidor.";
    } finally {
        boton.disabled = false;
    }
}


async function cerrarSesion() {
    try {
        await fetchConToken("./BACKEND/api_logout.php", {
            method: "POST",
            credentials: "same-origin"
        });
    } finally {
        document.body.classList.remove("autenticado");
        window.location.reload();
    }
}
let aplicacionIniciada = false;
function mostrarAplicacion() {
    document.body.classList.add("autenticado");
    if (aplicacionIniciada) return;
    aplicacionIniciada = true;

    // Al cargar la página, detecta y muestra la pestaña activa
    verificarYMostrarPestanaActiva();

    document.querySelector("#tablaClientes").addEventListener("click", manejarClientes);
    document.querySelector("#tablaProductos").addEventListener("click", manejarProductos);
    document.querySelector("#tablaProveedores").addEventListener("click", manejarProveedores);
    document.querySelector("#tablaPedidos").addEventListener("click", manejarPedidos);

    const botonSalir = document.querySelector("#boton-salir");
    if (botonSalir) botonSalir.addEventListener("click", cerrarSesion);


    document.querySelector("#formClientes").addEventListener("submit", crearCliente);
    document.querySelector("#formProducto").addEventListener("submit", crearProducto);
    document.querySelector("#formProveedores").addEventListener("submit", crearProveedor);

    // ENLAZAR EVENTOS DE BÚSQUEDA Y ORDENAMIENTO EN TIEMPO REAL

    // Inventario
    document.querySelectorAll("#busquedaInventario input, #ordenProductos").forEach(el => {
        el.addEventListener("input", filtrarInventario);
        el.addEventListener("change", filtrarInventario);
    });

    // Clientes
    document.querySelectorAll("#busquedaClientes input, #ordenClientes").forEach(el => {
        el.addEventListener("input", filtrarClientes);
        el.addEventListener("change", filtrarClientes);
    });

    // Proveedores
    document.querySelectorAll("#busquedaProveedores input, #ordenProveedores").forEach(el => {
        el.addEventListener("input", filtrarProveedores);
        el.addEventListener("change", filtrarProveedores);
    });

    // Pedidos
    document.querySelectorAll("#busquedaPedidos input, #ordenPedidos").forEach(el => {
        el.addEventListener("input", filtrarPedidos);
        el.addEventListener("change", filtrarPedidos);
    });
}

// Función unificada para hacer fetch y guardar los datos en el estado
async function cargarEntidad(url, selectorTbody, tipo) {
    try {
        const respuesta = await fetchConToken(url);
        const datos = await respuesta.json();

        // Guardamos en el estado según el tipo
        if (tipo === "productos") {
            estadoApp.productos = datos;
            filtrarInventario();
        } else if (tipo === "clientes") {
            estadoApp.clientes = datos;
            filtrarClientes();
        } else if (tipo === "proveedores") {
            estadoApp.proveedores = datos;
            filtrarProveedores();
        } else if (tipo === "pedidos") {
            estadoApp.pedidos = datos;
            filtrarPedidos();
        }
    } catch (error) {
        console.error(`Error al cargar ${tipo}:`, error);
    }
}

// Función unificada para pintar las filas en cualquier tabla
function renderizarTabla(datos, selectorTbody, tipo) {
    const cuerpo = document.querySelector(selectorTbody);
    if (!cuerpo) return;

    cuerpo.innerHTML = "";

    datos.forEach(item => {
        const fila = document.createElement("tr");
        fila.dataset.id = tipo === "pedidos"
    ? item.id_pedido
    : item.id || item.id_producto || item.id_cliente || item.id_proveedor;

        if (tipo === "productos") {
            fila.innerHTML = `
                <td>${item.id_producto}</td>
                <td>${item.nombre}</td>
                <td>${item.precio_compra}</td>
                <td>${item.precio_venta}</td>
                <td>${item.categoria}</td>
                <td>${item.stock}</td>
                <td>${item.id_proveedor ?? "No especificado"}</td>
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
        } else if (tipo === "ultimas-operaciones") {
            let listaProductosHTML = "";
            if (item.productos && item.productos.length > 0) {
                listaProductosHTML = "<ul>";
                item.productos.forEach(prod => {
                    listaProductosHTML += `<li>${prod.nombre_producto} (Cant: ${prod.cantidad})</li>`;
                });
                listaProductosHTML += "</ul>";
            } else {
                listaProductosHTML = "Sin productos";
            }

            // Sin ID, sin editar, sin borrar
            fila.innerHTML = `
                <td>${item.nombre_cliente}</td>
                <td>${item.fecha}</td>
                <td>$${item.total_pedido}</td>
                <td>${listaProductosHTML}</td>
            `;
        }

        cuerpo.appendChild(fila);
    });
}



// Variable global para almacenar el carrito del nuevo pedido
let carritoPedido = [];

// Función que detecta qué pestaña está abierta actualmente
async function verificarYMostrarPestanaActiva() {
    const panelActivo = document.querySelector('.pestaña.active-content');
    if (!panelActivo) return;

    const idTab = panelActivo.id;
    if (idTab === 'panel-principal') {
        await Promise.all([cargarUltimasOperacionesPanel(), cargarResumenDashboard()]);
    } else if (idTab === 'inventario') {
        await cargarEntidad(URL_API, '#tablaProductos', 'productos');
    } else if (idTab === 'clientes') {
        await cargarEntidad(URL_API2, '#tablaClientes', 'clientes');
    } else if (idTab === 'proveedores') {
        await cargarEntidad(URL_API4, '#tablaProveedores', 'proveedores');
    } else if (idTab === 'historial-pedidos') {
        await cargarEntidad(URL_API3, '#tablaPedidos', 'pedidos');
    } else if (idTab === 'nuevo-pedido') {
        await Promise.all([cargarClientesEnSelect(), cargarProductosCatalogoPedido()]);
        inicializarBotonGuardarPedido();
    }
}

// Cargar los pedidos en la pantalla principal
async function cargarUltimasOperacionesPanel() {
    try {
        const respuesta = await fetchConToken(URL_API3);
        const pedidos = await respuesta.json();

        // Ordenar de más nuevo a más viejo (descendente por ID de pedido)
        pedidos.sort((a, b) => b.id_pedido - a.id_pedido);

        // Renderizamos usando la función general reutilizada
        renderizarTabla(pedidos, "#tablaUltimasOperaciones", "ultimas-operaciones");
    } catch (error) {
        console.error("Error al cargar las últimas operaciones:", error);
    }
}

async function cargarResumenDashboard(){
    try {
        const respuesta = await fetchConToken(URL_API5);
        const datos = await respuesta.json();

        if (!respuesta.ok || datos.error){
            throw new Error(datos.error || "No se pudo cargar el resumen");

        }

        document.querySelector("#total-ventas").textContent =
            `$${Number(datos.monto_anual).toFixed(2)}`;

        document.querySelector("#productos-stock").textContent =
            datos.productos_disponibles ?? 0;

        document.querySelector("#unidades-stock").textContent =
             `${datos.total_unidades ?? 0} unidades`;

        document.querySelector("#alerta-stock").textContent =
            datos.stock_bajo?.length ?? 0;

        document.querySelector("#total-contactos").textContent =
         `${datos.total_clientes ?? 0} / ${datos.total_proveedores ?? 0}`

    } catch (error) {
        console.error("Error al cargar el resumen:", error);


    }
}

// Cargar clientes en el select id="cliente"
async function cargarClientesEnSelect() {
    try {
        const respuesta = await fetchConToken(URL_API2);
        const clientes = await respuesta.json();
        const selectCliente = document.querySelector("#cliente");
        if (!selectCliente) return;

        selectCliente.innerHTML = '<option value="">-- Seleccionar... --</option>';
        clientes.forEach(c => {
            const option = document.createElement("option");
            option.value = c.id_cliente;
            option.textContent = c.nombre_cliente;
            selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar clientes para el pedido:", error);
    }
}

// Cargar productos en el catálogo de nuevo pedido respetando el stock
async function cargarProductosCatalogoPedido() {
    try {
        const respuesta = await fetchConToken(URL_API);
        const productos = await respuesta.json();
        estadoApp.productos = productos; // Sincronizamos el estado
        const contenedor = document.querySelector("#catalogo-productos");
        if (!contenedor) return;

        contenedor.innerHTML = "";
        productos.forEach(prod => {
            const div = document.createElement("div");
            div.className = "prod-item";

            // Si el stock es 0, se deshabilita visualmente y no permite seleccionar
            if (prod.stock <= 0) {
                div.style.opacity = "0.5";
                div.style.cursor = "not-allowed";
                div.innerHTML = `<strong>${prod.nombre}</strong><br>Stock: 0 (Agotado)`;
            } else {
                div.innerHTML = `<strong>${prod.nombre}</strong><br>Precio: $${prod.precio_venta}<br>Stock: ${prod.stock}`;
                div.addEventListener("click", () => agregarAlCarrito(prod));
            }
            contenedor.appendChild(div);
        });
    } catch (error) {
        console.error("Error al cargar productos en catálogo:", error);
    }
}

// Agregar producto al carrito o incrementar su cantidad
function agregarAlCarrito(producto) {
    let itemEnCarrito = carritoPedido.find(item => item.id_producto === producto.id_producto);
    let cantidadActualEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    // Validar que no supere el stock disponible
    if (cantidadActualEnCarrito + 1 > producto.stock) {
        alert("No hay suficiente stock de este producto.");
        return;
    }

    if (itemEnCarrito) {
        itemEnCarrito.cantidad += 1;
    } else {
        carritoPedido.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio_unitario: producto.precio_venta,
            cantidad: 1
        });
    }

    renderizarCarrito();
}

// Renderizar el detalle del carrito usando estructura de tabla y calcular el total
function renderizarCarrito() {
    const listaCarrito = document.querySelector("#lista-carrito");
    const spanTotal = document.querySelector("#total-pedido");
    if (!listaCarrito || !spanTotal) return;

    if (carritoPedido.length === 0) {
        listaCarrito.innerHTML = "<p>El carrito esta vacio.</p>";
        spanTotal.textContent = "$0.00";
        return;
    }

    let tablaHTML = `
        <table class="tabla-carrito">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalGeneral = 0;

    carritoPedido.forEach((item, index) => {
        let subtotal = item.cantidad * item.precio_unitario;
        totalGeneral += subtotal;

        tablaHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn-eliminar-item" data-index="${index}">Eliminar</button>
                </td>
            </tr>
        `;
    });

    tablaHTML += `</tbody></table>`;
    listaCarrito.innerHTML = tablaHTML;
    spanTotal.textContent = `$${totalGeneral.toFixed(2)}`;

    // Asignar eventos a los botones de eliminar de cada ítem
    document.querySelectorAll(".btn-eliminar-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            carritoPedido.splice(index, 1);
            renderizarCarrito();
        });
    });
}

// Inicializar el botón de confirmar pedido para enviar la instancia a la API de pedidos
function inicializarBotonGuardarPedido() {
    const btnGuardar = document.querySelector("#btn-guardar-pedido");
    if (!btnGuardar) return;

    btnGuardar.onclick = null;

    btnGuardar.onclick = async () => {
        const idClienteSelect = document.querySelector("#cliente").value;
        if (!idClienteSelect) {
            alert("Por favor, seleccione un cliente.");
            return;
        }

        if (carritoPedido.length === 0) {
            alert("El carrito está vacío. Agregue al menos un producto.");
            return;
        }

        const datosPedido = {
            id_cliente: parseInt(idClienteSelect),
            productos: carritoPedido.map(item => ({
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario
            }))
        };

        try {
            const respuesta = await fetchConToken(URL_API3, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosPedido)
            });

            if (respuesta.ok) {
                alert("¡Se genero el pedido!");

                // Limpiar carrito y formulario
                carritoPedido = [];
                renderizarCarrito();
                document.querySelector("#cliente").value = "";
                cargarProductosCatalogoPedido(); 
            } else {
                const errorData = await respuesta.json();
                alert("Error al crear el pedido: " + (errorData.error || "Desconocido"));
            }
        } catch (error) {
            console.error("Error en la petición del pedido:", error);
        }
    };
}




async function cambiarPestana(event, idTabSeleccionada) {
    if (event) event.preventDefault();

    const loader = document.querySelector('#loader-pantalla');
    if (loader) {
        loader.classList.add('visible');
        loader.setAttribute('aria-hidden', 'false');
    }

    const checkMenu = document.querySelector('#btn-menu');
    if (checkMenu) checkMenu.checked = false;

    document.querySelectorAll('.pestaña-btn').forEach(boton => boton.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    document.querySelectorAll('.pestaña').forEach(panel => panel.classList.remove('active-content'));
    const panelSeleccionado = document.getElementById(idTabSeleccionada);
    if (panelSeleccionado) panelSeleccionado.classList.add('active-content');

    try {
        await Promise.all([
            verificarYMostrarPestanaActiva(),
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);
    } finally {
        if (loader) {
            loader.classList.remove('visible');
            loader.setAttribute('aria-hidden', 'true');
        }
    }
}


// MANEJADORES DE EVENTOS

function manejarClientes(e) {
    if (e.target.classList.contains("btn-borrar")) borrarRegistro(e, URL_API2);
    if (e.target.classList.contains("btn-editar")) editarCliente(e);
}

function manejarProductos(e) {
    if (e.target.classList.contains("btn-borrar")) borrarRegistro(e, URL_API);
    if (e.target.classList.contains("btn-editar")) editarProducto(e);
}

function manejarProveedores(e) {
    if (e.target.classList.contains("btn-borrar")) borrarRegistro(e, URL_API4);
    if (e.target.classList.contains("btn-editar")) editarProveedor(e);
}

function manejarPedidos(e) {
    if (e.target.classList.contains("btn-borrar")) borrarRegistro(e, URL_API3);
}


// FUNCION DELETE

async function borrarRegistro(evento, urlApi) {
    const fila = evento.target.closest("tr");
    const id = fila.dataset.id;

    if (!confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
        console.log("ID que se intenta borrar:", id);

        const respuesta = await fetchConToken(`${urlApi}?id=${id}`, {
          method: "DELETE"
        });

        if (!respuesta.ok) {
           const error = await respuesta.json();
           alert(error.error || "No se pudo borrar el pedido");
           console.error("Respuesta del servidor:", error);
           return;
        }  


         fila.remove(); // Borra la fila visualmente de la tabla
        }
        catch (error) {
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
        const respuesta = await fetchConToken(`${URL_API2}?id=${id}`, {
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
    if (!fila) return;

    const id = fila.dataset.id;
    const nombreActual = fila.children[1].textContent;
    const precioActual = fila.children[3].textContent;
    const stockActual = fila.children[5].textContent;
    const proveedorActual = fila.children[6].textContent;

    const nuevoNombre = prompt("Nuevo nombre:", nombreActual);
    if (nuevoNombre === null) return;

    const precioTexto = prompt("Nuevo precio de venta:", precioActual);
    if (precioTexto === null) return;

    const stockTexto = prompt("Nuevo stock:", stockActual);
    if (stockTexto === null) return;

    const proveedorPredeterminado =
        proveedorActual === "No especificado" ? "" : proveedorActual;

    const proveedorTexto = prompt(
        "Nuevo ID de proveedor:",
        proveedorPredeterminado
    );
    if (proveedorTexto === null) return;

    const nombre = nuevoNombre.trim();
    const precioVenta = Number(precioTexto);
    const stock = Number(stockTexto);
    const idProveedor = Number(proveedorTexto);

    if (!nombre) {
        alert("El nombre no puede quedar vacío.");
        return;
    }

    if (precioTexto.trim() === "" || !Number.isFinite(precioVenta) || precioVenta < 0) {
        alert("Ingresá un precio de venta válido, mayor o igual a cero.");
        return;
    }

    if (stockTexto.trim() === "" || !Number.isInteger(stock) || stock < 0) {
        alert("El stock debe ser un número entero mayor o igual a cero.");
        return;
    }

    if (proveedorTexto.trim() === "" || !Number.isInteger(idProveedor) || idProveedor < 1) {
        alert("El ID de proveedor debe ser un entero positivo.");
        return;
    }

    try {
        const respuesta = await fetchConToken(`${URL_API}?id=${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre,
                precio_venta: precioVenta,
                stock,
                id_proveedor: idProveedor
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(datos.error || "No se pudo actualizar el producto.");
        }

        fila.children[1].textContent = datos.nombre;
        fila.children[3].textContent = datos.precio_venta;
        fila.children[5].textContent = datos.stock;
        fila.children[6].textContent = datos.id_proveedor;
    } catch (error) {
        alert(error.message || "Error al actualizar el producto.");
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
        const respuesta = await fetchConToken(`${URL_API4}?id=${id}`, {
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




// Crear instancias
function toggleFormulario(idContenedor) {
    const contenedor = document.getElementById(idContenedor);    
    if (contenedor) contenedor.classList.toggle("oculto");
}


async function comprobarRespuestaAPI(respuesta) {
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(
            `Error ${respuesta.status}: ${datos.error || "No se pudo guardar."}`
        );
    }

    return datos;
}

async function crearCliente(evento) {
    evento.preventDefault();

    const nuevoCliente = {
        nombre_cliente: document.querySelector("#campoNombreCliente").value,
        direccion: document.querySelector("#campoDireccion").value,
        telefono: document.querySelector("#campoTelefono").value
    };

    try {
        const respuesta = await fetchConToken(URL_API2, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoCliente)
        });

        await comprobarRespuestaAPI(respuesta);

        document.querySelector("#formClientes").reset();
        toggleFormulario("formClientes-container");
        await cargarEntidad(URL_API2, "#tablaClientes", "clientes");
    } catch (error) {
        alert(error.message || "No se pudo crear el cliente.");
        console.error("Error al crear cliente:", error);
    }
}

async function crearProducto(evento) {
    evento.preventDefault();

    const nuevoProducto = {
        nombre: document.querySelector("#campoNombre").value,
        precio_compra:
            parseFloat(document.querySelector("#campoPrecioCompra").value) || 0,
        precio_venta:
            parseFloat(document.querySelector("#campoPrecioVenta").value),
        categoria: document.querySelector("#campoCategoria").value,
        stock: parseInt(document.querySelector("#campoStock").value, 10),
        id_proveedor:
            parseInt(document.querySelector("#campoIdProveedor").value, 10)
    };

    try {
        const respuesta = await fetchConToken(URL_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProducto)
        });

        await comprobarRespuestaAPI(respuesta);

        document.querySelector("#formProducto").reset();
        toggleFormulario("formProducto-container");
        await cargarEntidad(URL_API, "#tablaProductos", "productos");
    } catch (error) {
        alert(error.message || "No se pudo crear el producto.");
        console.error("Error al crear producto:", error);
    }
}

async function crearProveedor(evento) {
    evento.preventDefault();

    const nuevoProveedor = {
        nombre: document.querySelector("#campoNombreProveedor").value,
        contacto: document.querySelector("#campoContacto").value,
        mail: document.querySelector("#campoMail").value
    };

    try {
        const respuesta = await fetchConToken(URL_API4, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProveedor)
        });

        await comprobarRespuestaAPI(respuesta);

        document.querySelector("#formProveedores").reset();
        toggleFormulario("formProveedores-container");
        await cargarEntidad(URL_API4, "#tablaProveedores", "proveedores");
    } catch (error) {
        alert(error.message || "No se pudo crear el proveedor.");
        console.error("Error al crear proveedor:", error);
    }
}


// Busquedas

function toggleBusqueda(idContenedor) {
    const contenedor = document.getElementById(idContenedor);    
    if (contenedor) contenedor.classList.toggle("oculto");
}

function filtrarInventario() {
    let lista = estadoApp.productos;

    const textoNombre = document.getElementById("filtroProdNombre").value.toLowerCase();
    const textoPrecioCompra = document.getElementById("filtroProdPrecioCompra").value.toLowerCase();
    const textoPrecioVenta = document.getElementById("filtroProdPrecioVenta").value.toLowerCase();
    const textoStock = document.getElementById("filtroProdStock").value.toLowerCase();
    const textoProv = document.getElementById("filtroProdIdProv").value.toLowerCase();

    let listaFiltrada = [];
    for (let i = 0; i < lista.length; i++) {
        let p = lista[i];
        let nombre = p.nombre.toLowerCase();
        let categoria = (p.categoria || "").toLowerCase();
        let precioComp = String(p.precio_compra);
        let precioVent = String(p.precio_venta);
        let stock = String(p.stock);
        let prov = String(p.id_proveedor);

        let okNombre = (textoNombre === "" || nombre.indexOf(textoNombre) !== -1 || categoria.indexOf(textoNombre) !== -1);
        let okPC = (textoPrecioCompra === "" || precioComp.indexOf(textoPrecioCompra) !== -1);
        let okPV = (textoPrecioVenta === "" || precioVent.indexOf(textoPrecioVenta) !== -1);
        let okStock = (textoStock === "" || stock.indexOf(textoStock) !== -1);
        let okProv = (textoProv === "" || prov.indexOf(textoProv) !== -1);

        if (okNombre && okPC && okPV && okStock && okProv) {
            listaFiltrada.push(p);
        }
    }
    lista = listaFiltrada;

    const orden = document.getElementById("ordenProductos").value;
    lista = lista.slice();
    lista.sort((a, b) => orden === "asc" ? a.id_producto - b.id_producto : b.id_producto - a.id_producto);

    renderizarTabla(lista, "#tablaProductos", "productos");
}

function filtrarClientes() {
    let lista = estadoApp.clientes;

    const textoNombre = document.getElementById("filtroClienteNombre").value.toLowerCase();
    const textoDir = document.getElementById("filtroClienteDireccion").value.toLowerCase();
    const textoTel = document.getElementById("filtroClienteTelefono").value.toLowerCase();

    let listaFiltrada = [];
    for (let i = 0; i < lista.length; i++) {
        let c = lista[i];
        let nombre = c.nombre_cliente.toLowerCase();
        let dir = c.direccion.toLowerCase();
        let tel = String(c.telefono);

        let okNombre = (textoNombre === "" || nombre.indexOf(textoNombre) !== -1);
        let okDir = (textoDir === "" || dir.indexOf(textoDir) !== -1);
        let okTel = (textoTel === "" || tel.indexOf(textoTel) !== -1);

        if (okNombre && okDir && okTel) {
            listaFiltrada.push(c);
        }
    }
    lista = listaFiltrada;

    const orden = document.getElementById("ordenClientes").value;
    lista = lista.slice();
    lista.sort((a, b) => orden === "asc" ? a.id_cliente - b.id_cliente : b.id_cliente - a.id_cliente);

    renderizarTabla(lista, "#tablaClientes", "clientes");
}

function filtrarProveedores() {
    let lista = estadoApp.proveedores;

    const textoNombre = document.getElementById("filtroProvNombre").value.toLowerCase();
    const textoContacto = document.getElementById("filtroProvContacto").value.toLowerCase();
    const textoMail = document.getElementById("filtroProvMail").value.toLowerCase();

    let listaFiltrada = [];
    for (let i = 0; i < lista.length; i++) {
        let prov = lista[i];
        let nombre = prov.nombre.toLowerCase();
        let contacto = prov.contacto.toLowerCase();
        let mail = prov.mail.toLowerCase();

        let okNombre = (textoNombre === "" || nombre.indexOf(textoNombre) !== -1);
        let okContacto = (textoContacto === "" || contacto.indexOf(textoContacto) !== -1);
        let okMail = (textoMail === "" || mail.indexOf(textoMail) !== -1);

        if (okNombre && okContacto && okMail) {
            listaFiltrada.push(prov);
        }
    }
    lista = listaFiltrada;

    const orden = document.getElementById("ordenProveedores").value;
    lista = lista.slice();
    lista.sort((a, b) => orden === "asc" ? a.id_proveedor - b.id_proveedor : b.id_proveedor - a.id_proveedor);

    renderizarTabla(lista, "#tablaProveedores", "proveedores");
}

function filtrarPedidos() {
    let lista = estadoApp.pedidos;

    const textoCliente = document.getElementById("filtroPedidoCliente").value.toLowerCase();
    const textoFecha = document.getElementById("filtroPedidoFecha").value.toLowerCase();
    const textoTotal = document.getElementById("filtroPedidoTotal").value.toLowerCase();

    let listaFiltrada = [];
    for (let i = 0; i < lista.length; i++) {
        let ped = lista[i];
        let cliente = (ped.nombre_cliente || "").toLowerCase();
        let fecha = String(ped.fecha);
        let total = String(ped.total_pedido);

        let okCliente = (textoCliente === "" || cliente.indexOf(textoCliente) !== -1);
        let okFecha = (textoFecha === "" || fecha.indexOf(textoFecha) !== -1);
        let okTotal = (textoTotal === "" || total.indexOf(textoTotal) !== -1);

        if (okCliente && okFecha && okTotal) {
            listaFiltrada.push(ped);
        }
    }
    lista = listaFiltrada;

    const orden = document.getElementById("ordenPedidos").value;
    lista = lista.slice();
    lista.sort((a, b) => orden === "asc" ? a.id_pedido - b.id_pedido : b.id_pedido - a.id_pedido);

    renderizarTabla(lista, "#tablaPedidos", "pedidos");
}
