<?php
require_once __DIR__ . '/bootstrap.php';

use Olympia\Domain\Torneo;

// Definición de colores ANSI para la consola
define('COLOR_GREEN', "\033[32m");
define('COLOR_RED', "\033[31m");
define('COLOR_YELLOW', "\033[33m");
define('COLOR_BLUE', "\033[34m");
define('COLOR_RESET', "\033[0m");

$testsRun = 0;
$testsPassed = 0;
$testsFailed = 0;

/**
 * Muestra el encabezado del reporte.
 */
function imprimirEncabezado(): void {
    echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";
    echo COLOR_BLUE . "  TEST SUITE: Validaciones del Contrato 'Crear Nuevo Torneo'" . COLOR_RESET . "\n";
    echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n\n";
}

/**
 * Registra un resultado exitoso de prueba.
 */
function testPasado(string $descripcion): void {
    global $testsRun, $testsPassed;
    $testsRun++;
    $testsPassed++;
    echo COLOR_GREEN . "[ PASS ] " . COLOR_RESET . $descripcion . "\n";
}

/**
 * Registra un fallo de prueba.
 */
function testFallado(string $descripcion, string $detalle): void {
    global $testsRun, $testsFailed;
    $testsRun++;
    $testsFailed++;
    echo COLOR_RED . "[ FAIL ] " . COLOR_RESET . $descripcion . "\n";
    echo COLOR_RED . "         Detalle: " . $detalle . COLOR_RESET . "\n";
}

/**
 * Verifica que una acción lance la excepción esperada.
 */
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

/**
 * Verifica que una acción no lance ninguna excepción.
 */
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

// Fecha de hoy para generar fechas futuras en los tests
$hoy = new DateTime();
$manana = (clone $hoy)->modify('+1 day')->format('Y-m-d');
$enUnaSemana = (clone $hoy)->modify('+7 days')->format('Y-m-d');
$ayer = (clone $hoy)->modify('-1 day')->format('Y-m-d');

// --- PRUEBA 1: Validar coherencia de fechas (fecha fin anterior a fecha inicio) ---
testDebeLanzarExcepcion(
    "1. Excepción al tener la fecha de fin anterior a la de inicio",
    "La fecha de finalización no puede ser anterior a la fecha de inicio.",
    function() use ($manana, $hoy) {
        $torneo = new Torneo(
            "Torneo Incoherente",
            $manana, // inicio: mañana
            $hoy->format('Y-m-d'), // fin: hoy (anterior)
            8,
            "Eliminatoria",
            "Libre",
            "Fútbol"
        );
        $torneo->validarCoherenciaFechas();
    }
);

// --- PRUEBA 2: Validar fecha de inicio no pasada (fecha de inicio menor a la actual) ---
testDebeLanzarExcepcion(
    "2. Excepción al tener la fecha de inicio en el pasado",
    "La fecha de inicio no puede ser menor a la fecha actual.",
    function() use ($ayer, $enUnaSemana) {
        $torneo = new Torneo(
            "Torneo del Pasado",
            $ayer, // inicio: ayer
            $enUnaSemana,
            8,
            "Eliminatoria",
            "Libre",
            "Fútbol"
        );
        $torneo->validarFechaInicioNoPasada();
    }
);

// --- PRUEBA 3: Validar capacidad mínima general (menos de 2 equipos) ---
testDebeLanzarExcepcion(
    "3. Excepción al configurar menos de 2 equipos de capacidad máxima",
    "El torneo debe tener al menos 2 equipos asignados.",
    function() use ($manana, $enUnaSemana) {
        $torneo = new Torneo(
            "Torneo Sin Equipos",
            $manana,
            $enUnaSemana,
            1, // maxEquipos = 1
            "Eliminatoria",
            "Libre",
            "Fútbol"
        );
        $torneo->validarCapacidadSegunFormato();
    }
);

// --- PRUEBA 4: Validar capacidad Fase de Grupos (formato Grupos, maxEquipos < 4) ---
testDebeLanzarExcepcion(
    "4. Excepción al configurar 'Fase de Grupos' con menos de 4 equipos",
    "Para el formato 'Fase de Grupos' la capacidad máxima debe ser de al menos 4 equipos.",
    function() use ($manana, $enUnaSemana) {
        $torneo = new Torneo(
            "Torneo Grupos Chico",
            $manana,
            $enUnaSemana,
            3, // maxEquipos = 3 (insuficiente para fase de grupos)
            "Fase de Grupos",
            "Libre",
            "Fútbol"
        );
        $torneo->validarCapacidadSegunFormato();
    }
);

// --- PRUEBA 5: Caso de éxito - Datos totalmente válidos ---
testDebeTenerExito(
    "5. Registro exitoso de torneo con datos correctos",
    function() use ($manana, $enUnaSemana) {
        $torneo = new Torneo(
            "Torneo De Campeones",
            $manana,
            $enUnaSemana,
            8,
            "Eliminatoria",
            "Libre",
            "Fútbol"
        );
        
        // Ejecutar todas las validaciones
        $torneo->validarCoherenciaFechas();
        $torneo->validarFechaInicioNoPasada();
        $torneo->validarCapacidadSegunFormato();
    }
);

// --- PRUEBA 6: Caso de éxito - Formato Fase de Grupos con 4 equipos ---
testDebeTenerExito(
    "6. Registro exitoso de Fase de Grupos con exactamente 4 equipos",
    function() use ($manana, $enUnaSemana) {
        $torneo = new Torneo(
            "Mundialito",
            $manana,
            $enUnaSemana,
            4, // límite exacto
            "Fase de Grupos",
            "Sub-18",
            "Básquet"
        );
        
        $torneo->validarCoherenciaFechas();
        $torneo->validarFechaInicioNoPasada();
        $torneo->validarCapacidadSegunFormato();
    }
);

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
echo "\n" . COLOR_BLUE . "----------------------------------------------------------------------" . COLOR_RESET . "\n";
echo "  RESULTADOS: $testsPassed pasados, " . ($testsFailed > 0 ? COLOR_RED : COLOR_GREEN) . "$testsFailed fallados" . COLOR_RESET . " de $testsRun pruebas ejecutadas.\n";
echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";

// Retornar código de salida correspondiente
exit($testsFailed > 0 ? 1 : 0);
