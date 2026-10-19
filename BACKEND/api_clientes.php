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

function responderClientes($estado, $datos = []): void
{
    http_response_code($estado);

    if ($estado !== 204) {
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    }

    exit();
}

function validarIdCliente($valor)
{
    $id = filter_var($valor, FILTER_VALIDATE_INT);
    return ($id !== false && $id > 0) ? $id : false;
}

$metodo = $_SERVER["REQUEST_METHOD"];

try {
    if ($metodo === "GET") {
        $consulta = $conexion->query(
            "SELECT * FROM clientes ORDER BY id_cliente"
        );
        responderClientes(200, $consulta->fetchAll(PDO::FETCH_ASSOC));
    }

    if ($metodo === "POST" || $metodo === "PUT") {
        $esEdicion = $metodo === "PUT";

        if ($esEdicion) {
            if (!isset($_GET["id"])) {
                responderClientes(400, ["error" => "Falta el ID del cliente"]);
            }

            $id = validarIdCliente($_GET["id"]);
            if ($id === false) {
                responderClientes(422, ["error" => "El ID del cliente no es válido"]);
            }
        }

        $datos = json_decode(file_get_contents("php://input"), true);

        if (
            !is_array($datos) ||
            !isset($datos["nombre_cliente"], $datos["direccion"], $datos["telefono"]) ||
            !is_string($datos["nombre_cliente"]) ||
            !is_string($datos["direccion"]) ||
            !is_string($datos["telefono"])
        ) {
            responderClientes(400, ["error" => "Faltan datos válidos del cliente"]);
        }

        $nombre = trim($datos["nombre_cliente"]);
        $direccion = trim($datos["direccion"]);
        $telefono = trim($datos["telefono"]);

        if (
            $nombre === "" || mb_strlen($nombre) > 150 ||
            $direccion === "" || mb_strlen($direccion) > 255 ||
            $telefono === "" || mb_strlen($telefono) > 50
        ) {
            responderClientes(422, [
                "error" => "Revisá nombre, dirección y teléfono"
            ]);
        }

        if ($esEdicion) {
            $buscar = $conexion->prepare(
                "SELECT id_cliente FROM clientes WHERE id_cliente = :id"
            );
            $buscar->execute([":id" => $id]);

            if (!$buscar->fetch(PDO::FETCH_ASSOC)) {
                responderClientes(404, ["error" => "No se encontró el cliente"]);
            }

            $consulta = $conexion->prepare(
                "UPDATE clientes
                 SET nombre_cliente = :nombre,
                     direccion = :direccion,
                     telefono = :telefono
                 WHERE id_cliente = :id"
            );
            $consulta->execute([
                ":nombre" => $nombre,
                ":direccion" => $direccion,
                ":telefono" => $telefono,
                ":id" => $id
            ]);

            responderClientes(200, [
                "success" => true,
                "id_cliente" => $id,
                "nombre_cliente" => $nombre,
                "direccion" => $direccion,
                "telefono" => $telefono
            ]);
        }

        $consulta = $conexion->prepare(
            "INSERT INTO clientes (nombre_cliente, direccion, telefono)
             VALUES (:nombre, :direccion, :telefono)"
        );
        $consulta->execute([
            ":nombre" => $nombre,
            ":direccion" => $direccion,
            ":telefono" => $telefono
        ]);

        responderClientes(201, [
            "success" => true,
            "id_cliente" => (int)$conexion->lastInsertId()
        ]);
    }

    if ($metodo === "DELETE") {
        if (!isset($_GET["id"])) {
            responderClientes(400, ["error" => "Falta el ID del cliente"]);
        }

        $id = validarIdCliente($_GET["id"]);
        if ($id === false) {
            responderClientes(422, ["error" => "El ID del cliente no es válido"]);
        }

        $consulta = $conexion->prepare(
            "DELETE FROM clientes WHERE id_cliente = :id"
        );
        $consulta->execute([":id" => $id]);

        if ($consulta->rowCount() === 0) {
            responderClientes(404, ["error" => "No se encontró el cliente"]);
        }

        responderClientes(204);
    }

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");
    responderClientes(405, ["error" => "Método no permitido"]);
} catch (Throwable $error) {
    error_log("Error en api_clientes.php: " . $error->getMessage());
    responderClientes(500, ["error" => "Error interno del servidor"]);
}
?>