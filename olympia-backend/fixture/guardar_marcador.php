<?php
/**
 * guardar_marcador.php
 * Endpoint raíz. Delega la carga y edición de marcadores a FixtureController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\FixtureController();
$controller->guardarMarcador();
