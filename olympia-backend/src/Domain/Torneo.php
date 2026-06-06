<?php
namespace Olympia\Domain;

use Exception;
use DateTime;

/**
 * Clase de Dominio: Torneo
 * Representa la entidad Torneo y encapsula las reglas de negocio críticas relacionadas
 * con el ciclo de vida y configuración de los torneos deportivos.
 * Mapeada a las columnas reales de la base de datos (formato_torneo, categoria_torneo, deporte_torneo).
 */
class Torneo {
    public ?int $id_torneo = null;
    public string $nombre_torneo;
    public string $torneo_inicio;
    public string $torneo_fin;
    public int $max_equipos;
    public string $formato_torneo;
    public string $categoria_torneo;
    public string $deporte_torneo;
    public ?string $pin_asistente = null; // Para acceso de asistentes

    /**
     * Constructor de la clase Torneo.
     */
    public function __construct(
        string $nombre_torneo,
        string $torneo_inicio,
        string $torneo_fin,
        int $max_equipos,
        string $formato_torneo,
        string $categoria_torneo,
        string $deporte_torneo,
        ?string $pin_asistente = null,
        ?int $id_torneo = null
    ) {
        $this->nombre_torneo = $nombre_torneo;
        $this->torneo_inicio = $torneo_inicio;
        $this->torneo_fin = $torneo_fin;
        $this->max_equipos = $max_equipos;
        $this->formato_torneo = $formato_torneo;
        $this->categoria_torneo = $categoria_torneo;
        $this->deporte_torneo = $deporte_torneo;
        $this->pin_asistente = $pin_asistente;
        $this->id_torneo = $id_torneo;
    }

    /**
     * Valida la coherencia de las fechas de inicio y fin.
     * 
     * @return bool True si es válido.
     * @throws Exception Si la fecha de fin es anterior a la de inicio.
     */
    public function validarCoherenciaFechas(): bool {
        $inicio = new DateTime($this->torneo_inicio);
        $fin = new DateTime($this->torneo_fin);

        if ($fin < $inicio) {
            throw new Exception("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }
        return true;
    }

    /**
     * Valida que la fecha de inicio del torneo no sea en el pasado con respecto al servidor.
     * 
     * @return bool True si es válido.
     * @throws Exception Si la fecha de inicio es anterior a la fecha actual.
     */
    public function validarFechaInicioNoPasada(): bool {
        $inicio = new DateTime($this->torneo_inicio);
        $hoy = new DateTime(date('Y-m-d'));

        if ($inicio < $hoy) {
            throw new Exception("La fecha de inicio no puede ser menor a la fecha actual.");
        }
        return true;
    }

    /**
     * Valida la capacidad máxima de equipos según el formato seleccionado.
     * 
     * @return bool True si es válido.
     * @throws Exception Si la capacidad no cumple con los requisitos del formato.
     */
    public function validarCapacidadSegunFormato(): bool {
        $formato = strtolower($this->formato_torneo);

        if ($this->max_equipos < 2) {
            throw new Exception("El torneo debe tener al menos 2 equipos asignados.");
        }

        if (($formato === 'fase de grupos' || $formato === 'grupos') && $this->max_equipos < 4) {
            throw new Exception("Para el formato 'Fase de Grupos' la capacidad máxima debe ser de al menos 4 equipos.");
        }

        return true;
    }
}
