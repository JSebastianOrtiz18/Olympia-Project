<?php
/**
 * obtener_usuario.php
 * Endpoint raíz. Delega la obtención de usuarios al controlador orientado a objetos UsuarioController.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\UsuarioController();
$controller->obtenerUsuarios();
