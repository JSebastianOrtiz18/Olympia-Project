<?php
namespace Olympia\Controllers;

use Olympia\Core\Database;
use Olympia\Domain\Usuario;
use Olympia\Repositories\UsuarioRepository;
use Exception;

/**
 * Clase UsuarioController
 * Controla el flujo de peticiones relacionadas con los usuarios del sistema.
 */
class UsuarioController {
    private UsuarioRepository $usuarioRepo;

    public function __construct() {
        $db = Database::getConnection();
        $this->usuarioRepo = new UsuarioRepository($db);
    }

    /**
     * Obtiene el listado completo de usuarios y sus roles asignados.
     * Endpoint: obtener_usuario.php (GET)
     */
    public function obtenerUsuarios(): void {
        try {
            $usuarios = $this->usuarioRepo->findAllWithRoles();
            echo json_encode($usuarios);
        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Guarda un nuevo colaborador (Asistente / Organizador) y le asigna su rol.
     * Endpoint: guardar_colaborador.php (POST)
     */
    public function guardarColaborador(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['dni_usuario']) || !isset($input['nombre_usuario']) || !isset($input['email'])) {
                throw new Exception("Datos del colaborador incompletos.");
            }

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                $usuario = new Usuario(
                    (int)$input['dni_usuario'],
                    $input['nombre_usuario'],
                    $input['apellido_usuario'] ?? '',
                    $input['fecha_nac'] ?? '2000-01-01',
                    $input['email'],
                    isset($input['telefono_usuario']) ? (int)$input['telefono_usuario'] : null
                );

                // Validar email del dominio
                $usuario->validarEmail();

                // Guardar usuario
                if (!$this->usuarioRepo->save($usuario)) {
                    throw new Exception("Error al insertar al usuario.");
                }

                // Asignar rol de Asistente (id_rol = 3) u Organizador (id_rol = 2)
                $rolNombre = strtolower($input['rol'] ?? 'asistente');
                $idRol = ($rolNombre === 'organizador') ? 2 : 3;

                // Verificar si ya tiene el rol asignado
                $stmtCheck = $db->prepare("SELECT 1 FROM Usuario_rol WHERE dni_usuario = :dni AND id_rol = :id_rol");
                $stmtCheck->execute(['dni' => $usuario->dni_usuario, 'id_rol' => $idRol]);
                if (!$stmtCheck->fetch()) {
                    $stmtRol = $db->prepare("INSERT INTO Usuario_rol (dni_usuario, id_rol) VALUES (:dni, :id_rol)");
                    $stmtRol->execute(['dni' => $usuario->dni_usuario, 'id_rol' => $idRol]);
                }

                // Si se especifica torneo, agregarlo como colaborador
                if (!empty($input['id_torneo'])) {
                    $idTorneo = (int)$input['id_torneo'];
                    $stmtCol = $db->prepare("
                        INSERT INTO List_colaboradores (fecha_registro, dni_usuario, id_torneo, id_rol)
                        VALUES (:fecha, :dni, :id_torneo, :id_rol)
                        ON DUPLICATE KEY UPDATE fecha_registro = :fecha, id_rol = :id_rol
                    ");
                    $stmtCol->execute([
                        'fecha' => date('Y-m-d'),
                        'dni' => $usuario->dni_usuario,
                        'id_torneo' => $idTorneo,
                        'id_rol' => $idRol
                    ]);
                }

                $db->commit();
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Colaborador guardado correctamente."
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

    /**
     * Guarda un nuevo jugador como Usuario e inscribe al jugador en la plantilla de un equipo.
     * Endpoint: guardar_jugador.php (POST)
     */
    public function guardarJugador(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            // Obtener DNI con compatibilidad dual de llaves
            $dni = $input['dniJugador'] ?? $input['dni_jugador'] ?? null;
            if (!$dni) {
                throw new Exception("Error: No se recibió el DNI del jugador.");
            }

            $nombre = trim($input['nombre'] ?? $input['nombre_jugador'] ?? '');
            $apellido = trim($input['apellido'] ?? $input['apellido_jugador'] ?? '');
            $fechaNac = $input['fechaNacimiento'] ?? $input['fecha_nac'] ?? '2000-01-01';
            $correo = $input['correoElectronico'] ?? $input['email'] ?? ($dni . '@olympia.com');
            $telefono = $input['telefono'] ?? $input['telefono_usuario'] ?? null;
            $idEquipo = $input['id_equipo'] ?? $input['idEquipo'] ?? null;

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                $usuario = new Usuario(
                    (int)$dni,
                    $nombre,
                    $apellido,
                    $fechaNac,
                    $correo,
                    $telefono !== null ? (int)$telefono : null
                );

                // Validar email
                $usuario->validarEmail();

                // Guardar usuario en base de datos
                if (!$this->usuarioRepo->save($usuario)) {
                    throw new Exception("Error al guardar el jugador en la base de datos.");
                }

                // Si se especificó un equipo, asociarlo a la plantilla
                if ($idEquipo !== null) {
                    $idEquipo = (int)$idEquipo;
                    
                    // Verificar si ya está en la plantilla
                    $stmtCheck = $db->prepare("SELECT 1 FROM Plantilla_equipo WHERE id_equipo = :id_equipo AND dni_usuario = :dni");
                    $stmtCheck->execute(['id_equipo' => $idEquipo, 'dni' => $dni]);
                    
                    if (!$stmtCheck->fetch()) {
                        $stmtPlantilla = $db->prepare("
                            INSERT INTO Plantilla_equipo (posicion_equipo, nro_dorsal, id_equipo, dni_usuario)
                            VALUES ('Jugador', 10, :id_equipo, :dni)
                        ");
                        $stmtPlantilla->execute(['id_equipo' => $idEquipo, 'dni' => $dni]);
                    }
                }

                $db->commit();
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Jugador insertado como Usuario. (Asignado a plantilla exitosamente)"
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

