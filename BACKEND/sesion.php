<?php

if (session_status() !== PHP_SESSION_ACTIVE) {
    $usaHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $usaHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

function exigirSesion(): void
{
    if (empty($_SESSION['usuario_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Debes iniciar sesión para usar esta función.']);
        exit;
    }
}
