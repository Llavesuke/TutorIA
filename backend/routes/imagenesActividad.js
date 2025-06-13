/**
 * @fileoverview Rutas de imágenes de actividad para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de imágenes
 * de actividades educativas, incluyendo consulta por diferentes criterios y eliminación.
 *
 * Endpoints disponibles:
 * - GET /imagenes-actividad - Obtener todas las imágenes de actividad
 * - GET /imagenes-actividad/:id - Obtener imagen específica
 * - GET /imagenes-actividad/usuario/:usuarioId - Obtener imágenes por usuario
 * - GET /imagenes-actividad/unidad/:unidadId - Obtener imágenes por unidad
 * - DELETE /imagenes-actividad/:id - Eliminar imagen (requiere autenticación)
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
const router = Router();
import { ImagenActividad } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * GET /api/imagenes-actividad
 *
 * Obtiene todas las imágenes de actividad del sistema
 *
 * @description Este endpoint devuelve una lista completa de todas las imágenes
 * de actividades educativas almacenadas en el sistema.
 *
 * @returns {Object[]} 200 - Lista de todas las imágenes de actividad
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "url": "https://res.cloudinary.com/tutoria/image/upload/v123/activities/abc123.jpg",
 *     "public_id": "tutoria/activities/abc123",
 *     "unidad_id": "456",
 *     "usuario_id": "789",
 *     "fecha_subida": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const imagenes = await ImagenActividad.getAll();
    res.json(imagenes);
  } catch (error) {
    console.error('Error en GET /imagenes-actividad:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener imagen de actividad por ID
router.get('/:id', async (req, res) => {
  try {
    const imagen = await ImagenActividad.getById(req.params.id);
    
    if (!imagen) {
      return res.status(404).json({ message: 'Imagen de actividad no encontrada' });
    }
    
    res.json(imagen);
  } catch (error) {
    console.error(`Error en GET /imagenes-actividad/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener imágenes de actividad por usuario
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const imagenes = await ImagenActividad.getByUsuarioId(req.params.usuarioId);
    res.json(imagenes);
  } catch (error) {
    console.error(`Error en GET /imagenes-actividad/usuario/${req.params.usuarioId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener imágenes de actividad por unidad
router.get('/unidad/:unidadId', async (req, res) => {
  try {
    const imagenes = await ImagenActividad.getByUnidadId(req.params.unidadId);
    res.json(imagenes);
  } catch (error) {
    console.error(`Error en GET /imagenes-actividad/unidad/${req.params.unidadId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Eliminar imagen de actividad
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Verificar si la imagen existe
    const imagen = await ImagenActividad.getById(req.params.id);
    
    if (!imagen) {
      return res.status(404).json({ message: 'Imagen de actividad no encontrada' });
    }
    
    // Verificar si el usuario es el propietario o un administrador
    if (imagen.usuario_id !== req.user.id && req.user.user_metadata?.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para eliminar esta imagen' });
    }
    
    const result = await ImagenActividad.delete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error(`Error en DELETE /imagenes-actividad/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
