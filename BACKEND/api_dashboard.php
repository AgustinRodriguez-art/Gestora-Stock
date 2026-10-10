<?php
require_once 'conexion.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // 1. Total ventas del mes actual
        $stmtMes = $pdo->query("SELECT SUM(total_pedido) AS total_mes FROM Pedido WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())");
        $montoMes = $stmtMes->fetch()['total_mes'] ?? 0;

        // 2. Total ventas del año actual
        $stmtAnio = $pdo->query("SELECT SUM(total_pedido) AS total_anio FROM Pedido WHERE YEAR(fecha) = YEAR(CURRENT_DATE())");
        $montoAnio = $stmtAnio->fetch()['total_anio'] ?? 0;

        // 3. Lista de productos con stock bajo
        $stmtBajo = $pdo->query("SELECT * FROM Producto WHERE stock <= 5");
        $stockBajo = $stmtBajo->fetchAll();

        // 4. Top 5 productos más vendidos
        $stmtTop = $pdo->query("
            SELECT p.nombre, SUM(pp.cantidad) AS total_vendido 
            FROM Producto_pedido pp 
            JOIN Producto p ON pp.id_producto = p.id_producto 
            GROUP BY pp.id_producto 
            ORDER BY total_vendido DESC 
            LIMIT 5
        ");
        $topProductos = $stmtTop->fetchAll();

        echo json_encode([
            "success" => true,
            "monto_mes" => $montoMes,
            "monto_anio" => $montoAnio,
            "stock_bajo" => $stockBajo,
            "top_productos" => $topProductos
        ]);

    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>