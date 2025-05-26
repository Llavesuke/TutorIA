import db from '../config/db.js';

class ImagenActividad {
  // Obtener todas las imágenes de actividad
  static async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM imagenes_actividad ORDER BY fecha_subida DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error al obtener imágenes de actividad:', error);
      throw error;
    }
  }

  // Obtener imágenes de actividad por ID de usuario
  static async getByUsuarioId(usuarioId) {
    try {
      const result = await db.query(
        'SELECT * FROM imagenes_actividad WHERE usuario_id = $1 ORDER BY fecha_subida DESC',
        [usuarioId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener imágenes de actividad para usuario ${usuarioId}:`, error);
      throw error;
    }
  }

  // Obtener imágenes de actividad por ID de unidad
  static async getByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM imagenes_actividad WHERE unidad_id = $1 ORDER BY fecha_subida DESC',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error al obtener imágenes de actividad para unidad ${unidadId}:`, error);
      throw error;
    }
  }

  // Obtener imagen de actividad por ID
  static async getById(id) {
    try {
      const result = await db.query(
        'SELECT * FROM imagenes_actividad WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error al obtener imagen de actividad con ID ${id}:`, error);
      throw error;
    }
  }

  // Crear nueva imagen de actividad
  static async create(usuarioId, unidadId, url) {
    try {
      const result = await db.query(
        'INSERT INTO imagenes_actividad (usuario_id, unidad_id, url) VALUES ($1, $2, $3) RETURNING *',
        [usuarioId, unidadId, url]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear imagen de actividad:', error);
      throw error;
    }
  }

  // Eliminar imagen de actividad
  static async delete(id) {
    try {
      await db.query('DELETE FROM imagenes_actividad WHERE id = $1', [id]);
      return { message: `Imagen de actividad con ID ${id} eliminada correctamente` };
    } catch (error) {
      console.error(`Error al eliminar imagen de actividad con ID ${id}:`, error);
      throw error;
    }
  }
}

export default ImagenActividad;
