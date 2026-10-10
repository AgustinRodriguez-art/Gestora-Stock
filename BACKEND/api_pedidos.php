<?php
require_once 'conexion.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['id_cliente'], $data['productos']) || empty($data['productos'])) {
        echo json_encode(["success" => false, "error" => "Datos de pedido incompletos"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $id_cliente = $data['id_cliente'];
        $productos = $data['productos']; // Array con [id_producto, cantidad, precio_unitario]
        $total_pedido = 0;

        foreach ($productos as $item) {
            $total_pedido += ($item['cantidad'] * $item['precio_unitario']);
        }

        // 1. Insertar Cabecera del Pedido
        $stmtPedido = $pdo->prepare("INSERT INTO Pedido (id_cliente, total_pedido) VALUES (?, ?)");
        $stmtPedido->execute([$id_cliente, $total_pedido]);
        $id_pedido = $pdo->lastInsertId();

        // 2. Insertar Detalle y Actualizar Stock
        $productosStockBajo = [];

        foreach ($productos as $item) {
            $id_prod = $item['id_producto'];
            $cant = $item['cantidad'];
            $precio = $item['precio_unitario'];

            // Insertar en Producto_pedido
            $stmtDetalle = $pdo->prepare("INSERT INTO Producto_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
            $stmtDetalle->execute([$id_pedido, $id_prod, $cant, $precio]);

            // Actualizar stock de la tabla Producto
            $stmtStock = $pdo->prepare("UPDATE Producto SET stock = stock - ? WHERE id_producto = ?");
            $stmtStock->execute([$cant, $id_prod]);

            // Verificar si el stock quedó igual o menor a 5 para generar alerta
            $stmtCheck = $pdo->prepare("SELECT nombre, stock FROM Producto WHERE id_producto = ?");
            $stmtCheck->execute([$id_prod]);
            $prodInfo = $stmtCheck->fetch();

            if ($prodInfo && $prodInfo['stock'] <= 5) {
                $productosStockBajo[] = $prodInfo['nombre'] . " (Stock restante: " . $prodInfo['stock'] . ")";
            }
        }

        $pdo->commit();

        // 3. Integración de la API Externa de Correo (Resend) por Stock Bajo
        if (!empty($productosStockBajo)) {
            enviarAlertaStockBajo($productosStockBajo);
        }

        echo json_encode(["success" => true, "message" => "Pedido registrado con éxito", "id_pedido" => $id_pedido]);

    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}

function enviarAlertaStockBajo($productos) {
    $apiKey = 're_123456789'; // Reemplazar con su API Key real de Resend
    $mensaje = "Atención Administrador:\n\nLos siguientes productos han alcanzado un nivel crítico de stock:\n\n" . implode("\n", $productos);

    $payload = [
        'from' => 'inventario@tu-dominio.com',
        'to' => 'admin@consultorastock.com',
        'subject' => '⚠️ Alerta Crítica: Stock Bajo en Sistema',
        'text' => $mensaje
    ];

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    
    curl_exec($ch);
    curl_close($ch);
}
?>