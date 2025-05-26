-- Script para actualizar la tabla_invitaciones
-- Añade un campo email para almacenar el correo electrónico del destinatario

-- Verificar si la columna ya existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tabla_invitaciones' 
        AND column_name = 'email'
    ) THEN
        -- Añadir columna email
        ALTER TABLE tabla_invitaciones ADD COLUMN email VARCHAR(255);
        
        -- Añadir comentario a la columna
        COMMENT ON COLUMN tabla_invitaciones.email IS 'Correo electrónico del destinatario de la invitación';
        
        RAISE NOTICE 'Columna email añadida a tabla_invitaciones';
    ELSE
        RAISE NOTICE 'La columna email ya existe en tabla_invitaciones';
    END IF;
END
$$;

-- Crear un índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_invitaciones_email
ON tabla_invitaciones(email);

-- Actualizar comentario de la tabla
COMMENT ON TABLE tabla_invitaciones IS 'Tabla para almacenar invitaciones a profesores y administradores';
