<?php
/**
 * obtener_solicitudes.php
 * Endpoint raíz. Delega la obtención de todas las solicitudes a SolicitudController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\SolicitudController();
$controller->obtenerSolicitudes();
