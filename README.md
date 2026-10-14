# Gestora de Stock

Aplicación local de inventario con PHP, MySQL y un inicio de sesión con sesiones PHP.

## Preparar XAMPP

1. Copiá la carpeta del proyecto dentro de `C:\xampp\htdocs`. Podés llamarla `GestoraStock`.
2. Abrí el panel de XAMPP e iniciá **Apache** y **MySQL**.
3. Abrí `http://localhost/phpmyadmin/`.
4. Si todavía no existe la base de datos, importá `BASE DE DATOS/consultorastock.sql`.
   **Atención:** ese archivo empieza con `DROP DATABASE` y borra la base `consultorastock` si ya existe. No lo vuelvas a importar si querés conservar los datos.
5. En phpMyAdmin, seleccioná la base `consultorastock` e importá `BACKEND/crear_tabla_usuarios.sql`.
6. El archivo `BACKEND/config.php` trae la configuración común de XAMPP (`root` sin contraseña). Si tu MySQL usa otros datos, actualizá ese archivo. Hay un ejemplo en `BACKEND/config.example.php`.
7. Abrí una terminal en la carpeta del proyecto y ejecutá `C:\xampp\php\php.exe BACKEND\crear_usuario_cli.php`. La herramienta te pedirá usuario y contraseña y guardará la contraseña protegida en la base.
8. Entrá a `http://localhost/GestoraStock/` (o al nombre de la carpeta que hayas elegido) e iniciá sesión.

La aplicación debe abrirse desde Apache/XAMPP. No uses la opción **Live Server** de VS Code, porque no ejecuta PHP.

## Inicio de sesión

- El formulario valida el usuario y la contraseña contra la tabla `usuarios`.
- Las contraseñas se guardan con `password_hash` y se verifican con `password_verify`.
- Las API de productos, clientes, pedidos, proveedores y panel requieren una sesión iniciada.
- El botón **Cerrar sesión** finaliza la sesión PHP.
- Esta versión contiene únicamente el login PHP/MySQL. No incluye Firebase, la API de Google ni una pantalla de registro.
