<?php
namespace Olympia\Repositories;

use Olympia\Domain\Solicitud;
use PDO;
use Exception;

/**
 * Clase SolicitudRepository
 * Proporciona el mapeo de persistencia SQL para las solicitudes de inscripción.
 * Cuenta con auto-creación de la tabla Solicitud si no existe en la base de datos de destino.
 */
class SolicitudRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->asegurarTablaExiste();
    }

    /**
     * Asegura la existencia de la tabla Solicitud en la base de datos MySQL.
     */
    private function asegurarTablaExiste(): void {
        try {
            $this->db->query("SELECT 1 FROM Solicitud LIMIT 1");
        } catch (\PDOException $e) {
            // Si arroja excepción, significa que la tabla no existe en db_olympia
            $sql = "
                CREATE TABLE IF NOT EXISTS Solicitud (
                    id_solicitud VARCHAR(50) NOT NULL,
                    id_torneo INT NOT NULL,
                    id_equipo INT NOT NULL,
                    estado_solicitud VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
                    fecha_solicitud DATE NOT NULL,
                    PRIMARY KEY (id_solicitud),
                    FOREIGN KEY (id_torneo) REFERENCES Torneo(id_torneo) ON DELETE CASCADE,
                    FOREIGN KEY (id_equipo) REFERENCES Equipo(id_equipo) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ";
            $this->db->exec($sql);
        }
    }

    /**
     * Busca una solicitud por su ID.
     */
    public function find(string $id_solicitud): ?Solicitud {
        $stmt = $this->db->prepare("SELECT * FROM Solicitud WHERE id_solicitud = :id");
        $stmt->execute(['id' => $id_solicitud]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Solicitud(
            (int)$row['id_torneo'],
            (int)$row['id_equipo'],
            $row['estado_solicitud'],
            $row['fecha_solicitud'],
            $row['id_solicitud']
        );
    }

    /**
     * Recupera todas las solicitudes del sistema con información de equipo y torneo.
     */
    public function findAll(): array {
        $stmt = $this->db->query("
            SELECT s.*, t.nombre_torneo, e.nombre_equipo, t.deporte_torneo
            FROM Solicitud s
            INNER JOIN Torneo t ON s.id_torneo = t.id_torneo
            INNER JOIN Equipo e ON s.id_equipo = e.id_equipo
            ORDER BY s.fecha_solicitud DESC
        ");
        
        $solicitudes = [];
        while ($row = $stmt->fetch()) {
            $sol = new Solicitud(
                (int)$row['id_torneo'],
                (int)$row['id_equipo'],
                $row['estado_solicitud'],
                $row['fecha_solicitud'],
                $row['id_solicitud']
            );
            $sol->nombre_torneo = $row['nombre_torneo'];
            $sol->nombre_equipo = $row['nombre_equipo'];
            $sol->deporte_torneo = $row['deporte_torneo'];
            $solicitudes[] = $sol;
        }

        return $solicitudes;
    }

    /**
     * Guarda una solicitud en la base de datos.
     */
    public function save(Solicitud $solicitud): bool {
        if ($solicitud->id_solicitud === null) {
            $solicitud->id_solicitud = 'sol_' . round(microtime(true) * 1000);
        }

        // Verificar si ya existe para hacer insert o update
        $stmtCheck = $this->db->prepare("SELECT 1 FROM Solicitud WHERE id_solicitud = :id");
        $stmtCheck->execute(['id' => $solicitud->id_solicitud]);
        
        if ($stmtCheck->fetch()) {
            $stmt = $this->db->prepare("
                UPDATE Solicitud
                SET id_torneo = :id_torneo,
                    id_equipo = :id_equipo,
                    estado_solicitud = :estado,
                    fecha_solicitud = :fecha
                WHERE id_solicitud = :id
            ");
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO Solicitud (id_solicitud, id_torneo, id_equipo, estado_solicitud, fecha_solicitud)
                VALUES (:id, :id_torneo, :id_equipo, :estado, :fecha)
            ");
        }

        return $stmt->execute([
            'id' => $solicitud->id_solicitud,
            'id_torneo' => $solicitud->id_torneo,
            'id_equipo' => $solicitud->id_equipo,
            'estado' => $solicitud->estado_solicitud,
            'fecha' => $solicitud->fecha_solicitud
        ]);
    }

    /**
     * Actualiza el estado de una solicitud.
     */
    public function updateEstado(string $id_solicitud, string $estado): bool {
        $stmt = $this->db->prepare("UPDATE Solicitud SET estado_solicitud = :estado WHERE id_solicitud = :id");
        return $stmt->execute([
            'id' => $id_solicitud,
            'estado' => $estado
        ]);
    }

    /**
     * Verifica si ya existe una solicitud activa (Pendiente o Aprobada) para el binomio equipo/torneo.
     */
    public function checkDuplicada(int $id_equipo, int $id_torneo): bool {
        $stmt = $this->db->prepare("
            SELECT 1 FROM Solicitud 
            WHERE id_equipo = :id_equipo AND id_torneo = :id_torneo AND estado_solicitud IN ('Pendiente', 'Aprobado')
        ");
        $stmt->execute(['id_equipo' => $id_equipo, 'id_torneo' => $id_torneo]);
        return (bool)$stmt->fetch();
    }
}
