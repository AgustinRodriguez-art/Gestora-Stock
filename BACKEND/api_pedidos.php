<?php
require "conexion.php";

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
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

require_once __DIR__ . "/firebase_auth.php";
require_once __DIR__ . "/resend.php";

$usuarioFirebase = exigirUsuarioFirebase();
$emailUsuario = (string)($usuarioFirebase["email"] ?? "");

$metodo = $_SERVER["REQUEST_METHOD"];

// POST: validar y registrar un pedido
if ($metodo === "POST") {
    $cuerpo = json_decode(file_get_contents("php://input"), true);

    if (
        !is_array($cuerpo) ||
        !isset($cuerpo["id_cliente"], $cuerpo["productos"]) ||
        !is_array($cuerpo["productos"]) ||
        count($cuerpo["productos"]) === 0
    ) {
        http_response_code(400);
        echo json_encode(
            ["error" => "Faltan datos o el carrito está vacío"],
            JSON_UNESCAPED_UNICODE
        );
        exit();
    }

    $idCliente = filter_var($cuerpo["id_cliente"], FILTER_VALIDATE_INT);

    if ($idCliente === false || $idCliente < 1) {
        http_response_code(422);
        echo json_encode(
            ["error" => "El cliente no es válido"],
            JSON_UNESCAPED_UNICODE
        );
        exit();
    }

    try {
        $conexion->beginTransaction();

        $stmtCliente = $conexion->prepare(
            "SELECT id_cliente
             FROM clientes
             WHERE id_cliente = :id"
        );
        $stmtCliente->execute([":id" => $idCliente]);

        if (!$stmtCliente->fetch(PDO::FETCH_ASSOC)) {
            $conexion->rollBack();
            http_response_code(404);
            echo json_encode(
                ["error" => "No existe el cliente"],
                JSON_UNESCAPED_UNICODE
            );
            exit();
        }

        $total = 0;
        $productosValidos = [];

        foreach ($cuerpo["productos"] as $item) {
            if (!is_array($item)) {
                $conexion->rollBack();
                http_response_code(422);
                echo json_encode(
                    ["error" => "El producto del pedido no es válido"],
                    JSON_UNESCAPED_UNICODE
                );
                exit();
            }

            $idProducto = filter_var(
                $item["id_producto"] ?? null,
                FILTER_VALIDATE_INT
            );
            $cantidad = filter_var(
                $item["cantidad"] ?? null,
                FILTER_VALIDATE_INT
            );

            if (
                $idProducto === false || $idProducto < 1 ||
                $cantidad === false || $cantidad < 1
            ) {
                $conexion->rollBack();
                http_response_code(422);
                echo json_encode(
                    ["error" => "El producto o la cantidad no son válidos"],
                    JSON_UNESCAPED_UNICODE
                );
                exit();
            }

            $stmtProducto = $conexion->prepare(
                "SELECT nombre, precio_venta, stock
                 FROM producto
                 WHERE id_producto = :id
                 FOR UPDATE"
            );
            $stmtProducto->execute([":id" => $idProducto]);
            $producto = $stmtProducto->fetch(PDO::FETCH_ASSOC);

            if (!$producto) {
                $conexion->rollBack();
                http_response_code(404);
                echo json_encode(
                    ["error" => "No existe el producto"],
                    JSON_UNESCAPED_UNICODE
                );
                exit();
            }

            if ((int)$producto["stock"] < $cantidad) {
                $conexion->rollBack();
                http_response_code(409);
                echo json_encode(
                    ["error" => "No hay stock suficiente"],
                    JSON_UNESCAPED_UNICODE
                );
                exit();
            }

            // El precio y el stock se toman de la base de datos.
            $precio = (float)$producto["precio_venta"];
            $total += $precio * $cantidad;

            $productosValidos[] = [
                "id" => $idProducto,
                "nombre" => $producto["nombre"],
                "cantidad" => $cantidad,
                "precio" => $precio,
                "stock_anterior" => (int)$producto["stock"]
            ];
        }

        $stmtPedido = $conexion->prepare(
            "INSERT INTO pedido (id_cliente, total_pedido)
             VALUES (:cliente, :total)"
        );
        $stmtPedido->execute([
            ":cliente" => $idCliente,
            ":total" => $total
        ]);

        $idPedido = (int)$conexion->lastInsertId();
        $alertasStock = [];

        foreach ($productosValidos as $producto) {
            $stmtDetalle = $conexion->prepare(
                "INSERT INTO producto_pedido
                    (id_pedido, id_producto, cantidad, precio_unitario)
                 VALUES
                    (:pedido, :producto, :cantidad, :precio)"
            );
            $stmtDetalle->execute([
                ":pedido" => $idPedido,
                ":producto" => $producto["id"],
                ":cantidad" => $producto["cantidad"],
                ":precio" => $producto["precio"]
            ]);

            $stmtStock = $conexion->prepare(
                "UPDATE producto
                 SET stock = stock - :cantidad
                 WHERE id_producto = :id
                   AND stock >= :cantidad"
            );
            $stmtStock->execute([
                ":cantidad" => $producto["cantidad"],
                ":id" => $producto["id"]
            ]);

            if ($stmtStock->rowCount() !== 1) {
                $conexion->rollBack();
                http_response_code(409);
                echo json_encode(
                    ["error" => "No hay stock suficiente"],
                    JSON_UNESCAPED_UNICODE
                );
                exit();
            }

            $stockNuevo =
                $producto["stock_anterior"] - $producto["cantidad"];

            // Avisar solo cuando el stock cruza el límite hacia abajo.
            if (
                $producto["stock_anterior"] > LIMITE_STOCK_BAJO &&
                $stockNuevo <= LIMITE_STOCK_BAJO
            ) {
                $alertasStock[] = [
                    "nombre" => $producto["nombre"],
                    "stock" => $stockNuevo
                ];
            }
        }

        $conexion->commit();

        // El email se envía al usuario autenticado que hizo el pedido.
        foreach ($alertasStock as $alerta) {
            enviarAvisoStockBajo(
                $emailUsuario,
                $alerta["nombre"],
                $alerta["stock"]
            );
        }

        http_response_code(201);
        echo json_encode([
            "success" => true,
            "id_pedido" => $idPedido,
            "total" => $total
        ], JSON_UNESCAPED_UNICODE);
    } catch (Throwable $error) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }

        error_log("Error al registrar pedido: " . $error->getMessage());
        http_response_code(500);
        echo json_encode(
            ["error" => "No se pudo registrar el pedido"],
            JSON_UNESCAPED_UNICODE
        );
    }

    exit();
}

