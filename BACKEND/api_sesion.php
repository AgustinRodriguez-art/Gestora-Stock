<?php
require_once __DIR__ . '/sesion.php';
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'logueado' => !empty($_SESSION['usuario_id']),
    'usuario' => $_SESSION['nombre_usuario'] ?? null
], JSON_UNESCAPED_UNICODE);
?>