<?php
require_once __DIR__ . '/sesion.php';
header('Content-Type: application/json; charset=utf-8');

$_SESSION = [];

if (ini_get('session.use_cookies')) {
    $parametros = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $parametros['path'],
        'domain' => $parametros['domain'],
        'secure' => $parametros['secure'],
        'httponly' => $parametros['httponly'],
        'samesite' => 'Lax'
    ]);
}

session_destroy();
echo json_encode(['success' => true]);
