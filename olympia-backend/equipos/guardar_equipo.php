<?php
/**
 * guardar_equipo.php
 * Endpoint raíz. Delega el registro de un equipo al controlador orientado a objetos EquipoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\EquipoController();
$controller->guardarEquipo();
