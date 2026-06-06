<?php
/**
 * verificar_torneos.php
 * Endpoint raíz. Delega la obtención y verificación de torneos a TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->obtenerTorneos();
