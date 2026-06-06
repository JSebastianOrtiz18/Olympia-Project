<?php
/**
 * generar_fixture.php
 * Endpoint raíz. Delega la lógica de negocio al controlador orientado a objetos FixtureController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\FixtureController();
$controller->generarFixture();
