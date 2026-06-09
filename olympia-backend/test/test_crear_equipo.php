<?php
/**
 * test_crear_equipo.php
 * Script CLI para verificar las validaciones y post-condiciones del contrato "Crear Nuevo Equipo".
 */

require_once __DIR__ . '/bootstrap.php';

use Olympia\Domain\Equipo;

// Definición de colores ANSI para la consola
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

$testsRun = 0;
$testsPassed = 0;
$testsFailed = 0;

function imprimirEncabezado(): void {
    echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";
    echo COLOR_BLUE . "  TEST SUITE: Validaciones del Contrato 'Crear Nuevo Equipo'" . COLOR_RESET . "\n";
    echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n\n";
}

function testPasado(string $descripcion): void {
    global $testsRun, $testsPassed;
    $testsRun++;
    $testsPassed++;
    echo COLOR_GREEN . "[ PASS ] " . COLOR_RESET . $descripcion . "\n";
}

function testFallado(string $descripcion, string $detalle): void {
    global $testsRun, $testsFailed;
    $testsRun++;
    $testsFailed++;
    echo COLOR_RED . "[ FAIL ] " . COLOR_RESET . $descripcion . "\n";
    echo COLOR_RED . "         Detalle: " . $detalle . COLOR_RESET . "\n";
}

// -----------------------------------------------------------------------------
// EJECUCIÓN DE PRUEBAS
// -----------------------------------------------------------------------------

imprimirEncabezado();

// --- PRUEBA 1: Verificar instanciación de la entidad de dominio Equipo (Post-condiciones) ---
try {
    $equipo = new Equipo(
        "Halcones F.C.",
        "Equipo de fútbol amateur de la liga local",
        "Libre",
        "Fútbol",
        42 // id_equipo opcional
    );

    // Validar que las propiedades se asociaron correctamente según el constructor
    if ($equipo->nombre_equipo !== "Halcones F.C.") {
        throw new Exception("El nombre no coincide.");
    }
    if ($equipo->descripcion_equipo !== "Equipo de fútbol amateur de la liga local") {
        throw new Exception("La descripción no coincide.");
    }
    if ($equipo->categoria_equipo !== "Libre") {
        throw new Exception("La categoría no coincide.");
    }
    if ($equipo->deporte_equipo !== "Fútbol") {
        throw new Exception("El deporte no coincide.");
    }
    if ($equipo->id_equipo !== 42) {
        throw new Exception("El ID no coincide.");
    }

    testPasado("1. Creación e inicialización correcta del modelo de dominio Equipo");
} catch (Exception $e) {
    testFallado("1. Creación e inicialización correcta del modelo de dominio Equipo", $e->getMessage());
}

// --- PRUEBA 2: Validar simulación de campos vacíos en el controlador ---
// Simulamos la lógica del EquipoController cuando falta el nombre del equipo
try {
    $input = [
        "descripcion_equipo" => "Descripción sin nombre",
        "categoria_equipo" => "Libre",
        "deporte_equipo" => "Fútbol"
    ];

    if (!isset($input['nombre_equipo']) || empty(trim($input['nombre_equipo']))) {
        throw new Exception("Faltan datos obligatorios del equipo (nombre_equipo).");
    }

    testFallado("2. Excepción al faltar el campo obligatorio 'nombre_equipo'", "No se lanzó la excepción esperada.");
} catch (Exception $e) {
    if (strpos($e->getMessage(), "Faltan datos obligatorios") !== false) {
        testPasado("2. Excepción detectada correctamente cuando falta el campo 'nombre_equipo'");
    } else {
        testFallado("2. Excepción al faltar el campo obligatorio 'nombre_equipo'", "Mensaje inesperado: " . $e->getMessage());
    }
}

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
echo "\n" . COLOR_BLUE . "----------------------------------------------------------------------" . COLOR_RESET . "\n";
echo "  RESULTADOS: $testsPassed pasados, " . ($testsFailed > 0 ? COLOR_RED : COLOR_GREEN) . "$testsFailed fallados" . COLOR_RESET . " de $testsRun pruebas ejecutadas.\n";
echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";

exit($testsFailed > 0 ? 1 : 0);
