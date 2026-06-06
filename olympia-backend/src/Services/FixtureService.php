<?php
namespace Olympia\Services;

use Olympia\Domain\Torneo;
use Olympia\Domain\Equipo;
use Olympia\Domain\Partido;
use Olympia\Repositories\PartidoRepository;
use Exception;
use PDO;

/**
 * Servicio de Dominio: FixtureService
 * Encapsula la lógica algorítmica para la generación automática de calendarios de encuentros (fixtures)
 * en sus tres formatos deportivos: Liga (Todos contra todos), Fase de Grupos y Eliminatoria Directa.
 */
class FixtureService {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    /**
     * Genera automáticamente el fixture de un torneo y lo persiste.
     * Ejecuta toda la operación bajo una transacción atómica.
     * 
     * @param Torneo $torneo
     * @param array $equipos Lista de objetos de tipo Equipo.
     * @param PartidoRepository $partidoRepo
     * @return array Lista de objetos Partido creados.
     * @throws Exception Si ocurre un fallo de validación o inserción en la base de datos.
     */
    public function generarFixture(Torneo $torneo, array $equipos, PartidoRepository $partidoRepo): array {
        $numEquipos = count($equipos);
        $formato = strtolower($torneo->formato_torneo);

        // 1. Validaciones de Negocio
        if ($numEquipos < 2) {
            throw new Exception("Se requieren al menos 2 equipos asignados para generar un fixture.");
        }

        if (($formato === 'fase de grupos' || $formato === 'grupos') && $numEquipos < 4) {
            throw new Exception("Fallo de validación: El formato Grupos requiere un mínimo de 4 equipos.");
        }

        // Mezclar equipos de forma aleatoria para el sorteo inicial
        shuffle($equipos);

        try {
            $this->db->beginTransaction();

            // 2. Limpieza de fixture anterior
            $partidoRepo->deleteByTorneo($torneo->id_torneo);

            // Obtener el ID de inicio para los nuevos partidos
            $resId = $this->db->query("SELECT MAX(id_partido) as max_id FROM Partido");
            $nextId = ((int)($resId->fetch()['max_id'] ?? 0)) + 1;

            $partidosGenerados = [];

            // 3. Generación según formato
            if ($formato === 'liga') {
                $partidosGenerados = $this->generarLiga($torneo, $equipos, $nextId);
            } elseif ($formato === 'fase de grupos' || $formato === 'grupos') {
                $partidosGenerados = $this->generarFaseGrupos($torneo, $equipos, $nextId);
            } elseif ($formato === 'eliminatoria') {
                $partidosGenerados = $this->generarEliminatoria($torneo, $equipos, $nextId);
            } else {
                throw new Exception("Formato de torneo '$formato' no reconocido.");
            }

            // 4. Persistencia de todos los partidos generados
            foreach ($partidosGenerados as $partido) {
                $partidoRepo->save($partido);
            }

            $this->db->commit();
            return $partidosGenerados;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Algoritmo Round Robin para formato de Liga (Todos contra todos).
     */
    private function generarLiga(Torneo $torneo, array $equipos, int &$nextId): array {
        $partidos = [];
        $numEquipos = count($equipos);
        
        // Si la cantidad de equipos es impar, agregamos un elemento null que representa descanso ("Libre")
        if ($numEquipos % 2 != 0) {
            $equipos[] = null;
            $numEquipos++;
        }

        $totalFechas = $numEquipos - 1;
        $partidosPorFecha = $numEquipos / 2;

        for ($fecha = 1; $fecha <= $totalFechas; $fecha++) {
            $jornada = "Fecha " . $fecha;

            for ($i = 0; $i < $partidosPorFecha; $i++) {
                $local = $equipos[$i];
                $visitante = $equipos[$numEquipos - 1 - $i];

                // Si ninguno de los dos es el equipo fantasma (descanso), creamos el partido
                if ($local !== null && $visitante !== null) {
                    $partidos[] = new Partido(
                        'Pendiente',
                        date('Y-m-d'),
                        $torneo->id_torneo,
                        $jornada,
                        $local->id_equipo,
                        $visitante->id_equipo,
                        0,
                        0,
                        $nextId++
                    );
                }
            }

            // Rotación Round Robin: sacamos el último y lo insertamos en la segunda posición
            $ultimo = array_pop($equipos);
            array_splice($equipos, 1, 0, [$ultimo]);
        }

        return $partidos;
    }

    /**
     * Divide los equipos en grupos y genera una liga interna para cada grupo.
     */
    private function generarFaseGrupos(Torneo $torneo, array $equipos, int &$nextId): array {
        $partidos = [];
        $numEquipos = count($equipos);
        $tamanoGrupo = 4; // Tamaño base recomendado por el documento
        $numGrupos = (int)max(1, ceil($numEquipos / $tamanoGrupo));
        $grupos = [];
        $letrasGrupos = range('A', 'Z');

        // Distribuir los equipos de forma equitativa (modular) en los grupos
        for ($i = 0; $i < $numEquipos; $i++) {
            $idxGrupo = $i % $numGrupos;
            $grupos[$idxGrupo][] = $equipos[$i];
        }

        // Generar una liga para cada grupo de forma aislada
        foreach ($grupos as $idx => $grupoEquipos) {
            $letraGrupo = $letrasGrupos[$idx] ?? ('Grupo ' . ($idx + 1));
            $numEqGrupo = count($grupoEquipos);

            if ($numEqGrupo % 2 != 0) {
                $grupoEquipos[] = null;
                $numEqGrupo++;
            }

            $totalFechas = $numEqGrupo - 1;
            $partidosPorFecha = $numEqGrupo / 2;

            for ($fecha = 1; $fecha <= $totalFechas; $fecha++) {
                $jornada = "Grupo $letraGrupo - Fecha $fecha";

                for ($i = 0; $i < $partidosPorFecha; $i++) {
                    $local = $grupoEquipos[$i];
                    $visitante = $grupoEquipos[$numEqGrupo - 1 - $i];

                    if ($local !== null && $visitante !== null) {
                        $partidos[] = new Partido(
                            'Pendiente',
                            date('Y-m-d'),
                            $torneo->id_torneo,
                            $jornada,
                            $local->id_equipo,
                            $visitante->id_equipo,
                            0,
                            0,
                            $nextId++
                        );
                    }
                }

                // Rotar Round Robin dentro del grupo
                $ultimo = array_pop($grupoEquipos);
                array_splice($grupoEquipos, 1, 0, [$ultimo]);
            }
        }

        return $partidos;
    }

    /**
     * Genera la primera ronda de cruces (eliminación directa) incluyendo Byes si no es potencia de 2.
     */
    private function generarEliminatoria(Torneo $torneo, array $equipos, int &$nextId): array {
        $partidos = [];
        $numEquipos = count($equipos);

        // Calcular la potencia de 2 superior más cercana (2, 4, 8, 16, 32...)
        $p2 = 1;
        while ($p2 < $numEquipos) {
            $p2 *= 2;
        }

        // Definir el nombre de la ronda inicial
        $jornada = "Fase Preliminar";
        if ($p2 == 2) {
            $jornada = "Final";
        } elseif ($p2 == 4) {
            $jornada = "Semifinal";
        } elseif ($p2 == 8) {
            $jornada = "Cuartos de Final";
        } elseif ($p2 == 16) {
            $jornada = "Octavos de Final";
        } elseif ($p2 == 32) {
            $jornada = "16avos de Final";
        }

        $byes = $p2 - $numEquipos; // Equipos que no juegan en primera ronda (pasan directo)
        $equiposAJugar = $numEquipos - $byes; // Equipos que sí disputan la fase preliminar

        // Únicamente se emparejan a los que tienen que jugar la fase preliminar
        for ($i = 0; $i < $equiposAJugar; $i += 2) {
            $local = $equipos[$i];
            $visitante = $equipos[$i + 1];

            $partidos[] = new Partido(
                'Pendiente',
                date('Y-m-d'),
                $torneo->id_torneo,
                $jornada,
                $local->id_equipo,
                $visitante->id_equipo,
                0,
                0,
                $nextId++
            );
        }

        return $partidos;
    }
}
