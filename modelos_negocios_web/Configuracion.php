<?php
// Datos de conexión a la base de datos.
// Se leen del entorno para no dejar credenciales escritas en el repositorio.
// En local (XAMPP) basta con los valores por defecto.
$dbHost     = getenv('DB_HOST')     ?: 'localhost';
$dbUsername = getenv('DB_USER')     ?: 'root';
$dbPassword = getenv('DB_PASSWORD') ?: '';
$dbName     = getenv('DB_NAME')     ?: 'carta';

//Create connection and select DB
$db = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);

if ($db->connect_error) {
    die("No hay Conexion con la base de datos: " . $db->connect_error);
}
?>
