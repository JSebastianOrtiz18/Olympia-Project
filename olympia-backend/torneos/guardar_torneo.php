<?php
/**
 * guardar_torneo.php
 * Endpoint raíz. Delega la creación de un torneo al controlador orientado a objetos TorneoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\TorneoController();
$controller->guardarTorneo();
