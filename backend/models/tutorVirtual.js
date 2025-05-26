import db from '../config/db.js';

class TutorVirtual {
  // Get all tutores virtuales
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM tutores_virtuales');
      return result.rows;
    } catch (error) {
      console.error('Error fetching tutores virtuales:', error);
      throw error;
    }
  }

  // Get tutores virtuales by unidad_id
  static async getByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM tutores_virtuales WHERE unidad_id = $1',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching tutores virtuales for unidad ID ${unidadId}:`, error);
      throw error;
    }
  }

  // Get active tutores virtuales by unidad_id (for students)
  static async getActiveByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM tutores_virtuales WHERE unidad_id = $1 AND activo = true',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching active tutores virtuales for unidad ID ${unidadId}:`, error);
      throw error;
    }
  }

  // Get tutor virtual by ID with related information
  static async getById(id) {
    try {
      // Get the tutor virtual
      const tutorResult = await db.query('SELECT * FROM tutores_virtuales WHERE id = $1', [id]);
      const tutor = tutorResult.rows[0];

      if (!tutor) {
        return null;
      }

      // Get the unit information if available
      let unidad = null;
      if (tutor.unidad_id) {
        const unidadResult = await db.query(`
          SELECT u.*, m.nombre as modulo_nombre, m.curso, m.clase
          FROM unidades u
          LEFT JOIN modulos m ON u.modulo_id = m.id
          WHERE u.id = $1
        `, [tutor.unidad_id]);

        if (unidadResult.rows.length > 0) {
          const unidadData = unidadResult.rows[0];
          unidad = {
            id: unidadData.id,
            titulo: unidadData.titulo,
            descripcion: unidadData.descripcion,
            modulo_id: unidadData.modulo_id,
            modulo: unidadData.modulo_id ? {
              id: unidadData.modulo_id,
              nombre: unidadData.modulo_nombre,
              curso: unidadData.curso,
              clase: unidadData.clase
            } : null
          };
        }
      }

      // Return the tutor with the unit information
      return {
        ...tutor,
        unidad
      };
    } catch (error) {
      console.error(`Error fetching tutor virtual with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new tutor virtual
  static async create(unidadId, nombre, tipo, configuracion, modeloIa = 'gemini', imagen = null, objetivo = '', instrucciones = '', grupo = '', activo = true) {
    try {
      const result = await db.query(
        'INSERT INTO tutores_virtuales (unidad_id, nombre, tipo, configuracion, modelo_ia, imagen, objetivo, instrucciones, grupo, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [unidadId, nombre, tipo, configuracion, modeloIa, imagen, objetivo, instrucciones, grupo, activo]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating tutor virtual:', error);
      throw error;
    }
  }

  // Update tutor virtual
  static async update(id, nombre, tipo, configuracion, modeloIa, imagen = null, objetivo = '', instrucciones = '', grupo = '', activo = true) {
    try {
      const result = await db.query(
        'UPDATE tutores_virtuales SET nombre = $1, tipo = $2, configuracion = $3, modelo_ia = $4, imagen = $5, objetivo = $6, instrucciones = $7, grupo = $8, activo = $9 WHERE id = $10 RETURNING *',
        [nombre, tipo, configuracion, modeloIa, imagen, objetivo, instrucciones, grupo, activo, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating tutor virtual with ID ${id}:`, error);
      throw error;
    }
  }

  // Update tutor active status
  static async updateActiveStatus(id, activo) {
    try {
      const result = await db.query(
        'UPDATE tutores_virtuales SET activo = $1 WHERE id = $2 RETURNING *',
        [activo, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating tutor active status with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete tutor virtual
  static async delete(id) {
    try {
      await db.query('DELETE FROM tutores_virtuales WHERE id = $1', [id]);
      return { message: `Tutor virtual with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting tutor virtual with ID ${id}:`, error);
      throw error;
    }
  }
}

export default TutorVirtual;
