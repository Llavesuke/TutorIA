import db from '../config/db.js';

class DocumentoRag {
  // Obtener todos los documentos RAG
  static async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM documentos_rag ORDER BY fecha_subida DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching documentos RAG:', error);
      throw error;
    }
  }

  // Obtener documento RAG por ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM documentos_rag WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching documento RAG with ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener documentos RAG por tutor virtual
  static async getByTutorId(tutorVirtualId) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos_rag WHERE tutor_virtual_id = $1 ORDER BY fecha_subida DESC',
        [tutorVirtualId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching documentos RAG for tutor ${tutorVirtualId}:`, error);
      throw error;
    }
  }

  // Obtener documentos RAG por estado de procesamiento
  static async getByEstado(estado) {
    try {
      const result = await db.query(
        'SELECT * FROM documentos_rag WHERE estado_procesamiento = $1 ORDER BY fecha_subida DESC',
        [estado]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching documentos RAG with estado ${estado}:`, error);
      throw error;
    }
  }

  // Crear nuevo documento RAG
  static async create(tutorVirtualId, nombreArchivo, tipoArchivo, tamañoBytes, subidoPor, metadatos = {}) {
    try {
      const result = await db.query(
        `INSERT INTO documentos_rag
         (tutor_virtual_id, nombre_archivo, tipo_archivo, tamaño_bytes, subido_por, metadatos)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [tutorVirtualId, nombreArchivo, tipoArchivo, tamañoBytes, subidoPor, JSON.stringify(metadatos)]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating documento RAG:', error);
      throw error;
    }
  }

  // Actualizar estado de procesamiento
  static async updateEstadoProcesamiento(id, estado, errorMensaje = null, totalChunks = null) {
    try {
      let query = 'UPDATE documentos_rag SET estado_procesamiento = $1, fecha_procesamiento = NOW()';
      let params = [estado];
      let paramIndex = 2;

      if (errorMensaje !== null) {
        query += `, error_mensaje = $${paramIndex}`;
        params.push(errorMensaje);
        paramIndex++;
      }

      if (totalChunks !== null) {
        query += `, total_chunks = $${paramIndex}`;
        params.push(totalChunks);
        paramIndex++;
      }

      query += ` WHERE id = $${paramIndex} RETURNING *`;
      params.push(id);

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating estado procesamiento for documento RAG ${id}:`, error);
      throw error;
    }
  }

  // Eliminar documento RAG
  static async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM documentos_rag WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting documento RAG with ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener estadísticas de documentos RAG por tutor
  static async getEstadisticasByTutor(tutorVirtualId) {
    try {
      const result = await db.query(
        `SELECT
           estado_procesamiento,
           COUNT(*) as cantidad,
           SUM(tamaño_bytes) as tamaño_total,
           SUM(total_chunks) as chunks_total
         FROM documentos_rag
         WHERE tutor_virtual_id = $1
         GROUP BY estado_procesamiento`,
        [tutorVirtualId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching estadísticas for tutor ${tutorVirtualId}:`, error);
      throw error;
    }
  }

  // Obtener documentos RAG con información del tutor
  static async getWithTutorInfo(tutorVirtualId = null) {
    try {
      let query = `
        SELECT
          dr.*,
          tv.nombre as tutor_nombre,
          tv.tipo as tutor_tipo,
          u.nombre_real as subido_por_nombre
        FROM documentos_rag dr
        JOIN tutores_virtuales tv ON dr.tutor_virtual_id = tv.id
        JOIN usuarios u ON dr.subido_por = u.id
      `;

      let params = [];
      if (tutorVirtualId) {
        query += ' WHERE dr.tutor_virtual_id = $1';
        params.push(tutorVirtualId);
      }

      query += ' ORDER BY dr.fecha_subida DESC';

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching documentos RAG with tutor info:', error);
      throw error;
    }
  }

  // Verificar si un tutor tiene documentos RAG procesados
  static async tutorHasProcessedDocuments(tutorVirtualId) {
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM documentos_rag WHERE tutor_virtual_id = $1 AND estado_procesamiento = $2',
        [tutorVirtualId, 'completado']
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`Error checking processed documents for tutor ${tutorVirtualId}:`, error);
      throw error;
    }
  }

  // Obtener documentos pendientes de procesamiento
  static async getPendingProcessing() {
    try {
      const result = await db.query(
        'SELECT * FROM documentos_rag WHERE estado_procesamiento = $1 ORDER BY fecha_subida ASC',
        ['pendiente']
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      throw error;
    }
  }
}

export default DocumentoRag;
