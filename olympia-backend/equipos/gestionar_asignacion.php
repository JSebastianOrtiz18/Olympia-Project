<?php
/**
 * gestionar_asignacion.php
 * Endpoint raíz. Delega la asignación/remoción de un equipo al torneo en EquipoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\EquipoController();
$controller->gestionarAsignacion();
