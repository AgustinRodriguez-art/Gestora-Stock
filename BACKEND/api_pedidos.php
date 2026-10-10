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

// POST: Registrar un pedido y descontar stock con transaccion
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true);

    if (!isset($cuerpo["id_cliente"], $cuerpo["productos"]) || empty($cuerpo["productos"])) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos del pedido o el carrito esta vacio"]);
        exit();
    }

    try {
        $conexion->beginTransaction();

        $id_cliente = $cuerpo["id_cliente"];
        $productos = $cuerpo["productos"];
        $total_pedido = 0;

        foreach ($productos as $item) {
            $total_pedido += ($item["cantidad"] * $item["precio_unitario"]);
        }

        // 1. Insertar cabecera del pedido
        $stmtPedido = $conexion->prepare("INSERT INTO pedido (id_cliente, total_pedido) VALUES (:id_cliente, :total_pedido)");
        $stmtPedido->execute([
            ":id_cliente"   => $id_cliente,
            ":total_pedido" => $total_pedido
        ]);
        $id_pedido = $conexion->lastInsertId();

        // 2. Insertar detalle y actualizar stock
        foreach ($productos as $item) {
            $stmtDetalle = $conexion->prepare(
                "INSERT INTO producto_pedido (id_pedido, id_producto, cantidad, precio_unitario) 
                 VALUES (:id_pedido, :id_producto, :cantidad, :precio_unitario)"
            );
            $stmtDetalle->execute([
                ":id_pedido"       => $id_pedido,
                ":id_producto"     => $item["id_producto"],
                ":cantidad"        => $item["cantidad"],
                ":precio_unitario" => $item["precio_unitario"]
            ]);

            $stmtStock = $conexion->prepare("UPDATE producto SET stock = stock - :cantidad WHERE id_producto = :id_producto");
            $stmtStock->execute([
                ":cantidad"    => $item["cantidad"],
                ":id_producto" => $item["id_producto"]
            ]);
        }

        $conexion->commit();
        http_response_code(201);
        echo json_encode([
            "success"   => true,
            "id_pedido" => (int)$id_pedido,
            "total"     => $total_pedido
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        $conexion->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

// GET: Listar todos los pedidos con nombre de cliente
if ($metodo === "GET") {
    $consulta = $conexion->query(
        "SELECT p.*, c.nombre_cliente 
         FROM pedido p 
         JOIN clientes c ON p.id_cliente = c.id_cliente"
    );
    $pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($pedidos, JSON_UNESCAPED_UNICODE);
    exit();
}
?>