-- =================================================================
-- Documentación General del Esquema
-- =================================================================
--
-- Propósito: Este esquema define la estructura de la base de datos para el
--            Sistema de Gestión de Egresados del IES, diseñado para
--            soportar los requerimientos funcionales y no funcionales
--            descritos en el SRS.
-- Versión: 1.1 (con soporte para imágenes)
-- Motor: SQLite3 (Compatible con Turso)
--
-- =================================================================
-- Activación de claves foráneas (ejecutar por conexión)
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------
-- Tabla: Carrera
-- -----------------------------------------------------------------
-- Propósito: Almacena las diferentes carreras ofrecidas por el IES.
--            Cada egresado estará asociado a una de estas carreras.
-- -----------------------------------------------------------------
CREATE TABLE Carrera (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

-- -----------------------------------------------------------------
-- Tabla: Usuario
-- -----------------------------------------------------------------
-- Propósito: Tabla base para almacenar los datos comunes de todos los
--            usuarios del sistema (Egresados y Administradores).
--            Se utiliza una estrategia de "una tabla por clase" para
--            modelar la herencia.
-- -----------------------------------------------------------------
CREATE TABLE Usuario (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT, -- Campo agregado para apellido del usuario
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  tipo_usuario TEXT NOT NULL CHECK (tipo_usuario IN ('Egresado', 'Administrador'))
);

-- -----------------------------------------------------------------
-- Tabla: Perfil
-- -----------------------------------------------------------------
-- Propósito: Contiene toda la información profesional del egresado,
--            incluyendo imágenes de perfil y banner.
-- -----------------------------------------------------------------
CREATE TABLE Perfil (
  id INTEGER PRIMARY KEY,
  resumenProfesional TEXT,
  urlPortfolio TEXT,
  situacionLaboral TEXT,
  urlFotoPerfil TEXT, -- Campo para la foto de perfil
  urlBanner TEXT, -- Campo para la imagen de banner
  perfilPublico BOOLEAN DEFAULT 0, -- Indica si el perfil es público
  mostrarContacto BOOLEAN DEFAULT 0, -- Indica si mostrar información de contacto
  disponibleOfertas BOOLEAN DEFAULT 0, -- Indica si está disponible para ofertas laborales
  tituloprofesional TEXT, -- Título profesional del egresado
  areaInteres TEXT, -- Área de interés profesional
  fechaNacimiento DATE, -- Fecha de nacimiento
  direccion TEXT, -- Dirección del egresado
  ciudad TEXT, -- Ciudad de residencia
  provincia TEXT, -- Provincia de residencia
  pais TEXT DEFAULT 'Argentina' -- País de residencia
);

-- -----------------------------------------------------------------
-- Tabla: Egresado
-- -----------------------------------------------------------------
-- Propósito: Representa a un egresado del IES. Hereda los atributos
--            comunes de la tabla Usuario.
-- -----------------------------------------------------------------
CREATE TABLE Egresado (
  id INTEGER PRIMARY KEY,
  dni TEXT NOT NULL UNIQUE,
  telefono TEXT,
  perfilId INTEGER UNIQUE,
  carreraId INTEGER,
  FOREIGN KEY (id) REFERENCES Usuario (id) ON DELETE CASCADE,
  FOREIGN KEY (perfilId) REFERENCES Perfil (id) ON DELETE SET NULL,
  FOREIGN KEY (carreraId) REFERENCES Carrera (id) ON DELETE SET NULL
);

-- -----------------------------------------------------------------
-- Tabla: Administrador
-- -----------------------------------------------------------------
-- Propósito: Representa a un administrador del sistema, responsable de
--            validar a los egresados. Hereda de Usuario.
-- -----------------------------------------------------------------
CREATE TABLE Administrador (
  id INTEGER PRIMARY KEY,
  dni TEXT NOT NULL UNIQUE,
  FOREIGN KEY (id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: DniValido
-- -----------------------------------------------------------------
-- Propósito: Almacena la lista de DNIs de egresados válidos, precargada
--            por los administradores para el proceso de registro.
-- -----------------------------------------------------------------
CREATE TABLE DniValido (dni TEXT PRIMARY KEY, carrera TEXT NOT NULL);

-- -----------------------------------------------------------------
-- Tabla: ExperienciaLaboral
-- -----------------------------------------------------------------
CREATE TABLE ExperienciaLaboral (
  id INTEGER PRIMARY KEY,
  puesto TEXT NOT NULL,
  empresa TEXT NOT NULL,
  fechaInicio DATE,
  fechaFin DATE,
  descripcion TEXT,
  perfilId INTEGER NOT NULL,
  FOREIGN KEY (perfilId) REFERENCES Perfil (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: FormacionAcademica
-- -----------------------------------------------------------------
CREATE TABLE FormacionAcademica (
  id INTEGER PRIMARY KEY,
  titulo TEXT NOT NULL,
  institucion TEXT NOT NULL,
  anioFinalizacion INTEGER,
  perfilId INTEGER NOT NULL,
  FOREIGN KEY (perfilId) REFERENCES Perfil (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Curso
-- -----------------------------------------------------------------
CREATE TABLE Curso (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  institucion TEXT NOT NULL,
  horasDuracion INTEGER,
  perfilId INTEGER NOT NULL,
  FOREIGN KEY (perfilId) REFERENCES Perfil (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Mensaje
-- -----------------------------------------------------------------
CREATE TABLE Mensaje (
  id INTEGER PRIMARY KEY,
  contenido TEXT NOT NULL,
  fechaEnvio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado TEXT NOT NULL CHECK (estado IN ('LEIDO', 'NO_LEIDO')),
  remitenteId INTEGER NOT NULL,
  destinatarioId INTEGER NOT NULL,
  FOREIGN KEY (remitenteId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (destinatarioId) REFERENCES Egresado (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Notificacion
-- -----------------------------------------------------------------
CREATE TABLE Notificacion (
  id INTEGER PRIMARY KEY,
  contenido TEXT NOT NULL,
  fechaEnvio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  egresadoId INTEGER NOT NULL,
  FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Publicacion
-- -----------------------------------------------------------------
-- Propósito: Contenido generado por los egresados para ser compartido
--            con la comunidad.
-- -----------------------------------------------------------------
CREATE TABLE Publicacion (
  id INTEGER PRIMARY KEY,
  contenido TEXT NOT NULL,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  autorId INTEGER NOT NULL,
  FOREIGN KEY (autorId) REFERENCES Egresado (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: ImagenPublicacion (NUEVA)
-- -----------------------------------------------------------------
-- Propósito: Almacena las URLs de las imágenes asociadas a una
--            publicación. Permite que una publicación tenga
--            múltiples imágenes.
-- -----------------------------------------------------------------
CREATE TABLE ImagenPublicacion (
  id INTEGER PRIMARY KEY,
  url TEXT NOT NULL,
  publicacionId INTEGER NOT NULL,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Comentario
-- -----------------------------------------------------------------
CREATE TABLE Comentario (
  id INTEGER PRIMARY KEY,
  contenido TEXT NOT NULL,
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fueEditado BOOLEAN NOT NULL DEFAULT 0,
  autorId INTEGER NOT NULL,
  publicacionId INTEGER NOT NULL,
  FOREIGN KEY (autorId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: LikePublicacion
-- -----------------------------------------------------------------
CREATE TABLE LikePublicacion (
  egresadoId INTEGER NOT NULL,
  publicacionId INTEGER NOT NULL,
  PRIMARY KEY (egresadoId, publicacionId),
  FOREIGN KEY (egresadoId) REFERENCES Egresado (id) ON DELETE CASCADE,
  FOREIGN KEY (publicacionId) REFERENCES Publicacion (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Habilidades
-- -----------------------------------------------------------------
-- Propósito: Almacena las habilidades técnicas y blandas de cada egresado.
--            Permite categorizar y clasificar por nivel de experticia.
-- -----------------------------------------------------------------
CREATE TABLE Habilidades (
  id INTEGER PRIMARY KEY,
  usuarioId INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'tecnica' CHECK (tipo IN ('tecnica', 'blanda', 'idioma')),
  nivel TEXT NOT NULL DEFAULT 'intermedio' CHECK (nivel IN ('basico', 'intermedio', 'avanzado', 'experto')),
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES Egresado (id) ON DELETE CASCADE,
  UNIQUE(usuarioId, nombre) -- Evita habilidades duplicadas por usuario
);

-- -----------------------------------------------------------------
-- Tabla: Proyectos
-- -----------------------------------------------------------------
-- Propósito: Almacena información sobre proyectos desarrollados por los egresados.
--            Incluye soporte para imágenes, enlaces y detalles técnicos.
-- -----------------------------------------------------------------
CREATE TABLE Proyectos (
  id INTEGER PRIMARY KEY,
  usuarioId INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  enlace TEXT,
  tecnologias TEXT,
  fechaProyecto DATE,
  imagen TEXT, -- URL de la imagen del proyecto
  fechaCreacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaActualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES Egresado (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------
-- Tabla: Notificacion
-- -----------------------------------------------------------------
-- Propósito: Almacena las notificaciones internas del sistema para cada usuario.
--            Soporta diferentes tipos de notificaciones y tracking de emails.
-- -----------------------------------------------------------------
CREATE TABLE Notificacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('comentario', 'like', 'mencion')),
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  url_destino TEXT,
  leida BOOLEAN DEFAULT 0,
  enviada_email BOOLEAN DEFAULT 0,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  origen_usuario_id INTEGER,
  FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE,
  FOREIGN KEY (origen_usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);

-- Índice para mejorar el rendimiento de consultas de notificaciones
CREATE INDEX idx_notificacion_usuario 
ON Notificacion(usuario_id, leida, fecha_creacion DESC);

-- -----------------------------------------------------------------
-- Tabla: PreferenciasNotificacion
-- -----------------------------------------------------------------
-- Propósito: Almacena las preferencias de notificación de cada usuario.
--            Permite configurar qué tipos de notificaciones recibir por email.
-- -----------------------------------------------------------------
CREATE TABLE PreferenciasNotificacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL UNIQUE,
  email_comentarios BOOLEAN DEFAULT 1,
  email_likes BOOLEAN DEFAULT 1,
  email_menciones BOOLEAN DEFAULT 1,
  email_resumen_diario BOOLEAN DEFAULT 0,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES Usuario (id) ON DELETE CASCADE
);