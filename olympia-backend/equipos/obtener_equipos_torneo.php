<?php
/**
 * obtener_equipos_torneo.php
 * Endpoint raíz. Delega la obtención de equipos de un torneo al controlador EquipoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\EquipoController();
$controller->obtenerEquiposTorneo();
