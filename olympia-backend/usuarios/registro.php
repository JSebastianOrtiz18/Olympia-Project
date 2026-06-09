<?php
/**
 * registro.php
 * Endpoint para el registro de nuevos usuarios.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\UsuarioController();
$controller->registrarUsuario();
