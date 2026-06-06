<?php
namespace Olympia\Repositories;

use Olympia\Domain\Equipo;
use PDO;
use Exception;

/**
 * Clase EquipoRepository (Versión Normalizada 3NF)
 * Implementa la persistencia de Equipo resolviendo dinámicamente la relación
 * de Disciplina (Deporte + Categoría) según el esquema normalizado db-olympia.sql.
 */
class EquipoRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Resuelve el ID de una disciplina (Deporte + Categoría) creándolos de ser necesario.
     */
    private function resolverDisciplinaId(string $deporte, string $categoria): int {
        // 1. Resolver Deporte
        $stmtDep = $this->db->prepare("SELECT id_deporte FROM Deporte WHERE LOWER(nombre_deporte) = LOWER(:deporte)");
        $stmtDep->execute(['deporte' => $deporte]);
        $rowDep = $stmtDep->fetch();
        $idDeporte = $rowDep ? (int)$rowDep['id_deporte'] : null;

        if (!$idDeporte) {
            $stmtInsDep = $this->db->prepare("INSERT INTO Deporte (nombre_deporte) VALUES (:deporte)");
            $stmtInsDep->execute(['deporte' => ucfirst($deporte)]);
            $idDeporte = (int)$this->db->lastInsertId();
        }

        // 2. Resolver Categoría
        $stmtCat = $this->db->prepare("SELECT id_categoria FROM Categoria WHERE LOWER(nombre_categoria) = LOWER(:categoria)");
        $stmtCat->execute(['categoria' => $categoria]);
        $rowCat = $stmtCat->fetch();
        $idCategoria = $rowCat ? (int)$rowCat['id_categoria'] : null;

        if (!$idCategoria) {
            $stmtInsCat = $this->db->prepare("INSERT INTO Categoria (nombre_categoria) VALUES (:categoria)");
            $stmtInsCat->execute(['categoria' => ucfirst($categoria)]);
            $idCategoria = (int)$this->db->lastInsertId();
        }

        // 3. Resolver Disciplina
        $stmtDis = $this->db->prepare("SELECT id_disciplina FROM Disciplina WHERE id_deporte = :dep AND id_categoria = :cat");
        $stmtDis->execute(['dep' => $idDeporte, 'cat' => $idCategoria]);
        $rowDis = $stmtDis->fetch();
        
        if ($rowDis) {
            return (int)$rowDis['id_disciplina'];
        }

        $stmtInsDis = $this->db->prepare("INSERT INTO Disciplina (id_deporte, id_categoria) VALUES (:dep, :cat)");
        $stmtInsDis->execute(['dep' => $idDeporte, 'cat' => $idCategoria]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Busca un equipo por su ID.
     */
    public function find(int $id_equipo): ?Equipo {
        $stmt = $this->db->prepare("
            SELECT e.*, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Equipo e
            INNER JOIN Disciplina d ON e.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            WHERE e.id_equipo = :id
        ");
        $stmt->execute(['id' => $id_equipo]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Equipo(
            $row['nombre_equipo'],
            $row['descripcion_equipo'],
            $row['nombre_categoria'],
            $row['nombre_deporte'],
            (int)$row['id_equipo']
        );
    }

    /**
     * Busca todos los equipos del sistema.
     */
    public function findAll(): array {
        $stmt = $this->db->query("
            SELECT e.*, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Equipo e
            INNER JOIN Disciplina d ON e.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            ORDER BY e.nombre_equipo ASC
        ");
        
        $equipos = [];
        while ($row = $stmt->fetch()) {
            $equipos[] = new Equipo(
                $row['nombre_equipo'],
                $row['descripcion_equipo'],
                $row['nombre_categoria'],
                $row['nombre_deporte'],
                (int)$row['id_equipo']
            );
        }

        return $equipos;
    }

    /**
     * Obtiene todos los equipos asignados a un torneo.
     */
    public function findByTorneo(int $id_torneo): array {
        $stmt = $this->db->prepare("
            SELECT e.*, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Equipo e
            INNER JOIN Torneo_equipo te ON e.id_equipo = te.id_equipo
            INNER JOIN Disciplina d ON e.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            WHERE te.id_torneo = :id_torneo
            ORDER BY e.nombre_equipo ASC
        ");
        $stmt->execute(['id_torneo' => $id_torneo]);
        $equipos = [];

        while ($row = $stmt->fetch()) {
            $equipos[] = new Equipo(
                $row['nombre_equipo'],
                $row['descripcion_equipo'],
                $row['nombre_categoria'],
                $row['nombre_deporte'],
                (int)$row['id_equipo']
            );
        }

        return $equipos;
    }

    /**
     * Obtiene los equipos disponibles de la misma disciplina del torneo que no están inscriptos aún.
     */
    public function findAvailableForTorneo(int $id_torneo): array {
        $stmt = $this->db->prepare("
            SELECT e.*, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Equipo e
            INNER JOIN Disciplina d ON e.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            WHERE e.id_disciplina = (SELECT id_disciplina FROM Torneo WHERE id_torneo = :id_torneo)
              AND e.id_equipo NOT IN (
                  SELECT id_equipo 
                  FROM Torneo_equipo 
                  WHERE id_torneo = :id_torneo_ex
              )
            ORDER BY e.nombre_equipo ASC
        ");
        $stmt->execute([
            'id_torneo' => $id_torneo,
            'id_torneo_ex' => $id_torneo
        ]);
        $equipos = [];

        while ($row = $stmt->fetch()) {
            $equipos[] = new Equipo(
                $row['nombre_equipo'],
                $row['descripcion_equipo'],
                $row['nombre_categoria'],
                $row['nombre_deporte'],
                (int)$row['id_equipo']
            );
        }

        return $equipos;
    }

    /**
     * Guarda (inserta o actualiza) un equipo en base de datos.
     */
    public function save(Equipo $equipo): bool {
        // Resolver la FK normalizada
        $idDisciplina = $this->resolverDisciplinaId($equipo->deporte_equipo, $equipo->categoria_equipo);

        if ($equipo->id_equipo === null) {
            $res = $this->db->query("SELECT COALESCE(MAX(id_equipo), 0) + 1 AS next_id FROM Equipo");
            $nextId = (int)$res->fetch()['next_id'];
            $equipo->id_equipo = $nextId;

            $stmt = $this->db->prepare("
                INSERT INTO Equipo (id_equipo, nombre_equipo, descripcion_equipo, id_disciplina)
                VALUES (:id, :nombre, :descripcion, :id_disciplina)
            ");
        } else {
            $stmt = $this->db->prepare("
                UPDATE Equipo
                SET nombre_equipo = :nombre,
                    descripcion_equipo = :descripcion,
                    id_disciplina = :id_disciplina
                WHERE id_equipo = :id
            ");
        }

        return $stmt->execute([
            'id' => $equipo->id_equipo,
            'nombre' => $equipo->nombre_equipo,
            'descripcion' => $equipo->descripcion_equipo,
            'id_disciplina' => $idDisciplina
        ]);
    }

    /**
     * Asocia un equipo a un torneo en la tabla Torneo_equipo.
     */
    public function inscribirEnTorneo(int $id_equipo, int $id_torneo): bool {
        // Verificar duplicados primero
        $stmtCheck = $this->db->prepare("SELECT 1 FROM Torneo_equipo WHERE id_torneo = :id_torneo AND id_equipo = :id_equipo");
        $stmtCheck->execute(['id_torneo' => $id_torneo, 'id_equipo' => $id_equipo]);
        if ($stmtCheck->fetch()) {
            return true;
        }

        $stmt = $this->db->prepare("INSERT INTO Torneo_equipo (fecha_inscripcion, id_torneo, id_equipo) VALUES (:fecha, :id_torneo, :id_equipo)");
        return $stmt->execute([
            'fecha' => date('Y-m-d'),
            'id_torneo' => $id_torneo,
            'id_equipo' => $id_equipo
        ]);
    }

    /**
     * Remueve un equipo de un torneo en la tabla Torneo_equipo.
     */
    public function desinscribirDeTorneo(int $id_equipo, int $id_torneo): bool {
        $stmt = $this->db->prepare("DELETE FROM Torneo_equipo WHERE id_torneo = :id_torneo AND id_equipo = :id_equipo");
        return $stmt->execute([
            'id_torneo' => $id_torneo,
            'id_equipo' => $id_equipo
        ]);
    }

    /**
     * Obtiene la cantidad de jugadores asociados a la plantilla de un equipo.
     */
    public function obtenerCantidadJugadores(int $id_equipo): int {
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM Plantilla_equipo WHERE id_equipo = :id_equipo");
        $stmt->execute(['id_equipo' => $id_equipo]);
        return (int)$stmt->fetch()['total'];
    }
}
