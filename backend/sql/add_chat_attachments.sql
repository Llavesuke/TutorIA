-- Añadir campos para soportar adjuntos en mensajes de chat
-- Ejecutar este script para actualizar la base de datos existente

-- Añadir columnas para adjuntos en mensajes_chat
ALTER TABLE mensajes_chat 
ADD COLUMN adjunto_url VARCHAR(512),
ADD COLUMN tipo_mensaje VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensaje IN ('texto', 'imagen', 'archivo'));

-- Crear índice para mejorar rendimiento en consultas por tipo de mensaje
CREATE INDEX idx_mensajes_chat_tipo ON mensajes_chat(tipo_mensaje);

-- Comentarios para documentación
COMMENT ON COLUMN mensajes_chat.adjunto_url IS 'URL del archivo adjunto (imagen, documento, etc.) subido a Cloudinary';
COMMENT ON COLUMN mensajes_chat.tipo_mensaje IS 'Tipo de mensaje: texto (solo texto), imagen (contiene imagen), archivo (contiene archivo)';
