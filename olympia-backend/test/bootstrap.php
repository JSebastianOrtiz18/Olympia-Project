<?php
/**
 * bootstrap.php para pruebas unitarias.
 * Inicializa el autoloader de clases del backend sin enviar cabeceras HTTP.
 */

// Registrar el autoloader PSR-4 para el namespace Olympia\
spl_autoload_register(function ($class) {
    $prefix = 'Olympia\\';
    $base_dir = dirname(__DIR__) . '/src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});
