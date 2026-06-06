<?php
/**
 * verificar_pin.php
 * Endpoint raíz. Delega la validación de PIN al controlador TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->verificarPin();
