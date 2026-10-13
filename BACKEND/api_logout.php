<?php
require "sesion.php";

header("Content-Type: application/json; charset=utf-8");

iniciarSesion();
$_SESSION = [];
session_destroy();

echo json_encode(["success" => true]);