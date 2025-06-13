/**
 * @fileoverview Rutas de relación usuarios-módulos para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de asignaciones
 * entre usuarios (profesores) y módulos educativos, permitiendo establecer qué profesores
 * están a cargo de qué módulos específicos.
 *
 * Endpoints disponibles:
 * - GET /usuarios-modulos/modulo/:moduloId - Obtener profesores asignados a un módulo
 * - GET /usuarios-modulos/usuario/:usuarioId - Obtener módulos asignados a un profesor
 * - POST /usuarios-modulos - Asignar profesor a módulo
 * - DELETE /usuarios-modulos/:usuarioId/:moduloId - Eliminar asignación profesor-módulo
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import { UsuarioModulo, Usuario } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/usuarios-modulos/modulo/:moduloId
 *
 * Obtiene todos los profesores asignados a un módulo específico
 *
 * @description Este endpoint devuelve la lista de profesores que están asignados
 * a un módulo educativo específico. La respuesta está formateada para ser compatible
 * con el frontend, incluyendo información básica del profesor como nombre, avatar y email.
 *
 * @param {string} req.params.moduloId - ID del módulo educativo
 *
 * @returns {Object[]} 200 - Lista de profesores asignados al módulo
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/usuarios-modulos/modulo/123
 *
 * // Response:
 * [
 *   {
 *     "id": "456",
 *     "name": "Prof. Juan Pérez",
 *     "avatar": "https://res.cloudinary.com/tutoria/image/upload/v123/profiles/prof_456.jpg",
 *     "email": "juan.perez@colegio.com"
 *   }
 * ]
 */
router.get('/modulo/:moduloId', async (req, res) => {
  try {
    const { moduloId } = req.params;
    const profesores = await UsuarioModulo.getProfesoresPorModulo(moduloId);
    
    // Formatear la respuesta para que coincida con el formato esperado en el frontend
    const formattedProfessors = profesores.map(profesor => ({
      id: profesor.id,
      name: profesor.nombre_real,
      avatar: profesor.foto_perfil,
      email: profesor.email
    }));
    
    res.json(formattedProfessors);
  } catch (error) {
    console.error(`Error en GET /usuarios-modulos/modulo/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/usuarios-modulos/usuario/:usuarioId
 *
 * Obtiene todos los módulos asignados a un profesor específico
 *
 * @description Este endpoint devuelve la lista de módulos educativos que están
 * asignados a un profesor específico. Útil para mostrar la carga académica
 * de un profesor y los módulos que puede gestionar.
 *
 * @param {string} req.params.usuarioId - ID del usuario/profesor
 *
 * @returns {Object[]} 200 - Lista de módulos asignados al profesor
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/usuarios-modulos/usuario/456
 *
 * // Response:
 * [
 *   {
 *     "id": "123",
 *     "nombre": "Matemáticas Avanzadas",
 *     "descripcion": "Módulo de matemáticas para 4º ESO",
 *     "centro_id": "1",
 *     "curso": "4º ESO",
 *     "clase": "A"
 *   }
 * ]
 */
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const modulos = await UsuarioModulo.getModulosPorProfesor(usuarioId);
    res.json(modulos);
  } catch (error) {
    console.error(`Error en GET /usuarios-modulos/usuario/${req.params.usuarioId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/usuarios-modulos
 *
 * Asigna un profesor a un módulo educativo
 *
 * @description Este endpoint crea una nueva asignación entre un profesor y un módulo.
 * Verifica que el usuario sea efectivamente un profesor o administrador antes de
 * crear la asignación. Solo profesores y administradores pueden ser asignados a módulos.
 *
 * @param {Object} req.body - Datos de la asignación
 * @param {string} req.body.usuarioId - ID del usuario/profesor (requerido)
 * @param {string} req.body.moduloId - ID del módulo educativo (requerido)
 *
 * @returns {Object} 201 - Asignación creada exitosamente
 * @returns {Object} 400 - Parámetros faltantes o usuario no es profesor
 * @returns {Object} 404 - Usuario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "usuarioId": "456",
 *   "moduloId": "123"
 * }
 *
 * // Response:
 * {
 *   "id": "789",
 *   "usuario_id": "456",
 *   "modulo_id": "123",
 *   "fecha_asignacion": "2024-01-15T10:30:00Z",
 *   "message": "Profesor asignado al módulo exitosamente"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { usuarioId, moduloId } = req.body;
    
    if (!usuarioId || !moduloId) {
      return res.status(400).json({ message: 'Usuario ID y Módulo ID son requeridos' });
    }
    
    // Verificar que el usuario es un profesor
    const usuario = await Usuario.getById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin') {
      return res.status(400).json({ message: 'Solo los profesores y administradores pueden ser asignados a módulos' });
    }
    
    const result = await UsuarioModulo.asignarProfesorAModulo(usuarioId, moduloId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /usuarios-modulos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * DELETE /api/usuarios-modulos/:usuarioId/:moduloId
 *
 * Elimina la asignación de un profesor a un módulo específico
 *
 * @description Este endpoint elimina la relación entre un profesor y un módulo,
 * removiendo al profesor de la lista de profesores asignados al módulo.
 * Esta operación es irreversible y debe usarse con cuidado.
 *
 * @param {string} req.params.usuarioId - ID del usuario/profesor
 * @param {string} req.params.moduloId - ID del módulo educativo
 *
 * @returns {Object} 200 - Asignación eliminada exitosamente
 * @returns {Object} 404 - Asignación no encontrada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: DELETE /api/usuarios-modulos/456/123
 *
 * // Response:
 * {
 *   "message": "Asignación eliminada exitosamente",
 *   "usuario_id": "456",
 *   "modulo_id": "123"
 * }
 */
router.delete('/:usuarioId/:moduloId', async (req, res) => {
  try {
    const { usuarioId, moduloId } = req.params;
    const result = await UsuarioModulo.eliminarProfesorDeModulo(usuarioId, moduloId);
    res.json(result);
  } catch (error) {
    console.error(`Error en DELETE /usuarios-modulos/${req.params.usuarioId}/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
