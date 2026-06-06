<?php
/**
 * guardar_colaborador.php
 * Endpoint raíz. Delega la creación de un colaborador al controlador orientado a objetos UsuarioController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\UsuarioController();
$controller->guardarColaborador();
