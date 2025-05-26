import db from '../config/db.js';

class Modulo {
  // Get all modulos
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM modulos ORDER BY nombre');
      return result.rows;
    } catch (error) {
      console.error('Error fetching modulos:', error);
      throw error;
    }
  }

  // Get modulos by centro_id
  static async getByCentroId(centroId) {
    try {
      console.log(`[Modulo.getByCentroId] Fetching modules for centro ID: ${centroId}`);

      const result = await db.query(
        'SELECT * FROM modulos WHERE centro_id = $1 ORDER BY nombre',
        [centroId]
      );

      console.log(`[Modulo.getByCentroId] Found ${result.rows.length} modules for centro ID: ${centroId}`);
      console.log('[Modulo.getByCentroId] Modules:', result.rows);

      return result.rows;
    } catch (error) {
      console.error(`Error fetching modulos for centro ID ${centroId}:`, error);
      throw error;
    }
  }

  // Get modulo by ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM modulos WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching modulo with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new modulo
  static async create(centroId, nombre, descripcion, curso = null, clase = null) {
    try {
      const result = await db.query(
        'INSERT INTO modulos (centro_id, nombre, descripcion, curso, clase) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [centroId, nombre, descripcion, curso, clase]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating modulo:', error);
      throw error;
    }
  }

  // Update modulo
  static async update(id, nombre, descripcion, curso = null, clase = null) {
    try {
      const result = await db.query(
        'UPDATE modulos SET nombre = $1, descripcion = $2, curso = $3, clase = $4 WHERE id = $5 RETURNING *',
        [nombre, descripcion, curso, clase, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating modulo with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete modulo
  static async delete(id) {
    try {
      await db.query('DELETE FROM modulos WHERE id = $1', [id]);
      return { message: `Modulo with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting modulo with ID ${id}:`, error);
      throw error;
    }
  }

  // Get modulos by curso
  static async getByCurso(centroId, curso) {
    try {
      const result = await db.query(
        'SELECT * FROM modulos WHERE centro_id = $1 AND curso = $2 ORDER BY nombre',
        [centroId, curso]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching modulos for curso ${curso}:`, error);
      throw error;
    }
  }

  // Get modulos by curso and clase
  static async getByCursoAndClase(centroId, curso, clase) {
    try {
      const result = await db.query(
        'SELECT * FROM modulos WHERE centro_id = $1 AND curso = $2 AND (clase = $3 OR clase IS NULL) ORDER BY nombre',
        [centroId, curso, clase]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching modulos for curso ${curso} and clase ${clase}:`, error);
      throw error;
    }
  }

  // Get modulos by profesor ID
  static async getByProfesorId(profesorId, centroId) {
    try {
      console.log(`[Modulo.getByProfesorId] Fetching modules for profesor ID: ${profesorId} in centro ID: ${centroId}`);

      const result = await db.query(
        `SELECT m.* FROM modulos m
         JOIN usuarios_modulos um ON m.id = um.modulo_id
         WHERE um.usuario_id = $1 AND m.centro_id = $2
         ORDER BY m.nombre`,
        [profesorId, centroId]
      );

      console.log(`[Modulo.getByProfesorId] Found ${result.rows.length} modules for profesor ID: ${profesorId}`);
      return result.rows;
    } catch (error) {
      console.error(`Error fetching modulos for profesor ID ${profesorId}:`, error);
      throw error;
    }
  }
}

export default Modulo;
