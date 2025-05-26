import db from '../config/db.js';

class CentroEducativo {
  // Get all centros educativos
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM centros_educativos ORDER BY nombre');
      return result.rows;
    } catch (error) {
      console.error('Error fetching centros educativos:', error);
      throw error;
    }
  }

  // Get centro educativo by ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM centros_educativos WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching centro educativo with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new centro educativo
  static async create(nombre) {
    try {
      console.log('Creating educational center with name:', nombre);

      // Validate input
      if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        throw new Error('Centro educativo name is required and must be a non-empty string');
      }

      const result = await db.query(
        'INSERT INTO centros_educativos (nombre) VALUES ($1) RETURNING *',
        [nombre.trim()]
      );

      console.log('Educational center created successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating centro educativo:', error);
      // Add more context to the error
      if (error.code === '23505') {
        throw new Error('A centro educativo with this name already exists');
      }
      throw error;
    }
  }

  // Update centro educativo
  static async update(id, nombre) {
    try {
      const result = await db.query(
        'UPDATE centros_educativos SET nombre = $1 WHERE id = $2 RETURNING *',
        [nombre, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating centro educativo with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete centro educativo
  static async delete(id) {
    try {
      await db.query('DELETE FROM centros_educativos WHERE id = $1', [id]);
      return { message: `Centro educativo with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting centro educativo with ID ${id}:`, error);
      throw error;
    }
  }
}

export default CentroEducativo;
