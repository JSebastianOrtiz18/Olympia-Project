<?php
/**
 * obtener_fixture.php
 * Endpoint raíz. Delega la obtención de encuentros del fixture a FixtureController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\FixtureController();
$controller->obtenerFixture();
