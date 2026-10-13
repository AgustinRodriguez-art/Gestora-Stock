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

$metodo = $_SERVER["REQUEST_METHOD"];

// Si es POST, registramos un nuevo proveedor
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

// Si es GET, consultamos todos los proveedores cargados
if ($metodo === "GET") {
    $consulta = $conexion->query("SELECT * FROM proveedor");
    $proveedores = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($proveedores, JSON_UNESCAPED_UNICODE);
    exit();
}




/* PUT - Editar proveedor */
if ($metodo === "PUT") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del proveedor"]);
        exit();
    }

    $cuerpo = json_decode(file_get_contents("php://input"), true);

    if (!isset($cuerpo["nombre"]) || !isset($cuerpo["contacto"]) || !isset($cuerpo["mail"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos obligatorios del proveedor"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "UPDATE proveedor
         SET nombre = :nombre,
             contacto = :contacto,
             mail = :mail
         WHERE id_proveedor = :id"
    );

    $consulta->execute([
        ":nombre"   => $cuerpo["nombre"],
        ":contacto" => $cuerpo["contacto"],
        ":mail"     => $cuerpo["mail"],
        ":id"       => $_GET["id"]
    ]);

    http_response_code(200);
    echo json_encode([
        "success"      => true,
        "id_proveedor" => (int)$_GET["id"],
        "nombre"       => $cuerpo["nombre"],
        "contacto"     => $cuerpo["contacto"],
        "mail"         => $cuerpo["mail"]
    ], JSON_UNESCAPED_UNICODE);

    exit();
}

/* DELETE - Borrar proveedor  */
if ($metodo === "DELETE") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el id del proveedor"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "DELETE FROM proveedor
         WHERE id_proveedor = :id"
    );

    $consulta->execute([
        ":id" => $_GET["id"]
    ]);

    http_response_code(204);
    exit();
}







?>