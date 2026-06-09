-- =========================================================================
-- LOTE DE DATOS DE PRUEBA COMPLETO PARA OLYMPIA
-- Adaptado a la nueva estructura de db-olympia.sql y todos los casos de prueba
-- Nota: La contraseña para todos los usuarios cargados es: 'password'
-- =========================================================================

-- Limpiar tablas para evitar conflictos al re-ejecutar (respetando dependencias)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Resultado_partido;
TRUNCATE TABLE Partido;
TRUNCATE TABLE Torneo_equipo;
TRUNCATE TABLE Plantilla_equipo;
TRUNCATE TABLE Equipo;
TRUNCATE TABLE List_colaboradores;
TRUNCATE TABLE Solicitud;
TRUNCATE TABLE Torneo;
TRUNCATE TABLE Usuario;
TRUNCATE TABLE Disciplina;
TRUNCATE TABLE Deporte;
TRUNCATE TABLE Categoria;
TRUNCATE TABLE Formato;
TRUNCATE TABLE Rol;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. INSERTAR ROLES BÁSICOS
INSERT INTO Rol (id_rol, nombre_rol) VALUES
(1, 'Administrador'),
(2, 'Organizador'),
(3, 'Asistente');

-- 2. INSERTAR FORMATOS DE TORNEO
INSERT INTO Formato (id_formato, nombre_formato) VALUES
(1, 'Liga'),
(2, 'Eliminatoria'),
(3, 'Fase de Grupos');

-- 3. INSERTAR CATEGORÍAS
INSERT INTO Categoria (id_categoria, nombre_categoria) VALUES
(1, 'Sub-18'),
(2, 'Libre'),
(3, 'Veteranos'),
(4, 'Junior');

-- 4. INSERTAR DEPORTES
INSERT INTO Deporte (id_deporte, nombre_deporte) VALUES
(1, 'Futbol'),
(2, 'Basquet'),
(3, 'Voley'),
(4, 'Ping-Pong');

-- 5. INSERTAR DISCIPLINAS (Combinaciones de Categoría y Deporte)
INSERT INTO Disciplina (id_disciplina, id_categoria, id_deporte) VALUES
(1, 2, 1), -- Libre - Futbol
(2, 1, 2), -- Sub-18 - Basquet
(3, 2, 3), -- Libre - Voley
(4, 2, 4); -- Libre - Ping-Pong

