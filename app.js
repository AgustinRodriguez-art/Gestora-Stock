const URL_API = "http://localhost/GestoraStock/BACKEND/api_productos.php";

document.addEventListener("DOMContentLoaded", () => {
    mostrarProductos();

    //document.querySelector("#formAlta")
    //.addEventListener("submit", crearAlumno);

    //document.querySelector("#tablaProductos")
    //.addEventListener("click", manejarBotones);
});

async function mostrarProductos(){
    try{
        const respuesta = await fetch(URL_API);
        const productos = await respuesta.json();
        renderizarProductos(productos);
    }
    catch(error){
        console.error(error);
    }
}

function renderizarProductos(productos){
    const cuerpo = document.querySelector("#tablaProductos");
    cuerpo.innerHTML = "";
    productos.forEach(producto => {
        const fila = document.createElement("tr");
        fila.dataset.id = producto.id;
        fila.innerHTML = `
            <td>${producto.id_producto}</td>
            <td>${producto.nombre}</td>
            <td>${producto.precio_compra}</td>
            <td>${producto.precio_venta}</td>
            <td>${producto.categoria}</td>
            <td>${producto.stock}</td>
            <td>${producto.id_proveedor}</td>
            <td>
                <button class="btn-editar">Editar</button>
                <button class="btn-borrar">Borrar</button>
            </td>
        `;
        cuerpo.appendChild(fila);
    });
}




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
  document.getElementById(idTabSeleccionada).classList.add('active-content');

  // Marca el botón de la pestaña seleccionada como activo
  event.currentTarget.classList.add('active');
}