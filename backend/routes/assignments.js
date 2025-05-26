import { Router } from 'express';
import Assignment from '../models/assignment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();

// GET /api/assignments
router.get('/', requireAuth, async (req, res) => {
  try {
    const assignments = await Assignment.getAll();
    res.json(assignments);
  } catch (error) {
    console.error('Error en GET /assignments:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/assignments/my-submissions
router.get('/my-submissions', requireAuth, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const submissions = await Assignment.getUserSubmissions(usuarioId);
    res.json(submissions);
  } catch (error) {
    console.error('Error en GET /assignments/my-submissions:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/assignments/unidad/:unidadId
router.get('/unidad/:unidadId', requireAuth, async (req, res) => {
  try {
    const { unidadId } = req.params;
    const userRole = req.user.rol || req.user.user_metadata?.rol;

    // For students, only return active assignments
    // For professors and admins, return all assignments
    let assignments;
    if (userRole === 'estudiante') {
      assignments = await Assignment.getActiveByUnidadId(unidadId);
    } else {
      assignments = await Assignment.getByUnidadId(unidadId);
    }

    res.json(assignments);
  } catch (error) {
    console.error(`Error en GET /assignments/unidad/${req.params.unidadId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/assignments/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.getById(id);

    if (!assignment) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    res.json(assignment);
  } catch (error) {
    console.error(`Error en GET /assignments/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/assignments
router.post('/', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const {
      unidadId,
      titulo,
      descripcion,
      fechaEntrega,
      puntuacionMaxima,
      permitirTexto,
      permitirArchivos
    } = req.body;

    if (!unidadId || !titulo || !descripcion || !fechaEntrega) {
      return res.status(400).json({
        message: 'Se requieren los campos unidadId, titulo, descripcion y fechaEntrega'
      });
    }

    const nuevaAsignacion = await Assignment.create(
      unidadId,
      titulo,
      descripcion,
      fechaEntrega,
      puntuacionMaxima || 100,
      permitirTexto !== undefined ? permitirTexto : true,
      permitirArchivos !== undefined ? permitirArchivos : true
    );

    res.status(201).json(nuevaAsignacion);
  } catch (error) {
    console.error('Error en POST /assignments:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/assignments/:id
router.put('/:id', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      fechaEntrega,
      puntuacionMaxima,
      permitirTexto,
      permitirArchivos
    } = req.body;

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    const assignmentActualizado = await Assignment.update(
      id,
      titulo,
      descripcion,
      fechaEntrega,
      puntuacionMaxima,
      permitirTexto,
      permitirArchivos
    );

    res.json(assignmentActualizado);
  } catch (error) {
    console.error(`Error en PUT /assignments/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    await Assignment.delete(id);
    res.json({ message: `Assignment con ID ${id} eliminado correctamente` });
  } catch (error) {
    console.error(`Error en DELETE /assignments/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/assignments/:id/submissions
router.get('/:id/submissions', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    const submissions = await Assignment.getSubmissions(id);
    res.json(submissions);
  } catch (error) {
    console.error(`Error en GET /assignments/${req.params.id}/submissions:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/assignments/:id/my-submission
router.get('/:id/my-submission', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    const submission = await Assignment.getSubmissionByUserAndAssignment(usuarioId, id);

    if (!submission) {
      return res.status(404).json({ message: 'No has enviado ninguna respuesta para esta asignación' });
    }

    res.json(submission);
  } catch (error) {
    console.error(`Error en GET /assignments/${req.params.id}/my-submission:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/assignments/:id/submit
router.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { textoRespuesta, archivosUrls } = req.body;
    const usuarioId = req.user.id;

    console.log('Recibiendo envío de tarea:', {
      assignmentId: id,
      usuarioId,
      textoRespuesta: textoRespuesta ? 'Texto presente' : 'Sin texto',
      archivosUrls: archivosUrls ? `${archivosUrls.length} archivos` : 'Sin archivos'
    });

    // Imprimir detalles de los archivos para depuración
    if (archivosUrls && archivosUrls.length > 0) {
      console.log('Detalles de archivos recibidos:');
      archivosUrls.forEach((file, index) => {
        console.log(`Archivo ${index + 1}:`, {
          name: file.name || 'Sin nombre',
          url: file.url ? 'URL presente' : 'Sin URL',
          type: file.type || 'Sin tipo',
          size: file.size || 'Sin tamaño'
        });
      });
    }

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    // Verificar que el usuario es un estudiante
    if (req.user.rol !== 'estudiante') {
      return res.status(403).json({ message: 'Solo los estudiantes pueden enviar respuestas a las asignaciones' });
    }

    // Verificar que se proporciona al menos texto o archivos
    if (!textoRespuesta && (!archivosUrls || archivosUrls.length === 0)) {
      return res.status(400).json({ message: 'Debe proporcionar texto o archivos para la respuesta' });
    }

    try {
      // Verificar si ya existe una submission para este usuario y assignment
      const existingSubmission = await Assignment.getSubmissionByUserAndAssignment(usuarioId, id);

      let submission;
      if (existingSubmission) {
        console.log('Actualizando submission existente con ID:', existingSubmission.id);
        // Actualizar la submission existente
        submission = await Assignment.updateSubmission(
          existingSubmission.id,
          textoRespuesta,
          archivosUrls
        );
      } else {
        console.log('Creando nueva submission');
        // Crear una nueva submission
        submission = await Assignment.createSubmission(
          id,
          usuarioId,
          textoRespuesta,
          archivosUrls
        );
      }

      console.log('Submission creada/actualizada exitosamente:', submission);
      res.status(201).json(submission);
    } catch (submissionError) {
      console.error('Error específico al crear/actualizar submission:', submissionError);
      res.status(500).json({
        message: 'Error al guardar la respuesta',
        error: submissionError.message,
        details: submissionError.stack
      });
    }
  } catch (error) {
    console.error(`Error en POST /assignments/${req.params.id}/submit:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/assignments/submissions/:submissionId/grade
router.post('/submissions/:submissionId/grade', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { calificacion } = req.body;
    const profesorId = req.user.id;

    if (calificacion === undefined || calificacion === null) {
      return res.status(400).json({ message: 'Se requiere el campo calificacion' });
    }

    // Convertir a número si es string
    const calificacionNum = Number(calificacion);
    if (isNaN(calificacionNum)) {
      return res.status(400).json({ message: 'La calificación debe ser un número' });
    }

    // Validar rango
    if (calificacionNum < 0 || calificacionNum > 100) {
      return res.status(400).json({ message: 'La calificación debe estar entre 0 y 100' });
    }

    const updatedSubmission = await Assignment.gradeSubmission(submissionId, calificacionNum, profesorId);
    res.json(updatedSubmission);
  } catch (error) {
    console.error(`Error en POST /assignments/submissions/${req.params.submissionId}/grade:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/assignments/submissions/:submissionId/feedback
router.post('/submissions/:submissionId/feedback', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { comentarios } = req.body;
    const profesorId = req.user.id;

    if (!comentarios) {
      return res.status(400).json({ message: 'Se requiere el campo comentarios' });
    }

    const updatedSubmission = await Assignment.provideFeedback(submissionId, comentarios, profesorId);
    res.json(updatedSubmission);
  } catch (error) {
    console.error(`Error en POST /assignments/submissions/${req.params.submissionId}/feedback:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/assignments/:id/active
router.put('/:id/active', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return res.status(400).json({ message: 'Se requiere el campo active' });
    }

    // Verificar que la asignación existe
    const assignmentExistente = await Assignment.getById(id);
    if (!assignmentExistente) {
      return res.status(404).json({ message: `Assignment con ID ${id} no encontrado` });
    }

    const updatedAssignment = await Assignment.updateActiveStatus(id, active);
    res.json(updatedAssignment);
  } catch (error) {
    console.error(`Error en PUT /assignments/${req.params.id}/active:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
