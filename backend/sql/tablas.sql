-- Script de creación de tablas para TutorIA
-- Actualizado para permitir:
-- 1. Estudiantes sin correo electrónico (email opcional)
-- 2. Profesores y administradores con correo electrónico obligatorio
-- 3. Inicio de sesión con nombre de usuario o correo electrónico
-- 4. Seguimiento del estado de verificación del correo electrónico
-- 5. Adjuntos de imágenes y archivos en mensajes de chat
-- 6. Clasificación de mensajes por tipo (texto, imagen, archivo)
-- 7. Sistema RAG (Retrieval-Augmented Generation) para documentos PDF/DOCX
-- 8. Almacenamiento de embeddings vectoriales con pgvector

-- Habilitar extensión pgvector para búsqueda de similitud vectorial
CREATE EXTENSION IF NOT EXISTS vector;

-- Tablas principales
CREATE TABLE centros_educativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id UUID NOT NULL REFERENCES centros_educativos(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  curso VARCHAR(20), -- Campo para almacenar el curso al que pertenece el módulo (ej: "1º ESO", "2º ESO")
  clase VARCHAR(10) -- Campo para almacenar la clase específica (ej: "A", "B", "C") o NULL si aplica a todas
);

CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  orden SMALLINT NOT NULL
);

-- Tutores virtuales (múltiples por unidad)
CREATE TABLE tutores_virtuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) CHECK (tipo IN ('teorico', 'practico', 'evaluador', 'general')),
  configuracion JSONB,
  modelo_ia VARCHAR(50) DEFAULT 'gemini',
  imagen VARCHAR(512),
  objetivo TEXT,
  instrucciones TEXT,
  grupo VARCHAR(50),
  activo BOOLEAN DEFAULT TRUE
);

-- Usuarios y seguridad
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id UUID REFERENCES centros_educativos(id) ON DELETE CASCADE,
  rol VARCHAR(20) CHECK (rol IN ('admin', 'profesor', 'estudiante')) NOT NULL,
  nombre_usuario VARCHAR(255) NOT NULL UNIQUE, -- Nombre de usuario único
  nombre_real VARCHAR(255) NOT NULL, -- Nombre real del usuario
  email VARCHAR(255), -- Email opcional para estudiantes, requerido para profesores y admins
  contraseña_hash VARCHAR(255) NOT NULL,
  foto_perfil VARCHAR(512),
  curso VARCHAR(20), -- Campo para almacenar el curso del estudiante (ej: "1º ESO", "2º ESO")
  clase VARCHAR(10), -- Campo para almacenar la clase del estudiante (ej: "A", "B", "C")
  created_by UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  email_verificado BOOLEAN DEFAULT FALSE, -- Indica si el email ha sido verificado
  -- Restricción para asegurar que profesores y admins tengan email
  CONSTRAINT usuarios_profesor_admin_email_required CHECK (
    (rol != 'profesor' AND rol != 'admin') OR (email IS NOT NULL)
  ),
  -- Restricción para asegurar que solo los estudiantes tengan curso
  CONSTRAINT usuarios_estudiante_curso CHECK (
    (rol != 'estudiante') OR (curso IS NOT NULL)
  )
);

CREATE TABLE tabla_invitaciones (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centro_id UUID NOT NULL REFERENCES centros_educativos(id) ON DELETE CASCADE,
  tipo_rol VARCHAR(20) CHECK (tipo_rol IN ('profesor', 'admin')) NOT NULL,
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  usado BOOLEAN DEFAULT false
);

CREATE TABLE tabla_reseteo_contrasena (
  usuario_id UUID PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Gestión de chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tutor_virtual_id UUID NOT NULL REFERENCES tutores_virtuales(id) ON DELETE CASCADE,
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_ultimo_mensaje TIMESTAMP WITH TIME ZONE
);

CREATE TABLE mensajes_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  remitente VARCHAR(20) CHECK (remitente IN ('usuario', 'tutor')) NOT NULL,
  contenido TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  adjunto_url VARCHAR(512), -- URL del archivo adjunto (imagen, documento, etc.) subido a Cloudinary
  tipo_mensaje VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'imagen', 'archivo')) -- Tipo de mensaje: texto, imagen o archivo
);

-- Documentación y actividades
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
  unidad_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  url VARCHAR(512) NOT NULL,
  tipo VARCHAR(50) CHECK (tipo IN ('pdf', 'docx', 'pptx', 'txt')),
  subido_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imagenes_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  url VARCHAR(512) NOT NULL,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo VARCHAR(50) CHECK (tipo IN ('sistema', 'actividad', 'recordatorio')),
  mensaje TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tablas de relación N:M
CREATE TABLE usuarios_modulos (
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, modulo_id)
);

CREATE TABLE usuarios_unidades (
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  unidad_id UUID REFERENCES unidades(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, unidad_id)
);

-- Tareas y entregas
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_entrega TIMESTAMP WITH TIME ZONE NOT NULL,
  puntuacion_maxima INTEGER NOT NULL DEFAULT 100,
  permitir_texto BOOLEAN NOT NULL DEFAULT TRUE,
  permitir_archivos BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  texto_respuesta TEXT,
  archivos_urls JSONB,
  fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  calificacion INTEGER,
  comentarios TEXT,
  calificado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_calificacion TIMESTAMP WITH TIME ZONE
);

