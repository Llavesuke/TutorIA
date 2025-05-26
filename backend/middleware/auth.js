import supabase from '../config/supabase.js';
import { verifyToken } from '../utils/jwtUtils.js';
import Usuario from '../models/usuario.js';

/**
 * Middleware para verificar si el usuario está autenticado usando JWT
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // Also check for token in cookies
    else if (req.cookies && req.cookies.jwt_token) {
      token = req.cookies.jwt_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No autorizado: Token no proporcionado' });
    }

    // Verify the JWT token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'No autorizado: Token inválido o expirado' });
    }

    // Get user from database
    const user = await Usuario.getById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'No autorizado: Usuario no encontrado' });
    }

    // Add user to request for later use
    req.user = {
      id: user.id,
      email: user.email,
      rol: user.rol,
      centro_id: user.centro_id,
      nombre_usuario: user.nombre_usuario,
      nombre_real: user.nombre_real,
      user_metadata: {
        rol: user.rol,
        centro_id: user.centro_id,
        nombre_usuario: user.nombre_usuario,
        nombre_real: user.nombre_real
      }
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación JWT:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
};

/**
 * Middleware para verificar si el usuario tiene el rol requerido
 * @param {string[]} roles - Roles permitidos
 */
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      // Primero verificar si el usuario está autenticado
      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado: Usuario no autenticado' });
      }

      // Obtener el rol del usuario
      const userRole = req.user.rol || req.user.user_metadata?.rol;

      if (!userRole || !roles.includes(userRole)) {
        return res.status(403).json({
          message: 'Prohibido: No tienes permiso para acceder a este recurso',
          requiredRoles: roles,
          userRole: userRole
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de roles:', error);
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
  };
};

/**
 * Middleware para verificar si el usuario pertenece al centro educativo especificado
 * @param {string} centroIdParam - Nombre del parámetro que contiene el ID del centro
 */
export const requireSameCentro = (centroIdParam = 'centroId') => {
  return async (req, res, next) => {
    try {
      // Verificar si el usuario está autenticado
      if (!req.user) {
        return res.status(401).json({ message: 'No autorizado: Usuario no autenticado' });
      }

      // Obtener el ID del centro del usuario
      const userCentroId = req.user.centro_id;

      // Obtener el ID del centro de la solicitud
      const requestCentroId = req.params[centroIdParam] || req.body[centroIdParam];

      // Si el usuario es admin, permitir acceso a cualquier centro
      if (req.user.rol === 'admin' && req.user.centro_id === requestCentroId) {
        return next();
      }

      // Verificar si el usuario pertenece al centro
      if (!userCentroId || userCentroId !== requestCentroId) {
        return res.status(403).json({
          message: 'Prohibido: No tienes permiso para acceder a recursos de otro centro educativo'
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de centro educativo:', error);
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
  };
};
