<?php
require_once 'conexion.php';
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT p.*, pr.nombre AS proveedor_nombre FROM Producto p LEFT JOIN Proveedor pr ON p.id_proveedor = pr.id_proveedor");
            $productos = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $productos]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['nombre'], $data['precio_venta'], $data['categoria'], $data['stock'])) {
            echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
            break;
        }

        try {
            $sql = "INSERT INTO Producto (nombre, precio_compra, precio_venta, categoria, stock, imagen_url, id_proveedor) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['nombre'],
                $data['precio_compra'] ?? 0,
                $data['precio_venta'],
                $data['categoria'],
                $data['stock'],
                $data['imagen_url'] ?? null,
                $data['id_proveedor'] ?? null
            ]);
            echo json_encode(["success" => true, "message" => "Producto creado correctamente"]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;
}
?>