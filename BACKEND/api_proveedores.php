<?php
require_once __DIR__ . "/conexion.php";

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
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/firebase_auth.php";
exigirUsuarioFirebase();

function responderProveedores($estado, $datos = []): void
{
    http_response_code($estado);

    if ($estado !== 204) {
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    }

    exit();
}

function validarIdProveedor($valor)
{
    $id = filter_var($valor, FILTER_VALIDATE_INT);
    return ($id !== false && $id > 0) ? $id : false;
}

$metodo = $_SERVER["REQUEST_METHOD"];

try {
    if ($metodo === "GET") {
        $consulta = $conexion->query(
            "SELECT * FROM proveedor ORDER BY id_proveedor"
        );
        responderProveedores(200, $consulta->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($metodo === "POST" || $metodo === "PUT") {
        $esEdicion = $metodo === "PUT";

        if ($esEdicion) {
            if (!isset($_GET["id"])) {
                responderProveedores(400, ["error" => "Falta el ID del proveedor"]);
            }

            $id = validarIdProveedor($_GET["id"]);
            if ($id === false) {
                responderProveedores(422, ["error" => "El ID del proveedor no es válido"]);
            }
        }

        $datos = json_decode(file_get_contents("php://input"), true);

        if (
            !is_array($datos) ||
            !isset($datos["nombre"], $datos["contacto"], $datos["mail"]) ||
            !is_string($datos["nombre"]) ||
            !is_string($datos["contacto"]) ||
            !is_string($datos["mail"])
        ) {
            responderProveedores(400, ["error" => "Faltan datos válidos del proveedor"]);
        }

        $nombre = trim($datos["nombre"]);
        $contacto = trim($datos["contacto"]);
        $mail = trim($datos["mail"]);

        if (
            $nombre === "" || mb_strlen($nombre) > 100 ||
            $contacto === "" || mb_strlen($contacto) > 100 ||
            mb_strlen($mail) > 100 ||
            !filter_var($mail, FILTER_VALIDATE_EMAIL)
        ) {
            responderProveedores(422, [
                "error" => "Revisá nombre, contacto y correo"
            ]);
        }

        if ($esEdicion) {
            $buscar = $conexion->prepare(
                "SELECT id_proveedor FROM proveedor WHERE id_proveedor = :id"
            );
            $buscar->execute([":id" => $id]);

            if (!$buscar->fetch(PDO::FETCH_ASSOC)) {
                responderProveedores(404, ["error" => "No se encontró el proveedor"]);
            }

            $consulta = $conexion->prepare(
                "UPDATE proveedor
                 SET nombre = :nombre,
                     contacto = :contacto,
                     mail = :mail
                 WHERE id_proveedor = :id"
            );
            $consulta->execute([
                ":nombre" => $nombre,
                ":contacto" => $contacto,
                ":mail" => $mail,
                ":id" => $id
            ]);

            responderProveedores(200, [
                "success" => true,
                "id_proveedor" => $id,
                "nombre" => $nombre,
                "contacto" => $contacto,
                "mail" => $mail
            ]);
        }

        $consulta = $conexion->prepare(
            "INSERT INTO proveedor (nombre, contacto, mail)
             VALUES (:nombre, :contacto, :mail)"
        );
        $consulta->execute([
            ":nombre" => $nombre,
            ":contacto" => $contacto,
            ":mail" => $mail
        ]);

        responderProveedores(201, [
            "success" => true,
            "id_proveedor" => (int)$conexion->lastInsertId()
        ]);
    }

    if ($metodo === "DELETE") {
        if (!isset($_GET["id"])) {
            responderProveedores(400, ["error" => "Falta el ID del proveedor"]);
        }

        $id = validarIdProveedor($_GET["id"]);
        if ($id === false) {
            responderProveedores(422, ["error" => "El ID del proveedor no es válido"]);
        }

        $consulta = $conexion->prepare(
            "DELETE FROM proveedor WHERE id_proveedor = :id"
        );
        $consulta->execute([":id" => $id]);

        if ($consulta->rowCount() === 0) {
            responderProveedores(404, ["error" => "No se encontró el proveedor"]);
        }

        responderProveedores(204);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    responderProveedores(405, ["error" => "Método no permitido"]);
} catch (Throwable $error) {
    error_log("Error en api_proveedores.php: " . $error->getMessage());
    responderProveedores(500, ["error" => "Error interno del servidor"]);
}
?>