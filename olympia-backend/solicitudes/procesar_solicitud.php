<?php
/**
 * procesar_solicitud.php
 * Endpoint raíz. Delega la aprobación o rechazo de solicitudes al controlador SolicitudController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\SolicitudController();
$controller->procesarSolicitud();
