import { Router } from 'express';
import CentroEducativo from '../models/centroEducativo.js';

const router = Router();

// GET all centros educativos
router.get('/', async (req, res) => {
  try {
    const centrosEducativos = await CentroEducativo.getAll();
    res.json(centrosEducativos);
  } catch (error) {
    console.error('Error in GET /centros-educativos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET centro educativo by ID
router.get('/:id', async (req, res) => {
  try {
    const centroEducativo = await CentroEducativo.getById(req.params.id);
    if (!centroEducativo) {
      return res.status(404).json({ message: 'Centro educativo not found' });
    }
    res.json(centroEducativo);
  } catch (error) {
    console.error(`Error in GET /centros-educativos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST new centro educativo
router.post('/', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: 'Nombre is required' });
    }
    const newCentroEducativo = await CentroEducativo.create(nombre);
    res.status(201).json(newCentroEducativo);
  } catch (error) {
    console.error('Error in POST /centros-educativos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update centro educativo
router.put('/:id', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ message: 'Nombre is required' });
    }
    const updatedCentroEducativo = await CentroEducativo.update(req.params.id, nombre);
    if (!updatedCentroEducativo) {
      return res.status(404).json({ message: 'Centro educativo not found' });
    }
    res.json(updatedCentroEducativo);
  } catch (error) {
    console.error(`Error in PUT /centros-educativos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE centro educativo
router.delete('/:id', async (req, res) => {
  try {
    const result = await CentroEducativo.delete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(`Error in DELETE /centros-educativos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
