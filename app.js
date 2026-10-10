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