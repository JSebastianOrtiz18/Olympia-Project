<?php
namespace Olympia\Repositories;

use Olympia\Domain\Partido;
use PDO;
use Exception;

/**
 * Clase PartidoRepository (Versión Normalizada 3NF)
 * Encargada de persistir y recuperar los datos de los partidos mapeando a las tablas normalizadas
 * Partido (información del encuentro) y Resultado_partido (relación de local/visitante y puntuación).
 */
class PartidoRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->asegurarColumnasYTablas();
    }

    /**
     * Asegura la existencia de las columnas necesarias en base de datos.
     */
    private function asegurarColumnasYTablas(): void {
        // Asegurar fase_jornada en Partido
        try {
            $this->db->query("SELECT fase_jornada FROM Partido LIMIT 1");
        } catch (\PDOException $e) {
            try {
                $this->db->exec("ALTER TABLE Partido ADD COLUMN fase_jornada VARCHAR(50) NOT NULL DEFAULT 'Fase Única'");
            } catch (Exception $ex) {
                // Silenciar si ya existe por condiciones concurrentes
            }
        }
    }

    /**
     * Busca un partido por su ID reconstructurándolo desde las tablas normalizadas.
     */
    public function find(int $id_partido): ?Partido {
        $stmt = $this->db->prepare("SELECT * FROM Partido WHERE id_partido = :id");
        $stmt->execute(['id' => $id_partido]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        // Recuperar local y visitante desde Resultado_partido
        $stmtRes = $this->db->prepare("SELECT id_equipo, condicion, puntuacion FROM Resultado_partido WHERE id_partido = :id");
        $stmtRes->execute(['id' => $id_partido]);
        
        $idLocal = null;
        $idVisitante = null;
        $scoreLocal = 0;
        $scoreVisitante = 0;

        while ($resRow = $stmtRes->fetch()) {
            if ($resRow['condicion'] === 'Local') {
                $idLocal = (int)$resRow['id_equipo'];
                $scoreLocal = (int)$resRow['puntuacion'];
            } elseif ($resRow['condicion'] === 'Visitante') {
                $idVisitante = (int)$resRow['id_equipo'];
                $scoreVisitante = (int)$resRow['puntuacion'];
            }
        }

        return new Partido(
            $row['estado_partido'],
            $row['fecha_partido'],
            (int)$row['id_torneo'],
            $row['fase_jornada'],
            $idLocal,
            $idVisitante,
            $scoreLocal,
            $scoreVisitante,
            (int)$row['id_partido']
        );
    }

    /**
     * Recupera el fixture completo de un torneo, mapeando a la relación 3NF de Resultado_partido.
     */
    public function findByTorneo(int $id_torneo): array {
        // Query de doble JOIN para traer ambos equipos y sus puntuaciones en una sola consulta
        $stmt = $this->db->prepare("
            SELECT p.*, 
                   rl.id_equipo AS id_equipo_local, 
                   rl.puntuacion AS marcador_local, 
                   el.nombre_equipo AS equipo_local_nombre, 
                   rv.id_equipo AS id_equipo_visitante, 
                   rv.puntuacion AS marcador_visitante, 
                   ev.nombre_equipo AS equipo_visitante_nombre
            FROM Partido p
            LEFT JOIN Resultado_partido rl ON p.id_partido = rl.id_partido AND rl.condicion = 'Local'
            LEFT JOIN Equipo el ON rl.id_equipo = el.id_equipo
            LEFT JOIN Resultado_partido rv ON p.id_partido = rv.id_partido AND rv.condicion = 'Visitante'
            LEFT JOIN Equipo ev ON rv.id_equipo = ev.id_equipo
            WHERE p.id_torneo = :id_torneo
            ORDER BY p.fase_jornada ASC, p.id_partido ASC
        ");
        
        $stmt->execute(['id_torneo' => $id_torneo]);
        $partidos = [];

        while ($row = $stmt->fetch()) {
            $partido = new Partido(
                $row['estado_partido'],
                $row['fecha_partido'],
                (int)$row['id_torneo'],
                $row['fase_jornada'],
                $row['id_equipo_local'] !== null ? (int)$row['id_equipo_local'] : null,
                $row['id_equipo_visitante'] !== null ? (int)$row['id_equipo_visitante'] : null,
                (int)($row['marcador_local'] ?? 0),
                (int)($row['marcador_visitante'] ?? 0),
                (int)$row['id_partido']
            );
            $partido->equipo_local_nombre = $row['equipo_local_nombre'] ?? 'Libre';
            $partido->equipo_visitante_nombre = $row['equipo_visitante_nombre'] ?? 'Libre';
            $partidos[] = $partido;
        }

        return $partidos;
    }

    /**
     * Elimina todos los partidos y puntuaciones de un torneo.
     */
    public function deleteByTorneo(int $id_torneo): bool {
        // 1. Eliminar resultados asociados para evitar error de FK
        $stmtRes = $this->db->prepare("
            DELETE FROM Resultado_partido 
            WHERE id_partido IN (SELECT id_partido FROM Partido WHERE id_torneo = :id_torneo)
        ");
        $stmtRes->execute(['id_torneo' => $id_torneo]);

        // 2. Eliminar partidos
        $stmtPart = $this->db->prepare("DELETE FROM Partido WHERE id_torneo = :id_torneo");
        return $stmtPart->execute(['id_torneo' => $id_torneo]);
    }

    /**
     * Guarda un partido e inserta/actualiza sus dos filas en Resultado_partido.
     */
    public function save(Partido $partido): bool {
        // Verificar si el partido con este ID existe en la base de datos
        $exists = false;
        if ($partido->id_partido !== null) {
            $stmtCheck = $this->db->prepare("SELECT 1 FROM Partido WHERE id_partido = :id");
            $stmtCheck->execute(['id' => $partido->id_partido]);
            $exists = (bool)$stmtCheck->fetch();
        }

        if (!$exists) {
            if ($partido->id_partido === null) {
                $res = $this->db->query("SELECT COALESCE(MAX(id_partido), 0) + 1 AS next_id FROM Partido");
                $nextId = (int)$res->fetch()['next_id'];
                $partido->id_partido = $nextId;
            }

            $stmt = $this->db->prepare("
                INSERT INTO Partido (id_partido, id_torneo, estado_partido, fase_jornada, fecha_partido)
                VALUES (:id, :id_torneo, :estado, :jornada, :fecha)
            ");
        } else {
            $stmt = $this->db->prepare("
                UPDATE Partido
                SET id_torneo = :id_torneo,
                    estado_partido = :estado,
                    fase_jornada = :jornada,
                    fecha_partido = :fecha
                WHERE id_partido = :id
            ");
        }

        $res = $stmt->execute([
            'id' => $partido->id_partido,
            'id_torneo' => $partido->id_torneo,
            'estado' => $partido->estado_partido,
            'jornada' => $partido->fase_jornada,
            'fecha' => $partido->fecha_partido
        ]);

        if (!$res) {
            return false;
        }

        // Guardar/Actualizar los dos resultados en Resultado_partido
        if ($partido->id_equipo_local !== null) {
            $this->guardarResultadoEquipo($partido->id_partido, $partido->id_equipo_local, 'Local', $partido->marcador_local);
        }
        if ($partido->id_equipo_visitante !== null) {
            $this->guardarResultadoEquipo($partido->id_partido, $partido->id_equipo_visitante, 'Visitante', $partido->marcador_visitante);
        }

        return true;
    }

    /**
     * Inserta o actualiza un registro en Resultado_partido.
     */
    private function guardarResultadoEquipo(int $idPartido, int $idEquipo, string $condicion, int $puntuacion): void {
        $stmtCheck = $this->db->prepare("
            SELECT 1 FROM Resultado_partido WHERE id_partido = :id_partido AND condicion = :condicion
        ");
        $stmtCheck->execute(['id_partido' => $idPartido, 'condicion' => $condicion]);

        if ($stmtCheck->fetch()) {
            $stmt = $this->db->prepare("
                UPDATE Resultado_partido 
                SET id_equipo = :id_equipo, puntuacion = :puntuacion
                WHERE id_partido = :id_partido AND condicion = :condicion
            ");
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO Resultado_partido (id_partido, id_equipo, condicion, puntuacion)
                VALUES (:id_partido, :id_equipo, :condicion, :puntuacion)
            ");
        }

        $stmt->execute([
            'id_partido' => $idPartido,
            'id_equipo' => $idEquipo,
            'condicion' => $condicion,
            'puntuacion' => $puntuacion
        ]);
    }

    /**
     * Actualiza el marcador e ingresa los resultados en la relación 3NF.
     */
    public function actualizarMarcador(int $id_partido, int $marcador_local, int $marcador_visitante, string $estado = 'Finalizado'): bool {
        // 1. Actualizar estado del partido
        $stmt = $this->db->prepare("UPDATE Partido SET estado_partido = :estado WHERE id_partido = :id");
        $res = $stmt->execute(['id' => $id_partido, 'estado' => $estado]);

        if (!$res) {
            return false;
        }

        // 2. Actualizar puntuación de Local
        $stmtL = $this->db->prepare("
            UPDATE Resultado_partido SET puntuacion = :score 
            WHERE id_partido = :id AND condicion = 'Local'
        ");
        $stmtL->execute(['id' => $id_partido, 'score' => $marcador_local]);

        // 3. Actualizar puntuación de Visitante
        $stmtV = $this->db->prepare("
            UPDATE Resultado_partido SET puntuacion = :score 
            WHERE id_partido = :id AND condicion = 'Visitante'
        ");
        $stmtV->execute(['id' => $id_partido, 'score' => $marcador_visitante]);

        return true;
    }
}
