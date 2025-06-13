/**
 * @fileoverview Rutas de centros educativos para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de centros educativos,
 * incluyendo creación, consulta, actualización y eliminación de centros educativos.
 *
 * Endpoints disponibles:
 * - GET /centros-educativos - Obtener todos los centros educativos
 * - GET /centros-educativos/:id - Obtener centro educativo específico
 * - POST /centros-educativos - Crear nuevo centro educativo
 * - PUT /centros-educativos/:id - Actualizar centro educativo
 * - DELETE /centros-educativos/:id - Eliminar centro educativo
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import CentroEducativo from '../models/centroEducativo.js';

const router = Router();

/**
 * GET /api/centros-educativos
 *
 * Obtiene todos los centros educativos registrados
 *
 * @description Este endpoint devuelve la lista completa de centros educativos
 * disponibles en el sistema. No requiere autenticación ya que es información
 * pública necesaria para el registro de usuarios.
 *
 * @returns {Array} 200 - Lista de centros educativos
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "nombre": "Colegio San José",
 *     "fecha_creacion": "2024-01-15T10:30:00Z"
 *   },
 *   {
 *     "id": "2",
 *     "nombre": "Instituto Tecnológico",
 *     "fecha_creacion": "2024-01-16T09:15:00Z"
 *   }
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const centrosEducativos = await CentroEducativo.getAll();
    res.json(centrosEducativos);
  } catch (error) {
    console.error('Error in GET /centros-educativos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/centros-educativos/:id
 *
 * Obtiene un centro educativo específico por su ID
 *
 * @description Devuelve la información detallada de un centro educativo
 * identificado por su ID único.
 *
 * @param {string} req.params.id - ID del centro educativo
 *
 * @returns {Object} 200 - Información del centro educativo
 * @returns {Object} 404 - Centro educativo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * {
 *   "id": "1",
 *   "nombre": "Colegio San José",
 *   "fecha_creacion": "2024-01-15T10:30:00Z"
 * }
 */
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

/**
 * POST /api/centros-educativos
 *
 * Crea un nuevo centro educativo
 *
 * @description Registra un nuevo centro educativo en el sistema.
 * Valida que el nombre sea proporcionado y único.
 *
 * @param {Object} req.body - Datos del centro educativo
 * @param {string} req.body.nombre - Nombre del centro educativo (requerido)
 *
 * @returns {Object} 201 - Centro educativo creado exitosamente
 * @returns {Object} 400 - Nombre requerido o datos inválidos
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "nombre": "Nuevo Colegio Internacional"
 * }
 *
 * // Response:
 * {
 *   "id": "3",
 *   "nombre": "Nuevo Colegio Internacional",
 *   "fecha_creacion": "2024-01-17T14:20:00Z"
 * }
 */
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

/**
 * PUT /api/centros-educativos/:id
 *
 * Actualiza un centro educativo existente
 *
 * @description Permite actualizar la información de un centro educativo específico.
 * Actualmente solo permite actualizar el nombre del centro.
 *
 * @param {string} req.params.id - ID del centro educativo a actualizar
 * @param {Object} req.body - Datos actualizados del centro
 * @param {string} req.body.nombre - Nuevo nombre del centro educativo (requerido)
 *
 * @returns {Object} 200 - Centro educativo actualizado exitosamente
 * @returns {Object} 400 - Nombre requerido
 * @returns {Object} 404 - Centro educativo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "nombre": "Colegio San José Actualizado"
 * }
 *
 * // Response:
 * {
 *   "id": "1",
 *   "nombre": "Colegio San José Actualizado",
 *   "fecha_creacion": "2024-01-15T10:30:00Z"
 * }
 */
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

/**
 * DELETE /api/centros-educativos/:id
 *
 * Elimina un centro educativo del sistema
 *
 * @description Elimina permanentemente un centro educativo del sistema.
 * Esta operación también puede afectar a usuarios, módulos y otros datos
 * asociados al centro, dependiendo de las restricciones de la base de datos.
 *
 * @param {string} req.params.id - ID del centro educativo a eliminar
 *
 * @returns {Object} 200 - Centro educativo eliminado exitosamente
 * @returns {Object} 404 - Centro educativo no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: DELETE /api/centros-educativos/1
 *
 * // Response:
 * {
 *   "message": "Centro educativo eliminado exitosamente",
 *   "id": "1"
 * }
 */
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
