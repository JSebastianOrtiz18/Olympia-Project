<?php
/**
 * guardar_asignaciones_batch.php
 * Endpoint raíz. Delega la asignación por lote al controlador EquipoController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\EquipoController();
$controller->guardarAsignacionesBatch();
