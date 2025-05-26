import db from '../config/db.js';

class Assignment {
  // Get all assignments
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM assignments ORDER BY fecha_entrega');
      return result.rows;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  }

  // Get assignments by unidad_id
  static async getByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM assignments WHERE unidad_id = $1 ORDER BY fecha_entrega',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching assignments for unidad ID ${unidadId}:`, error);
      throw error;
    }
  }

  // Get only active assignments by unidad_id (for students)
  static async getActiveByUnidadId(unidadId) {
    try {
      const result = await db.query(
        'SELECT * FROM assignments WHERE unidad_id = $1 AND active = TRUE ORDER BY fecha_entrega',
        [unidadId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching active assignments for unidad ID ${unidadId}:`, error);
      throw error;
    }
  }

  // Get assignment by ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching assignment with ID ${id}:`, error);
      throw error;
    }
  }

  // Create new assignment
  static async create(unidadId, titulo, descripcion, fechaEntrega, puntuacionMaxima, permitirTexto, permitirArchivos) {
    try {
      const result = await db.query(
        `INSERT INTO assignments (
          unidad_id, titulo, descripcion, fecha_entrega,
          puntuacion_maxima, permitir_texto, permitir_archivos, fecha_creacion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) RETURNING *`,
        [unidadId, titulo, descripcion, fechaEntrega, puntuacionMaxima, permitirTexto, permitirArchivos]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  // Update assignment
  static async update(id, titulo, descripcion, fechaEntrega, puntuacionMaxima, permitirTexto, permitirArchivos) {
    try {
      const result = await db.query(
        `UPDATE assignments SET
          titulo = $1,
          descripcion = $2,
          fecha_entrega = $3,
          puntuacion_maxima = $4,
          permitir_texto = $5,
          permitir_archivos = $6
        WHERE id = $7 RETURNING *`,
        [titulo, descripcion, fechaEntrega, puntuacionMaxima, permitirTexto, permitirArchivos, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating assignment with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete assignment
  static async delete(id) {
    try {
      await db.query('DELETE FROM assignments WHERE id = $1', [id]);
      return { message: `Assignment with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting assignment with ID ${id}:`, error);
      throw error;
    }
  }

  // Get submissions for an assignment
  static async getSubmissions(assignmentId) {
    try {
      const result = await db.query(
        `SELECT s.*, u.nombre_usuario, u.nombre_real
         FROM assignment_submissions s
         JOIN usuarios u ON s.usuario_id = u.id
         WHERE s.assignment_id = $1
         ORDER BY s.fecha_envio DESC`,
        [assignmentId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching submissions for assignment ID ${assignmentId}:`, error);
      throw error;
    }
  }

  // Create submission for an assignment
  static async createSubmission(assignmentId, usuarioId, textoRespuesta, archivosUrls) {
    try {
      console.log('Creando submission con datos:', {
        assignmentId,
        usuarioId,
        textoRespuesta: textoRespuesta ? 'Presente' : 'No presente',
        archivosUrls: archivosUrls ? 'Presente' : 'No presente'
      });

      // Preparar los datos de archivos para PostgreSQL
      let archivosUrlsData = null;

      if (archivosUrls && Array.isArray(archivosUrls) && archivosUrls.length > 0) {
        // Asegurarse de que solo guardamos los campos necesarios
        archivosUrlsData = archivosUrls.map(file => ({
          name: file.name || 'unknown',
          url: file.url || '',
          type: file.type || 'unknown',
          size: file.size || 0
        }));
      }

      console.log('Datos de archivos preparados:', JSON.stringify(archivosUrlsData));

      // Insertar en la base de datos
      // Convertir explícitamente archivosUrlsData a JSON string para PostgreSQL
      const archivosUrlsJson = archivosUrlsData ? JSON.stringify(archivosUrlsData) : null;

      console.log('JSON a insertar en la base de datos:', archivosUrlsJson);

      const result = await db.query(
        `INSERT INTO assignment_submissions (
          assignment_id, usuario_id, texto_respuesta, archivos_urls, fecha_envio
        ) VALUES ($1, $2, $3, $4::jsonb, CURRENT_TIMESTAMP) RETURNING *`,
        [assignmentId, usuarioId, textoRespuesta, archivosUrlsJson]
      );

      console.log('Submission creada exitosamente:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating submission for assignment ID ${assignmentId}:`, error);
      console.error('Detalles del error:', error.stack);
      throw error;
    }
  }

  // Get submission by user and assignment
  static async getSubmissionByUserAndAssignment(usuarioId, assignmentId) {
    try {
      console.log(`Buscando submission para usuario ${usuarioId} y assignment ${assignmentId}`);

      const result = await db.query(
        `SELECT * FROM assignment_submissions
         WHERE usuario_id = $1 AND assignment_id = $2
         ORDER BY fecha_envio DESC
         LIMIT 1`,
        [usuarioId, assignmentId]
      );

      if (result.rows.length > 0) {
        console.log('Submission encontrada:', result.rows[0]);
      } else {
        console.log('No se encontró ninguna submission');
      }

      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching submission for user ${usuarioId} and assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  // Update submission
  static async updateSubmission(submissionId, textoRespuesta, archivosUrls) {
    try {
      console.log('Actualizando submission con datos:', {
        submissionId,
        textoRespuesta: textoRespuesta ? 'Presente' : 'No presente',
        archivosUrls: archivosUrls ? 'Presente' : 'No presente'
      });

      // Preparar los datos de archivos para PostgreSQL
      let archivosUrlsData = null;

      if (archivosUrls && Array.isArray(archivosUrls) && archivosUrls.length > 0) {
        // Asegurarse de que solo guardamos los campos necesarios
        archivosUrlsData = archivosUrls.map(file => ({
          name: file.name || 'unknown',
          url: file.url || '',
          type: file.type || 'unknown',
          size: file.size || 0
        }));
      }

      console.log('Datos de archivos preparados para actualización:', JSON.stringify(archivosUrlsData));

      // Actualizar en la base de datos
      // Convertir explícitamente archivosUrlsData a JSON string para PostgreSQL
      const archivosUrlsJson = archivosUrlsData ? JSON.stringify(archivosUrlsData) : null;

      console.log('JSON a actualizar en la base de datos:', archivosUrlsJson);

      const result = await db.query(
        `UPDATE assignment_submissions SET
          texto_respuesta = $1,
          archivos_urls = $2::jsonb,
          fecha_envio = CURRENT_TIMESTAMP,
          calificacion = NULL,
          comentarios = NULL,
          calificado_por = NULL,
          fecha_calificacion = NULL
        WHERE id = $3 RETURNING *`,
        [textoRespuesta, archivosUrlsJson, submissionId]
      );

      console.log('Submission actualizada exitosamente:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating submission with ID ${submissionId}:`, error);
      console.error('Detalles del error:', error.stack);
      throw error;
    }
  }

  // Get user submissions for an assignment
  static async getUserSubmissions(usuarioId) {
    try {
      const result = await db.query(
        `SELECT s.*, a.titulo as assignment_titulo, a.unidad_id
         FROM assignment_submissions s
         JOIN assignments a ON s.assignment_id = a.id
         WHERE s.usuario_id = $1
         ORDER BY s.fecha_envio DESC`,
        [usuarioId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching submissions for user ID ${usuarioId}:`, error);
      throw error;
    }
  }

  // Grade a submission
  static async gradeSubmission(submissionId, calificacion, calificadoPorId) {
    try {
      console.log(`Grading submission ${submissionId} with grade ${calificacion} by user ${calificadoPorId}`);

      // Validate the grade
      if (calificacion < 0 || calificacion > 100) {
        throw new Error('La calificación debe estar entre 0 y 100');
      }

      const result = await db.query(
        `UPDATE assignment_submissions SET
          calificacion = $1,
          calificado_por = $2,
          fecha_calificacion = CURRENT_TIMESTAMP
        WHERE id = $3 RETURNING *`,
        [calificacion, calificadoPorId, submissionId]
      );

      if (result.rows.length === 0) {
        throw new Error(`No se encontró la entrega con ID ${submissionId}`);
      }

      console.log('Submission graded successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error grading submission with ID ${submissionId}:`, error);
      throw error;
    }
  }

  // Provide feedback for a submission
  static async provideFeedback(submissionId, comentarios, profesorId) {
    try {
      console.log(`Providing feedback for submission ${submissionId} by professor ${profesorId}`);

      const result = await db.query(
        `UPDATE assignment_submissions SET
          comentarios = $1,
          calificado_por = COALESCE(calificado_por, $2),
          fecha_calificacion = COALESCE(fecha_calificacion, CURRENT_TIMESTAMP)
        WHERE id = $3 RETURNING *`,
        [comentarios, profesorId, submissionId]
      );

      if (result.rows.length === 0) {
        throw new Error(`No se encontró la entrega con ID ${submissionId}`);
      }

      console.log('Feedback provided successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error providing feedback for submission with ID ${submissionId}:`, error);
      throw error;
    }
  }

  // Update assignment active status
  static async updateActiveStatus(id, active) {
    try {
      console.log(`Updating active status for assignment ${id} to ${active}`);

      const result = await db.query(
        `UPDATE assignments SET
          active = $1
        WHERE id = $2 RETURNING *`,
        [active, id]
      );

      if (result.rows.length === 0) {
        throw new Error(`No se encontró la tarea con ID ${id}`);
      }

      console.log('Assignment active status updated successfully:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating active status for assignment with ID ${id}:`, error);
      throw error;
    }
  }
}

export default Assignment;
