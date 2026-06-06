<?php
namespace Olympia\Core;

use PDO;
use PDOException;
use Exception;

/**
 * Clase Database
 * Proporciona y administra la conexión única a la base de datos utilizando PDO (PHP Data Objects).
 * Implementa el patrón Singleton para evitar múltiples conexiones concurrentes innecesarias.
 */
class Database {
    private static ?PDO $instance = null;

    /**
     * Obtiene la instancia única de la conexión PDO.
     * 
     * @return PDO
     * @throws Exception Si falla la conexión a la base de datos.
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $host = "localhost";
            $user = "root";
            $pass = "";
            $dbname = "db_olympia";
            $charset = "utf8mb4";

            $dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";
            
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanza excepciones en caso de errores SQL
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve resultados como array asociativo
                PDO::ATTR_EMULATE_PREPARES   => false,                  // Utiliza consultas preparadas reales para mayor seguridad
            ];

            try {
                self::$instance = new PDO($dsn, $user, $pass, $options);
            } catch (PDOException $e) {
                // Registrar el mensaje real en logs internos e informar un error controlado al cliente
                error_log("Fallo de conexión a base de datos: " . $e->getMessage());
                throw new Exception("No se pudo establecer la conexión con la base de datos. Verifique su servidor MySQL.");
            }
        }

        return self::$instance;
    }
}
