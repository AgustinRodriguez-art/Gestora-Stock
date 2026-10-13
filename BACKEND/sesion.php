<?php

function iniciarSesion(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            "path" => "/",
            "httponly" => true,
            "samesite" => "Lax",
            "secure" => false
        ]);

        session_start();
    }
}


function exigirSesion(): void
{
    iniciarSesion();

    if (($_SESSION["logueado"] ?? false) !== true) {
        http_response_code(401);
        header("Content-Type: application/json; charset=utf-8");
        echo json_encode(["error" => "Se requiere un inicio de sesion"]);
        exit();
    }
}