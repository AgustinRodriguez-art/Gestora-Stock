<?php
require "conexion.php";

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        // Ventas del mes actual
        $stmtMes = $conexion->query("SELECT SUM(total_pedido) AS total_mes FROM pedido WHERE MONTH(fecha) = MONTH(CURRENT_DATE()) AND YEAR(fecha) = YEAR(CURRENT_DATE())");
        $montoMes = $stmtMes->fetch(PDO::FETCH_ASSOC)['total_mes'] ?? 0;

        // Ventas del ano actual
        $stmtAnio = $conexion->query("SELECT SUM(total_pedido) AS total_anio FROM pedido WHERE YEAR(fecha) = YEAR(CURRENT_DATE())");
        $montoAnio = $stmtAnio->fetch(PDO::FETCH_ASSOC)['total_anio'] ?? 0;

        // Productos con stock bajo (menor o igual a 5)
        $stmtBajo = $conexion->query("SELECT * FROM producto WHERE stock <= 5");
        $stockBajo = $stmtBajo->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success"     => true,
            "monto_mes"   => (float)$montoMes,
            "monto_anual" => (float)$montoAnio,
            "stock_bajo"  => $stockBajo
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    }
    exit();
}
?>