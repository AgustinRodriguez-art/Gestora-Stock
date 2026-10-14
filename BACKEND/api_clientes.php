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






/* PUT - Editar cliente */
if ($metodo === "PUT") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del cliente"]);
        exit();
    }

    $cuerpo = json_decode(file_get_contents("php://input"), true);

    if (!isset($cuerpo["nombre_cliente"]) || !isset($cuerpo["direccion"]) || !isset($cuerpo["telefono"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos obligatorios del cliente"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "UPDATE clientes
         SET nombre_cliente = :nombre_cliente,
             direccion = :direccion,
             telefono = :telefono
         WHERE id_cliente = :id"
    );

    $consulta->execute([
        ":nombre_cliente" => $cuerpo["nombre_cliente"],
        ":direccion"      => $cuerpo["direccion"],
        ":telefono"       => $cuerpo["telefono"],
        ":id"             => $_GET["id"]
    ]);

    http_response_code(200);
    echo json_encode([
        "success"        => true,
        "id_cliente"     => (int)$_GET["id"],
        "nombre_cliente" => $cuerpo["nombre_cliente"],
        "direccion"      => $cuerpo["direccion"],
        "telefono"       => $cuerpo["telefono"]
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

/* DELETE - Borrar cliente */
if ($metodo === "DELETE") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del cliente"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "DELETE FROM clientes
         WHERE id_cliente = :id"
    );

    $consulta->execute([
        ":id" => $_GET["id"]
    ]);

    http_response_code(204);
    exit();
}






?>
