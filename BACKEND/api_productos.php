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

    $nombre = trim((string)$cuerpo["nombre"]);
    $categoria = trim((string)$cuerpo["categoria"]);
    $precioCompra = $cuerpo["precio_compra"] ?? 0;
    $precioVenta = $cuerpo["precio_venta"];
    $stock = $cuerpo["stock"];

    if (
        $nombre === "" ||
        mb_strlen($nombre) > 150 ||
        $categoria === "" ||
        mb_strlen($categoria) > 100 ||
        !is_numeric($precioCompra) ||
        !is_numeric($precioVenta) ||
        (float)$precioCompra < 0 ||
        (float)$precioVenta < 0 ||
        (float)$precioCompra > 99999999.99 ||
        (float)$precioVenta > 99999999.99 ||
        filter_var($stock, FILTER_VALIDATE_INT) === false ||
        (int)$stock < 0
    ) {
        http_response_code(422);
        echo json_encode(["error" => "Revisa el nombre, la categoria, los precios y el stock"]);
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
        ":nombre"        => $nombre,
        ":precio_compra" => $precioCompra,
        ":precio_venta"  => $precioVenta,
        ":categoria"     => $categoria,
        ":stock"         => $stock
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
    $id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        http_response_code(422);
        echo json_encode(["error" => "El id del producto debe ser un número válido"]);
        exit();
    }

    $consulta = $conexion->prepare(
        "DELETE FROM producto WHERE id_producto = :id"
    );

    $consulta->execute([":id" => $id]);

    if ($consulta->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(["error" => "No se encontró el producto"]);
        exit();
    }

    http_response_code(204);
    exit();
}







?>
