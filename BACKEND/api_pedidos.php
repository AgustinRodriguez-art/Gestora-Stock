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

 //  POST - Registrar pedido y descontar stock
  
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true); //[cite: 5]

    if (
        !isset($cuerpo["id_cliente"]) ||
        !isset($cuerpo["productos"]) ||
        empty($cuerpo["productos"])
    ) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan datos del pedido o el carrito esta vacio"]);
        exit();
    }

    try {
        // Inicia una transaccion: si algo falla, no se guarda nada a medias
        $conexion->beginTransaction();

        $idCliente = $cuerpo["id_cliente"];
        $productos = $cuerpo["productos"];
        $totalPedido = 0;

        // Suma el precio de cada item para calcular el total
        foreach ($productos as $item) {
            $totalPedido += ($item["cantidad"] * $item["precio_unitario"]);
        }

        // 1. Guarda la cabecera principal del pedido
        $stmtPedido = $conexion->prepare(
            "INSERT INTO pedido (id_cliente, total_pedido) VALUES (:id_cliente, :total_pedido)"
        );
        $stmtPedido->execute([
            ":id_cliente"   => $idCliente,
            ":total_pedido" => $totalPedido
        ]);
        $idPedido = $conexion->lastInsertId(); //[cite: 5]

        // 2. Guarda cada producto en el detalle y descuenta el stock
        foreach ($productos as $item) {
            $stmtDetalle = $conexion->prepare(
                "INSERT INTO producto_pedido (id_pedido, id_producto, cantidad, precio_unitario)
                 VALUES (:id_pedido, :id_producto, :cantidad, :precio_unitario)"
            );
            $stmtDetalle->execute([
                ":id_pedido"       => $idPedido,
                ":id_producto"     => $item["id_producto"],
                ":cantidad"        => $item["cantidad"],
                ":precio_unitario" => $item["precio_unitario"]
            ]);

            // Resta la cantidad vendida al stock del producto
            $stmtStock = $conexion->prepare(
                "UPDATE producto SET stock = stock - :cantidad WHERE id_producto = :id_producto"
            );
            $stmtStock->execute([
                ":cantidad"    => $item["cantidad"],
                ":id_producto" => $item["id_producto"]
            ]);
        }

        // Confirma que todo salio bien en la base de datos
        $conexion->commit();
        http_response_code(201);
        echo json_encode([
            "success"   => true,
            "id_pedido" => (int)$idPedido,
            "total"     => $totalPedido
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        // Si ocurre un error, deshace todos los cambios realizados
        $conexion->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }

    exit();
}

 //  GET - Listar pedidos realizados
   
if ($metodo === "GET") {
    // Une la tabla de pedidos con clientes para mostrar nombres claros
    $consulta = $conexion->query(
        "SELECT p.*, c.nombre_cliente 
         FROM pedido p 
         JOIN clientes c ON p.id_cliente = c.id_cliente"
    );
    $pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC); //[cite: 5]

    echo json_encode($pedidos, JSON_UNESCAPED_UNICODE); //[cite: 5]
    exit();
}
?>