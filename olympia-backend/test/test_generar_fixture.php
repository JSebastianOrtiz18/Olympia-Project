<?php
/**
 * test_generar_fixture.php
 * Script CLI para verificar las validaciones y algoritmos de generación de fixtures.
 */

require_once __DIR__ . '/bootstrap.php';

use Olympia\Domain\Torneo;
use Olympia\Domain\Equipo;
use Olympia\Repositories\PartidoRepository;
use Olympia\Services\FixtureService;

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
    echo COLOR_BLUE . "  TEST SUITE: Validaciones del Contrato 'Generar Fixture'" . COLOR_RESET . "\n";
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

/**
 * Inicializa una base de datos SQLite en memoria con el esquema básico requerido.
 */
function crearBaseDeDatosMemoria(): PDO {
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Crear tablas básicas para Partidos y Resultados (en formato normalizado 3NF)
    $db->exec("CREATE TABLE Partido (
        id_partido INTEGER PRIMARY KEY,
        id_torneo INTEGER,
        estado_partido TEXT,
        fase_jornada TEXT,
        fecha_partido TEXT
    )");

    $db->exec("CREATE TABLE Resultado_partido (
        id_partido INTEGER,
        id_equipo INTEGER,
        condicion TEXT,
        puntuacion INTEGER,
        PRIMARY KEY (id_partido, condicion)
    )");

    return $db;
}

/**
 * Helper para generar una lista de equipos ficticios.
 */
function generarEquiposFicticios(int $cantidad): array {
    $equipos = [];
    for ($i = 1; $i <= $cantidad; $i++) {
        $equipos[] = new Equipo("Equipo $i", "Descripción", "Libre", "Fútbol", $i);
    }
    return $equipos;
}

// -----------------------------------------------------------------------------
// EJECUCIÓN DE PRUEBAS
// -----------------------------------------------------------------------------

imprimirEncabezado();

// --- PRUEBA 1: Excepción con menos de 2 equipos ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Mini", "2026-07-01", "2026-07-15", 8, "Liga", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(1); // 1 equipo (insuficiente)

    $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);
    testFallado("1. Excepción con menos de 2 equipos", "No se lanzó ninguna excepción.");
} catch (Exception $e) {
    $mensajeEsperado = "Se requieren al menos 2 equipos asignados para generar un fixture.";
    if (trim($e->getMessage()) === $mensajeEsperado) {
        testPasado("1. Excepción correcta lanzada al tener menos de 2 equipos");
    } else {
        testFallado("1. Excepción correcta lanzada al tener menos de 2 equipos", "Mensaje inesperado: " . $e->getMessage());
    }
}

// --- PRUEBA 2: Excepción Fase de Grupos con menos de 4 equipos ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Grupos", "2026-07-01", "2026-07-15", 8, "Fase de Grupos", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(3); // 3 equipos (insuficiente para grupos)

    $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);
    testFallado("2. Excepción Fase de Grupos con menos de 4 equipos", "No se lanzó ninguna excepción.");
} catch (Exception $e) {
    $mensajeEsperado = "Fallo de validación: El formato Grupos requiere un mínimo de 4 equipos.";
    if (trim($e->getMessage()) === $mensajeEsperado) {
        testPasado("2. Excepción correcta lanzada al configurar Fase de Grupos con < 4 equipos");
    } else {
        testFallado("2. Excepción correcta lanzada al configurar Fase de Grupos con < 4 equipos", "Mensaje inesperado: " . $e->getMessage());
    }
}

// --- PRUEBA 3: Generación de Liga con número par de equipos (8 equipos) ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Liga Par", "2026-07-01", "2026-07-15", 8, "Liga", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(8);

    $partidos = $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);

    // Liga de 8 equipos genera (8 * 7) / 2 = 28 partidos
    if (count($partidos) === 28) {
        testPasado("3. Generación normal de Liga con número par de equipos (28 partidos)");
    } else {
        testFallado("3. Generación normal de Liga con número par de equipos", "Se esperaban 28 partidos, se generaron: " . count($partidos));
    }
} catch (Exception $e) {
    testFallado("3. Generación normal de Liga con número par de equipos", "Excepción no esperada: " . $e->getMessage());
}

