<?php
require "conexion.php";

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";
$origenesPermitidos = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: " . $origen);
    header("Vary: Origin");
}

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/firebase_auth.php";
exigirUsuarioFirebase();

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    try {
        $resumenStock = $conexion->query(
            "SELECT COALESCE(SUM(stock), 0) AS total_unidades,
                    COALESCE(
                        SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END),
                        0
                    ) AS productos_disponibles
             FROM producto"
        )->fetch(PDO::FETCH_ASSOC);

        $totalClientes = (int)$conexion
            ->query("SELECT COUNT(*) FROM clientes")
            ->fetchColumn();

        $totalProveedores = (int)$conexion
            ->query("SELECT COUNT(*) FROM proveedor")
            ->fetchColumn();

        $stmtMes = $conexion->query(
            "SELECT SUM(total_pedido) AS total_mes
             FROM pedido
             WHERE MONTH(fecha) = MONTH(CURRENT_DATE())
               AND YEAR(fecha) = YEAR(CURRENT_DATE())"
        );
        $montoMes = $stmtMes->fetch(PDO::FETCH_ASSOC)["total_mes"] ?? 0;

        $stmtAnio = $conexion->query(
            "SELECT SUM(total_pedido) AS total_anio
             FROM pedido
             WHERE YEAR(fecha) = YEAR(CURRENT_DATE())"
        );
        $montoAnio = $stmtAnio->fetch(PDO::FETCH_ASSOC)["total_anio"] ?? 0;

        $stmtBajo = $conexion->query(
            "SELECT * FROM producto WHERE stock <= 5"
        );
        $stockBajo = $stmtBajo->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "monto_mes" => (float)$montoMes,
            "monto_anual" => (float)$montoAnio,
            "stock_bajo" => $stockBajo,
            "total_unidades" => (int)$resumenStock["total_unidades"],
            "productos_disponibles" =>
                (int)$resumenStock["productos_disponibles"],
            "total_clientes" => $totalClientes,
            "total_proveedores" => $totalProveedores
        ], JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        error_log("Error al generar el dashboard: " . $e->getMessage());

        http_response_code(500);
        echo json_encode(
            ["error" => "No se pudo cargar el panel. Intentá nuevamente."],
            JSON_UNESCAPED_UNICODE
        );
    }

    exit();
}

header("Allow: GET, OPTIONS");
http_response_code(405);
echo json_encode(
    ["error" => "Método no permitido"],
    JSON_UNESCAPED_UNICODE
);
exit();
?>