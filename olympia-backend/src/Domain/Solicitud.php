<?php
namespace Olympia\Domain;

use Exception;

/**
 * Clase de Dominio: Solicitud
 * Representa una solicitud de inscripción enviada por un Capitán para ingresar a un torneo.
 */
class Solicitud {
    public ?string $id_solicitud = null; // Ej. 'sol_1717590000000' o autoincremental
    public int $id_torneo;
    public int $id_equipo;
    public string $estado_solicitud; // 'Pendiente', 'Aprobado', 'Rechazado'
    public string $fecha_solicitud;

    // Propiedades virtuales para renderizado
    public ?string $nombre_torneo = null;
    public ?string $nombre_equipo = null;
    public ?string $deporte_torneo = null;

    /**
     * Constructor de la clase Solicitud.
     */
    public function __construct(
        int $id_torneo,
        int $id_equipo,
        string $estado_solicitud = 'Pendiente',
        ?string $fecha_solicitud = null,
        ?string $id_solicitud = null
    ) {
        $this->id_torneo = $id_torneo;
        $this->id_equipo = $id_equipo;
        $this->estado_solicitud = $estado_solicitud;
        $this->fecha_solicitud = $fecha_solicitud ?? date('Y-m-d');
        $this->id_solicitud = $id_solicitud;

        $this->validarEstado();
    }

    /**
     * Valida que el estado de la solicitud sea válido.
     */
    private function validarEstado(): void {
        $estadosPermitidos = ['Pendiente', 'Aprobado', 'Rechazado'];
        if (!in_array($this->estado_solicitud, $estadosPermitidos)) {
            throw new Exception("El estado '{$this->estado_solicitud}' de la solicitud no está permitido.");
        }
    }

    /**
     * Valida que la solicitud cumpla con todas las reglas de inscripción.
     * 
     * @param Equipo $equipo
     * @param Torneo $torneo
     * @param int $cantidadJugadores
     * @return bool
     * @throws Exception Si falla alguna regla de negocio.
     */
    public function validarReglasInscripcion(Equipo $equipo, Torneo $torneo, int $cantidadJugadores): bool {
        // 1. Validar deporte
        $equipo->validarCoincidenciaDeporte($torneo->deporte_torneo);

        // 2. Validar plantilla mínima
        $equipo->validarPlantillaMinima($torneo->deporte_torneo, $cantidadJugadores);

        // 3. Validar cupos disponibles
        if ($torneo->max_equipos <= 0) {
            throw new Exception("El torneo no cuenta con cupos configurados.");
        }

        return true;
    }
}