// --- PRUEBA 4: Generación de Liga con número impar de equipos (7 equipos con Bye implícito) ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Liga Impar", "2026-07-01", "2026-07-15", 8, "Liga", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(7);

    $partidos = $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);

    // Liga de 7 equipos (se añade 1 fantasma = 8). Se juegan 7 rondas de 3 partidos cada una = 21 partidos.
    if (count($partidos) === 21) {
        testPasado("4. Generación de Liga con equipos impares omitiendo descansos (21 partidos)");
    } else {
        testFallado("4. Generación de Liga con equipos impares", "Se esperaban 21 partidos, se generaron: " . count($partidos));
    }
} catch (Exception $e) {
    testFallado("4. Generación de Liga con equipos impares", "Excepción no esperada: " . $e->getMessage());
}

// --- PRUEBA 5: Generación de Eliminatoria Directa con potencia de 2 (8 equipos) ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Eliminatoria Par", "2026-07-01", "2026-07-15", 8, "Eliminatoria", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(8);

    $partidos = $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);

    // Eliminatoria de 8 genera 4 partidos en la primera ronda (Cuartos de final)
    if (count($partidos) === 4) {
        $jornada = $partidos[0]->fase_jornada;
        if ($jornada === "Cuartos de Final") {
            testPasado("5. Generación de Eliminatoria con potencia de 2 (4 partidos en Cuartos de Final)");
        } else {
            testFallado("5. Generación de Eliminatoria con potencia de 2", "Ronda incorrecta: " . $jornada);
        }
    } else {
        testFallado("5. Generación de Eliminatoria con potencia de 2", "Se esperaban 4 partidos, se generaron: " . count($partidos));
    }
} catch (Exception $e) {
    testFallado("5. Generación de Eliminatoria con potencia de 2", "Excepción no esperada: " . $e->getMessage());
}

// --- PRUEBA 6: Generación de Eliminatoria Directa con número no potencia de 2 (6 equipos, con Byes) ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Eliminatoria Bye", "2026-07-01", "2026-07-15", 8, "Eliminatoria", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(6);

    $partidos = $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);

    // Próxima potencia de 2 es 8. Byes = 8 - 6 = 2. Equipos jugando primera ronda = 6 - 2 = 4 equipos.
    // 4 equipos jugando primera ronda genera exactamente 2 partidos. Los otros 2 equipos pasan directo.
    if (count($partidos) === 2) {
        testPasado("6. Generación de Eliminatoria sin potencia de 2 asignando Byes (2 partidos preliminares)");
    } else {
        testFallado("6. Generación de Eliminatoria sin potencia de 2", "Se esperaban 2 partidos, se generaron: " . count($partidos));
    }
} catch (Exception $e) {
    testFallado("6. Generación de Eliminatoria sin potencia de 2", "Excepción no esperada: " . $e->getMessage());
}

// --- PRUEBA 7: Generación de Fase de Grupos (8 equipos) ---
try {
    $db = crearBaseDeDatosMemoria();
    $partidoRepo = new PartidoRepository($db);
    $fixtureService = new FixtureService($db);

    $torneo = new Torneo("Torneo Grupos Completo", "2026-07-01", "2026-07-15", 8, "Fase de Grupos", "Libre", "Fútbol", null, 1);
    $equipos = generarEquiposFicticios(8);

    $partidos = $fixtureService->generarFixture($torneo, $equipos, $partidoRepo);

    // 8 equipos divididos en 2 grupos (A y B) de 4 equipos cada uno.
    // Cada grupo genera (4 * 3) / 2 = 6 partidos. Total partidos en Fase de Grupos = 12 partidos.
    if (count($partidos) === 12) {
        testPasado("7. Generación normal de Fase de Grupos con división equitativa (12 partidos en total)");
    } else {
        testFallado("7. Generación normal de Fase de Grupos", "Se esperaban 12 partidos, se generaron: " . count($partidos));
    }
} catch (Exception $e) {
    testFallado("7. Generación normal de Fase de Grupos", "Excepción no esperada: " . $e->getMessage());
}

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
echo "\n" . COLOR_BLUE . "----------------------------------------------------------------------" . COLOR_RESET . "\n";
echo "  RESULTADOS: $testsPassed pasados, " . ($testsFailed > 0 ? COLOR_RED : COLOR_GREEN) . "$testsFailed fallados" . COLOR_RESET . " de $testsRun pruebas ejecutadas.\n";
echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";

exit($testsFailed > 0 ? 1 : 0);
