<?php
require_once 'conexion.php';
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM Clientes");
            $clientes = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $clientes]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['nombre_cliente'], $data['direccion'], $data['telefono'])) {
            echo json_encode(["success" => false, "error" => "Faltan datos obligatorios del cliente"]);
            break;
        }

        try {
            $sql = "INSERT INTO Clientes (nombre_cliente, direccion, telefono) VALUES (?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['nombre_cliente'],
                $data['direccion'],
                $data['telefono']
            ]);
            echo json_encode(["success" => true, "message" => "Cliente registrado correctamente", "id_cliente" => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;
}
?>