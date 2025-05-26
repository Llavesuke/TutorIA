import { Router } from 'express';
import TutorVirtual from '../models/tutorVirtual.js';
import { requireAuth } from '../middleware/auth.js';
import db from '../config/db.js';
const router = Router();

// GET /api/tutores-virtuales
router.get('/', requireAuth, async (req, res) => {
  try {
    const tutores = await TutorVirtual.getAll();
    res.json(tutores);
  } catch (error) {
    console.error('Error en GET /tutores-virtuales:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/tutores-virtuales/unidad/:unidadId
router.get('/unidad/:unidadId', requireAuth, async (req, res) => {
  try {
    const { unidadId } = req.params;
    const userRole = req.user.rol;

    // For students, only return active tutors
    // For professors and admins, return all tutors
    let tutores;
    if (userRole === 'estudiante') {
      tutores = await TutorVirtual.getActiveByUnidadId(unidadId);
    } else {
      tutores = await TutorVirtual.getByUnidadId(unidadId);
    }

    res.json(tutores);
  } catch (error) {
    console.error(`Error en GET /tutores-virtuales/unidad/${req.params.unidadId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/tutores-virtuales/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const tutor = await TutorVirtual.getById(id);

    if (!tutor) {
      return res.status(404).json({ message: `Tutor virtual con ID ${id} no encontrado` });
    }

    res.json(tutor);
  } catch (error) {
    console.error(`Error en GET /tutores-virtuales/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/tutores-virtuales
router.post('/', requireAuth, async (req, res) => {
  try {
    const { unidadId, nombre, tipo, configuracion, modeloIa, imagen, objetivo, instrucciones, grupo } = req.body;

    if (!unidadId || !nombre || !tipo) {
      return res.status(400).json({
        message: 'Se requieren los campos unidadId, nombre y tipo'
      });
    }

    // Validar el tipo
    const tiposValidos = ['teorico', 'practico', 'evaluador', 'general'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: `El tipo debe ser uno de: ${tiposValidos.join(', ')}`
      });
    }

    // Crear el tutor usando el modelo actualizado
    const nuevoTutor = await TutorVirtual.create(
      unidadId,
      nombre,
      tipo,
      configuracion || {},
      modeloIa || 'gemini',
      imagen || null,
      objetivo || '',
      instrucciones || '',
      grupo || ''
    );
    res.status(201).json(nuevoTutor);
  } catch (error) {
    console.error('Error en POST /tutores-virtuales:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/tutores-virtuales/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, configuracion, modeloIa, imagen, objetivo, instrucciones, grupo, activo } = req.body;

    // Verificar que el tutor existe
    const tutorExistente = await TutorVirtual.getById(id);
    if (!tutorExistente) {
      return res.status(404).json({ message: `Tutor virtual con ID ${id} no encontrado` });
    }

    // Actualizar el tutor usando el modelo actualizado
    const tutorActualizado = await TutorVirtual.update(
      id,
      nombre,
      tipo,
      configuracion || {},
      modeloIa || 'gemini',
      imagen,
      objetivo || '',
      instrucciones || '',
      grupo || '',
      activo !== undefined ? activo : true
    );
    res.json(tutorActualizado);
  } catch (error) {
    console.error(`Error en PUT /tutores-virtuales/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/tutores-virtuales/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el tutor existe
    const tutorExistente = await TutorVirtual.getById(id);
    if (!tutorExistente) {
      return res.status(404).json({ message: `Tutor virtual con ID ${id} no encontrado` });
    }

    await TutorVirtual.delete(id);
    res.json({ message: `Tutor virtual con ID ${id} eliminado correctamente` });
  } catch (error) {
    console.error(`Error en DELETE /tutores-virtuales/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PATCH /api/tutores-virtuales/:id/active
router.patch('/:id/active', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (activo === undefined) {
      return res.status(400).json({ message: 'Se requiere el campo activo' });
    }

    // Verificar que el tutor existe
    const tutorExistente = await TutorVirtual.getById(id);
    if (!tutorExistente) {
      return res.status(404).json({ message: `Tutor virtual con ID ${id} no encontrado` });
    }

    // Solo permitir a profesores y administradores cambiar el estado activo
    if (req.user.rol !== 'admin' && req.user.rol !== 'profesor') {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    // Actualizar solo el estado activo del tutor
    const tutorActualizado = await TutorVirtual.updateActiveStatus(id, activo);

    res.json(tutorActualizado);
  } catch (error) {
    console.error(`Error en PATCH /tutores-virtuales/${req.params.id}/active:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
