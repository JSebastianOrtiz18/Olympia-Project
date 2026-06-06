<?php
namespace Olympia\Repositories;

use Olympia\Domain\Torneo;
use PDO;
use Exception;

/**
 * Clase TorneoRepository (Versión Normalizada 3NF)
 * Implementa la persistencia de Torneo resolviendo dinámicamente las relaciones
 * Normalizadas de Formato, Deporte, Categoría y Disciplina.
 */
class TorneoRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
        $this->asegurarColumnas();
    }

    /**
     * Asegura la existencia de las columnas necesarias en base de datos.
     */
    private function asegurarColumnas(): void {
        try {
            $this->db->query("SELECT pin_asistente FROM Torneo LIMIT 1");
        } catch (\PDOException $e) {
            try {
                $this->db->exec("ALTER TABLE Torneo ADD COLUMN pin_asistente VARCHAR(6) NULL DEFAULT NULL");
            } catch (Exception $ex) {
                // Silenciar
            }
        }
    }

    /**
     * Resuelve el ID de un formato por su nombre, creándolo si no existe.
     */
    private function resolverFormatoId(string $nombreFormato): int {
        $stmt = $this->db->prepare("SELECT id_formato FROM Formato WHERE LOWER(nombre_formato) = LOWER(:nombre)");
        $stmt->execute(['nombre' => $nombreFormato]);
        $row = $stmt->fetch();

        if ($row) {
            return (int)$row['id_formato'];
        }

        // Crear si no existe
        $stmtIns = $this->db->prepare("INSERT INTO Formato (nombre_formato) VALUES (:nombre)");
        $stmtIns->execute(['nombre' => ucfirst($nombreFormato)]);
        return (int)$this->db->lastInsertId();
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
     * Busca un torneo por su ID, uniendo con sus catálogos normalizados.
     */
    public function find(int $id_torneo): ?Torneo {
        $stmt = $this->db->prepare("
            SELECT t.*, 
                   f.nombre_formato, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Torneo t
            INNER JOIN Formato f ON t.id_formato = f.id_formato
            INNER JOIN Disciplina d ON t.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            WHERE t.id_torneo = :id
        ");
        $stmt->execute(['id' => $id_torneo]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Torneo(
            $row['nombre_torneo'],
            $row['torneo_inicio'],
            $row['torneo_fin'],
            (int)$row['max_equipos'],
            $row['nombre_formato'],
            $row['nombre_categoria'],
            $row['nombre_deporte'],
            $row['pin_asistente'] ?? null,
            (int)$row['id_torneo']
        );
    }

    /**
     * Recupera todos los torneos del sistema.
     */
    public function findAll(): array {
        $stmt = $this->db->query("
            SELECT t.*, 
                   f.nombre_formato, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Torneo t
            INNER JOIN Formato f ON t.id_formato = f.id_formato
            INNER JOIN Disciplina d ON t.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            ORDER BY t.created_at DESC
        ");
        
        $torneos = [];
        while ($row = $stmt->fetch()) {
            $torneos[] = new Torneo(
                $row['nombre_torneo'],
                $row['torneo_inicio'],
                $row['torneo_fin'],
                (int)$row['max_equipos'],
                $row['nombre_formato'],
                $row['nombre_categoria'],
                $row['nombre_deporte'],
                $row['pin_asistente'] ?? null,
                (int)$row['id_torneo']
            );
        }

        return $torneos;
    }

    /**
     * Guarda (inserta o actualiza) un torneo en la base de datos resolviendo las FKs.
     */
    public function save(Torneo $torneo): bool {
        // 1. Resolver las FK normalizadas
        $idFormato = $this->resolverFormatoId($torneo->formato_torneo);
        $idDisciplina = $this->resolverDisciplinaId($torneo->deporte_torneo, $torneo->categoria_torneo);

        if ($torneo->id_torneo === null) {
            $res = $this->db->query("SELECT COALESCE(MAX(id_torneo), 0) + 1 AS next_id FROM Torneo");
            $nextId = (int)$res->fetch()['next_id'];
            $torneo->id_torneo = $nextId;

            $stmt = $this->db->prepare("
                INSERT INTO Torneo (id_torneo, nombre_torneo, torneo_inicio, torneo_fin, max_equipos, id_formato, id_disciplina, pin_asistente)
                VALUES (:id, :nombre, :inicio, :fin, :max_eq, :id_formato, :id_disciplina, :pin)
            ");
        } else {
            $stmt = $this->db->prepare("
                UPDATE Torneo 
                SET nombre_torneo = :nombre, 
                    torneo_inicio = :inicio, 
                    torneo_fin = :fin, 
                    max_equipos = :max_eq, 
                    id_formato = :id_formato, 
                    id_disciplina = :id_disciplina,
                    pin_asistente = :pin
                WHERE id_torneo = :id
            ");
        }

        return $stmt->execute([
            'id' => $torneo->id_torneo,
            'nombre' => $torneo->nombre_torneo,
            'inicio' => $torneo->torneo_inicio,
            'fin' => $torneo->torneo_fin,
            'max_eq' => $torneo->max_equipos,
            'id_formato' => $idFormato,
            'id_disciplina' => $idDisciplina,
            'pin' => $torneo->pin_asistente
        ]);
    }

    /**
     * Elimina físicamente un torneo.
     */
    public function delete(int $id_torneo): bool {
        $stmt = $this->db->prepare("DELETE FROM Torneo WHERE id_torneo = :id");
        return $stmt->execute(['id' => $id_torneo]);
    }

    /**
     * Guarda el PIN del asistente para un torneo.
     */
    public function updatePin(int $id_torneo, ?string $pin): bool {
        $stmt = $this->db->prepare("UPDATE Torneo SET pin_asistente = :pin WHERE id_torneo = :id");
        return $stmt->execute(['id' => $id_torneo, 'pin' => $pin]);
    }

    /**
     * Busca un torneo por PIN.
     */
    public function findByPin(string $pin): ?Torneo {
        $stmt = $this->db->prepare("
            SELECT t.*, 
                   f.nombre_formato, 
                   dep.nombre_deporte, 
                   cat.nombre_categoria
            FROM Torneo t
            INNER JOIN Formato f ON t.id_formato = f.id_formato
            INNER JOIN Disciplina d ON t.id_disciplina = d.id_disciplina
            INNER JOIN Deporte dep ON d.id_deporte = dep.id_deporte
            INNER JOIN Categoria cat ON d.id_categoria = cat.id_categoria
            WHERE t.pin_asistente = :pin
        ");
        $stmt->execute(['pin' => $pin]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }

        return new Torneo(
            $row['nombre_torneo'],
            $row['torneo_inicio'],
            $row['torneo_fin'],
            (int)$row['max_equipos'],
            $row['nombre_formato'],
            $row['nombre_categoria'],
            $row['nombre_deporte'],
            $row['pin_asistente'] ?? null,
            (int)$row['id_torneo']
        );
    }
}
