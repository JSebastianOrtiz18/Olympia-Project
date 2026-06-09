<?php
/**
 * Script CLI para verificar las validaciones del contrato "Inscribir Equipo".
 */

require_once __DIR__ . '/bootstrap.php';

use Olympia\Domain\Equipo;
use Olympia\Domain\Torneo;
use Olympia\Domain\Solicitud;

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
    echo COLOR_BLUE . "  TEST SUITE: Validaciones del Contrato 'Inscribir Equipo'" . COLOR_RESET . "\n";
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

function testDebeLanzarExcepcion(string $descripcion, string $mensajeEsperado, callable $accion): void {
    try {
        $accion();
        testFallado($descripcion, "No se lanzó ninguna excepción. Se esperaba: '$mensajeEsperado'");
    } catch (Exception $e) {
        if (trim($e->getMessage()) === trim($mensajeEsperado)) {
            testPasado($descripcion);
        } else {
            testFallado($descripcion, "Se lanzó una excepción incorrecta.\n         Esperada: '$mensajeEsperado'\n         Obtenida: '" . $e->getMessage() . "'");
        }
    }
}

function testDebeTenerExito(string $descripcion, callable $accion): void {
    try {
        $accion();
        testPasado($descripcion);
    } catch (Exception $e) {
        testFallado($descripcion, "Se lanzó una excepción no esperada: '" . $e->getMessage() . "'");
    }
}

// -----------------------------------------------------------------------------
// EJECUCIÓN DE PRUEBAS
// -----------------------------------------------------------------------------

imprimirEncabezado();

// --- PRUEBA 1: Validación de coincidencia de deporte (Deportes incompatibles) ---
testDebeLanzarExcepcion(
    "1. Excepción cuando el deporte del equipo no coincide con el del torneo",
    "El deporte del equipo (Fútbol) no coincide con el del torneo (Básquet).",
    function() {
        $equipo = new Equipo("Los Galácticos", "Descripción", "Libre", "Fútbol", 1);
        $torneo = new Torneo("Torneo de Básquetbol", "2026-07-01", "2026-07-10", 8, "Eliminatoria", "Libre", "Básquet", null, 1);
        
        $solicitud = new Solicitud($torneo->id_torneo, $equipo->id_equipo, "Pendiente");
        $solicitud->validarReglasInscripcion($equipo, $torneo, 8);
    }
);

// --- PRUEBA 2: Validación de plantilla mínima (Fútbol - requiere al menos 7) ---
testDebeLanzarExcepcion(
    "2. Excepción cuando la plantilla tiene menos jugadores que el mínimo requerido (Fútbol)",
    "No cumples con el mínimo de jugadores: 'Fútbol Club' tiene 5 pero Fútbol requiere al menos 7 jugadores.",
    function() {
        $equipo = new Equipo("Fútbol Club", "Descripción", "Libre", "Fútbol", 1);
        $torneo = new Torneo("Torneo de Fútbol", "2026-07-01", "2026-07-10", 8, "Eliminatoria", "Libre", "Fútbol", null, 1);
        
        $solicitud = new Solicitud($torneo->id_torneo, $equipo->id_equipo, "Pendiente");
        // Se le envían 5 jugadores (el mínimo es 7)
        $solicitud->validarReglasInscripcion($equipo, $torneo, 5);
    }
);

// --- PRUEBA 3: Validación de plantilla mínima (Básquet - requiere al menos 5) ---
testDebeLanzarExcepcion(
    "3. Excepción cuando la plantilla tiene menos jugadores que el mínimo requerido (Básquet)",
    "No cumples con el mínimo de jugadores: 'Básquet Club' tiene 4 pero Básquet requiere al menos 5 jugadores.",
    function() {
        $equipo = new Equipo("Básquet Club", "Descripción", "Libre", "Básquet", 1);
        $torneo = new Torneo("Torneo de Básquet", "2026-07-01", "2026-07-10", 8, "Eliminatoria", "Libre", "Básquet", null, 1);
        
        $solicitud = new Solicitud($torneo->id_torneo, $equipo->id_equipo, "Pendiente");
        // Se le envían 4 jugadores (el mínimo es 5)
        $solicitud->validarReglasInscripcion($equipo, $torneo, 4);
    }
);

// --- PRUEBA 4: Validación de cupos configurados (max_equipos <= 0) ---
testDebeLanzarExcepcion(
    "4. Excepción cuando el torneo no cuenta con cupos configurados (capacidad <= 0)",
    "El torneo no cuenta con cupos configurados.",
    function() {
        $equipo = new Equipo("Vóley Club", "Descripción", "Libre", "Vóley", 1);
        $torneo = new Torneo("Torneo Vóley", "2026-07-01", "2026-07-10", 0, "Eliminatoria", "Libre", "Vóley", null, 1);
        
        $solicitud = new Solicitud($torneo->id_torneo, $equipo->id_equipo, "Pendiente");
        // 6 jugadores es válido para vóley, pero el torneo tiene max_equipos = 0
        $solicitud->validarReglasInscripcion($equipo, $torneo, 6);
    }
);

// --- PRUEBA 5: Estado de solicitud no permitido ---
testDebeLanzarExcepcion(
    "5. Excepción al intentar instanciar una solicitud con un estado no permitido",
    "El estado 'EnProceso' de la solicitud no está permitido.",
    function() {
        new Solicitud(1, 1, "EnProceso");
    }
);

// --- PRUEBA 6: Caso de éxito - Datos de inscripción válidos (Fútbol con 8 jugadores) ---
testDebeTenerExito(
    "6. Inscripción exitosa con datos totalmente válidos",
    function() {
        $equipo = new Equipo("Fútbol Club", "Descripción", "Libre", "Fútbol", 1);
        $torneo = new Torneo("Torneo de Fútbol", "2026-07-01", "2026-07-10", 8, "Eliminatoria", "Libre", "Fútbol", null, 1);
        
        $solicitud = new Solicitud($torneo->id_torneo, $equipo->id_equipo, "Pendiente");
        // 8 jugadores (mínimo es 7) y deportes compatibles
        $solicitud->validarReglasInscripcion($equipo, $torneo, 8);
    }
);

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
echo "\n" . COLOR_BLUE . "----------------------------------------------------------------------" . COLOR_RESET . "\n";
echo "  RESULTADOS: $testsPassed pasados, " . ($testsFailed > 0 ? COLOR_RED : COLOR_GREEN) . "$testsFailed fallados" . COLOR_RESET . " de $testsRun pruebas ejecutadas.\n";
echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";

exit($testsFailed > 0 ? 1 : 0);
