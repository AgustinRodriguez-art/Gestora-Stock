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

// POST: Registrar un proveedor
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($cuerpo["nombre"], $cuerpo["contacto"], $cuerpo["mail"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos obligatorios del proveedor"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "INSERT INTO proveedor (nombre, contacto, mail) 
         VALUES (:nombre, :contacto, :mail)"
    );
    $consulta->execute([
        ":nombre"   => $cuerpo["nombre"],
        ":contacto" => $cuerpo["contacto"],
        ":mail"     => $cuerpo["mail"]
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true, 
        "id_proveedor" => (int)$conexion->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// GET: Listar todos los proveedores
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM proveedor");
    $proveedores = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($proveedores, JSON_UNESCAPED_UNICODE);
    exit();
}
?>