-- 6. INSERTAR USUARIOS
-- Todos los usuarios cargados tienen el password_hash para 'password'
-- ($2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
INSERT INTO Usuario (dni_usuario, nombre_usuario, apellido_usuario, fecha_nac, email, telefono_usuario, password_hash) VALUES
(11111111, 'Admin', 'Olympia', '1990-01-01', 'admin@olympia.com', 111111111, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(55555555, 'Marcos', 'Gómez', '1988-04-12', 'organizador@olympia.com', 555555555, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(66666666, 'Lucía', 'Fernández', '1993-09-25', 'asistente@olympia.com', 666666666, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22222222, 'Juan', 'Pérez', '1995-05-15', 'juan@capitan.com', 222222222, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(33333333, 'Luis', 'Sosa', '1998-10-20', 'luis@capitan.com', 333333333, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(44444444, 'Carlos', 'Gómez', '1992-03-05', 'carlos@capitan.com', 444444444, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
-- Jugadores adicionales para completar plantillas
(12345671, 'Lionel', 'Messi', '1987-06-24', 'messi@olympia.com', 123456711, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(12345672, 'Sergio', 'Agüero', '1988-06-02', 'aguero@olympia.com', 123456722, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(12345673, 'Ángel', 'Di María', '1988-02-14', 'dimaria@olympia.com', 123456733, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(12345674, 'Javier', 'Mascherano', '1984-06-08', 'masche@olympia.com', 123456744, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(12345675, 'Nicolás', 'Otamendi', '1988-02-12', 'otamendi@olympia.com', 123456755, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(12345676, 'Emiliano', 'Martínez', '1992-09-02', 'dibujo@olympia.com', 123456766, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22345671, 'Stephen', 'Curry', '1988-03-14', 'curry@olympia.com', 223456711, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22345672, 'Klay', 'Thompson', '1990-02-08', 'klay@olympia.com', 223456722, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22345673, 'LeBron', 'James', '1984-12-30', 'lebron@olympia.com', 223456733, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22345674, 'Kevin', 'Durant', '1988-09-29', 'durant@olympia.com', 223456744, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22345675, 'James', 'Harden', '1989-08-26', 'harden@olympia.com', 223456755, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 7. INSERTAR TORNEOS
INSERT INTO Torneo (id_torneo, nombre_torneo, torneo_inicio, torneo_fin, max_equipos, id_formato, id_disciplina, pin_asistente) VALUES
(1, 'Liga de Verano Fútbol', DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 6, 1, 1, NULL),
(2, 'Copa Básquet Juvenil', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 8, 2, 2, 'REF123'),
(3, 'Torneo Vóley Playa', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 4, 2, 3, 'VOL123'),
(4, 'Torneo Ping-Pong Dobles', DATE_SUB(CURDATE(), INTERVAL 5 DAY), DATE_SUB(CURDATE(), INTERVAL 1 DAY), 4, 2, 4, NULL);

-- 8. ASIGNAR COLABORADORES A LOS TORNEOS (SuperAdmin, Organizadores y Asistentes)
INSERT INTO List_colaboradores (fecha_registro, dni_usuario, id_torneo, id_rol) VALUES
(CURDATE(), 11111111, 1, 1), -- Admin es SuperAdmin de Torneo 1
(CURDATE(), 11111111, 2, 1), -- Admin es SuperAdmin de Torneo 2
(CURDATE(), 11111111, 3, 1), -- Admin es SuperAdmin de Torneo 3
(CURDATE(), 11111111, 4, 1), -- Admin es SuperAdmin de Torneo 4
(CURDATE(), 55555555, 1, 2), -- Marcos es Organizador en Torneo 1
(CURDATE(), 55555555, 2, 2), -- Marcos es Organizador en Torneo 2
(CURDATE(), 55555555, 3, 2), -- Marcos es Organizador en Torneo 3
(CURDATE(), 66666666, 1, 3), -- Lucía es Asistente en Torneo 1
(CURDATE(), 66666666, 2, 3); -- Lucía es Asistente en Torneo 2

-- 9. INSERTAR EQUIPOS
INSERT INTO Equipo (id_equipo, nombre_equipo, descripcion_equipo, id_disciplina) VALUES
(1, 'Los Halcones FC', 'El mejor equipo de fútbol del barrio', 1),
(2, 'Rayo Plateado', 'Rápidos y furiosos de fútbol', 1),
(3, 'Centauros del Norte', 'Fuerza bruta de fútbol', 1),
(4, 'Titanes de Oro', 'Los campeones invictos', 1),
(5, 'Estrella Roja', 'Pasión y gloria de fútbol', 1),
(6, 'Deportivo Sur', 'Desde abajo en fútbol', 1),
(7, 'Gigantes del Aro', 'Los más altos de básquet', 2),
(8, 'Tiradores', 'Triples seguros (incompleto)', 2),
(9, 'Voley Team', 'Veteranos de vóley', 3);

-- 10. ASIGNAR CAPITANES Y JUGADORES A LAS PLANTILLAS
INSERT INTO Plantilla_equipo (posicion_equipo, nro_dorsal, id_equipo, dni_usuario) VALUES
-- Capitanes
('Capitán', 10, 1, 22222222), -- Juan es capitán de Los Halcones FC
('Capitán', 10, 2, 33333333), -- Luis es capitán de Rayo Plateado
('Capitán', 10, 3, 44444444), -- Carlos es capitán de Centauros del Norte
('Capitán', 10, 4, 22222222), -- Juan es capitán de Titanes de Oro
('Capitán', 10, 5, 33333333), -- Luis es capitán de Estrella Roja
('Capitán', 10, 6, 44444444), -- Carlos es capitán de Deportivo Sur
('Capitán', 10, 7, 22222222), -- Juan es capitán de Gigantes del Aro
('Capitán', 10, 8, 33333333), -- Luis es capitán de Tiradores (incompleto)
('Capitán', 10, 9, 44444444), -- Carlos es capitán de Voley Team

-- Jugadores adicionales para completar Los Halcones FC (Fútbol: Min 7)
('Jugador', 11, 1, 12345671),
('Jugador', 9, 1, 12345672),
('Jugador', 7, 1, 12345673),
('Jugador', 5, 1, 12345674),
('Jugador', 2, 1, 12345675),
('Jugador', 1, 1, 12345676),

-- Jugadores adicionales para completar Gigantes del Aro (Básquet: Min 5)
('Jugador', 30, 7, 22345671),
('Jugador', 11, 7, 22345672),
('Jugador', 23, 7, 22345673),
('Jugador', 7, 7, 22345674),
('Jugador', 13, 7, 22345675);

-- 11. INSCRIBIR EQUIPOS A LOS TORNEOS (Aprobados/Participando)
INSERT INTO Torneo_equipo (fecha_inscripcion, id_torneo, id_equipo) VALUES
(CURDATE(), 1, 1),
(CURDATE(), 1, 2),
(CURDATE(), 2, 7);

-- 12. CREAR SOLICITUDES DE PRUEBA
-- Asegurar tabla Solicitud
CREATE TABLE IF NOT EXISTS Solicitud (
    id_solicitud VARCHAR(50) NOT NULL,
    id_torneo INT NOT NULL,
    id_equipo INT NOT NULL,
    estado_solicitud VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud DATE NOT NULL,
    PRIMARY KEY (id_solicitud),
    FOREIGN KEY (id_torneo) REFERENCES Torneo(id_torneo) ON DELETE CASCADE,
    FOREIGN KEY (id_equipo) REFERENCES Equipo(id_equipo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO Solicitud (id_solicitud, id_torneo, id_equipo, estado_solicitud, fecha_solicitud) VALUES
('sol_prueba_1', 1, 3, 'Pendiente', CURDATE()), -- Solicitud Pendiente para Torneo 1
('sol_prueba_2', 1, 4, 'Aprobado', DATE_SUB(CURDATE(), INTERVAL 1 DAY)), -- Solicitud Aprobada
('sol_prueba_3', 1, 5, 'Rechazado', DATE_SUB(CURDATE(), INTERVAL 2 DAY)); -- Solicitud Rechazada

-- 13. PARTIDOS Y RESULTADOS DE PRUEBA (Para Historial/Buscador y fixture terminado)
-- Torneo 4 (Ping-Pong Dobles): Finalizado
INSERT INTO Partido (id_partido, estado_partido, fecha_partido, id_torneo, fase_jornada) VALUES
(101, 'Finalizado', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 4, 'Final');

INSERT INTO Resultado_partido (condicion, puntuacion, id_partido, id_equipo) VALUES
('Local', 3, 101, 1), -- Ganador: Los Halcones
('Visitante', 1, 101, 2); -- Perdedor: Rayo Plateado

-- Torneo 2 (Copa Básquet): En Curso
INSERT INTO Partido (id_partido, estado_partido, fecha_partido, id_torneo, fase_jornada) VALUES
(102, 'En Juego', CURDATE(), 2, 'Jornada 1');
