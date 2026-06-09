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
     * Inicia sesión de un usuario.
     * Endpoint: login.php (POST)
     */
    public function loginUsuario(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['email']) || !isset($input['password'])) {
                throw new Exception("Correo y contraseña son requeridos.");
            }

            $email = trim($input['email']);
            $password = $input['password'];

            $usuario = $this->usuarioRepo->findByEmail($email);
            if (!$usuario) {
                throw new Exception("El correo electrónico no se encuentra registrado.");
            }

            // Verificar contraseña
            if (!password_verify($password, $usuario->password_hash)) {
                throw new Exception("Contraseña incorrecta.");
            }

            // Obtener roles del usuario
            $roles = $this->usuarioRepo->getUserRoles($usuario->dni_usuario);

            // Determinar rol prioritario para devolver en el token de la sesión.
            // Prioridad: SuperAdmin > Organizador > Asistente > Capitán
            $rolSeleccionado = 'Capitán';
            if (in_array('SuperAdmin', $roles)) {
                $rolSeleccionado = 'SuperAdmin';
            } elseif (in_array('Organizador', $roles)) {
                $rolSeleccionado = 'Organizador';
            } elseif (in_array('Asistente', $roles)) {
                $rolSeleccionado = 'Asistente';
            }

            echo json_encode([
                "status" => "success",
                "mensaje" => "Inicio de sesión exitoso.",
                "user" => [
                    "dni" => $usuario->dni_usuario,
                    "nombre" => $usuario->nombre_usuario,
                    "apellido" => $usuario->apellido_usuario,
                    "email" => $usuario->email,
                    "telefono" => $usuario->telefono_usuario,
                    "rol" => $rolSeleccionado,
                    "roles" => $roles
                ]
            ]);

        } catch (Exception $e) {
            echo json_encode([
                "status" => "error",
                "mensaje" => $e->getMessage()
            ]);
        }
    }

    /**
     * Registra un nuevo usuario en la plataforma.
     * Endpoint: registro.php (POST)
     */
    public function registrarUsuario(): void {
        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (!$input || !isset($input['nombre']) || !isset($input['apellido']) || !isset($input['dni']) || !isset($input['fechaNac']) || !isset($input['email']) || !isset($input['password'])) {
                throw new Exception("Datos de registro incompletos.");
            }

            $dni = (int)$input['dni'];
            $nombre = trim($input['nombre']);
            $apellido = trim($input['apellido']);
            $fechaNac = $input['fechaNac'];
            $email = trim($input['email']);
            $telefono = isset($input['telefono']) && $input['telefono'] !== '' ? (int)$input['telefono'] : null;
            $password = $input['password'];

            if (strlen($password) < 8) {
                throw new Exception("La contraseña debe tener al menos 8 caracteres.");
            }

            // Verificar si el DNI ya está registrado
            if ($this->usuarioRepo->find($dni)) {
                throw new Exception("El DNI ya se encuentra registrado en el sistema.");
            }

            // Verificar si el email ya está registrado
            if ($this->usuarioRepo->findByEmail($email)) {
                throw new Exception("El correo electrónico ya se encuentra registrado en el sistema.");
            }

            // Hashear contraseña
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $usuario = new Usuario(
                $dni,
                $nombre,
                $apellido,
                $fechaNac,
                $email,
                $telefono,
                $passwordHash
            );

            // Validar email
            $usuario->validarEmail();

            if ($this->usuarioRepo->save($usuario)) {
                echo json_encode([
                    "status" => "success",
                    "mensaje" => "Registro exitoso.",
                    "user" => [
                        "dni" => $usuario->dni_usuario,
                        "nombre" => $usuario->nombre_usuario,
                        "apellido" => $usuario->apellido_usuario,
                        "email" => $usuario->email,
                        "telefono" => $usuario->telefono_usuario,
                        "rol" => "Capitán"
                    ]
                ]);
            } else {
                throw new Exception("Error al guardar el usuario en la base de datos.");
            }

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

            $dni = $input['dni_usuario'] ?? $input['dni'] ?? null;
            $nombre = $input['nombre_usuario'] ?? $input['nombre'] ?? '';
            $apellido = $input['apellido_usuario'] ?? $input['apellido'] ?? '';
            $fechaNac = $input['fecha_nac'] ?? $input['fechaNac'] ?? '2000-01-01';
            $email = $input['email'] ?? '';
            $telefono = $input['telefono_usuario'] ?? $input['telefono'] ?? null;

            if (!$dni || !$nombre || !$email) {
                throw new Exception("Datos del colaborador incompletos.");
            }

            $db = Database::getConnection();
            $db->beginTransaction();

            try {
                $usuario = new Usuario(
                    (int)$dni,
                    $nombre,
                    $apellido,
                    $fechaNac,
                    $email,
                    $telefono !== null ? (int)$telefono : null
                );

                // Validar email del dominio
                $usuario->validarEmail();

                // Guardar usuario
                if (!$this->usuarioRepo->save($usuario)) {
                    throw new Exception("Error al insertar al usuario.");
                }

                // Obtener ID del rol (Asistente = 3, Organizador = 2)
                $rolNombre = strtolower($input['rol'] ?? 'asistente');
                $idRol = ($rolNombre === 'organizador' || $rolNombre === '2') ? 2 : 3;

                // Si se especifica torneo, agregarlo como colaborador.
                // Si no, podemos asociarlo a un torneo ficticio o por defecto si es requerido, o simplemente omitir.
                // Generalmente se añade a List_colaboradores para un torneo.
                $idTorneo = !empty($input['id_torneo']) ? (int)$input['id_torneo'] : 1; // Fallback a Torneo 1 si no se especifica

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

