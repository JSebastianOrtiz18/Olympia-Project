<?php
namespace Olympia\Domain;

use Exception;

/**
 * Clase de Dominio: Usuario
 * Representa a los usuarios registrados en la plataforma (Administradores, Organizadores, Capitanes, Asistentes).
 */
class Usuario {
    public int $dni_usuario;
    public string $nombre_usuario;
    public string $apellido_usuario;
    public string $fecha_nac;
    public string $email;
    public ?int $telefono_usuario = null;
    public ?string $password_hash = null;

    /**
     * Constructor de la clase Usuario.
     */
    public function __construct(
        int $dni_usuario,
        string $nombre_usuario,
        string $apellido_usuario,
        string $fecha_nac,
        string $email,
        ?int $telefono_usuario = null,
        ?string $password_hash = null
    ) {
        $this->dni_usuario = $dni_usuario;
        $this->nombre_usuario = $nombre_usuario;
        $this->apellido_usuario = $apellido_usuario;
        $this->fecha_nac = $fecha_nac;
        $this->email = $email;
        $this->telefono_usuario = $telefono_usuario;
        $this->password_hash = $password_hash;
    }

    /**
     * Valida si el formato de email es correcto.
     */
    public function validarEmail(): bool {
        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("El correo electrónico '{$this->email}' no es válido.");
        }
        return true;
    }
}
