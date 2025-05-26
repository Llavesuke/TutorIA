import db from '../config/db.js';

class Documento {
  // Obtener todos los documentos
  static async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM documentos ORDER BY fecha_subida DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error al obtener documentos:', error);
      throw error;
    }
  }

  // Obtener documentos por ID de módulo
  static async getByModuloId(moduloId) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos WHERE modulo_id = $1 ORDER BY fecha_subida DESC',
        [moduloId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener documentos para módulo ${moduloId}:`, error);
      throw error;
    }
  }

  // Obtener documentos por ID de unidad
  static async getByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos WHERE unidad_id = $1 ORDER BY fecha_subida DESC',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener documentos para unidad ${unidadId}:`, error);
      throw error;
    }
  }

  // Obtener documentos por ID de usuario que los subió
  static async getByUsuarioId(usuarioId) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos WHERE subido_por = $1 ORDER BY fecha_subida DESC',
        [usuarioId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener documentos subidos por usuario ${usuarioId}:`, error);
      throw error;
    }
  }

  // Obtener documento por ID
  static async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener documento con ID ${id}:`, error);
      throw error;
    }
  }

  // Crear nuevo documento
  static async create(moduloId, unidadId, url, tipo, subidoPor) {
    try {
      const result = await db.query(
        'INSERT INTO documentos (modulo_id, unidad_id, url, tipo, subido_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [moduloId, unidadId, url, tipo, subidoPor]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear documento:', error);
      throw error;
    }
  }

  // Eliminar documento
  static async delete(id) {
    try {
      await db.query('DELETE FROM documentos WHERE id = $1', [id]);
      return { message: `Documento con ID ${id} eliminado correctamente` };
    } catch (error) {
      console.error(`Error al eliminar documento con ID ${id}:`, error);
      throw error;
    }
  }

  // Buscar documentos por tipo
  static async getByTipo(tipo) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos WHERE tipo = $1 ORDER BY fecha_subida DESC',
        [tipo]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener documentos de tipo ${tipo}:`, error);
      throw error;
    }
  }
}

export default Documento;
