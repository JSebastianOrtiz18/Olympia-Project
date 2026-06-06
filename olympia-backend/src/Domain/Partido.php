<?php
namespace Olympia\Domain;

use Exception;

/**
 * Clase de Dominio: Partido
 * Representa un encuentro deportivo entre dos equipos en una jornada específica de un torneo.
 */
class Partido {
    public ?int $id_partido = null;
    public string $estado_partido; // 'Pendiente', 'En Juego', 'Finalizado', 'Suspendido'
    public string $fecha_partido;
    public int $id_torneo;
    public int $marcador_local = 0;
    public int $marcador_visitante = 0;
    public string $fase_jornada; // Ej. 'Fecha 1', 'Grupo A - Fecha 2', 'Semifinal'
    public ?int $id_equipo_local = null;
    public ?int $id_equipo_visitante = null;

    // Propiedades virtuales para renderizado
    public ?string $equipo_local_nombre = null;
    public ?string $equipo_visitante_nombre = null;

    /**
     * Constructor de la clase Partido.
     */
    public function __construct(
        string $estado_partido,
        string $fecha_partido,
        int $id_torneo,
        string $fase_jornada,
        ?int $id_equipo_local = null,
        ?int $id_equipo_visitante = null,
        int $marcador_local = 0,
        int $marcador_visitante = 0,
        ?int $id_partido = null
    ) {
        $this->estado_partido = $estado_partido;
        $this->fecha_partido = $fecha_partido;
        $this->id_torneo = $id_torneo;
        $this->fase_jornada = $fase_jornada;
        $this->id_equipo_local = $id_equipo_local;
        $this->id_equipo_visitante = $id_equipo_visitante;
        $this->marcador_local = $marcador_local;
        $this->marcador_visitante = $marcador_visitante;
        $this->id_partido = $id_partido;

        $this->validarEstado();
    }

    /**
     * Valida que el estado del partido sea uno de los permitidos.
     * 
     * @return void
     * @throws Exception Si el estado es inválido.
     */
    private function validarEstado(): void {
        $estadosPermitidos = ['Pendiente', 'En Juego', 'Finalizado', 'Suspendido', 'Programado'];
        if (!in_array($this->estado_partido, $estadosPermitidos)) {
            throw new Exception("El estado '{$this->estado_partido}' no está permitido.");
        }
    }
}
