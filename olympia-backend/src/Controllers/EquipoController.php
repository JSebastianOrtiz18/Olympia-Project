<?php
namespace Olympia\Controllers;

use Olympia\Core\Database;
use Olympia\Domain\Equipo;
use Olympia\Repositories\EquipoRepository;
use Exception;

/**
 * Clase EquipoController
 * Gestiona el flujo de peticiones relacionadas con el registro, asignación y consulta de equipos.
 */
class EquipoController {
    private EquipoRepository $equipoRepo;

    public function __construct() {
        $db = Database::getConnection();
        $this->equipoRepo = new EquipoRepository($db);
    }

    /**
     * Guarda un nuevo equipo y opcionalmente lo inscribe a un torneo en una sola transacción.
     * Endpoint: guardar_equipo.php (POST)
     */
    public function guardarEquipo(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['nombre_equipo'])) {
                throw new Exception("Faltan datos obligatorios del equipo.");
            }

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                $equipo = new Equipo(
                    $input['nombre_equipo'],
                    $input['descripcion_equipo'] ?? '',
                    $input['categoria_equipo'] ?? '',
                    $input['deporte_equipo'] ?? ''
                );

                if (!$this->equipoRepo->save($equipo)) {
                    throw new Exception("Error al insertar el equipo.");
                }

                // Si se envió un torneo asignado, inscribir inmediatamente
                if (!empty($input['id_torneo'])) {
                    $idTorneo = (int)$input['id_torneo'];
                    if (!$this->equipoRepo->inscribirEnTorneo($equipo->id_equipo, $idTorneo)) {
                        throw new Exception("Error al vincular el equipo al torneo.");
                    }
                }

                $db->commit();
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Equipo registrado exitosamente",
                    "id_equipo" => $equipo->id_equipo
                ]);

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => "Fallo en la transacción: " . $e->getMessage()
            ]);
        }
    }

    /**
     * Obtiene los equipos asignados a un torneo en particular.
     * Endpoint: obtener_equipos_torneo.php (GET)
     */
    public function obtenerEquiposTorneo(): void {
        try {
            $idTorneo = isset($_GET['id_torneo']) ? (int)$_GET['id_torneo'] : 0;

            if ($idTorneo <= 0) {
                throw new Exception("ID del torneo inválido.");
            }

            // Cargar detalles del torneo para obtener max_equipos
            $db = Database::getConnection();
            $torneoRepo = new \Olympia\Repositories\TorneoRepository($db);
            $torneo = $torneoRepo->find($idTorneo);

            if (!$torneo) {
                throw new Exception("El torneo no existe.");
            }

            // Obtener equipos asignados (inscriptos)
            $asignadosRaw = $this->equipoRepo->findByTorneo($idTorneo);
            $asignados = [];
            foreach ($asignadosRaw as $e) {
                $asignados[] = [
                    'id_equipo' => $e->id_equipo,
                    'nombre_equipo' => $e->nombre_equipo,
                    'descripcion_equipo' => $e->descripcion_equipo,
                    'categoria_equipo' => $e->categoria_equipo,
                    'deporte_equipo' => $e->deporte_equipo
                ];
            }

            // Obtener equipos disponibles (misma disciplina, no inscriptos)
            $disponiblesRaw = $this->equipoRepo->findAvailableForTorneo($idTorneo);
            $disponibles = [];
            foreach ($disponiblesRaw as $e) {
                $disponibles[] = [
                    'id_equipo' => $e->id_equipo,
                    'nombre_equipo' => $e->nombre_equipo,
                    'descripcion_equipo' => $e->descripcion_equipo,
                    'categoria_equipo' => $e->categoria_equipo,
                    'deporte_equipo' => $e->deporte_equipo
                ];
            }

            echo json_encode([
                'disponibles' => $disponibles,
                'asignados' => $asignados,
                'max_equipos' => $torneo->max_equipos,
                'pin_asistente' => $torneo->pin_asistente
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Gestiona la inscripción o remoción individual de un equipo en un torneo.
     * Endpoint: gestionar_asignacion.php (POST)
     */
    public function gestionarAsignacion(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_torneo']) || !isset($input['id_equipo']) || !isset($input['accion'])) {
                throw new Exception("Datos incompletos.");
            }

            $idTorneo = (int)$input['id_torneo'];
            $idEquipo = (int)$input['id_equipo'];
            $accion = $input['accion'];

            if ($accion === 'asignar') {
                if ($this->equipoRepo->inscribirEnTorneo($idEquipo, $idTorneo)) {
                    echo json_encode(["status" => "success", "mensaje" => "Equipo asignado"]);
                } else {
                    throw new Exception("Error al asignar equipo.");
                }
            } elseif ($accion === 'remover') {
                if ($this->equipoRepo->desinscribirDeTorneo($idEquipo, $idTorneo)) {
                    echo json_encode(["status" => "success", "mensaje" => "Equipo removido"]);
                } else {
                    throw new Exception("Error al remover equipo.");
                }
            } else {
                throw new Exception("Acción no válida.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    public function guardarAsignacionesBatch(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_torneo']) || !isset($input['equipos'])) {
                throw new Exception("Datos incompletos para asignación por lote.");
            }

            $idTorneo = (int)$input['id_torneo'];
            $equiposIds = $input['equipos']; // Array de enteros

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                // Borrar inscripciones previas de este torneo
                $stmtDel = $db->prepare("DELETE FROM Torneo_equipo WHERE id_torneo = :id_torneo");
                $stmtDel->execute(['id_torneo' => $idTorneo]);

                // Insertar las nuevas asignaciones
                foreach ($equiposIds as $idEquipo) {
                    $this->equipoRepo->inscribirEnTorneo((int)$idEquipo, $idTorneo);
                }

                $db->commit();
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Asignaciones guardadas correctamente para el torneo: " . $idTorneo
                ]);

            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }
}
