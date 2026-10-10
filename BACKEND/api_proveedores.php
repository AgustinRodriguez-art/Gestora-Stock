<?php
require "conexion.php"; //[cite: 5]

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$metodo = $_SERVER["REQUEST_METHOD"];


 //  POST - Registrar proveedor
  
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true); //[cite: 5]

    if (
        !isset($cuerpo["nombre"]) ||
        !isset($cuerpo["contacto"]) ||
        !isset($cuerpo["mail"])
    ) {
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
        "id_proveedor" => (int)$conexion->lastInsertId() //[cite: 5]
    ], JSON_UNESCAPED_UNICODE);

    exit();
}


//  GET - Listar proveedores
   
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM proveedor"); //[cite: 5]
    $proveedores = $consulta->fetchAll(PDO::FETCH_ASSOC); //[cite: 5]

    echo json_encode($proveedores, JSON_UNESCAPED_UNICODE); //[cite: 5]
    exit();
}
?>