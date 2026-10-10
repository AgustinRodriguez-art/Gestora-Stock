<?php
// Carga la conexion centralizada
require "conexion.php";

// Configura los permisos de acceso y el formato de respuesta JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$metodo = $_SERVER["REQUEST_METHOD"];


  // POST - Crear producto nuevo
  
if ($metodo === "POST") {
    // Lee los datos JSON enviados desde JavaScript
    $cuerpo = json_decode(
        file_get_contents("php://input"),
        true
    );

    // Valida que los datos obligatorios esten presentes
    if (
        !isset($cuerpo["nombre"]) ||
        !isset($cuerpo["precio_venta"]) ||
        !isset($cuerpo["categoria"]) ||
        !isset($cuerpo["stock"])
    ) {
        http_response_code(400);
        echo json_encode([
            "error" => "Faltan datos obligatorios del producto"
        ]);
        exit();
    }

    // Prepara la consulta SQL para evitar inyecciones
    $consulta = $conexion->prepare(
        "INSERT INTO producto (nombre, precio_compra, precio_venta, categoria, stock)
         VALUES (:nombre, :precio_compra, :precio_venta, :categoria, :stock)"
    );

    // Ejecuta la consulta pasando los valores de forma segura
    $consulta->execute([
        ":nombre"        => $cuerpo["nombre"],
        ":precio_compra" => $cuerpo["precio_compra"] ?? 0,
        ":precio_venta"  => $cuerpo["precio_venta"],
        ":categoria"     => $cuerpo["categoria"],
        ":stock"         => $cuerpo["stock"]
    ]);

    http_response_code(201);

    // Devuelve una respuesta JSON con el ID generado
    echo json_encode([
        "success" => true,
        "id_producto" => (int)$conexion->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

  // GET - Listar todos los productos

if ($metodo === "GET") {
    // Consulta todos los registros de la tabla
    $consulta = $conexion->query(
        "SELECT * FROM producto"
    );

    $productos = $consulta->fetchAll(
        PDO::FETCH_ASSOC
    );

    // Devuelve el listado completo en formato JSON
    echo json_encode(
        $productos,
        JSON_UNESCAPED_UNICODE
    );

    exit();
}
?>