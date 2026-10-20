<?php

require_once __DIR__ . "/config.php";

header("Content-Type: application/json; charset=utf-8");

$url = getenv("MYSQL_URL");

if ($url === false || trim($url) === "") {
    error_log("MYSQL_URL no está definida o está vacía.");
    http_response_code(500);
    echo json_encode(["error" => "No está configurada la conexión a MySQL"]);
    exit;
}

$partes = parse_url($url);

if (
    $partes === false ||
    empty($partes["host"]) ||
    empty($partes["user"]) ||
    !isset($partes["pass"]) ||
    empty($partes["path"])
) {
    error_log("MYSQL_URL tiene un formato inválido.");
    http_response_code(500);
    echo json_encode(["error" => "La URL de conexión a MySQL no es válida"]);
    exit;
}

$host = $partes["host"];
$puerto = $partes["port"] ?? 3306;
$base = ltrim($partes["path"], "/");
$usuario = rawurldecode($partes["user"]);
$contrasena = rawurldecode($partes["pass"]);

try {
    $conexion = new PDO(
        "mysql:host={$host};port={$puerto};dbname={$base};charset=utf8mb4",
        $usuario,
        $contrasena,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $error) {
    error_log("Error de conexión MySQL: " . $error->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "No se pudo conectar a la base de datos"]);
    exit;
}