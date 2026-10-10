// Control de pestanas visuales
function mostrarSeccion(idSeccion) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => sec.classList.remove('activa'));
    document.getElementById(idSeccion).classList.add('activa');

    // Cargar datos segun la seccion activa
    if (idSeccion === 'dashboard') cargarDashboard();
    if (idSeccion === 'productos') cargarProductos();
    if (idSeccion === 'clientes') cargarClientes();
    if (idSeccion === 'proveedores') cargarProveedores();
    if (idSeccion === 'pedidos') cargarPedidos();
}

// Cargar Dashboard
async function cargarDashboard() {
    try {
        const respuesta = await fetch('../backend/api_dashboard.php');
        const datos = await respuesta.json();
        
        if(datos.success) {
            document.getElementById('montoMes').innerText = '\$' + datos.monto_mes;
            document.getElementById('montoAnio').innerText = '\$' + datos.monto_anual;

            const tbody = document.querySelector('#tablaStockBajo tbody');
            tbody.innerHTML = '';
            datos.stock_bajo.forEach(prod => {
                tbody.innerHTML += `<tr>
                    <td>${prod.id_producto}</td>
                    <td>${prod.nombre}</td>
                    <td>${prod.stock}</td>
                    <td>${prod.categoria}</td>
                </tr>`;
            });
        }
    } catch (error) {
        console.error("Error al cargar dashboard", error);
    }
}

// Cargar y Crear Productos
async function cargarProductos() {
    const respuesta = await fetch('../backend/api_productos.php');
    const productos = await respuesta.json();
    const tbody = document.querySelector('#tablaProductos tbody');
    tbody.innerHTML = '';
    productos.forEach(p => {
        tbody.innerHTML += `<tr>
            <td>${p.id_producto}</td>
            <td>${p.nombre}</td>
            <td>$${p.precio_venta}</td>
            <td>${p.categoria}</td>
            <td>${p.stock}</td>
        </tr>`;
    });
}

document.getElementById('formProducto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoProd = {
        nombre: document.getElementById('prodNombre').value,
        precio_compra: parseFloat(document.getElementById('prodPrecioCompra').value) || 0,
        precio_venta: parseFloat(document.getElementById('prodPrecioVenta').value),
        categoria: document.getElementById('prodCategoria').value,
        stock: parseInt(document.getElementById('prodStock').value)
    };

    await fetch('../backend/api_productos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProd)
    });

    document.getElementById('formProducto').reset();
    cargarProductos();
});

// Cargar y Crear Clientes
async function cargarClientes() {
    const respuesta = await fetch('../backend/api_clientes.php');
    const clientes = await respuesta.json();
    const tbody = document.querySelector('#tablaClientes tbody');
    tbody.innerHTML = '';
    clientes.forEach(c => {
        tbody.innerHTML += `<tr>
            <td>${c.id_cliente}</td>
            <td>${c.nombre_cliente}</td>
            <td>${c.direccion}</td>
            <td>${c.telefono}</td>
        </tr>`;
    });
}

document.getElementById('formCliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoCli = {
        nombre_cliente: document.getElementById('cliNombre').value,
        direccion: document.getElementById('cliDireccion').value,
        telefono: document.getElementById('cliTelefono').value
    };

    await fetch('../backend/api_clientes.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoCli)
    });

    document.getElementById('formCliente').reset();
    cargarClientes();
});

// Cargar y Crear Proveedores
async function cargarProveedores() {
    const respuesta = await fetch('../backend/api_proveedores.php');
    const proveedores = await respuesta.json();
    const tbody = document.querySelector('#tablaProveedores tbody');
    tbody.innerHTML = '';
    proveedores.forEach(pr => {
        tbody.innerHTML += `<tr>
            <td>${pr.id_proveedor}</td>
            <td>${pr.nombre}</td>
            <td>${pr.contacto}</td>
            <td>${pr.mail}</td>
        </tr>`;
    });
}

document.getElementById('formProveedor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoProv = {
        nombre: document.getElementById('provNombre').value,
        contacto: document.getElementById('provContacto').value,
        mail: document.getElementById('provMail').value
    };

    await fetch('../backend/api_proveedores.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProv)
    });

    document.getElementById('formProveedor').reset();
    cargarProveedores();
});

// Cargar y Registrar Pedidos
async function cargarPedidos() {
    const respuesta = await fetch('../backend/api_pedidos.php');
    const pedidos = await respuesta.json();
    const tbody = document.querySelector('#tablaPedidos tbody');
    tbody.innerHTML = '';
    pedidos.forEach(ped => {
        tbody.innerHTML += `<tr>
            <td>${ped.id_pedido}</td>
            <td>${ped.nombre_cliente}</td>
            <td>$${ped.total_pedido}</td>
            <td>${ped.fecha}</td>
        </tr>`;
    });
}

document.getElementById('formPedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pedidoData = {
        id_cliente: parseInt(document.getElementById('pedIdCliente').value),
        productos: [
            {
                id_producto: parseInt(document.getElementById('pedIdProducto').value),
                cantidad: parseInt(document.getElementById('pedCantidad').value),
                precio_unitario: parseFloat(document.getElementById('pedIdProducto').value ? document.getElementById('pedPrecioUnitario').value : 0)
            }
        ]
    };

    await fetch('../backend/api_pedidos.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedidoData)
    });

    document.getElementById('formPedido').reset();
    cargarPedidos();
});

// Cargar dashboard por defecto al abrir la pagina
cargarDashboard();