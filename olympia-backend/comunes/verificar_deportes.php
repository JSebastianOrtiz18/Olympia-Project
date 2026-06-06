<?php
/**
 * verificar_deportes.php
 * Endpoint raíz. Delega la obtención de deportes al controlador TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->obtenerDeportes();
