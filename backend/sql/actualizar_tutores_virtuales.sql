-- Actualizar la tabla tutores_virtuales para añadir el campo imagen
ALTER TABLE tutores_virtuales
ADD COLUMN IF NOT EXISTS imagen VARCHAR(512);

-- Añadir un índice para búsquedas por unidad_id
CREATE INDEX IF NOT EXISTS idx_tutores_unidad
ON tutores_virtuales(unidad_id);

-- Añadir un campo para el estado (activo/inactivo)
ALTER TABLE tutores_virtuales
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Actualizar comentario de la tabla
COMMENT ON TABLE tutores_virtuales IS 'Tabla para almacenar tutores virtuales con IA';
