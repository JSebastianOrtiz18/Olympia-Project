<?php
/**
 * obtener_torneos.php
 * Endpoint raíz. Delega la obtención de torneos al controlador orientado a objetos TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->obtenerTorneos();
