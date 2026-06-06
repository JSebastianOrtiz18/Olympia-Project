<?php
namespace Olympia\Controllers;

use Olympia\Core\Database;
use Olympia\Repositories\TorneoRepository;
use Olympia\Repositories\EquipoRepository;
use Olympia\Repositories\PartidoRepository;
use Olympia\Services\FixtureService;
use Exception;

/**
 * Clase FixtureController
 * Coordina la generación y visualización de fixtures, así como la actualización de marcadores.
 */
class FixtureController {
    private TorneoRepository $torneoRepo;
    private EquipoRepository $equipoRepo;
    private PartidoRepository $partidoRepo;
    private FixtureService $fixtureService;

    public function __construct() {
        $db = Database::getConnection();
        $this->torneoRepo = new TorneoRepository($db);
        $this->equipoRepo = new EquipoRepository($db);
        $this->partidoRepo = new PartidoRepository($db);
        $this->fixtureService = new FixtureService($db);
    }

    /**
     * Endpoint: generar_fixture.php (POST)
     * Genera automáticamente los encuentros de un torneo basándose en su formato.
     */
    public function generarFixture(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_torneo'])) {
                throw new Exception("Datos incompletos.");
            }

            $idTorneo = (int)$input['id_torneo'];

            // Cargar Torneo
            $torneo = $this->torneoRepo->find($idTorneo);
            if (!$torneo) {
                throw new Exception("Torneo no encontrado.");
            }

            // Cargar Equipos inscriptos
            $equipos = $this->equipoRepo->findByTorneo($idTorneo);

            // Generar y persistir el fixture a través del servicio
            $partidos = $this->fixtureService->generarFixture($torneo, $equipos, $this->partidoRepo);

            echo json_encode([
                "status" => "success",
                "mensaje" => "Fixture generado correctamente bajo el formato: " . ucfirst($torneo->formato_torneo) . "."
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Endpoint: obtener_fixture.php (GET)
     * Obtiene todos los partidos generados para un torneo en específico.
     */
    public function obtenerFixture(): void {
        try {
            $idTorneo = isset($_GET['id_torneo']) ? (int)$_GET['id_torneo'] : 0;

            if ($idTorneo <= 0) {
                throw new Exception("ID del torneo inválido.");
            }

            // Obtener el formato de torneo a partir del torneo
            $torneo = $this->torneoRepo->find($idTorneo);
            $formato = $torneo ? $torneo->formato_torneo : 'Desconocido';

            $partidos = $this->partidoRepo->findByTorneo($idTorneo);
            $result = [];

            foreach ($partidos as $p) {
                $result[] = [
                    'id_partido' => $p->id_partido,
                    'estado_partido' => $p->estado_partido,
                    'fecha_partido' => $p->fecha_partido,
                    'id_torneo' => $p->id_torneo,
                    'marcador_local' => $p->marcador_local,
                    'marcador_visitante' => $p->marcador_visitante,
                    'fase_jornada' => $p->fase_jornada,
                    'id_equipo_local' => $p->id_equipo_local,
                    'id_equipo_visitante' => $p->id_equipo_visitante,
                    'local' => $p->equipo_local_nombre ?: 'Libre',
                    'visitante' => $p->equipo_visitante_nombre ?: 'Libre'
                ];
            }

            echo json_encode([
                "formato" => $formato,
                "partidos" => $result
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Endpoint: guardar_marcador.php (POST)
     * Actualiza el marcador final y marca un partido como 'Finalizado'.
     */
    public function guardarMarcador(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_partido']) || !isset($input['marcador_local']) || !isset($input['marcador_visitante'])) {
                throw new Exception("Datos incompletos para actualizar el resultado.");
            }

            $idPartido = (int)$input['id_partido'];
            $marcadorLocal = (int)$input['marcador_local'];
            $marcadorVisitante = (int)$input['marcador_visitante'];
            $estado = $input['estado_partido'] ?? 'Finalizado';

            // Validaciones del marcador (deben ser positivos)
            if ($marcadorLocal < 0 || $marcadorVisitante < 0) {
                throw new Exception("Por favor, ingrese únicamente valores numéricos enteros positivos válidos para este deporte.");
            }

            if ($this->partidoRepo->actualizarMarcador($idPartido, $marcadorLocal, $marcadorVisitante, $estado)) {
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Marcador guardado exitosamente."
                ]);
            } else {
                throw new Exception("Error al actualizar el marcador.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }
}
