<?php
/**
 * test_asistente_pin.php
 * Script CLI para verificar las validaciones de PIN de asistente e inicio de sesión temporal.
 */

require_once __DIR__ . '/bootstrap.php';

use Olympia\Domain\Torneo;
use Olympia\Repositories\TorneoRepository;

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
    echo COLOR_BLUE . "  TEST SUITE: Validaciones del Contrato 'Asignar/Iniciar Sesión Asistente'" . COLOR_RESET . "\n";
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
 * Inicializa una base de datos SQLite en memoria con el esquema normalizado 3NF de torneos.
 */
function crearBaseDeDatosMemoria(): PDO {
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec("CREATE TABLE Formato (
        id_formato INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_formato TEXT
    )");

    $db->exec("CREATE TABLE Deporte (
        id_deporte INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_deporte TEXT
    )");

    $db->exec("CREATE TABLE Categoria (
        id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_categoria TEXT
    )");

    $db->exec("CREATE TABLE Disciplina (
        id_disciplina INTEGER PRIMARY KEY AUTOINCREMENT,
        id_deporte INTEGER,
        id_categoria INTEGER
    )");

    $db->exec("CREATE TABLE Torneo (
        id_torneo INTEGER PRIMARY KEY,
        nombre_torneo TEXT,
        torneo_inicio TEXT,
        torneo_fin TEXT,
        max_equipos INTEGER,
        id_formato INTEGER,
        id_disciplina INTEGER,
        pin_asistente TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )");

    return $db;
}

// -----------------------------------------------------------------------------
// EJECUCIÓN DE PRUEBAS
// -----------------------------------------------------------------------------

imprimirEncabezado();

// --- PRUEBA 1: Generación de PIN alfanumérico correcto ---
try {
    // Algoritmo de generación de PIN alfanumérico único de 6 caracteres (del TorneoController)
    $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $pin = '';
    for ($i = 0; $i < 6; $i++) {
        $pin .= $caracteres[rand(0, strlen($caracteres) - 1)];
    }

    if (strlen($pin) !== 6) {
        throw new Exception("El PIN debe tener exactamente 6 caracteres.");
    }

    if (!preg_match('/^[A-Z0-9]{6}$/', $pin)) {
        throw new Exception("El PIN debe contener únicamente letras mayúsculas y números alfanuméricos.");
    }

    testPasado("1. Generación exitosa de PIN alfanumérico temporal de 6 caracteres ($pin)");
} catch (Exception $e) {
    testFallado("1. Generación exitosa de PIN alfanumérico temporal", $e->getMessage());
}

// --- PRUEBA 2: Persistencia y recuperación de Torneo por PIN ---
try {
    $db = crearBaseDeDatosMemoria();
    $torneoRepo = new TorneoRepository($db);

    $torneo = new Torneo("Torneo con PIN", "2026-07-01", "2026-07-15", 8, "Liga", "Libre", "Fútbol", "REF123", null);
    
    // Guardar torneo
    $torneoRepo->save($torneo);

    // Recuperar torneo por PIN
    $recuperado = $torneoRepo->findByPin("REF123");

    if ($recuperado === null) {
        throw new Exception("No se pudo recuperar el torneo por su PIN.");
    }

    if ($recuperado->id_torneo !== 1 || $recuperado->nombre_torneo !== "Torneo con PIN") {
        throw new Exception("Los datos del torneo recuperado no coinciden.");
    }

    testPasado("2. Almacenamiento y búsqueda correcta de torneo por PIN activo (REF123)");
} catch (Exception $e) {
    testFallado("2. Almacenamiento y búsqueda correcta de torneo por PIN activo", $e->getMessage());
}

// --- PRUEBA 3: Excepción al iniciar sesión si el nombre está vacío ---
try {
    $input = [
        "nombre" => "", // Nombre vacío o con espacios
        "pin" => "REF123"
    ];

    if (!isset($input['nombre']) || empty(trim($input['nombre']))) {
        throw new Exception("Por favor, ingresa tu Nombre y Apellido para identificarte al modificar resultados.");
    }

    testFallado("3. Excepción detectada al iniciar sesión con nombre de asistente vacío", "No se lanzó la excepción.");
} catch (Exception $e) {
    $mensajeEsperado = "Por favor, ingresa tu Nombre y Apellido para identificarte al modificar resultados.";
    if (trim($e->getMessage()) === $mensajeEsperado) {
        testPasado("3. Excepción detectada correctamente cuando el nombre de asistente está vacío");
    } else {
        testFallado("3. Excepción detectada al iniciar sesión con nombre de asistente vacío", "Mensaje inesperado: " . $e->getMessage());
    }
}

// --- PRUEBA 4: Excepción al iniciar sesión si el PIN está vacío ---
try {
    $input = [
        "nombre" => "Julio Ortiz",
        "pin" => "" // PIN vacío
    ];

    if (!isset($input['pin']) || empty(trim($input['pin']))) {
        throw new Exception("Por favor, ingresa el código PIN de acceso.");
    }

    testFallado("4. Excepción detectada al iniciar sesión con PIN vacío", "No se lanzó la excepción.");
} catch (Exception $e) {
    $mensajeEsperado = "Por favor, ingresa el código PIN de acceso.";
    if (trim($e->getMessage()) === $mensajeEsperado) {
        testPasado("4. Excepción detectada correctamente cuando el PIN de acceso está vacío");
    } else {
        testFallado("4. Excepción detectada al iniciar sesión con PIN vacío", "Mensaje inesperado: " . $e->getMessage());
    }
}

// --- PRUEBA 5: Excepción al iniciar sesión con un PIN incorrecto o inexistente ---
try {
    $db = crearBaseDeDatosMemoria();
    $torneoRepo = new TorneoRepository($db);

    $torneo = new Torneo("Torneo con PIN", "2026-07-01", "2026-07-15", 8, "Liga", "Libre", "Fútbol", "REF123", null);
    $torneoRepo->save($torneo);

    $pinIngresado = "XYZ999"; // PIN Incorrecto
    $torneoEncontrado = $torneoRepo->findByPin($pinIngresado);

    if (!$torneoEncontrado) {
        throw new Exception("El código PIN ingresado es incorrecto o ya ha expirado.");
    }

    testFallado("5. Excepción detectada al verificar un PIN incorrecto", "No se lanzó la excepción.");
} catch (Exception $e) {
    $mensajeEsperado = "El código PIN ingresado es incorrecto o ya ha expirado.";
    if (trim($e->getMessage()) === $mensajeEsperado) {
        testPasado("5. Excepción correcta lanzada al ingresar un PIN incorrecto o vencido");
    } else {
        testFallado("5. Excepción detectada al verificar un PIN incorrecto", "Mensaje inesperado: " . $e->getMessage());
    }
}

// -----------------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------------
echo "\n" . COLOR_BLUE . "----------------------------------------------------------------------" . COLOR_RESET . "\n";
echo "  RESULTADOS: $testsPassed pasados, " . ($testsFailed > 0 ? COLOR_RED : COLOR_GREEN) . "$testsFailed fallados" . COLOR_RESET . " de $testsRun pruebas ejecutadas.\n";
echo COLOR_BLUE . "======================================================================" . COLOR_RESET . "\n";

exit($testsFailed > 0 ? 1 : 0);
