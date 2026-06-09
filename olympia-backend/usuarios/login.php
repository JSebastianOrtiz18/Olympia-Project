<?php
/**
 * login.php
 * Endpoint para el inicio de sesión de usuarios.
 */
require_once __DIR__ . '/../src/bootstrap.php';

$controller = new \Olympia\Controllers\UsuarioController();
$controller->loginUsuario();
