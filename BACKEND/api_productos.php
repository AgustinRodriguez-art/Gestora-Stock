<?php
require_once __DIR__ . "/conexion.php";

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";
$origenesPermitidos = [
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: $origen");
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

function responder(int $estado, array $datos): void
{
    http_response_code($estado);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit();
}

function proveedorExiste(PDO $conexion, int $idProveedor): bool
{
    $consulta = $conexion->prepare(
        "SELECT id_proveedor FROM proveedor WHERE id_proveedor = :id"
    );
    $consulta->execute([":id" => $idProveedor]);

    return (bool)$consulta->fetch(PDO::FETCH_ASSOC);
}

$metodo = $_SERVER["REQUEST_METHOD"];

try {
    if ($metodo === "GET") {
        $consulta = $conexion->query(
            "SELECT * FROM producto ORDER BY id_producto"
        );

        echo json_encode(
            $consulta->fetchAll(PDO::FETCH_ASSOC),
            JSON_UNESCAPED_UNICODE
        );
        exit();
    }

    if ($metodo === "POST") {
        $datos = json_decode(file_get_contents("php://input"), true);

        if (
            !is_array($datos) ||
            !isset(
                $datos["nombre"],
                $datos["precio_venta"],
                $datos["categoria"],
                $datos["stock"],
                $datos["id_proveedor"]
            )
        ) {
            responder(400, ["error" => "Faltan datos obligatorios del producto"]);
        }

        $nombre = trim((string)$datos["nombre"]);
        $categoria = trim((string)$datos["categoria"]);
        $precioCompra = $datos["precio_compra"] ?? 0;
        $precioVenta = $datos["precio_venta"];
        $stock = filter_var($datos["stock"], FILTER_VALIDATE_INT);
        $idProveedor = filter_var($datos["id_proveedor"], FILTER_VALIDATE_INT);

        if (
            $nombre === "" ||
            mb_strlen($nombre) > 150 ||
            $categoria === "" ||
            mb_strlen($categoria) > 100 ||
            !is_numeric($precioCompra) ||
            !is_numeric($precioVenta) ||
            (float)$precioCompra < 0 ||
            (float)$precioVenta < 0 ||
            (float)$precioCompra > 99999999.99 ||
            (float)$precioVenta > 99999999.99 ||
            $stock === false ||
            $stock < 0 ||
            $idProveedor === false ||
            $idProveedor < 1
        ) {
            responder(422, ["error" => "Revisá el nombre, categoría, precios, stock y proveedor"]);
        }

        if (!proveedorExiste($conexion, $idProveedor)) {
            responder(422, ["error" => "No existe ese proveedor"]);
        }

        $consulta = $conexion->prepare(
            "INSERT INTO producto
                (nombre, precio_compra, precio_venta, categoria, stock, id_proveedor)
             VALUES
                (:nombre, :precio_compra, :precio_venta, :categoria, :stock, :id_proveedor)"
        );

        $consulta->execute([
            ":nombre" => $nombre,
            ":precio_compra" => (float)$precioCompra,
            ":precio_venta" => (float)$precioVenta,
            ":categoria" => $categoria,
            ":stock" => $stock,
            ":id_proveedor" => $idProveedor
        ]);

        responder(201, [
            "success" => true,
            "id_producto" => (int)$conexion->lastInsertId()
        ]);
    }

    if ($metodo === "PUT") {
        if (!isset($_GET["id"])) {
            responder(400, ["error" => "Falta el id del producto"]);
        }

        $id = filter_var($_GET["id"], FILTER_VALIDATE_INT);

        if ($id === false || $id < 1) {
            responder(422, ["error" => "El id del producto debe ser válido"]);
        }

        $datos = json_decode(file_get_contents("php://input"), true);

        if (
            !is_array($datos) ||
            !isset(
                $datos["nombre"],
                $datos["precio_venta"],
                $datos["stock"],
                $datos["id_proveedor"]
            )
        ) {
            responder(400, ["error" => "Faltan nombre, precio, stock o proveedor"]);
        }

        $nombre = trim((string)$datos["nombre"]);
        $precioVenta = $datos["precio_venta"];
        $stock = filter_var($datos["stock"], FILTER_VALIDATE_INT);
        $idProveedor = filter_var($datos["id_proveedor"], FILTER_VALIDATE_INT);

        if (
            $nombre === "" ||
            mb_strlen($nombre) > 150 ||
            !is_numeric($precioVenta) ||
            (float)$precioVenta < 0 ||
            (float)$precioVenta > 99999999.99 ||
            $stock === false ||
            $stock < 0 ||
            $idProveedor === false ||
            $idProveedor < 1
        ) {
            responder(422, ["error" => "Revisá el nombre, precio, stock e ID de proveedor"]);
        }

        $buscarProducto = $conexion->prepare(
            "SELECT id_producto FROM producto WHERE id_producto = :id"
        );
        $buscarProducto->execute([":id" => $id]);

        if (!$buscarProducto->fetch(PDO::FETCH_ASSOC)) {
            responder(404, ["error" => "No se encontró el producto"]);
        }

        if (!proveedorExiste($conexion, $idProveedor)) {
            responder(422, ["error" => "No existe ese proveedor"]);
        }

        $consulta = $conexion->prepare(
            "UPDATE producto
             SET nombre = :nombre,
                 precio_venta = :precio_venta,
                 stock = :stock,
                 id_proveedor = :id_proveedor
             WHERE id_producto = :id"
        );

        $consulta->execute([
            ":nombre" => $nombre,
            ":precio_venta" => (float)$precioVenta,
            ":stock" => $stock,
            ":id_proveedor" => $idProveedor,
            ":id" => $id
        ]);

        responder(200, [
            "success" => true,
            "id_producto" => $id,
            "nombre" => $nombre,
            "precio_venta" => (float)$precioVenta,
            "stock" => $stock,
            "id_proveedor" => $idProveedor
        ]);
    }

    if ($metodo === "DELETE") {
        if (!isset($_GET["id"])) {
            responder(400, ["error" => "Falta el id del producto"]);
        }

        $id = filter_var($_GET["id"], FILTER_VALIDATE_INT);

        if ($id === false || $id < 1) {
            responder(422, ["error" => "El id del producto debe ser válido"]);
        }

        $consulta = $conexion->prepare(
            "DELETE FROM producto WHERE id_producto = :id"
        );
        $consulta->execute([":id" => $id]);

        if ($consulta->rowCount() === 0) {
            responder(404, ["error" => "No se encontró el producto"]);
        }

        http_response_code(204);
        exit();
    }

    responder(405, ["error" => "Método no permitido"]);
} catch (PDOException $error) {
    error_log("Error en api_productos.php: " . $error->getMessage());
    responder(500, ["error" => "Ocurrió un error en la base de datos"]);
}
?>