<?php
// Importamos la conexion a la base de datos
require "conexion.php";

// Configuramos las cabeceras para permitir peticiones del navegador (CORS) y respuestas JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Respondemos inmediatamente si el navegador consulta las opciones previas de conexion
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

$metodo = $_SERVER["REQUEST_METHOD"];

// Si mandan datos por POST, registramos un nuevo cliente
if ($metodo === "POST") {
    // Leemos el cuerpo JSON enviado desde el formulario del frontend
    $cuerpo = json_decode(file_get_contents("php://input"), true);

    // Validamos que vengan los campos indispensables
    if (!isset($cuerpo["nombre_cliente"], $cuerpo["direccion"], $cuerpo["telefono"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos del cliente"]);
        exit();
    }

    // Consulta para evitar inyecciones SQL
    $consulta = $conexion->prepare(
        "INSERT INTO clientes (nombre_cliente, direccion, telefono) 
         VALUES (:nombre_cliente, :direccion, :telefono)"
    );
    $consulta->execute([
        ":nombre_cliente" => $cuerpo["nombre_cliente"],
        ":direccion"      => $cuerpo["direccion"],
        ":telefono"       => $cuerpo["telefono"]
    ]);

    // Devolvemos un codigo 201 indicando que se creo correctamente y el ID generado
    http_response_code(201);
    echo json_encode([
        "success" => true, 
        "id_cliente" => (int)$conexion->lastInsertId()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// Si piden los datos por GET, listamos todos los clientes guardados
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM clientes");
    $clientes = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($clientes, JSON_UNESCAPED_UNICODE);
    exit();
}
?>