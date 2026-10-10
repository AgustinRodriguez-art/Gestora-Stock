<?php
// Intenta conectar a la base de datos usando PDO
try {
    $conexion = new PDO(
        "mysql:host=localhost;dbname=consultorastock;charset=utf8mb4",
        "root",
        ""
    );

    // Configura PDO para que lance excepciones si ocurre un error en SQL
    $conexion->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

} catch (PDOException $error) {
    // Si falla la conexion, detiene todo y devuelve un codigo de error HTTP 500 en JSON
    http_response_code(500);

    header("Content-Type: application/json; charset=utf-8");

    echo json_encode([
        "error" => "No se pudo conectar a la base de datos"
    ]);

    exit();
}
?>