// GET: listar pedidos y sus productos
if ($metodo === "GET") {
    try {
        $consulta = $conexion->query(
            "SELECT p.*, c.nombre_cliente
             FROM pedido p
             JOIN clientes c ON p.id_cliente = c.id_cliente"
        );
        $pedidos = $consulta->fetchAll(PDO::FETCH_ASSOC);

        foreach ($pedidos as &$pedido) {
            $stmtProductos = $conexion->prepare(
                "SELECT pp.cantidad,
                        pp.precio_unitario,
                        pr.nombre AS nombre_producto
                 FROM producto_pedido pp
                 JOIN producto pr ON pp.id_producto = pr.id_producto
                 WHERE pp.id_pedido = :id_pedido"
            );
            $stmtProductos->execute([
                ":id_pedido" => $pedido["id_pedido"]
            ]);

            $pedido["productos"] =
                $stmtProductos->fetchAll(PDO::FETCH_ASSOC);
        }
        unset($pedido);

        http_response_code(200);
        echo json_encode($pedidos, JSON_UNESCAPED_UNICODE);
    } catch (Throwable $error) {
        error_log("Error al listar pedidos: " . $error->getMessage());
        http_response_code(500);
        echo json_encode(
            ["error" => "No se pudieron cargar los pedidos"],
            JSON_UNESCAPED_UNICODE
        );
    }

    exit();
}

// DELETE: eliminar pedido sin modificar el stock
if ($metodo === "DELETE") {
    if (!isset($_GET["id"])) {
        http_response_code(400);
        echo json_encode(
            ["error" => "Falta el ID del pedido"],
            JSON_UNESCAPED_UNICODE
        );
        exit();
    }

    $idPedido = filter_var($_GET["id"], FILTER_VALIDATE_INT);

    if ($idPedido === false || $idPedido < 1) {
        http_response_code(422);
        echo json_encode(
            ["error" => "El ID del pedido no es válido"],
            JSON_UNESCAPED_UNICODE
        );
        exit();
    }

    try {
        $stmt = $conexion->prepare(
            "DELETE FROM pedido
             WHERE id_pedido = :id"
        );
        $stmt->execute([":id" => $idPedido]);

        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(
                ["error" => "No se encontró el pedido"],
                JSON_UNESCAPED_UNICODE
            );
            exit();
        }

        http_response_code(200);
        echo json_encode(
            ["success" => true],
            JSON_UNESCAPED_UNICODE
        );
    } catch (Throwable $error) {
        error_log("Error al eliminar pedido: " . $error->getMessage());
        http_response_code(500);
        echo json_encode(
            ["error" => "No se pudo eliminar el pedido"],
            JSON_UNESCAPED_UNICODE
        );
    }

    exit();
}

header("Allow: GET, POST, DELETE, OPTIONS");
http_response_code(405);
echo json_encode(
    ["error" => "Método no permitido"],
    JSON_UNESCAPED_UNICODE
);
?>