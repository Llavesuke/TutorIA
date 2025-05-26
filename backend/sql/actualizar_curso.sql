-- Script para actualizar la tabla usuarios añadiendo el campo curso para estudiantes
-- Este script añade:
-- 1. Un nuevo campo 'curso' para almacenar el curso del estudiante (ej: "1º ESO", "2º ESO")
-- 2. Una restricción para asegurar que solo los estudiantes tengan curso

-- 1. Añadir el campo curso a la tabla usuarios
ALTER TABLE IF EXISTS usuarios 
ADD COLUMN IF NOT EXISTS curso VARCHAR(20);

-- 2. Añadir restricción para asegurar que solo los estudiantes tengan curso
ALTER TABLE IF EXISTS usuarios
ADD CONSTRAINT IF NOT EXISTS usuarios_estudiante_curso
CHECK (
    (rol != 'estudiante') OR 
    (curso IS NOT NULL)
);

-- 3. Actualizar comentarios de la tabla para documentar los cambios
COMMENT ON COLUMN usuarios.curso IS 'Curso del estudiante (ej: "1º ESO", "2º ESO"). Solo aplicable a usuarios con rol "estudiante".';

-- Nota: Esta restricción permite que los estudiantes existentes tengan curso NULL temporalmente,
-- pero requerirá que los nuevos estudiantes tengan un curso asignado.
