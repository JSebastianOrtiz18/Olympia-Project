<?php
namespace Olympia\Repositories;

use Olympia\Domain\Usuario;
use PDO;
use Exception;

/**
 * Clase UsuarioRepository
 * Encargada de la persistencia y recuperación de datos de la entidad Usuario.
 */
class UsuarioRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Busca un usuario por DNI.
     */
    public function find(int $dni_usuario): ?Usuario {
        $stmt = $this->db->prepare("SELECT * FROM Usuario WHERE dni_usuario = :dni");
        $stmt->execute(['dni' => $dni_usuario]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Usuario(
            (int)$row['dni_usuario'],
            $row['nombre_usuario'],
            $row['apellido_usuario'],
            $row['fecha_nac'],
            $row['email'],
            isset($row['telefono_usuario']) ? (int)$row['telefono_usuario'] : null,
            $row['password_hash']
        );
    }

    /**
     * Trae todos los usuarios junto con sus roles concatenados.
     */
    public function findAllWithRoles(): array {
        $sql = "
            SELECT U.dni_usuario, 
                   U.nombre_usuario, 
                   U.apellido_usuario, 
                   U.email, 
                   U.fecha_nac,
                   U.telefono_usuario,
                   COALESCE(
                       (
                           SELECT GROUP_CONCAT(rol_nombre SEPARATOR ', ')
                           FROM (
                               SELECT DISTINCT R.nombre_rol AS rol_nombre
                               FROM List_colaboradores LC
                               INNER JOIN Rol R ON LC.id_rol = R.id_rol
                               WHERE LC.dni_usuario = U.dni_usuario
                               UNION
                               SELECT DISTINCT 'Capitán' AS rol_nombre
                               FROM Plantilla_equipo PE
                               WHERE PE.dni_usuario = U.dni_usuario AND PE.posicion_equipo = 'Capitán'
                           ) AS temp_roles
                       ),
                       'Sin rol asignado'
                   ) AS roles_asignados 
            FROM Usuario U 
            ORDER BY U.nombre_usuario ASC
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un usuario por email.
     */
    public function findByEmail(string $email): ?Usuario {
        $stmt = $this->db->prepare("SELECT * FROM Usuario WHERE LOWER(email) = LOWER(:email)");
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Usuario(
            (int)$row['dni_usuario'],
            $row['nombre_usuario'],
            $row['apellido_usuario'],
            $row['fecha_nac'],
            $row['email'],
            isset($row['telefono_usuario']) ? (int)$row['telefono_usuario'] : null,
            $row['password_hash']
        );
    }

    /**
     * Obtiene todos los roles asignados a un usuario.
     */
    public function getUserRoles(int $dni_usuario): array {
        // Buscar roles de colaborador
        $stmt = $this->db->prepare("
            SELECT DISTINCT R.nombre_rol 
            FROM List_colaboradores LC
            INNER JOIN Rol R ON LC.id_rol = R.id_rol
            WHERE LC.dni_usuario = :dni
        ");
        $stmt->execute(['dni' => $dni_usuario]);
        $colabRoles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Buscar si es Capitán en Plantilla_equipo
        $stmtCap = $this->db->prepare("
            SELECT 1 
            FROM Plantilla_equipo 
            WHERE dni_usuario = :dni AND posicion_equipo = 'Capitán'
            LIMIT 1
        ");
        $stmtCap->execute(['dni' => $dni_usuario]);
        $isCap = $stmtCap->fetch();

        $roles = [];
        foreach ($colabRoles as $role) {
            if ($role === 'Administrador') {
                $roles[] = 'SuperAdmin';
            } elseif ($role === 'Organizador') {
                $roles[] = 'Organizador';
            } elseif ($role === 'Asistente') {
                $roles[] = 'Asistente';
            }
        }

        if ($isCap) {
            $roles[] = 'Capitán';
        }

        if (empty($roles)) {
            $roles[] = 'Capitán'; // Rol por defecto si no tiene otro
        }

        return array_unique($roles);
    }

    /**
     * Guarda (inserta o actualiza) un usuario.
     */
    public function save(Usuario $usuario): bool {
        // Verificar si ya existe para hacer insert o update
        $stmtCheck = $this->db->prepare("SELECT 1 FROM Usuario WHERE dni_usuario = :dni");
        $stmtCheck->execute(['dni' => $usuario->dni_usuario]);

        if ($stmtCheck->fetch()) {
            $stmt = $this->db->prepare("
                UPDATE Usuario
                SET nombre_usuario = :nombre,
                    apellido_usuario = :apellido,
                    fecha_nac = :fecha_nac,
                    email = :email,
                    telefono_usuario = :telefono,
                    password_hash = :pass
                WHERE dni_usuario = :dni
            ");
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO Usuario (dni_usuario, nombre_usuario, apellido_usuario, fecha_nac, email, telefono_usuario, password_hash)
                VALUES (:dni, :nombre, :apellido, :fecha_nac, :email, :telefono, :pass)
            ");
        }

        return $stmt->execute([
            'dni' => $usuario->dni_usuario,
            'nombre' => $usuario->nombre_usuario,
            'apellido' => $usuario->apellido_usuario,
            'fecha_nac' => $usuario->fecha_nac,
            'email' => $usuario->email,
            'telefono' => $usuario->telefono_usuario,
            'pass' => $usuario->password_hash ?? password_hash('olympia123', PASSWORD_DEFAULT)
        ]);
    }
}
