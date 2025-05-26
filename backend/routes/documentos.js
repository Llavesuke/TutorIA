import { Router } from 'express';
const router = Router();
import { Documento } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

// Obtener todos los documentos
router.get('/', async (req, res) => {
  try {
    const documentos = await Documento.getAll();
    res.json(documentos);
  } catch (error) {
    console.error('Error en GET /documentos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener documento por ID
router.get('/:id', async (req, res) => {
  try {
    const documento = await Documento.getById(req.params.id);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    res.json(documento);
  } catch (error) {
    console.error(`Error en GET /documentos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener documentos por módulo
router.get('/modulo/:moduloId', async (req, res) => {
  try {
    const documentos = await Documento.getByModuloId(req.params.moduloId);
    res.json(documentos);
  } catch (error) {
    console.error(`Error en GET /documentos/modulo/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener documentos por unidad
router.get('/unidad/:unidadId', async (req, res) => {
  try {
    const documentos = await Documento.getByUnidadId(req.params.unidadId);
    res.json(documentos);
  } catch (error) {
    console.error(`Error en GET /documentos/unidad/${req.params.unidadId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener documentos por usuario
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const documentos = await Documento.getByUsuarioId(req.params.usuarioId);
    res.json(documentos);
  } catch (error) {
    console.error(`Error en GET /documentos/usuario/${req.params.usuarioId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener documentos por tipo
router.get('/tipo/:tipo', async (req, res) => {
  try {
    const documentos = await Documento.getByTipo(req.params.tipo);
    res.json(documentos);
  } catch (error) {
    console.error(`Error en GET /documentos/tipo/${req.params.tipo}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Eliminar documento
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Verificar si el documento existe
    const documento = await Documento.getById(req.params.id);
    
    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }
    
    // Verificar si el usuario es el propietario o un administrador
    if (documento.subido_por !== req.user.id && req.user.user_metadata?.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este documento' });
    }
    
    const result = await Documento.delete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(`Error en DELETE /documentos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
