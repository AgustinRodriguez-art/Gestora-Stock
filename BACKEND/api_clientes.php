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


 //  POST - Registrar cliente nuevo

if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true);
    if (
        !isset($cuerpo["nombre_cliente"]) ||
        !isset($cuerpo["direccion"]) ||
        !isset($cuerpo["telefono"])
    ) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos del cliente"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "INSERT INTO clientes (nombre_cliente, direccion, telefono)
         VALUES (:nombre_cliente, :direccion, :telefono)"
    );

    $consulta->execute([
        ":nombre_cliente" => $cuerpo["nombre_cliente"],
        ":direccion"      => $cuerpo["direccion"],
        ":telefono"       => $cuerpo["telefono"]
    ]);

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "id_cliente" => (int)$conexion->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

//GET - Listar clientes

if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM clientes"); 
    $clientes = $consulta->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($clientes, JSON_UNESCAPED_UNICODE);
    exit();
}
?>