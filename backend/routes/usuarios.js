/**
 * @fileoverview Rutas de usuarios para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de usuarios,
 * incluyendo consulta, actualización, eliminación y operaciones específicas por rol y centro educativo.
 *
 * Endpoints disponibles:
 * - GET /usuarios - Obtener todos los usuarios
 * - GET /usuarios/rol/:rol - Obtener usuarios por rol
 * - GET /usuarios/centro/:centroId - Obtener usuarios por centro educativo
 * - GET /usuarios/by-email/:email - Obtener usuario por email
 * - GET /usuarios/:id - Obtener usuario específico
 * - POST /usuarios - Crear nuevo usuario (placeholder)
 * - PUT /usuarios/:id - Actualizar usuario
 * - DELETE /usuarios/:id - Eliminar usuario
 * - POST /usuarios/update-email - Actualizar email del usuario actual
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import Usuario from '../models/usuario.js';
import db from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();

/**
 * GET /api/usuarios
 *
 * Obtiene todos los usuarios registrados en el sistema
 *
 * @description Este endpoint devuelve la lista completa de usuarios registrados
 * en la plataforma TutorIA. No requiere autenticación ya que es información
 * necesaria para la gestión administrativa del sistema.
 *
 * @returns {Array} 200 - Lista de usuarios con información básica
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "email": "juan@colegio.com",
 *     "nombre_usuario": "juan_perez",
 *     "nombre_real": "Juan Pérez García",
 *     "rol": "estudiante",
 *     "centro_id": "1",
 *     "curso": "1º ESO",
 *     "clase": "A",
 *     "fecha_registro": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.getAll();
    res.json(usuarios);
  } catch (error) {
    console.error('Error en GET /usuarios:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/usuarios/rol/:rol
router.get('/rol/:rol', async (req, res) => {
  try {
    const { rol } = req.params;
    const { centroId } = req.query;

    // Validate role parameter
    const validRoles = ['admin', 'profesor', 'estudiante'];
    if (!validRoles.includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido. Debe ser admin, profesor o estudiante' });
    }

    let usuarios;

    // If centroId is provided, filter by both role and center ID
    if (centroId) {
      console.log(`Fetching users with role ${rol} for center ${centroId}`);

      // First check if the center exists
      const result = await db.query('SELECT * FROM centros_educativos WHERE id = $1', [centroId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: `Centro educativo con ID ${centroId} no encontrado` });
      }

      // Get users by role and center ID
      usuarios = await db.query(
        'SELECT * FROM usuarios WHERE rol = $1 AND centro_id = $2 ORDER BY nombre_usuario',
        [rol, centroId]
      );
      usuarios = usuarios.rows;
    } else {
      // If no centroId is provided, just filter by role
      console.log(`Fetching all users with role ${rol}`);
      usuarios = await Usuario.getByRol(rol);
    }

    // Format the response to match the expected format in the frontend
    const formattedUsers = usuarios.map(user => ({
      id: user.id,
      name: user.nombre_real,
      lastActivity: user.ultimo_acceso ? '1 hour ago' : 'Never', // Placeholder for now
      date: user.fecha_creacion ? new Date(user.fecha_creacion).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      aiInteraction: 'Low', // Placeholder for now
      status: user.ultimo_acceso ? 'Active' : 'Inactive',
      avatar: user.foto_perfil,
      curso: user.curso,
      clase: user.clase,
      email: user.email
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error(`Error en GET /usuarios/rol/${req.params.rol}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/usuarios/centro/:centroId
 *
 * Obtiene todos los usuarios de un centro educativo específico
 *
 * @description Devuelve la lista de usuarios (estudiantes, profesores, administradores)
 * que pertenecen a un centro educativo determinado. Útil para la gestión
 * administrativa y la organización por centros.
 *
 * @param {string} req.params.centroId - ID del centro educativo
 *
 * @returns {Array} 200 - Lista de usuarios del centro especificado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: /api/usuarios/centro/1
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "nombre_real": "Juan Pérez",
 *     "rol": "estudiante",
 *     "curso": "1º ESO",
 *     "clase": "A"
 *   },
 *   {
 *     "id": "2",
 *     "nombre_real": "María García",
 *     "rol": "profesor",
 *     "especialidad": "Matemáticas"
 *   }
 * ]
 */
