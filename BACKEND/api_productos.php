<?php
require "conexion.php";

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";

$origenesPermitidos = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: $origen");
    header("Vary: Origin");
}

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/firebase_auth.php";
$usuarioFirebase = exigirUsuarioFirebase();

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






/* PUT - Editar producto */
if ($metodo === "PUT") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del producto"]);
        exit();
    }

    $cuerpo = json_decode(file_get_contents("php://input"), true);

    // Validamos los campos que permites actualizar desde tu frontend (precio y stock)
    if (!isset($cuerpo["precio_venta"]) || !isset($cuerpo["stock"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos obligatorios para actualizar"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "UPDATE producto
         SET precio_venta = :precio_venta,
             stock = :stock
         WHERE id_producto = :id"
    );

    $consulta->execute([
        ":precio_venta" => $cuerpo["precio_venta"],
        ":stock"        => $cuerpo["stock"],
        ":id"           => $_GET["id"]
    ]);

    http_response_code(200);
    echo json_encode([
        "success"      => true,
        "id_producto"  => (int)$_GET["id"],
        "precio_venta" => $cuerpo["precio_venta"],
        "stock"        => $cuerpo["stock"]
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

/* DELETE - Borrar producto */
if ($metodo === "DELETE") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del producto"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "DELETE FROM producto
         WHERE id_producto = :id"
    );

    $consulta->execute([
        ":id" => $_GET["id"]
    ]);

    http_response_code(204);
    exit();
}








?>
