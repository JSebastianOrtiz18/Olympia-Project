<?php
/**
 * generar_pin_asistente.php
 * Endpoint raíz. Delega la generación de PIN al controlador TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->generarPinAsistente();
