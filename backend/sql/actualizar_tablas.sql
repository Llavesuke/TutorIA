-- Script para actualizar una base de datos existente
-- Este script modifica la tabla usuarios para permitir:
-- 1. Estudiantes sin correo electrónico (email opcional)
-- 2. Profesores y administradores con correo electrónico obligatorio
-- 3. Inicio de sesión con nombre de usuario o correo electrónico
-- 4. Seguimiento del estado de verificación del correo electrónico

-- 1. Hacer que el campo email sea opcional
ALTER TABLE IF EXISTS usuarios
ALTER COLUMN email DROP NOT NULL;

-- 2. Añadir campo email_verificado
ALTER TABLE IF EXISTS usuarios
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- 3. Añadir restricción para asegurar que profesores y admins tengan email
ALTER TABLE IF EXISTS usuarios
ADD CONSTRAINT IF NOT EXISTS usuarios_profesor_admin_email_required
CHECK (
    (rol != 'profesor' AND rol != 'admin') OR
    (email IS NOT NULL)
);

-- 4. Añadir restricción de unicidad para nombre_usuario
ALTER TABLE IF EXISTS usuarios
ADD CONSTRAINT IF NOT EXISTS usuarios_nombre_usuario_unique UNIQUE (nombre_usuario);

-- 5. Modificar la restricción de unicidad para email para permitir valores nulos
-- Primero eliminamos la restricción existente si existe
ALTER TABLE IF EXISTS usuarios
DROP CONSTRAINT IF EXISTS usuarios_email_key;

-- Luego creamos un índice único que ignora los valores nulos
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_unique
ON usuarios (email)
WHERE email IS NOT NULL;

-- 6. Añadir índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_usuarios_nombre_usuario
ON usuarios(nombre_usuario);

CREATE INDEX IF NOT EXISTS idx_usuarios_email
ON usuarios(email)
WHERE email IS NOT NULL;

-- 7. Actualizar los usuarios existentes con email para establecer email_verificado
-- basado en el estado de verificación en Supabase Auth
-- Nota: Esta consulta debe ejecutarse con permisos de administrador
UPDATE usuarios u
SET email_verificado = TRUE
FROM auth.users au
WHERE u.email = au.email
AND au.email_confirmed_at IS NOT NULL;

-- 8. Añadir campo curso para estudiantes
ALTER TABLE IF EXISTS usuarios
ADD COLUMN IF NOT EXISTS curso VARCHAR(20);

-- 9. Añadir restricción para asegurar que solo los estudiantes tengan curso
ALTER TABLE IF EXISTS usuarios
ADD CONSTRAINT IF NOT EXISTS usuarios_estudiante_curso
CHECK (
    (rol != 'estudiante') OR
    (curso IS NOT NULL)
);

-- 10. Actualizar comentarios de la tabla para documentar los cambios
COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema. Los profesores y administradores requieren email, los estudiantes no.';
COMMENT ON COLUMN usuarios.email IS 'Email del usuario. Requerido para profesores y administradores, opcional para estudiantes.';
COMMENT ON COLUMN usuarios.email_verificado IS 'Indica si el email del usuario ha sido verificado.';
COMMENT ON COLUMN usuarios.nombre_usuario IS 'Nombre de usuario único para iniciar sesión.';
COMMENT ON COLUMN usuarios.curso IS 'Curso del estudiante (ej: "1º ESO", "2º ESO"). Solo aplicable a usuarios con rol "estudiante".';
