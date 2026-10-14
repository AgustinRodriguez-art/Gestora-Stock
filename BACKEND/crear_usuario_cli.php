<?php
// Herramienta local de instalación. Solo funciona desde la terminal, no desde el navegador.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/conexion.php';

echo "Nombre de usuario: ";
$nombre = trim((string)fgets(STDIN));
echo "Contraseña: ";
$contrasena = rtrim((string)fgets(STDIN), "\r\n");

if ($nombre === '' || $contrasena === '') {
    fwrite(STDERR, "El usuario y la contraseña no pueden quedar vacíos.\n");
    exit(1);
}

try {
    $consulta = $conexion->prepare(
        'INSERT INTO usuarios (nombre_usuario, password_hash) VALUES (:usuario, :hash)'
    );
    $consulta->execute([
        ':usuario' => $nombre,
        ':hash' => password_hash($contrasena, PASSWORD_DEFAULT)
    ]);
    echo "Usuario creado correctamente.\n";
} catch (PDOException $error) {
    fwrite(STDERR, "No se pudo crear el usuario. Revisa si ya existe y la conexión a MySQL.\n");
    exit(1);
}
