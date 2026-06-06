<?php
/**
 * bootstrap.php
 * Inicializador del entorno de ejecución del backend.
 * Configura CORS, cabeceras JSON, y registra un autoloader PSR-4 para las clases.
 */

// Permite peticiones CORS desde cualquier origen (React corre en localhost:5173 por defecto)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Si es una petición pre-flight OPTIONS, responder con OK y salir inmediatamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de visualización de errores (para depuración local)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Autocargador PSR-4 personalizado para el namespace Olympia\
spl_autoload_register(function ($class) {
    // Prefijo del namespace del proyecto
    $prefix = 'Olympia\\';

    // Directorio base para el prefijo del namespace
    $base_dir = __DIR__ . '/';

    // ¿La clase usa el prefijo del namespace?
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        // No, pasar al siguiente autoloader registrado
        return;
    }

    // Obtener el nombre relativo de la clase
    $relative_class = substr($class, $len);

    // Reemplazar el prefijo por el directorio base y cambiar los separadores de namespace (\)
    // por separadores de directorios (/) en el nombre de la clase relativo, y agregar .php
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    // Si el archivo existe, cargarlo
    if (file_exists($file)) {
        require_once $file;
    }
});
