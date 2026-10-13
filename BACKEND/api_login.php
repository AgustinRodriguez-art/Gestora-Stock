<?php

header("Content-Type: application/json; charset=utf-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Método invalido"]);
    exit();
}

require "conexion.php";
require "sesion.php";

$datos = json_decode(file_get_contents("php://input"), true);

$email = trim($datos["email"] ?? "");
$password = $datos["password"] ?? "";

if ($email === "" || $password === "") {
    http_response_code(400);
    echo json_encode(["error" => "Completar correctamente| email y contraseña"]);
    exit();
}

$consulta = $conexion->prepare(
    "SELECT id_usuario, email, password_hash
     FROM usuarios
     WHERE email = :email AND activo = 1"
);

$consulta->execute([":email" => $email]);
$usuario = $consulta->fetch(PDO::FETCH_ASSOC);

if (!$usuario || !password_verify($password, $usuario["password_hash"])) {
    http_response_code(401);
    echo json_encode(["error" => "Email o contraseña incorrectos"]);
    exit();
}

iniciarSesion();
session_regenerate_id(true);

$_SESSION["logueado"] = true;
$_SESSION["id_usuario"] = (int) $usuario["id_usuario"];
$_SESSION["email"] = $usuario["email"];

echo json_encode(["success" => true]); 