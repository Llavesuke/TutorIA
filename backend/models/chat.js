import db from '../config/db.js';

class Chat {
  // Ejecutar consulta personalizada
  static async query(text, params) {
    try {
      return await db.query(text, params);
    } catch (error) {
      console.error('Error executing custom query:', error);
      throw error;
    }
  }
  // Obtener todos los chats
  static async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM chats ORDER BY fecha_inicio DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error al obtener chats:', error);
      throw error;
    }
  }

  // Obtener chats por ID de usuario
  static async getByUsuarioId(usuarioId) {
    try {
      const result = await db.query(
        'SELECT c.*, tv.nombre as tutor_nombre, tv.tipo as tutor_tipo ' +
        'FROM chats c ' +
        'JOIN tutores_virtuales tv ON c.tutor_virtual_id = tv.id ' +
        'WHERE c.usuario_id = $1 ' +
        'ORDER BY c.fecha_ultimo_mensaje DESC NULLS LAST, c.fecha_inicio DESC',
        [usuarioId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener chats para usuario ${usuarioId}:`, error);
      throw error;
    }
  }

  // Obtener chats por ID de tutor virtual
  static async getByTutorVirtualId(tutorVirtualId) {
    try {
      const result = await db.query(
        'SELECT c.*, u.nombre_usuario as usuario_nombre ' +
        'FROM chats c ' +
        'JOIN usuarios u ON c.usuario_id = u.id ' +
        'WHERE c.tutor_virtual_id = $1 ' +
        'ORDER BY c.fecha_ultimo_mensaje DESC NULLS LAST, c.fecha_inicio DESC',
        [tutorVirtualId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener chats para tutor virtual ${tutorVirtualId}:`, error);
      throw error;
    }
  }

  // Obtener chat por ID
  static async getById(id) {
    try {
      const result = await db.query(
        'SELECT c.*, tv.nombre as tutor_nombre, tv.tipo as tutor_tipo, u.nombre_usuario as usuario_nombre ' +
        'FROM chats c ' +
        'JOIN tutores_virtuales tv ON c.tutor_virtual_id = tv.id ' +
        'JOIN usuarios u ON c.usuario_id = u.id ' +
        'WHERE c.id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener chat con ID ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo chat
  static async create(usuarioId, tutorVirtualId) {
    try {
      const result = await db.query(
        'INSERT INTO chats (usuario_id, tutor_virtual_id) VALUES ($1, $2) RETURNING *',
        [usuarioId, tutorVirtualId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear chat:', error);
      throw error;
    }
  }

  // Actualizar fecha del último mensaje
  static async updateLastMessageTime(id) {
    try {
      const result = await db.query(
        'UPDATE chats SET fecha_ultimo_mensaje = NOW() WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error al actualizar fecha del último mensaje para chat ${id}:`, error);
      throw error;
    }
  }

  // Eliminar chat
  static async delete(id) {
    try {
      // Primero eliminar todos los mensajes asociados al chat
      await db.query('DELETE FROM mensajes_chat WHERE chat_id = $1', [id]);

      // Luego eliminar el chat
      await db.query('DELETE FROM chats WHERE id = $1', [id]);

      return { message: `Chat con ID ${id} eliminado correctamente` };
    } catch (error) {
      console.error(`Error al eliminar chat con ID ${id}:`, error);
      throw error;
    }
  }
}

export default Chat;
