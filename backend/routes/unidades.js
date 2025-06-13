/**
 * @fileoverview Rutas de unidades educativas para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de unidades educativas,
 * que son subdivisiones de los módulos que organizan el contenido en temas específicos.
 *
 * Endpoints disponibles:
 * - GET /unidades - Obtener todas las unidades educativas
 * - GET /unidades/:id - Obtener unidad específica
 * - GET /unidades/modulo/:moduloId - Obtener unidades por módulo
 * - POST /unidades - Crear nueva unidad educativa
 * - PUT /unidades/:id - Actualizar unidad educativa
 * - DELETE /unidades/:id - Eliminar unidad educativa
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { Unidad } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

/**
 * GET /api/unidades
 *
 * Obtiene todas las unidades educativas disponibles
 *
 * @description Este endpoint devuelve la lista completa de unidades educativas
 * registradas en el sistema. Las unidades son subdivisiones de los módulos
 * que organizan el contenido educativo en temas específicos. Cada unidad
 * puede tener tutores virtuales, documentos y actividades asociadas.
 *
 * @middleware requireAuth - Requiere usuario autenticado
 *
 * @returns {Array} 200 - Lista de unidades con información completa
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "nombre": "Álgebra Básica",
 *     "descripcion": "Introducción a las ecuaciones lineales",
 *     "modulo_id": "1",
 *     "orden": 1,
 *     "activa": true,
 *     "fecha_creacion": "2024-01-15T10:30:00Z",
 *     "tutores_count": 3,
 *     "documentos_count": 5
 *   }
 * ]
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const unidades = await Unidad.getAll();
    res.json(unidades);
  } catch (error) {
    console.error('Error en GET /unidades:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/unidades/:id
 *
 * Obtiene una unidad educativa específica por su ID
 *
 * @description Devuelve la información detallada de una unidad educativa
 * específica, incluyendo su contenido, tutores asociados, documentos
 * y estadísticas de uso. Es fundamental para la navegación del contenido
 * educativo y la configuración de tutores virtuales.
 *
 * @middleware requireAuth - Requiere usuario autenticado
 *
 * @param {string} req.params.id - ID de la unidad educativa
 *
 * @returns {Object} 200 - Información completa de la unidad
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 404 - Unidad no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: /api/unidades/1
 * // Response:
 * {
 *   "id": "1",
 *   "nombre": "Álgebra Básica",
 *   "descripcion": "Introducción a las ecuaciones lineales y sistemas",
 *   "modulo_id": "1",
 *   "orden": 1,
 *   "activa": true,
 *   "contenido": "Contenido detallado de la unidad...",
 *   "objetivos": ["Resolver ecuaciones lineales", "Entender sistemas de ecuaciones"],
 *   "fecha_creacion": "2024-01-15T10:30:00Z",
 *   "tutores_virtuales": [
 *     {
 *       "id": "1",
 *       "nombre": "Tutor Teórico",
 *       "tipo": "teorico"
 *     }
 *   ],
 *   "estadisticas": {
 *     "estudiantes_activos": 25,
 *     "conversaciones_totales": 150
 *   }
 * }
 */
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
