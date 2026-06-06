<?php
namespace Olympia\Domain;

use Exception;

/**
 * Clase de Dominio: Equipo
 * Representa un equipo y gestiona las validaciones de disciplina y composición de plantilla.
 * Mapeado a las columnas reales de la base de datos (categoria_equipo, deporte_equipo).
 */
class Equipo {
    public ?int $id_equipo = null;
    public string $nombre_equipo;
    public string $descripcion_equipo;
    public string $categoria_equipo;
    public string $deporte_equipo;

    /**
     * Constructor de la clase Equipo.
     */
    public function __construct(
        string $nombre_equipo,
        string $descripcion_equipo,
        string $categoria_equipo,
        string $deporte_equipo,
        ?int $id_equipo = null
    ) {
        $this->nombre_equipo = $nombre_equipo;
        $this->descripcion_equipo = $descripcion_equipo;
        $this->categoria_equipo = $categoria_equipo;
        $this->deporte_equipo = $deporte_equipo;
        $this->id_equipo = $id_equipo;
    }

    /**
     * Valida que el deporte del equipo coincida con el deporte del torneo.
     * 
     * @param string $deporteTorneo Nombre del deporte del torneo.
     * @return bool True si coincide.
     * @throws Exception Si el deporte del equipo no coincide con el del torneo.
     */
    public function validarCoincidenciaDeporte(string $deporteTorneo): bool {
        if (strtolower($this->deporte_equipo) !== strtolower($deporteTorneo)) {
            throw new Exception("El deporte del equipo ({$this->deporte_equipo}) no coincide con el del torneo ($deporteTorneo).");
        }
        return true;
    }

    /**
     * Valida que la plantilla cumpla con el mínimo de jugadores requerido para el deporte.
     * 
     * @param string $deporteTorneo Deporte del torneo.
     * @param int $cantidadJugadores Cantidad de jugadores actualmente en la plantilla del equipo.
     * @return bool True si cumple con el mínimo.
     * @throws Exception Si no cumple con el mínimo de jugadores.
     */
    public function validarPlantillaMinima(string $deporteTorneo, int $cantidadJugadores): bool {
        $deporte = strtolower($deporteTorneo);
        $minimo = 5; // Mínimo por defecto

        switch ($deporte) {
            case 'futbol':
            case 'fútbol':
                $minimo = 7;
                break;
            case 'basquet':
            case 'básquet':
            case 'baloncesto':
                $minimo = 5;
                break;
            case 'voley':
            case 'vóley':
            case 'voleibol':
                $minimo = 6;
                break;
            case 'ping-pong':
            case 'pingpong':
            case 'tenis de mesa':
                $minimo = 1;
                break;
            default:
                $minimo = 5;
                break;
        }

        if ($cantidadJugadores < $minimo) {
            throw new Exception("No cumples con el mínimo de jugadores: '{$this->nombre_equipo}' tiene $cantidadJugadores pero $deporteTorneo requiere al menos $minimo jugadores.");
        }

        return true;
    }
}
