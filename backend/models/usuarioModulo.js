import db from '../config/db.js';

/**
 * Modelo para la relación entre usuarios (profesores) y módulos
 */
class UsuarioModulo {
  /**
   * Asignar un usuario (profesor) a un módulo
   * @param {string} usuarioId - ID del usuario (profesor)
   * @param {string} moduloId - ID del módulo
   * @returns {Object} - Objeto con los IDs del usuario y módulo
   */
  static async asignarProfesorAModulo(usuarioId, moduloId) {
    try {
      console.log(`Asignando profesor ${usuarioId} al módulo ${moduloId}`);
      
      // Verificar si ya existe la asignación
      const checkResult = await db.query(
        'SELECT * FROM usuarios_modulos WHERE usuario_id = $1 AND modulo_id = $2',
        [usuarioId, moduloId]
      );
      
      if (checkResult.rows.length > 0) {
        console.log(`El profesor ${usuarioId} ya está asignado al módulo ${moduloId}`);
        return { usuario_id: usuarioId, modulo_id: moduloId };
      }
      
      // Crear la asignación
      const result = await db.query(
        'INSERT INTO usuarios_modulos (usuario_id, modulo_id) VALUES ($1, $2) RETURNING *',
        [usuarioId, moduloId]
      );
      
      console.log(`Profesor ${usuarioId} asignado correctamente al módulo ${moduloId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`Error al asignar profesor ${usuarioId} al módulo ${moduloId}:`, error);
      throw error;
    }
  }
  
  /**
   * Eliminar la asignación de un usuario (profesor) a un módulo
   * @param {string} usuarioId - ID del usuario (profesor)
   * @param {string} moduloId - ID del módulo
   * @returns {Object} - Mensaje de éxito
   */
  static async eliminarProfesorDeModulo(usuarioId, moduloId) {
    try {
      await db.query(
        'DELETE FROM usuarios_modulos WHERE usuario_id = $1 AND modulo_id = $2',
        [usuarioId, moduloId]
      );
      
      return { message: `Profesor ${usuarioId} eliminado del módulo ${moduloId} correctamente` };
    } catch (error) {
      console.error(`Error al eliminar profesor ${usuarioId} del módulo ${moduloId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtener todos los profesores asignados a un módulo
   * @param {string} moduloId - ID del módulo
   * @returns {Array} - Array de objetos con información de los profesores
   */
  static async getProfesoresPorModulo(moduloId) {
    try {
      const result = await db.query(
        `SELECT u.* FROM usuarios u
         JOIN usuarios_modulos um ON u.id = um.usuario_id
         WHERE um.modulo_id = $1 AND u.rol = 'profesor'
         ORDER BY u.nombre_real`,
        [moduloId]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener profesores del módulo ${moduloId}:`, error);
      throw error;
    }
  }
  
  /**
   * Obtener todos los módulos asignados a un profesor
   * @param {string} usuarioId - ID del usuario (profesor)
   * @returns {Array} - Array de objetos con información de los módulos
   */
  static async getModulosPorProfesor(usuarioId) {
    try {
      const result = await db.query(
        `SELECT m.* FROM modulos m
         JOIN usuarios_modulos um ON m.id = um.modulo_id
         WHERE um.usuario_id = $1
         ORDER BY m.nombre`,
        [usuarioId]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener módulos del profesor ${usuarioId}:`, error);
      throw error;
    }
  }
}

export default UsuarioModulo;
