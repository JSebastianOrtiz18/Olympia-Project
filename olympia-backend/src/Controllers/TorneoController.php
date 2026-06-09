<?php
namespace Olympia\Controllers;

use Olympia\Core\Database;
use Olympia\Domain\Torneo;
use Olympia\Repositories\TorneoRepository;
use Exception;

/**
 * Clase TorneoController
 * Gestiona el flujo de peticiones HTTP para crear, recuperar y configurar torneos.
 */
class TorneoController {
    private TorneoRepository $torneoRepo;

    public function __construct() {
        $db = Database::getConnection();
        $this->torneoRepo = new TorneoRepository($db);
    }

    /**
     * Procesa la creación de un nuevo torneo.
     * Endpoint: guardar_torneo.php (POST)
     */
    public function guardarTorneo(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['nombre_torneo'])) {
                throw new Exception("Datos del torneo incompletos.");
            }

            // Instanciar entidad de dominio
            $torneo = new Torneo(
                $input['nombre_torneo'],
                $input['torneo_inicio'] ?? '',
                $input['torneo_fin'] ?? '',
                (int)($input['max_equipos'] ?? 0),
                $input['formato_torneo'] ?? '',
                $input['categoria_torneo'] ?? '',
                $input['deporte_torneo'] ?? ''
            );

            // Ejecutar validaciones del dominio
            $torneo->validarCoherenciaFechas();
            $torneo->validarFechaInicioNoPasada();
            $torneo->validarCapacidadSegunFormato();

            // Guardar en base de datos usando el repositorio
            if ($this->torneoRepo->save($torneo)) {
                $creadorDni = isset($input['creador_dni']) ? (int)$input['creador_dni'] : null;
                if ($creadorDni) {
                    $db = Database::getConnection();
                    $userRepo = new \Olympia\Repositories\UsuarioRepository($db);
                    $roles = $userRepo->getUserRoles($creadorDni);
                    $rolId = 2; // Organizador por defecto
                    if (in_array('SuperAdmin', $roles)) {
                        $rolId = 1; // Administrador/SuperAdmin
                    } elseif (in_array('Asistente', $roles)) {
                        $rolId = 3; // Asistente
                    }

                    $stmtColab = $db->prepare("
                        INSERT IGNORE INTO List_colaboradores (fecha_registro, dni_usuario, id_torneo, id_rol)
                        VALUES (CURDATE(), :dni, :id_torneo, :rol_id)
                    ");
                    $stmtColab->execute([
                        'dni' => $creadorDni,
                        'id_torneo' => $torneo->id_torneo,
                        'rol_id' => $rolId
                    ]);
                }

                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Torneo creado correctamente con el ID: " . $torneo->id_torneo
                ]);
            } else {
                throw new Exception("Error al guardar el torneo en la base de datos.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Recupera todos los torneos activos.
     * Endpoint: obtener_torneos.php (GET)
     */
    public function obtenerTorneos(): void {
        try {
            $torneos = $this->torneoRepo->findAll();
            $result = [];
            foreach ($torneos as $t) {
                $hoy = date('Y-m-d');
                $estado = 'Programado';
                if ($hoy > $t->torneo_fin) {
                    $estado = 'Finalizado';
                } elseif ($hoy >= $t->torneo_inicio && $hoy <= $t->torneo_fin) {
                    $estado = 'Activo';
                }

                $result[] = [
                    'id_torneo' => $t->id_torneo,
                    'nombre_torneo' => $t->nombre_torneo,
                    'torneo_inicio' => $t->torneo_inicio,
                    'torneo_fin' => $t->torneo_fin,
                    'max_equipos' => $t->max_equipos,
                    'formato_torneo' => $t->formato_torneo,
                    'categoria_torneo' => $t->categoria_torneo,
                    'deporte_torneo' => $t->deporte_torneo,
                    'pin_asistente' => $t->pin_asistente,
                    'estado' => $estado
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

    /**
     * Genera un PIN alfanumérico aleatorio de 6 dígitos para acceso temporal de asistentes.
     * Endpoint: gestionar_asignacion.php / pin (POST)
     */
    public function generarPinAsistente(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['id_torneo'])) {
                throw new Exception("ID del torneo no especificado.");
            }

            $idTorneo = (int)$input['id_torneo'];
            $torneo = $this->torneoRepo->find($idTorneo);

            if (!$torneo) {
                throw new Exception("El torneo especificado no existe.");
            }

            // Algoritmo de generación de PIN alfanumérico único de 6 caracteres
            $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            $pin = '';
            for ($i = 0; $i < 6; $i++) {
                $pin .= $caracteres[rand(0, strlen($caracteres) - 1)];
            }

            $torneo->pin_asistente = $pin;

            if ($this->torneoRepo->save($torneo)) {
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "¡Código PIN generado para asistentes: $pin!",
                    "pin" => $pin
                ]);
            } else {
                throw new Exception("Error al almacenar el código PIN.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    public function obtenerDeportes(): void {
        try {
            $db = Database::getConnection();
            $stmt = $db->query("SELECT id_deporte, nombre_deporte FROM Deporte");
            $deportes = $stmt->fetchAll();
            echo json_encode($deportes);
        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Valida el PIN de asistente y retorna el id_torneo y nombre del torneo correspondientes.
     * Endpoint: verificar_pin.php (POST)
     */
    public function verificarPin(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['pin'])) {
                throw new Exception("El código PIN no fue especificado.");
            }

            $pin = trim($input['pin']);
            $torneo = $this->torneoRepo->findByPin($pin);

            if ($torneo) {
                echo json_encode([
                    "status" => "success",
                    "id_torneo" => $torneo->id_torneo,
                    "nombre_torneo" => $torneo->nombre_torneo
                ]);
            } else {
                throw new Exception("El código PIN ingresado es incorrecto o ya ha expirado.");
            }

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }
}

