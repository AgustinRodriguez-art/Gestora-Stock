<?php
require "sesion.php";

header("Content-Type: application/json; charset=utf-8");

iniciarSesion();

echo json_encode([
    "logueado" => ($_SESSION["logueado"] ?? false) === true
]);