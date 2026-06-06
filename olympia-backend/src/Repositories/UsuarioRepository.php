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
                   COALESCE(GROUP_CONCAT(R.nombre_rol SEPARATOR ', '), 'Sin rol asignado') AS roles_asignados 
            FROM Usuario U 
            LEFT JOIN Usuario_rol UR ON U.dni_usuario = UR.dni_usuario 
            LEFT JOIN Rol R ON UR.id_rol = R.id_rol 
            GROUP BY U.dni_usuario 
            ORDER BY U.nombre_usuario ASC
        ";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
