import db from '../config/db.js';

class MensajeChat {
  // Obtener todos los mensajes de un chat
  static async getByChatId(chatId) {
    try {
      const result = await db.query(
        'SELECT * FROM mensajes_chat WHERE chat_id = $1 ORDER BY timestamp ASC',
        [chatId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener mensajes para chat ${chatId}:`, error);
      throw error;
    }
  }

  // Obtener mensaje por ID
  static async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM mensajes_chat WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener mensaje con ID ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo mensaje
  static async create(chatId, remitente, contenido, adjuntoUrl = null, tipoMensaje = 'texto') {
    try {
      // Insertar el mensaje
      const result = await db.query(
        'INSERT INTO mensajes_chat (chat_id, remitente, contenido, adjunto_url, tipo_mensaje) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [chatId, remitente, contenido, adjuntoUrl, tipoMensaje]
      );

      // Actualizar la fecha del último mensaje en el chat
      await db.query(
        'UPDATE chats SET fecha_ultimo_mensaje = NOW() WHERE id = $1',
        [chatId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error al crear mensaje de chat:', error);
      throw error;
    }
  }

  // Eliminar mensaje
  static async delete(id) {
    try {
      await db.query('DELETE FROM mensajes_chat WHERE id = $1', [id]);
      return { message: `Mensaje con ID ${id} eliminado correctamente` };
    } catch (error) {
      console.error(`Error al eliminar mensaje con ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener los últimos N mensajes de un chat
  static async getLastMessages(chatId, limit = 10) {
    try {
      const result = await db.query(
        'SELECT * FROM mensajes_chat WHERE chat_id = $1 ORDER BY timestamp DESC LIMIT $2',
        [chatId, limit]
      );
      // Invertir el orden para que estén en orden cronológico
      return result.rows.reverse();
    } catch (error) {
      console.error(`Error al obtener últimos mensajes para chat ${chatId}:`, error);
      throw error;
    }
  }

  // Contar mensajes en un chat
  static async countMessages(chatId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as total FROM mensajes_chat WHERE chat_id = $1',
        [chatId]
      );
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error(`Error al contar mensajes para chat ${chatId}:`, error);
      throw error;
    }
  }
}

export default MensajeChat;