-- Índices para optimización
CREATE INDEX idx_usuarios_centro ON usuarios(centro_id);
CREATE INDEX idx_usuarios_nombre_usuario ON usuarios(nombre_usuario);
CREATE INDEX idx_usuarios_email ON usuarios(email) WHERE email IS NOT NULL;
CREATE INDEX idx_modulos_centro ON modulos(centro_id);
CREATE INDEX idx_unidades_modulo ON unidades(modulo_id);
CREATE INDEX idx_tutores_unidad ON tutores_virtuales(unidad_id);
CREATE INDEX idx_chats_usuario ON chats(usuario_id);
CREATE INDEX idx_mensajes_chat_tipo ON mensajes_chat(tipo_mensaje);
CREATE INDEX idx_documentos_unidad ON documentos(unidad_id);
CREATE INDEX idx_assignments_unidad ON assignments(unidad_id);
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_usuario ON assignment_submissions(usuario_id);

-- ========================================
-- TABLAS PARA SISTEMA RAG (Retrieval-Augmented Generation)
-- ========================================

-- Documentos RAG: Metadatos de documentos PDF/DOCX para el sistema RAG
CREATE TABLE documentos_rag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_virtual_id UUID NOT NULL REFERENCES tutores_virtuales(id) ON DELETE CASCADE,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_archivo VARCHAR(10) CHECK (tipo_archivo IN ('pdf', 'docx')) NOT NULL,
  url_cloudinary VARCHAR(512) NOT NULL,
  tamaño_bytes BIGINT NOT NULL,
  estado_procesamiento VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'error')),
  error_mensaje TEXT,
  total_chunks INTEGER DEFAULT 0,
  subido_por UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  fecha_procesamiento TIMESTAMP WITH TIME ZONE,
  metadatos JSONB DEFAULT '{}'::jsonb
);

-- Chunks de texto con embeddings vectoriales
CREATE TABLE chunks_texto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_rag_id UUID NOT NULL REFERENCES documentos_rag(id) ON DELETE CASCADE,
  contenido_texto TEXT NOT NULL,
  embedding vector(768), -- Google text-embedding-004 produce embeddings de 768 dimensiones
  numero_chunk INTEGER NOT NULL,
  posicion_inicio INTEGER,
  posicion_fin INTEGER,
  metadatos_chunk JSONB DEFAULT '{}'::jsonb,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relación entre tutores y documentos RAG (para casos donde un documento se comparte entre tutores)
CREATE TABLE tutor_documentos_rag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_virtual_id UUID NOT NULL REFERENCES tutores_virtuales(id) ON DELETE CASCADE,
  documento_rag_id UUID NOT NULL REFERENCES documentos_rag(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tutor_virtual_id, documento_rag_id)
);

-- Índices para optimización del sistema RAG
CREATE INDEX idx_documentos_rag_tutor ON documentos_rag(tutor_virtual_id);
CREATE INDEX idx_documentos_rag_estado ON documentos_rag(estado_procesamiento);
CREATE INDEX idx_chunks_documento ON chunks_texto(documento_rag_id);
CREATE INDEX idx_chunks_embedding ON chunks_texto USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_tutor_documentos_tutor ON tutor_documentos_rag(tutor_virtual_id);
CREATE INDEX idx_tutor_documentos_documento ON tutor_documentos_rag(documento_rag_id);

-- Comentarios de las tablas
COMMENT ON TABLE centros_educativos IS 'Centros educativos que utilizan la plataforma';
COMMENT ON TABLE modulos IS 'Módulos o asignaturas dentro de cada centro educativo';
COMMENT ON TABLE unidades IS 'Unidades temáticas dentro de cada módulo';
COMMENT ON TABLE tutores_virtuales IS 'Tutores virtuales de IA para cada unidad';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema (administradores, profesores, estudiantes)';
COMMENT ON TABLE chats IS 'Conversaciones entre usuarios y tutores virtuales';
COMMENT ON TABLE mensajes_chat IS 'Mensajes individuales dentro de cada conversación';
COMMENT ON TABLE documentos IS 'Documentos subidos por los usuarios';
COMMENT ON TABLE imagenes_actividad IS 'Imágenes subidas por estudiantes para actividades';
COMMENT ON TABLE notificaciones IS 'Sistema de notificaciones para usuarios';
COMMENT ON TABLE usuarios_modulos IS 'Relación entre usuarios y módulos (profesores asignados)';
COMMENT ON TABLE usuarios_unidades IS 'Relación entre usuarios y unidades (estudiantes inscritos)';
COMMENT ON TABLE assignments IS 'Tareas asignadas a estudiantes';
COMMENT ON TABLE assignment_submissions IS 'Entregas de tareas por parte de estudiantes';
COMMENT ON TABLE documentos_rag IS 'Documentos PDF/DOCX para el sistema RAG de tutores virtuales';
COMMENT ON TABLE chunks_texto IS 'Fragmentos de texto con embeddings vectoriales para búsqueda semántica';
COMMENT ON TABLE tutor_documentos_rag IS 'Relación entre tutores virtuales y sus documentos de contexto RAG';
