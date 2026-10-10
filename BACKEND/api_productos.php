<?php
require "conexion.php";

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$metodo = $_SERVER["REQUEST_METHOD"];

// Si es POST, agregamos un nuevo producto al stoc
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true);

    // Validamos que esten presentes los datos clave requeridos
    if (!isset($cuerpo["nombre"], $cuerpo["precio_venta"], $cuerpo["categoria"], $cuerpo["stock"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos obligatorios del producto"]);
        exit();
    }

    // Preparamos la consulta SQL para insertar de forma segura
    $consulta = $conexion->prepare(
        "INSERT INTO producto (nombre, precio_compra, precio_venta, categoria, stock) 
         VALUES (:nombre, :precio_compra, :precio_venta, :categoria, :stock)"
    );
    $consulta->execute([
        ":nombre"        => $cuerpo["nombre"],
        ":precio_compra" => $cuerpo["precio_compra"] ?? 0,
        ":precio_venta"  => $cuerpo["precio_venta"],
        ":categoria"     => $cuerpo["categoria"],
        ":stock"         => $cuerpo["stock"]
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true, 
        "id_producto" => (int)$conexion->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Si es GET, devolvemos la lista completa de productos
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM producto");
    $productos = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($productos, JSON_UNESCAPED_UNICODE);
    exit();
}
?>