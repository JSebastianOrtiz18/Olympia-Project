CREATE DATABASE IF NOT EXISTS db_olympia;
USE db_olympia;

-- ==============================================================================
--                               TABLAS MAESTRAS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLA: Usuario
-- Descripción: Almacena la información personal de todos los usuarios del sistema.
-- ------------------------------------------------------------------------------
CREATE TABLE Usuario
(
  dni_usuario BIGINT NOT NULL,
  nombre_usuario VARCHAR(50) NOT NULL,
  apellido_usuario VARCHAR(50) NOT NULL,
  fecha_nac DATE NOT NULL,
  email VARCHAR(150) NOT NULL,
  telefono_usuario BIGINT,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (dni_usuario)
);
-- Unicidad: Evita correos y teléfonos duplicados en el sistema
ALTER TABLE Usuario 
  ADD CONSTRAINT uq_usu_email UNIQUE (email),
  ADD CONSTRAINT uq_usu_tel UNIQUE (telefono_usuario);


-- ------------------------------------------------------------------------------
-- TABLAS DE CATÁLOGO (Formato, Categoría, Deporte, Rol)
-- Descripción: Tablas paramétricas para normalizar atributos de texto (3NF).
-- ------------------------------------------------------------------------------
CREATE TABLE Formato
(
  id_formato INT NOT NULL AUTO_INCREMENT,
  nombre_formato VARCHAR(30) NOT NULL,
  PRIMARY KEY (id_formato)
);

CREATE TABLE Categoria
(
  id_categoria INT NOT NULL AUTO_INCREMENT,
  nombre_categoria VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_categoria)
);

CREATE TABLE Deporte
(
  id_deporte INT NOT NULL AUTO_INCREMENT,
  nombre_deporte VARCHAR(30) NOT NULL,
  PRIMARY KEY (id_deporte)
);

CREATE TABLE Rol
(
  id_rol INT NOT NULL AUTO_INCREMENT,
  nombre_rol VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_rol)
);
-- Unicidad: No pueden existir dos roles con el mismo nombre
ALTER TABLE Rol 
  ADD CONSTRAINT uq_rol_nom UNIQUE (nombre_rol);


-- ==============================================================================
--                          TABLAS CON DEPENDENCIAS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLA: Disciplina
-- Descripción: Entidad unificadora que combina un deporte con una categoría.
-- ------------------------------------------------------------------------------
CREATE TABLE Disciplina
(
  id_disciplina INT NOT NULL AUTO_INCREMENT,
  id_categoria INT NOT NULL,
  id_deporte INT NOT NULL,
  PRIMARY KEY (id_disciplina)
);

ALTER TABLE Disciplina 
  ADD CONSTRAINT fk_dis_cat FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria),
  ADD CONSTRAINT fk_dis_dep FOREIGN KEY (id_deporte) REFERENCES Deporte(id_deporte);


-- ------------------------------------------------------------------------------
-- TABLA: Torneo
-- Descripción: Almacena la configuración y reglas de los eventos deportivos.
-- ------------------------------------------------------------------------------
CREATE TABLE Torneo
(
  id_torneo INT NOT NULL AUTO_INCREMENT,
  nombre_torneo VARCHAR(150) NOT NULL,
  torneo_inicio DATE NOT NULL,
  torneo_fin DATE NOT NULL,
  max_equipos INT NOT NULL,
  id_formato INT NOT NULL,
  id_disciplina INT NOT NULL,
  pin_asistente VARCHAR(6) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_torneo)
);

ALTER TABLE Torneo 
  ADD CONSTRAINT fk_tor_for FOREIGN KEY (id_formato) REFERENCES Formato(id_formato),
  ADD CONSTRAINT fk_tor_dis FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina);
-- Validación Lógica: Fechas coherentes y mínimo de participantes para competir
ALTER TABLE Torneo 
  ADD CONSTRAINT chk_tor_fec CHECK (torneo_fin >= torneo_inicio),
  ADD CONSTRAINT chk_tor_max CHECK (max_equipos >= 2);


-- ------------------------------------------------------------------------------
-- TABLA: Equipo
-- Descripción: Registra los equipos inscriptos en la plataforma.
-- ------------------------------------------------------------------------------
CREATE TABLE Equipo
(
  id_equipo INT NOT NULL AUTO_INCREMENT,
  nombre_equipo VARCHAR(70) NOT NULL,
  descripcion_equipo VARCHAR(200) NOT NULL,
  id_disciplina INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_equipo)
);

ALTER TABLE Equipo 
  ADD CONSTRAINT fk_equ_dis FOREIGN KEY (id_disciplina) REFERENCES Disciplina(id_disciplina);
