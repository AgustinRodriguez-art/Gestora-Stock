<?php
function entorno($nombre, $porDefecto = "")
{
    $valor = getenv($nombre);
    return $valor !== false ? $valor : $porDefecto;
}

define("DB_HOST", entorno("DB_HOST", "localhost"));
define("DB_PORT", entorno("DB_PORT", "3306"));
define("DB_NAME", entorno("DB_NAME", "consultorastock"));
define("DB_USER", entorno("DB_USER", "root"));
define("DB_PASS", entorno("DB_PASS", ""));


define("ENTORNO", entorno("ENTORNO", "local"));

date_default_timezone_set("America/Argentina/Buenos_Aires");

define("RESEND_API_KEY", entorno("RESEND_API_KEY", ""));
define("LIMITE_STOCK_BAJO", 5);
?>