<?php
require_once __DIR__ . '/sesion.php';
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido.']);
    exit;
}

$datos = json_decode(file_get_contents('php://input'), true);
$usuario = trim((string)($datos['usuario'] ?? ''));
$contrasena = (string)($datos['contrasena'] ?? '');

if ($usuario === '' || $contrasena === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Escribe tu usuario y contraseña.']);
    exit;
}

try {
    $consulta = $conexion->prepare(
        'SELECT id_usuario, nombre_usuario, password_hash FROM usuarios WHERE nombre_usuario = :usuario LIMIT 1'
    );
    $consulta->execute([':usuario' => $usuario]);
    $cuenta = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$cuenta || !password_verify($contrasena, $cuenta['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'El usuario o la contraseña no son correctos.']);
        exit;
    }

    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int)$cuenta['id_usuario'];
    $_SESSION['nombre_usuario'] = $cuenta['nombre_usuario'];

    echo json_encode([
        'success' => true,
        'usuario' => ['nombre' => $cuenta['nombre_usuario']]
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo validar el usuario. Revisa la configuración de la base de datos.']);
}