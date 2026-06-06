-- =========================================================================
-- LOTE DE DATOS DE PRUEBA PARA OLYMPIA
-- Adaptado a la nueva estructura de db-olympia.sql
-- Nota: La contraseña para todos los usuarios cargados es: 'password'
-- =========================================================================

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
(3, 2, 3); -- Libre - Voley

-- 6. INSERTAR USUARIOS (Organizadores y Capitanes con password_hash para 'password')
INSERT INTO Usuario (dni_usuario, nombre_usuario, apellido_usuario, fecha_nac, email, telefono_usuario, password_hash) VALUES
(11111111, 'Admin', 'Olympia', '1990-01-01', 'admin@olympia.com', 111111111, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(22222222, 'Juan', 'Pérez', '1995-05-15', 'juan@capitan.com', 222222222, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(33333333, 'Luis', 'Sosa', '1998-10-20', 'luis@capitan.com', 333333333, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
(44444444, 'Carlos', 'Gómez', '1992-03-05', 'carlos@capitan.com', 444444444, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 7. INSERTAR TORNEOS (Referenciando Formatos y Disciplinas)
INSERT INTO Torneo (id_torneo, nombre_torneo, torneo_inicio, torneo_fin, max_equipos, id_formato, id_disciplina) VALUES
(1, 'Liga de Verano Fútbol', DATE_ADD(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 40 DAY), 6, 1, 1),
(2, 'Copa Básquet Juvenil', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 15 DAY), 8, 2, 2),
(3, 'Torneo Vóley Playa', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 10 DAY), 4, 2, 3);

-- 8. ASIGNAR COLABORADORES A LOS TORNEOS (Reemplaza a la tabla global de roles Usuario_rol)
INSERT INTO List_colaboradores (fecha_registro, dni_usuario, id_torneo, id_rol) VALUES
(CURDATE(), 11111111, 1, 1); -- Admin asignado al Torneo 1 con Rol de Administrador

-- 9. INSERTAR EQUIPOS (Asignándoles su correspondiente id_disciplina)
INSERT INTO Equipo (id_equipo, nombre_equipo, descripcion_equipo, id_disciplina) VALUES
(1, 'Los Halcones FC', 'El mejor equipo del barrio', 1),
(2, 'Rayo Plateado', 'Rápidos y furiosos', 1),
(3, 'Centauros del Norte', 'Fuerza bruta', 1),
(4, 'Titanes de Oro', 'Los campeones invictos', 1),
(5, 'Estrella Roja', 'Pasión y gloria', 1),
(6, 'Deportivo Sur', 'Desde abajo', 1),
(7, 'Gigantes del Aro', 'Los más altos', 2),
(8, 'Tiradores', 'Triples seguros', 2);

-- 10. ASIGNAR CAPITANES A LOS EQUIPOS (En Plantilla_equipo con posición y dorsal)
INSERT INTO Plantilla_equipo (posicion_equipo, nro_dorsal, id_equipo, dni_usuario) VALUES
('Capitán', 10, 1, 22222222),
('Capitán', 10, 2, 33333333),
('Capitán', 10, 3, 44444444),
('Capitán', 10, 4, 22222222),
('Capitán', 10, 5, 33333333),
('Capitán', 10, 6, 44444444),
('Capitán', 10, 7, 22222222),
('Capitán', 10, 8, 33333333);

-- 11. INSCRIBIR EQUIPOS A LOS TORNEOS (En Torneo_equipo con fecha_inscripcion obligatoria)
INSERT INTO Torneo_equipo (fecha_inscripcion, id_torneo, id_equipo) VALUES
(CURDATE(), 1, 1), -- Los Halcones FC en Torneo 1
(CURDATE(), 1, 2); -- Rayo Plateado en Torneo 1