-- RESTRICCIÓN COMPUESTA : 
-- Evalúa el nombre y la disciplina como un paquete único. 
ALTER TABLE Equipo 
  ADD CONSTRAINT uq_equ_nom_dis UNIQUE (nombre_equipo, id_disciplina);


-- ------------------------------------------------------------------------------
CREATE TABLE Partido
(
  id_partido INT NOT NULL AUTO_INCREMENT,
  estado_partido VARCHAR(20) NOT NULL,
  fecha_partido DATE NOT NULL,
  id_torneo INT NOT NULL,
  fase_jornada VARCHAR(50) NOT NULL,
  PRIMARY KEY (id_partido)
);

ALTER TABLE Partido 
  ADD CONSTRAINT fk_par_tor FOREIGN KEY (id_torneo) REFERENCES Torneo(id_torneo);
-- Validación Lógica: Limita los estados posibles del partido
ALTER TABLE Partido 
  ADD CONSTRAINT chk_par_est CHECK (estado_partido IN ('Pendiente', 'En Juego', 'Finalizado', 'Suspendido'));


-- ==============================================================================
--                     TABLAS ASOCIATIVAS 
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TABLA: List_colaboradores
-- Descripción: Registra al personal de apoyo asignado a un torneo específico.
-- ------------------------------------------------------------------------------
CREATE TABLE List_colaboradores
(
  fecha_registro DATE NOT NULL,
  dni_usuario BIGINT NOT NULL,
  id_torneo INT NOT NULL,
  id_rol INT NOT NULL,
  PRIMARY KEY (dni_usuario, id_torneo)
);

ALTER TABLE List_colaboradores 
  ADD CONSTRAINT fk_col_usu FOREIGN KEY (dni_usuario) REFERENCES Usuario(dni_usuario),
  ADD CONSTRAINT fk_col_tor FOREIGN KEY (id_torneo) REFERENCES Torneo(id_torneo),
  ADD CONSTRAINT fk_col_rol FOREIGN KEY (id_rol) REFERENCES Rol(id_rol);


-- ------------------------------------------------------------------------------
-- TABLA: Plantilla_equipo
-- Descripción: Gestiona la lista de jugadores que conforman un equipo.
-- ------------------------------------------------------------------------------
CREATE TABLE Plantilla_equipo
(
  posicion_equipo VARCHAR(30) NOT NULL,
  nro_dorsal INT NOT NULL,
  id_equipo INT NOT NULL,
  dni_usuario BIGINT NOT NULL,
  PRIMARY KEY (id_equipo, dni_usuario)
);

ALTER TABLE Plantilla_equipo 
  ADD CONSTRAINT fk_pla_equ FOREIGN KEY (id_equipo) REFERENCES Equipo(id_equipo),
  ADD CONSTRAINT fk_pla_usu FOREIGN KEY (dni_usuario) REFERENCES Usuario(dni_usuario);


-- ------------------------------------------------------------------------------
-- TABLA: Torneo_equipo
-- Descripción: Historial de inscripciones de los equipos a los diferentes torneos.
-- ------------------------------------------------------------------------------
CREATE TABLE Torneo_equipo
(
  fecha_inscripcion DATE NOT NULL,
  id_torneo INT NOT NULL,
  id_equipo INT NOT NULL,
  PRIMARY KEY (id_torneo, id_equipo)
);

ALTER TABLE Torneo_equipo 
  ADD CONSTRAINT fk_teq_tor FOREIGN KEY (id_torneo) REFERENCES Torneo(id_torneo),
  ADD CONSTRAINT fk_teq_equ FOREIGN KEY (id_equipo) REFERENCES Equipo(id_equipo);


-- ------------------------------------------------------------------------------
-- TABLA: Resultado_partido
-- Descripción: Almacena la puntuación final de cada equipo en un partido.
-- ------------------------------------------------------------------------------
CREATE TABLE Resultado_partido
(
  condicion VARCHAR(30) NOT NULL,
  puntuacion INT NOT NULL,
  id_partido INT NOT NULL,
  id_equipo INT NOT NULL,
  PRIMARY KEY (id_partido, id_equipo)
);

ALTER TABLE Resultado_partido 
  ADD CONSTRAINT fk_res_par FOREIGN KEY (id_partido) REFERENCES Partido(id_partido),
  ADD CONSTRAINT fk_res_equ FOREIGN KEY (id_equipo) REFERENCES Equipo(id_equipo);
-- Validación Lógica: Reglas estrictas para los resultados
ALTER TABLE Resultado_partido 
  ADD CONSTRAINT chk_res_con CHECK (condicion IN ('Local', 'Visitante')),
  ADD CONSTRAINT chk_res_pun CHECK (puntuacion >= 0);