-- Crear tabla para asignaciones (assignments)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_entrega TIMESTAMP WITH TIME ZONE NOT NULL,
  puntuacion_maxima INTEGER NOT NULL DEFAULT 100,
  permitir_texto BOOLEAN NOT NULL DEFAULT TRUE,
  permitir_archivos BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla para envíos de asignaciones (submissions)
CREATE TABLE IF NOT EXISTS assignment_submissions (
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

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_assignments_unidad ON assignments(unidad_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_usuario ON assignment_submissions(usuario_id);

-- Comentarios de las tablas
COMMENT ON TABLE assignments IS 'Tabla para almacenar asignaciones o tareas para los estudiantes';
COMMENT ON TABLE assignment_submissions IS 'Tabla para almacenar los envíos de los estudiantes para las asignaciones';
