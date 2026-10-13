const URL_API = "./BACKEND/api_productos.php";
const URL_API2 = "./BACKEND/api_clientes.php";
const URL_API3 = "./BACKEND/api_pedidos.php";
const URL_API4 = "./BACKEND/api_proveedores.php";

const estadoApp = {
    productos: [],
    clientes: [],
    proveedores: [],
    pedidos: []
};

document.addEventListener("DOMContentLoaded", () => {
    verificarYMostrarPestanaActiva();

    document.querySelector("#tablaClientes").addEventListener("click", manejarClientes);
    document.querySelector("#tablaProductos").addEventListener("click", manejarProductos);
    document.querySelector("#tablaProveedores").addEventListener("click", manejarProveedores);
    document.querySelector("#tablaPedidos").addEventListener("click", manejarPedidos);

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
});

async function cargarEntidad(url, selectorTbody, tipo) {
    try {
        const respuesta = await fetch(url);
        const datos = await respuesta.json();
        
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

function renderizarTabla(datos, selectorTbody, tipo) {
    const cuerpo = document.querySelector(selectorTbody);
    if (!cuerpo) return;
    
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

let carritoPedido = [];

function verificarYMostrarPestanaActiva() {
    const panelActivo = document.querySelector('.pestaña.active-content');
    
    if (panelActivo) {
        const idTab = panelActivo.id;        
        
        if (idTab === 'panel-principal') {
            cargarUltimasOperacionesPanel();
        } else if (idTab === 'inventario') {
            cargarEntidad(URL_API, '#tablaProductos', 'productos');
        } else if (idTab === 'clientes') {
            cargarEntidad(URL_API2, '#tablaClientes', 'clientes');
        } else if (idTab === 'proveedores') {
            cargarEntidad(URL_API4, '#tablaProveedores', 'proveedores');
        } else if (idTab === 'historial-pedidos') {
            cargarEntidad(URL_API3, '#tablaPedidos', 'pedidos');
        } else if (idTab === 'nuevo-pedido') {
            cargarClientesEnSelect();
            cargarProductosCatalogoPedido();
            inicializarBotonGuardarPedido();
        }
    }
}

async function cargarUltimasOperacionesPanel() {
    try {
        const respuesta = await fetch(URL_API3);
        const pedidos = await respuesta.json();
        
        pedidos.sort((a, b) => b.id_pedido - a.id_pedido);

        renderizarTabla(pedidos, "#tablaUltimasOperaciones", "ultimas-operaciones");
    } catch (error) {
        console.error("Error al cargar las últimas operaciones:", error);
    }
}

async function cargarClientesEnSelect() {
    try {
        const respuesta = await fetch(URL_API2);
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

async function cargarProductosCatalogoPedido() {
    try {
        const respuesta = await fetch(URL_API);
        const productos = await respuesta.json();
        estadoApp.productos = productos;
        const contenedor = document.querySelector("#catalogo-productos");
        if (!contenedor) return;

        contenedor.innerHTML = "";
        productos.forEach(prod => {
            const div = document.createElement("div");
            div.className = "prod-item";
            
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

function agregarAlCarrito(producto) {
    let itemEnCarrito = carritoPedido.find(item => item.id_producto === producto.id_producto);
    let cantidadActualEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

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

    document.querySelectorAll(".btn-eliminar-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const index = e.target.getAttribute("data-index");
            carritoPedido.splice(index, 1);
            renderizarCarrito();
        });
    });
}

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
            const respuesta = await fetch(URL_API3, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(datosPedido)
            });

            if (respuesta.ok) {
                alert("¡Se genero el pedido!");
                
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

function cambiarPestana(event, idTabSeleccionada) {
    if (event) event.preventDefault();

    const paneles = document.querySelectorAll('.pestaña');
    paneles.forEach(panel => {
        panel.classList.remove('active-content');
    });

    const panelSeleccionado = document.getElementById(idTabSeleccionada);
    if (panelSeleccionado) {
        panelSeleccionado.classList.add('active-content');
    }

    const enlacesMenu = document.querySelectorAll('.pestaña-btn');
    enlacesMenu.forEach(enlace => {
        enlace.classList.toggle('active', enlace.dataset.seccion === idTabSeleccionada);
    });

    verificarYMostrarPestanaActiva();
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
        const respuesta = await fetch(`${urlApi}?id=${id}`, {
            method: "DELETE"
        });

        if (respuesta.ok) {
            fila.remove();
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

// Crear instancias
function toggleFormulario(idContenedor) {
    const contenedor = document.getElementById(idContenedor);    
    if (contenedor) contenedor.classList.toggle("oculto");
}

async function crearCliente(evento) {
    evento.preventDefault();
    
    const nuevoCliente = {
        nombre_cliente: document.querySelector("#campoNombreCliente").value,
        direccion: document.querySelector("#campoDireccion").value,
        telefono: document.querySelector("#campoTelefono").value
    };

    try {
        const respuesta = await fetch(URL_API2, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoCliente)
        });

        if (respuesta.ok) {
            document.querySelector("#formClientes").reset();
            toggleFormulario('formClientes-container');
            cargarEntidad(URL_API2, '#tablaClientes', 'clientes');
        }
    } catch (error) {
        console.error("Error al crear cliente:", error);
    }
}

async function crearProducto(evento) {
    evento.preventDefault();

    const nuevoProducto = {
        nombre: document.querySelector("#campoNombre").value,
        precio_compra: parseFloat(document.querySelector("#campoPrecioCompra").value) || 0,
        precio_venta: parseFloat(document.querySelector("#campoPrecioVenta").value),
        categoria: document.querySelector("#campoCategoria").value,
        stock: parseInt(document.querySelector("#campoStock").value),
        id_proveedor: parseInt(document.querySelector("#campoIdProveedor").value)
    };

    try {
        const respuesta = await fetch(URL_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProducto)
        });

        if (respuesta.ok) {
            document.querySelector("#formProducto").reset();
            toggleFormulario('formProducto-container');
            cargarEntidad(URL_API, '#tablaProductos', 'productos');
        }
    } catch (error) {
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
        const respuesta = await fetch(URL_API4, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoProveedor)
        });

        if (respuesta.ok) {
            document.querySelector("#formProveedores").reset();
            toggleFormulario('formProveedores-container');
            cargarEntidad(URL_API4, '#tablaProveedores', 'proveedores');
        }
    } catch (error) {
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

