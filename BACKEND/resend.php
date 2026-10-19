<?php

require_once __DIR__ . "/config.php";

function enviarAvisoStockBajo(
    string $emailDestinatario,
    string $nombreProducto,
    int $stock
): bool {
    if (
        !defined("RESEND_API_KEY") ||
        RESEND_API_KEY === "" ||
        RESEND_API_KEY === "TU_CLAVE_NUEVA_DE_RESEND"
    ) {
        error_log("Falta configurar RESEND_API_KEY en BACKEND/config.php");
        return false;
    }

    if (!filter_var($emailDestinatario, FILTER_VALIDATE_EMAIL)) {
        error_log("El usuario autenticado no tiene un email válido.");
        return false;
    }

    $nombreSeguro = htmlspecialchars(
        $nombreProducto,
        ENT_QUOTES,
        "UTF-8"
    );

    $datos = [
        "from" => "GestoraStock <onboarding@resend.dev>",
        "to" => [$emailDestinatario],
        "subject" => "Stock bajo: " . $nombreProducto,
        "html" => "
            <h2>Alerta de stock bajo</h2>
            <p>El producto <strong>{$nombreSeguro}</strong>
            tiene solamente <strong>{$stock}</strong> unidades.</p>
        "
    ];

    $curl = curl_init("https://api.resend.com/emails");

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($datos),
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . RESEND_API_KEY,
            "Content-Type: application/json"
        ],
        CURLOPT_TIMEOUT => 10
    ]);

    $respuesta = curl_exec($curl);
    $estado = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    if ($respuesta === false) {
        error_log("Error al conectar con Resend: " . curl_error($curl));
        curl_close($curl);
        return false;
    }

    curl_close($curl);

    if ($estado < 200 || $estado >= 300) {
        error_log("Error de Resend HTTP {$estado}: " . $respuesta);
        return false;
    }

    return true;
}
?>