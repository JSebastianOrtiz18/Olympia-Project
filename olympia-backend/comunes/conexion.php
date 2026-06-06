<?php
$host = "localhost"; // Define la dirección del servidor de la base de datos
$user = "root"; // Define el nombre de usuario para acceder a la base de datos
$pass = ""; // Define la contraseña de acceso a la base de datos
$dbname = "db_olympia"; // Define el nombre de la base de datos a utilizar

$conn = new mysqli($host, $user, $pass, $dbname); // Crea una nueva conexión a MySQL utilizando las credenciales

if ($conn->connect_error) { // Si ocurrió un error durante el intento de conexión ->
    die(json_encode([
        "status" => "error",
        "mensaje" => "Fallo la conexión a la Base de Datos: " . $conn->connect_error
    ])); // Termina la ejecución y muestra un JSON con el detalle del error
}

$conn->set_charset("utf8"); // Configura la conexión para usar UTF-8 y evitar problemas con acentos y letras eñe
?>
