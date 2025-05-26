import db from '../config/db.js';

class Unidad {
  // Get all unidades
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM unidades ORDER BY orden');
      return result.rows;
    } catch (error) {
      console.error('Error fetching unidades:', error);
      throw error;
    }
  }

  // Get unidades by modulo_id
  static async getByModuloId(moduloId) {
    try {
      const result = await db.query(
        'SELECT * FROM unidades WHERE modulo_id = $1 ORDER BY orden',
        [moduloId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching unidades for modulo ID ${moduloId}:`, error);
      throw error;
    }
  }

  // Get unidad by ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM unidades WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching unidad with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new unidad
  static async create(moduloId, nombre, orden) {
    try {
      const result = await db.query(
        'INSERT INTO unidades (modulo_id, nombre, orden) VALUES ($1, $2, $3) RETURNING *',
        [moduloId, nombre, orden]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating unidad:', error);
      throw error;
    }
  }

  // Update unidad
  static async update(id, nombre, orden) {
    try {
      const result = await db.query(
        'UPDATE unidades SET nombre = $1, orden = $2 WHERE id = $3 RETURNING *',
        [nombre, orden, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating unidad with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete unidad
  static async delete(id) {
    try {
      await db.query('DELETE FROM unidades WHERE id = $1', [id]);
      return { message: `Unidad with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting unidad with ID ${id}:`, error);
      throw error;
    }
  }
}

export default Unidad;
