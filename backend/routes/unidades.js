import { Router } from 'express';
import { Unidad } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

// GET /api/unidades
router.get('/', requireAuth, async (req, res) => {
  try {
    const unidades = await Unidad.getAll();
    res.json(unidades);
  } catch (error) {
    console.error('Error en GET /unidades:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/unidades/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const unidad = await Unidad.getById(id);

    if (!unidad) {
      return res.status(404).json({ message: `Unidad con ID ${id} no encontrada` });
    }

    res.json(unidad);
  } catch (error) {
    console.error(`Error en GET /unidades/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/unidades/modulo/:moduloId
router.get('/modulo/:moduloId', requireAuth, async (req, res) => {
  try {
    const { moduloId } = req.params;
    const unidades = await Unidad.getByModuloId(moduloId);
    res.json(unidades);
  } catch (error) {
    console.error(`Error en GET /unidades/modulo/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/unidades
router.post('/', requireAuth, async (req, res) => {
  try {
    const { moduloId, nombre, orden } = req.body;

    if (!moduloId || !nombre || orden === undefined) {
      return res.status(400).json({
        message: 'Se requieren los campos moduloId, nombre y orden'
      });
    }

    const nuevaUnidad = await Unidad.create(moduloId, nombre, orden);
    res.status(201).json(nuevaUnidad);
  } catch (error) {
    console.error('Error en POST /unidades:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/unidades/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, orden } = req.body;

    // Verificar que la unidad existe
    const unidadExistente = await Unidad.getById(id);
    if (!unidadExistente) {
      return res.status(404).json({ message: `Unidad con ID ${id} no encontrada` });
    }

    const unidadActualizada = await Unidad.update(id, nombre, orden);
    res.json(unidadActualizada);
  } catch (error) {
    console.error(`Error en PUT /unidades/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/unidades/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la unidad existe
    const unidadExistente = await Unidad.getById(id);
    if (!unidadExistente) {
      return res.status(404).json({ message: `Unidad con ID ${id} no encontrada` });
    }

    await Unidad.delete(id);
    res.json({ message: `Unidad con ID ${id} eliminada correctamente` });
  } catch (error) {
    console.error(`Error en DELETE /unidades/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
