<?php

function exigirUsuarioFirebase(): array
{
    $encabezados = function_exists('getallheaders') ? getallheaders() : [];

    $autorizacion =
        $encabezados['Authorization']
        ?? $encabezados['authorization']
        ?? $_SERVER['HTTP_AUTHORIZATION']
        ?? '';

    if (!preg_match('/Bearer\s+(\S+)/i', $autorizacion, $coincidencias)) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Falta el token de inicio de sesión.']);
        exit;
    }

    $token = $coincidencias[1];

    // En el siguiente paso pondremos aquí la API key de Firebase.
    $apiKey = 'AIzaSyAyxPDyIX2u9N5IjibocSidzNh-rNKNMZ0';

    $url = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='
        . urlencode($apiKey);

    $conexion = curl_init($url);

    curl_setopt_array($conexion, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['idToken' => $token]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);

    $respuesta = curl_exec($conexion);
    $estadoHttp = curl_getinfo($conexion, CURLINFO_HTTP_CODE);
    curl_close($conexion);

    $datos = is_string($respuesta) ? json_decode($respuesta, true) : null;

    if (
        $estadoHttp !== 200
        || empty($datos['users'][0]['localId'])
    ) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'La sesión no es válida o venció.']);
        exit;
    }

    return $datos['users'][0];
}