router.get('/centro/:centroId', async (req, res) => {
  try {
    const { centroId } = req.params;
    const usuarios = await Usuario.getByCentroId(centroId);
    res.json(usuarios);
  } catch (error) {
    console.error(`Error en GET /usuarios/centro/${req.params.centroId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/usuarios/by-email/:email
 *
 * Busca un usuario por su dirección de correo electrónico
 *
 * @description Permite buscar un usuario específico utilizando su email.
 * Devuelve información completa del usuario incluyendo metadatos.
 * El email debe estar codificado en URL si contiene caracteres especiales.
 *
 * @param {string} req.params.email - Dirección de email del usuario (URL encoded)
 *
 * @returns {Object} 200 - Usuario encontrado con metadatos
 * @returns {Object} 404 - Usuario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: /api/usuarios/by-email/juan%40colegio.com
 * // Response:
 * {
 *   "user": {
 *     "id": "1",
 *     "email": "juan@colegio.com",
 *     "nombre_usuario": "juan_perez",
 *     "nombre_real": "Juan Pérez García",
 *     "rol": "estudiante",
 *     "centro_id": "1",
 *     "user_metadata": {
 *       "rol": "estudiante",
 *       "nombre_real": "Juan Pérez García",
 *       "nombre_usuario": "juan_perez",
 *       "centro_id": "1"
 *     }
 *   }
 * }
 */
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);

    console.log('Getting user by email:', decodedEmail);

    const usuario = await Usuario.getByEmail(decodedEmail);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Remove password hash and add user_metadata
    const { contraseña_hash, ...usuarioSinContraseña } = usuario;

    const userWithMetadata = {
      ...usuarioSinContraseña,
      user_metadata: {
        rol: usuario.rol,
        nombre_real: usuario.nombre_real,
        nombre_usuario: usuario.nombre_usuario,
        centro_id: usuario.centro_id
      }
    };

    res.json({ user: userWithMetadata });
  } catch (error) {
    console.error(`Error en GET /usuarios/by-email/${req.params.email}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/usuarios/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.getById(id);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error(`Error en GET /usuarios/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/usuarios
router.post('/', async (req, res) => {
  try {
    const usuarioData = req.body;
    res.status(201).json({ message: 'Usuario creado (placeholder)', data: usuarioData });
  } catch (error) {
    console.error('Error en POST /usuarios:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreUsuario, email, fotoPerfil, curso, clase } = req.body;

    // Verificar que el usuario existe
    const usuarioExistente = await Usuario.getById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ message: `Usuario con ID ${id} no encontrado` });
    }

    // Actualizar el usuario
    const usuarioActualizado = await Usuario.update(id, nombreUsuario, email, fotoPerfil, curso, clase);
    res.json(usuarioActualizado);
  } catch (error) {
    console.error(`Error en PUT /usuarios/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const usuario = await Usuario.getById(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log(`Deleting user with ID: ${id}, role: ${usuario.rol}, name: ${usuario.nombre_real}`);

    // Eliminar el usuario de la base de datos
    const result = await Usuario.delete(id);

    console.log(`User deleted successfully: ${id}`);
    res.json(result);
  } catch (error) {
    console.error(`Error en DELETE /usuarios/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Actualizar email del usuario actual
router.post('/update-email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    // Verificar que el usuario existe
    const usuarioExistente = await Usuario.getById(userId);
    if (!usuarioExistente) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el email ya está en uso
    const emailExistente = await Usuario.getByEmail(email);
    if (emailExistente && emailExistente.id !== userId) {
      return res.status(409).json({ message: 'Este email ya está en uso por otro usuario' });
    }

    // Actualizar el email del usuario
    const usuarioActualizado = await Usuario.update(
      userId,
      usuarioExistente.nombre_usuario,
      email,
      usuarioExistente.foto_perfil,
      usuarioExistente.curso,
      usuarioExistente.clase
    );

    res.json({
      message: 'Email actualizado exitosamente',
      user: usuarioActualizado
    });
  } catch (error) {
    console.error('Error en POST /usuarios/update-email:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
