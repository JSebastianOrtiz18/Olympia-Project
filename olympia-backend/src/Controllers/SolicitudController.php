<?php
namespace Olympia\Controllers;

use Olympia\Core\Database;
use Olympia\Domain\Solicitud;
use Olympia\Repositories\SolicitudRepository;
use Olympia\Repositories\TorneoRepository;
use Olympia\Repositories\EquipoRepository;
use Exception;

/**
 * Clase SolicitudController
 * Gestiona el ciclo de vida de las solicitudes de inscripción enviadas por los capitanes.
 */
class SolicitudController {
    private SolicitudRepository $solicitudRepo;
    private TorneoRepository $torneoRepo;
    private EquipoRepository $equipoRepo;

    public function __construct() {
        $db = Database::getConnection();
        $this->solicitudRepo = new SolicitudRepository($db);
        $this->torneoRepo = new TorneoRepository($db);
        $this->equipoRepo = new EquipoRepository($db);
    }

    /**
     * Guarda una solicitud de inscripción, aplicando las validaciones de negocio del dominio.
     * Endpoint: guardar_solicitud.php (POST)
     */
    public function guardarSolicitud(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_torneo']) || !isset($input['id_equipo'])) {
                throw new Exception("Datos incompletos.");
            }

            $idTorneo = (int)$input['id_torneo'];
            $idEquipo = (int)$input['id_equipo'];

            // 1. Cargar Entidades de Dominio
            $torneo = $this->torneoRepo->find($idTorneo);
            if (!$torneo) {
                throw new Exception("El torneo especificado no existe.");
            }

            $equipo = $this->equipoRepo->find($idEquipo);
            if (!$equipo) {
                throw new Exception("El equipo especificado no existe.");
            }

            // 2. Verificar duplicados
            if ($this->solicitudRepo->checkDuplicada($idEquipo, $idTorneo)) {
                throw new Exception("Ya has solicitado la inscripción de '{$equipo->nombre_equipo}' en este torneo.");
            }

            // 3. Obtener cantidad de jugadores en plantilla
            $cantJugadores = $this->equipoRepo->obtenerCantidadJugadores($idEquipo);

            // 4. Instanciar y validar Reglas en el Dominio
            $solicitud = new Solicitud($idTorneo, $idEquipo, 'Pendiente');
            $solicitud->validarReglasInscripcion($equipo, $torneo, $cantJugadores);

            // 5. Guardar
            if ($this->solicitudRepo->save($solicitud)) {
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "¡Solicitud enviada para {$equipo->nombre_equipo}! El organizador la revisará.",
                    "id_solicitud" => $solicitud->id_solicitud
                ]);
            } else {
                throw new Exception("Error al persistir la solicitud en el servidor.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Procesa la aprobación o rechazo de una solicitud por parte del Organizador.
     * Endpoint: procesar_solicitud.php (POST)
     */
    public function procesarSolicitud(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_solicitud']) || !isset($input['accion'])) {
                throw new Exception("Datos incompletos.");
            }

            $idSolicitud = $input['id_solicitud'];
            $accion = strtolower($input['accion']);

            $solicitud = $this->solicitudRepo->find($idSolicitud);
            if (!$solicitud) {
                throw new Exception("La solicitud especificada no existe.");
            }

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                if ($accion === 'aprobar') {
                    // Actualizar el estado en la base de datos
                    $this->solicitudRepo->updateEstado($idSolicitud, 'Aprobado');

                    // Inscribir al equipo en el torneo (insertar en Torneo_equipo)
                    if (!$this->equipoRepo->inscribirEnTorneo($solicitud->id_equipo, $solicitud->id_torneo)) {
                        throw new Exception("Error al inscribir al equipo en el torneo.");
                    }

                    $db->commit();
                    echo json_encode([
                        "status" => "success",
                        "mensaje" => "Solicitud aprobada y equipo inscrito exitosamente."
                    ]);

                } elseif ($accion === 'rechazar') {
                    $this->solicitudRepo->updateEstado($idSolicitud, 'Rechazado');
                    $db->commit();
                    echo json_encode([
                        "status" => "success",
                        "mensaje" => "Solicitud rechazada correctamente."
                    ]);
                } else {
                    throw new Exception("Acción no reconocida.");
                }

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

    /**
     * Obtiene la lista de todas las solicitudes enviadas.
     * Opcionalmente utilizado por el panel del organizador.
     */
    public function obtenerSolicitudes(): void {
        try {
            $solicitudes = $this->solicitudRepo->findAll();
            $result = [];

            foreach ($solicitudes as $s) {
                $result[] = [
                    'id' => $s->id_solicitud,
                    'idTorneo' => $s->id_torneo,
                    'nombreTorneo' => $s->nombre_torneo,
                    'idEquipo' => $s->id_equipo,
                    'nombreEquipo' => $s->nombre_equipo,
                    'deporte' => $s->deporte_torneo,
                    'estado' => $s->estado_solicitud,
                    'fechaSolicitud' => $s->fecha_solicitud
                ];
            }

            echo json_encode($result);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }
}
