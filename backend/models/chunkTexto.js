import db from '../config/db.js';

class ChunkTexto {
  // Obtener todos los chunks
  static async getAll() {
    try {
      const result = await db.query(
        'SELECT * FROM chunks_texto ORDER BY documento_rag_id, numero_chunk'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching chunks texto:', error);
      throw error;
    }
  }

  // Obtener chunk por ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM chunks_texto WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching chunk texto with ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener chunks por documento RAG
  static async getByDocumentoRagId(documentoRagId) {
    try {
      const result = await db.query(
        'SELECT * FROM chunks_texto WHERE documento_rag_id = $1 ORDER BY numero_chunk',
        [documentoRagId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching chunks for documento RAG ${documentoRagId}:`, error);
      throw error;
    }
  }

  // Crear nuevo chunk
  static async create(documentoRagId, contenidoTexto, embedding, numeroChunk, posicionInicio, posicionFin, metadatosChunk = {}) {
    try {
      const result = await db.query(
        `INSERT INTO chunks_texto
         (documento_rag_id, contenido_texto, embedding, numero_chunk, posicion_inicio, posicion_fin, metadatos_chunk)
         VALUES ($1, $2, $3::vector, $4, $5, $6, $7)
         RETURNING *`,
        [
          documentoRagId,
          contenidoTexto,
          `[${embedding.join(',')}]`, // Format as PostgreSQL vector literal
          numeroChunk,
          posicionInicio,
          posicionFin,
          JSON.stringify(metadatosChunk)
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating chunk texto:', error);
      throw error;
    }
  }

  // Eliminar chunk
  static async delete(id) {
    try {
      const result = await db.query(
        'DELETE FROM chunks_texto WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error deleting chunk texto with ID ${id}:`, error);
      throw error;
    }
  }

  // Eliminar todos los chunks de un documento RAG
  static async deleteByDocumentoRagId(documentoRagId) {
    try {
      const result = await db.query(
        'DELETE FROM chunks_texto WHERE documento_rag_id = $1 RETURNING *',
        [documentoRagId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error deleting chunks for documento RAG ${documentoRagId}:`, error);
      throw error;
    }
  }

  // Búsqueda de similitud vectorial
  static async searchSimilar(queryEmbedding, tutorVirtualId, limit = 5, threshold = 0.7) {
    try {
      console.log(`Searching for similar chunks for tutor ${tutorVirtualId} with limit ${limit}`);

      const query = `
        SELECT
          ct.*,
          dr.nombre_archivo,
          dr.tipo_archivo,
          (ct.embedding <=> $1::vector) as distance
        FROM chunks_texto ct
        JOIN documentos_rag dr ON ct.documento_rag_id = dr.id
        WHERE dr.tutor_virtual_id = $2
          AND dr.estado_procesamiento = 'completado'
          AND (ct.embedding <=> $1::vector) < $3
        ORDER BY ct.embedding <=> $1::vector
        LIMIT $4
      `;

      const result = await db.query(query, [
        `[${queryEmbedding.join(',')}]`,
        tutorVirtualId,
        1 - threshold, // Convert similarity threshold to distance threshold
        limit
      ]);

      console.log(`Found ${result.rows.length} similar chunks`);
      return result.rows;
    } catch (error) {
      console.error('Error searching similar chunks:', error);
      throw error;
    }
  }

  // Búsqueda de similitud con información adicional del tutor
  static async searchSimilarWithContext(queryEmbedding, tutorVirtualId, limit = 5, threshold = 0.7) {
    try {
      const query = `
        SELECT
          ct.*,
          dr.nombre_archivo,
          dr.tipo_archivo,
          dr.metadatos,
          tv.nombre as tutor_nombre,
          tv.instrucciones as tutor_instrucciones,
          (ct.embedding <=> $1::vector) as distance,
          (1 - (ct.embedding <=> $1::vector)) as similarity
        FROM chunks_texto ct
        JOIN documentos_rag dr ON ct.documento_rag_id = dr.id
        JOIN tutores_virtuales tv ON dr.tutor_virtual_id = tv.id
        WHERE dr.tutor_virtual_id = $2
          AND dr.estado_procesamiento = 'completado'
          AND (ct.embedding <=> $1::vector) < $3
        ORDER BY ct.embedding <=> $1::vector
        LIMIT $4
      `;

      const result = await db.query(query, [
        `[${queryEmbedding.join(',')}]`,
        tutorVirtualId,
        1 - threshold,
        limit
      ]);

      return result.rows;
    } catch (error) {
      console.error('Error searching similar chunks with context:', error);
      throw error;
    }
  }

  // Obtener estadísticas de chunks por documento
  static async getEstadisticasByDocumento(documentoRagId) {
    try {
      const result = await db.query(
        `SELECT
           COUNT(*) as total_chunks,
           AVG(LENGTH(contenido_texto)) as promedio_longitud,
           MIN(LENGTH(contenido_texto)) as min_longitud,
           MAX(LENGTH(contenido_texto)) as max_longitud,
           SUM(LENGTH(contenido_texto)) as total_caracteres
         FROM chunks_texto
         WHERE documento_rag_id = $1`,
        [documentoRagId]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching estadísticas for documento ${documentoRagId}:`, error);
      throw error;
    }
  }

  // Obtener chunks con contexto del documento
  static async getWithDocumentContext(documentoRagId = null) {
    try {
      let query = `
        SELECT
          ct.*,
          dr.nombre_archivo,
          dr.tipo_archivo,
          dr.estado_procesamiento,
          tv.nombre as tutor_nombre
        FROM chunks_texto ct
        JOIN documentos_rag dr ON ct.documento_rag_id = dr.id
        JOIN tutores_virtuales tv ON dr.tutor_virtual_id = tv.id
      `;

      let params = [];
      if (documentoRagId) {
        query += ' WHERE ct.documento_rag_id = $1';
        params.push(documentoRagId);
      }

      query += ' ORDER BY ct.documento_rag_id, ct.numero_chunk';

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching chunks with document context:', error);
      throw error;
    }
  }

  // Verificar si existen chunks para un tutor
  static async tutorHasChunks(tutorVirtualId) {
    try {
      const result = await db.query(
        `SELECT COUNT(*) as count
         FROM chunks_texto ct
         JOIN documentos_rag dr ON ct.documento_rag_id = dr.id
         WHERE dr.tutor_virtual_id = $1 AND dr.estado_procesamiento = 'completado'`,
        [tutorVirtualId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error(`Error checking chunks for tutor ${tutorVirtualId}:`, error);
      throw error;
    }
  }

  // Obtener muestra de chunks para un tutor (para debugging)
  static async getSampleChunks(tutorVirtualId, limit = 3) {
    try {
      const result = await db.query(
        `SELECT
           ct.contenido_texto,
           ct.numero_chunk,
           dr.nombre_archivo
         FROM chunks_texto ct
         JOIN documentos_rag dr ON ct.documento_rag_id = dr.id
         WHERE dr.tutor_virtual_id = $1 AND dr.estado_procesamiento = 'completado'
         ORDER BY RANDOM()
         LIMIT $2`,
        [tutorVirtualId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching sample chunks for tutor ${tutorVirtualId}:`, error);
      throw error;
    }
  }
}

export default ChunkTexto;
