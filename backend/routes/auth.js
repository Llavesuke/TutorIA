/**
 * @fileoverview Rutas de autenticación para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la autenticación de usuarios,
 * incluyendo registro, login, logout, restablecimiento de contraseñas y gestión de tokens JWT.
 *
 * Endpoints disponibles:
 * - POST /auth/register - Registrar nuevo usuario
 * - POST /auth/login - Iniciar sesión
 * - POST /auth/logout - Cerrar sesión
 * - GET /auth/me - Obtener usuario actual
 * - POST /auth/refresh-token - Renovar token JWT
 * - POST /auth/forgot-password - Solicitar restablecimiento de contraseña
 * - POST /auth/reset-password - Restablecer contraseña con token
 * - POST /auth/change-password - Cambiar contraseña (requiere autenticación)
 * - GET /auth/validate-reset-token/:token - Validar token de restablecimiento
 * - GET /auth/verify-email-status - Verificar estado de verificación de email
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import crypto from 'crypto';
import SupabaseAuthService from '../services/supabaseAuthService.js';
import JwtAuthService from '../services/jwtAuthService.js';
import EmailService from '../services/emailService.js';
import { requireAuth } from '../middleware/auth.js';
import Usuario from '../models/usuario.js';
import db from '../config/db.js';
import supabase from '../config/supabase.js';

const router = Router();

/**
 * POST /api/auth/register
 *
 * Registra un nuevo usuario en el sistema
 *
 * @description Este endpoint permite registrar nuevos usuarios en la plataforma TutorIA.
 * Valida los datos de entrada, verifica que el email y nombre de usuario sean únicos,
 * y crea el usuario tanto en la base de datos local como en Supabase Auth.
 *
 * @param {Object} req.body - Datos del usuario a registrar
 * @param {string} req.body.email - Correo electrónico único del usuario
 * @param {string} req.body.password - Contraseña del usuario (mínimo 6 caracteres)
 * @param {string} req.body.nombreUsuario - Nombre de usuario único
 * @param {string} req.body.nombreReal - Nombre real del usuario
 * @param {string} req.body.rol - Rol del usuario (estudiante, profesor, admin)
 * @param {string} req.body.centroId - ID del centro educativo al que pertenece
 * @param {string} [req.body.curso] - Curso del estudiante (opcional)
 * @param {string} [req.body.clase] - Clase del estudiante (opcional)
 * @param {string} [req.body.fotoPerfil] - URL de la foto de perfil (opcional)
 *
 * @returns {Object} 201 - Usuario registrado exitosamente
 * @returns {Object} 400 - Error de validación o datos duplicados
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "email": "estudiante@colegio.com",
 *   "password": "password123",
 *   "nombreUsuario": "juan_perez",
 *   "nombreReal": "Juan Pérez García",
 *   "rol": "estudiante",
 *   "centroId": "1",
 *   "curso": "1º ESO",
 *   "clase": "A"
 * }
 */
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    console.log('Registration request received:', { ...userData, password: '***REDACTED***' });

    // Check if this is an educational center registration
    if (userData.centreName && !userData.centroId) {
      console.log('Educational center registration detected');

      // Validate center name
      if (!userData.centreName || typeof userData.centreName !== 'string' || userData.centreName.trim() === '') {
        return res.status(400).json({
          message: 'Nombre del centro educativo es requerido y debe ser una cadena no vacía'
        });
      }

      // Create the educational center first
      try {
        const CentroEducativo = (await import('../models/centroEducativo.js')).default;
        console.log('Attempting to create educational center with name:', userData.centreName);

        const newCentro = await CentroEducativo.create(userData.centreName);

        // Set the centroId for the user
        userData.centroId = newCentro.id;

        console.log('Created educational center successfully:', newCentro);
      } catch (centroError) {
        console.error('Error creating educational center:', centroError);
        return res.status(500).json({
          message: 'Error al crear el centro educativo',
          error: centroError.message
        });
      }
    }

    // Validar campos requeridos
    const requiredFields = ['centroId', 'rol', 'nombreUsuario', 'password'];

    // Email es requerido solo para profesores y admins
    if (userData.rol === 'profesor' || userData.rol === 'admin') {
      requiredFields.push('email');
    }

    // Verificar que todos los campos requeridos estén presentes
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      console.error('Missing required fields:', {
        hasCentroId: !!userData.centroId,
        hasRol: !!userData.rol,
        hasNombreUsuario: !!userData.nombreUsuario,
        hasEmail: !!userData.email,
        hasPassword: !!userData.password,
        missingFields
      });
      return res.status(400).json({
        message: 'Faltan campos requeridos',
        missingFields
      });
    }

    // Validar rol
    if (!['admin', 'profesor', 'estudiante'].includes(userData.rol)) {
      console.error('Invalid role:', userData.rol);
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Add nombreReal if it's missing but we have it
    if (!userData.nombreReal && userData.adminFullName) {
      userData.nombreReal = userData.adminFullName;
      console.log('Using adminFullName as nombreReal:', userData.nombreReal);
    } else if (!userData.nombreReal) {
      // If we still don't have nombreReal, use nombreUsuario as a fallback
      userData.nombreReal = userData.nombreUsuario;
      console.log('Using nombreUsuario as nombreReal:', userData.nombreReal);
    }

    // Extra validation to ensure nombreReal is never null or undefined
    if (!userData.nombreReal) {
      userData.nombreReal = userData.email ? userData.email.split('@')[0] : 'User';
      console.log('Using fallback for nombreReal:', userData.nombreReal);
    }

    // Force nombreReal to be a string
    userData.nombreReal = String(userData.nombreReal);
    console.log('Final nombreReal value:', userData.nombreReal, 'Type:', typeof userData.nombreReal);

    console.log('Calling SupabaseAuthService.register with validated data');
    const result = await SupabaseAuthService.register(userData);
    console.log('Registration successful:', { userId: result.user?.id });

    // Send welcome email for center registration (admin users)
    if (userData.email && userData.rol === 'admin' && userData.centreName) {
      try {
        console.log('Sending welcome email for new educational center');
        await EmailService.sendWelcomeEmail(userData.email, {
          userName: userData.nombreReal || userData.nombreUsuario,
          userRole: userData.rol
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the registration if email sending fails
      }
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /auth/register:', error);

    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      return res.status(409).json({ message: 'El usuario con este email ya existe' });
    }

    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/auth/login
 *
 * Inicia sesión de usuario en el sistema
 *
 * @description Este endpoint autentica a un usuario utilizando email/nombre de usuario y contraseña.
 * Primero intenta autenticación JWT local, y si falla, utiliza Supabase Auth como respaldo.
 * Devuelve un token JWT para autenticación en requests posteriores.
 *
 * @param {Object} req.body - Credenciales de login
 * @param {string} req.body.identifier - Email o nombre de usuario
 * @param {string} req.body.password - Contraseña del usuario
 *
 * @returns {Object} 200 - Login exitoso con token y datos de usuario
 * @returns {Object} 401 - Credenciales inválidas
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "identifier": "juan_perez",
 *   "password": "password123"
 * }
 *
 * // Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "123",
 *     "email": "juan@colegio.com",
 *     "rol": "estudiante"
 *   },
 *   "isEmailVerified": true
 * }
 */
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    console.log('Login request received for identifier:', identifier);

    if (!identifier || !password) {
      console.log('Missing identifier or password');
      return res.status(400).json({ message: 'Identificador y contraseña son requeridos' });
    }

    // Try JWT authentication first
    try {
      console.log('Attempting JWT authentication for identifier:', identifier);
      const jwtResult = await JwtAuthService.login(identifier, password, res);

      console.log('JWT login successful, result:', {
        hasUser: !!jwtResult.user,
        hasToken: !!jwtResult.token,
        hasRefreshToken: !!jwtResult.refreshToken,
        isEmailVerified: jwtResult.isEmailVerified
      });

      // Return user data and tokens
      return res.json({
        user: jwtResult.user,
        token: jwtResult.token,
        refreshToken: jwtResult.refreshToken,
        isEmailVerified: jwtResult.isEmailVerified
      });
    } catch (jwtError) {
      console.error('JWT authentication failed, error details:', jwtError.message);
      console.error('Full JWT error:', jwtError);
      console.log('Falling back to Supabase authentication');

      // If JWT auth fails, fall back to Supabase auth
      const result = await SupabaseAuthService.login(identifier, password);

      // Log the verification status
      if (result.isEmailVerified !== undefined) {
        console.log('Supabase login successful, email verification status:', result.isEmailVerified);
      } else {
        console.log('Supabase login successful, no email verification status (probably a student without email)');
      }

      // Include the verification status in the response
      return res.json({
        ...result,
        isEmailVerified: result.isEmailVerified
      });
    }
  } catch (error) {
    console.error('Error en POST /auth/login:', error);

    if (error.message.includes('Invalid login credentials') ||
        error.message.includes('Contraseña incorrecta')) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (error.message.includes('Usuario no encontrado')) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/auth/logout
 *
 * Cierra la sesión del usuario actual
 *
 * @description Este endpoint cierra la sesión del usuario autenticado.
 * Invalida el token JWT actual y limpia las cookies de autenticación.
 * Intenta cerrar sesión tanto en JWT como en Supabase Auth.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @returns {Object} 200 - Logout exitoso
 * @returns {Object} 401 - Token de autenticación inválido o faltante
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Response:
 * {
 *   "message": "Logout successful"
 * }
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Try JWT logout first
    try {
      console.log('Attempting JWT logout');
      const jwtResult = await JwtAuthService.logout(res);
      console.log('JWT logout successful');

      // Also try to logout from Supabase if there's a session
      try {
        await SupabaseAuthService.logout();
      } catch (supabaseError) {
        console.log('Supabase logout failed, but JWT logout was successful:', supabaseError);
      }

      return res.json({ message: 'Logout successful' });
    } catch (jwtError) {
      console.error('JWT logout failed, falling back to Supabase:', jwtError);

      // If JWT logout fails, fall back to Supabase logout
      const result = await SupabaseAuthService.logout();
      return res.json(result);
    }
  } catch (error) {
    console.error('Error en POST /auth/logout:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});



/**
 * POST /api/auth/refresh-token
 *
 * Renueva el token JWT de autenticación
 *
 * @description Este endpoint permite renovar un token JWT expirado utilizando un refresh token válido.
 * El refresh token puede enviarse en el cuerpo de la petición o en las cookies.
 *
 * @param {Object} req.body - Datos de renovación
 * @param {string} [req.body.refreshToken] - Refresh token (opcional si está en cookies)
 *
 * @returns {Object} 200 - Token renovado exitosamente
 * @returns {Object} 400 - Refresh token requerido
 * @returns {Object} 401 - Refresh token inválido o expirado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Response:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "message": "Token refreshed successfully"
 * }
 */
router.post('/refresh-token', async (req, res) => {
  try {
    // Get refresh token from request body or cookies
    let refreshToken = req.body.refreshToken;

    if (!refreshToken && req.cookies && req.cookies.jwt_refresh_token) {
      refreshToken = req.cookies.jwt_refresh_token;
    }

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Refresh the token
    const result = await JwtAuthService.refreshToken(refreshToken, res);

    res.json({
      token: result.token,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Error en POST /auth/refresh-token:', error);

    if (error.message.includes('Invalid refresh token')) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/auth/update-password
 *
 * Actualiza la contraseña del usuario (sin autenticación previa)
 *
 * @description Este endpoint permite actualizar la contraseña de un usuario utilizando Supabase Auth.
 * Generalmente se usa después de un proceso de restablecimiento de contraseña.
 *
 * @param {Object} req.body - Datos de actualización
 * @param {string} req.body.newPassword - Nueva contraseña del usuario
 *
 * @returns {Object} 200 - Contraseña actualizada exitosamente
 * @returns {Object} 400 - Nueva contraseña requerida
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "newPassword": "nuevaPassword123"
 * }
 *
 * // Response:
 * {
 *   "message": "Contraseña actualizada exitosamente"
 * }
 */
router.post('/update-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Nueva contraseña es requerida' });
    }

    const result = await SupabaseAuthService.updatePassword(newPassword);
    res.json({ message: 'Contraseña actualizada exitosamente', ...result });
  } catch (error) {
    console.error('Error en POST /auth/update-password:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/auth/forgot-password
 *
 * Solicita el restablecimiento de contraseña por email
 *
 * @description Este endpoint inicia el proceso de restablecimiento de contraseña.
 * Envía un email con un enlace de restablecimiento si el email existe en el sistema.
 * Por seguridad, siempre devuelve el mismo mensaje independientemente de si el email existe.
 *
 * @param {Object} req.body - Datos de solicitud
 * @param {string} req.body.email - Email del usuario que solicita el restablecimiento
 *
 * @returns {Object} 200 - Solicitud procesada (siempre exitosa por seguridad)
 * @returns {Object} 400 - Email requerido
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "email": "usuario@colegio.com"
 * }
 *
 * // Response:
 * {
 *   "message": "If the email exists in our system, you will receive a password reset link."
 * }
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Buscar usuario por email
    const user = await Usuario.getByEmail(email);

    // Por seguridad, siempre devolvemos el mismo mensaje, independientemente de si el email existe
    const successMessage = 'If the email exists in our system, you will receive a password reset link.';

    if (user) {
      try {
        // Crear token de restablecimiento
        const resetToken = await Usuario.createPasswordResetToken(user.id);

        // Crear URL de restablecimiento
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Enviar correo de restablecimiento
        await EmailService.sendPasswordResetEmail(email, {
          resetUrl,
          userName: user.nombre_real || user.nombre_usuario
        });

        console.log('Password reset email sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // No revelamos el error al usuario por seguridad
      }
    }

    res.json({ message: successMessage });
  } catch (error) {
    console.error('Error en POST /auth/forgot-password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/reset-password
 *
 * Restablece la contraseña utilizando un token de restablecimiento
 *
 * @description Este endpoint permite restablecer la contraseña de un usuario utilizando
 * un token válido recibido por email. El token debe ser válido y no haber expirado.
 *
 * @param {Object} req.body - Datos de restablecimiento
 * @param {string} req.body.token - Token de restablecimiento recibido por email
 * @param {string} req.body.newPassword - Nueva contraseña (mínimo 6 caracteres)
 *
 * @returns {Object} 200 - Contraseña restablecida exitosamente
 * @returns {Object} 400 - Token y nueva contraseña requeridos, o token inválido/expirado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "token": "abc123def456...",
 *   "newPassword": "nuevaPassword123"
 * }
 *
 * // Response:
 * {
 *   "message": "Password reset successfully"
 * }
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Restablecer la contraseña
    const result = await Usuario.resetPassword(token, newPassword);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error en POST /auth/reset-password:', error);

    if (error.message.includes('Invalid reset token') || error.message.includes('expired')) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/validate-reset-token/:token
 *
 * Valida un token de restablecimiento de contraseña
 *
 * @description Este endpoint verifica si un token de restablecimiento de contraseña
 * es válido y no ha expirado. Útil para validar tokens antes de mostrar el formulario
 * de restablecimiento de contraseña.
 *
 * @param {string} req.params.token - Token de restablecimiento a validar
 *
 * @returns {Object} 200 - Token válido
 * @returns {Object} 400 - Token requerido o inválido/expirado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/auth/validate-reset-token/abc123def456...
 *
 * // Response (token válido):
 * {
 *   "valid": true,
 *   "message": "Valid token"
 * }
 *
 * // Response (token inválido):
 * {
 *   "valid": false,
 *   "message": "Invalid or expired token"
 * }
 */
router.get('/validate-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const validation = await Usuario.validatePasswordResetToken(token);

    if (validation.valid) {
      res.json({ valid: true, message: 'Valid token' });
    } else {
      res.status(400).json({ valid: false, message: validation.message });
    }
  } catch (error) {
    console.error('Error en GET /auth/validate-reset-token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/change-password
 *
 * Cambia la contraseña del usuario autenticado
 *
 * @description Este endpoint permite a un usuario autenticado cambiar su contraseña.
 * Requiere proporcionar la contraseña actual para verificar la identidad antes del cambio.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {Object} req.body - Datos de cambio de contraseña
 * @param {string} req.body.currentPassword - Contraseña actual del usuario
 * @param {string} req.body.newPassword - Nueva contraseña del usuario
 *
 * @returns {Object} 200 - Contraseña actualizada exitosamente
 * @returns {Object} 400 - Contraseñas requeridas o contraseña actual incorrecta
 * @returns {Object} 401 - Token de autenticación inválido o faltante
 * @returns {Object} 404 - Usuario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Request body:
 * {
 *   "currentPassword": "passwordActual123",
 *   "newPassword": "nuevaPassword456"
 * }
 *
 * // Response:
 * {
 *   "message": "Contraseña actualizada exitosamente"
 * }
 */
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Se requieren la contraseña actual y la nueva' });
    }

    // Verificar la contraseña actual
    const user = await Usuario.getById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isPasswordValid = await Usuario.verifyPassword(currentPassword, user.contraseña_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Actualizar la contraseña
    const hashedPassword = await Usuario.hashPassword(newPassword);
    await db.query('UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error en POST /auth/change-password:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/auth/verify-email-status
 *
 * Verifica el estado de verificación del correo electrónico
 *
 * @description Este endpoint verifica si el correo electrónico de un usuario
 * ha sido verificado en el sistema. Útil para determinar si se debe mostrar
 * un mensaje de verificación pendiente.
 *
 * @param {string} req.query.email - Email del usuario a verificar
 *
 * @returns {Object} 200 - Estado de verificación obtenido exitosamente
 * @returns {Object} 400 - Email requerido
 * @returns {Object} 404 - Usuario no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/auth/verify-email-status?email=usuario@colegio.com
 *
 * // Response:
 * {
 *   "success": true,
 *   "isEmailVerified": true,
 *   "message": "Email verification status retrieved successfully"
 * }
 */
router.get('/verify-email-status', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    console.log('Checking email verification status for:', email);

    // Check email verification status using our custom system only
    const Usuario = (await import('../models/usuario.js')).default;
    const user = await Usuario.getByEmail(email);

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        isEmailVerified: false
      });
    }

    res.json({
      success: true,
      isEmailVerified: user.email_verificado || false,
      userId: user.id
    });
  } catch (error) {
    console.error('Error en GET /auth/verify-email-status:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Send email verification
router.post('/send-verification-email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      return res.status(400).json({ message: 'Email es requerido' });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.getById(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Generar token de verificación simple basado en email y userId
    const tokenData = `${email}:${userId}:${Date.now()}`;
    const verificationToken = crypto.createHash('sha256').update(tokenData).digest('hex').substring(0, 32);

    // Crear URL de verificación
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}?email=${encodeURIComponent(email)}&userId=${userId}`;

    // Enviar correo de verificación usando el servicio de email existente
    const emailResult = await EmailService.sendVerificationEmail(email, {
      verificationUrl,
      userName: usuario.nombre_real || usuario.nombre_usuario
    });

    if (emailResult.success) {
      res.json({
        message: 'Correo de verificación enviado exitosamente',
        token: verificationToken
      });
    } else {
      res.status(500).json({ message: 'Error al enviar el correo de verificación' });
    }
  } catch (error) {
    console.error('Error en POST /auth/send-verification-email:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Verify email with token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { email, userId } = req.query;

    if (!token || !email || !userId) {
      return res.status(400).json({ message: 'Token, email y userId son requeridos' });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.getById(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el email coincide
    if (usuario.email !== email) {
      return res.status(400).json({ message: 'Email no coincide con el usuario' });
    }

    // Para simplicidad, validamos que el token tenga el formato correcto
    // En un sistema más robusto, validaríamos el token contra una base de datos
    if (token.length !== 32) {
      return res.status(400).json({ message: 'Token de verificación inválido' });
    }

    // Actualizar el estado de verificación del email
    await Usuario.updateEmailVerificationStatus(userId, true);

    // Check if this is a browser request (HTML) or API request (JSON)
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('text/html')) {
      // Browser request - redirect
      res.redirect(`${process.env.FRONTEND_URL}/student/home?verified=true`);
    } else {
      // API request - return JSON
      res.json({
        message: 'Email verificado exitosamente',
        verified: true,
        redirectUrl: `${process.env.FRONTEND_URL}/student/home?verified=true`
      });
    }
  } catch (error) {
    console.error('Error en GET /auth/verify-email/:token:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * GET /api/auth/me
 *
 * Obtiene la información del usuario autenticado
 *
 * @description Este endpoint devuelve la información del usuario actualmente autenticado.
 * Útil para verificar el estado de autenticación y obtener datos del usuario en el frontend.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @returns {Object} 200 - Información del usuario obtenida exitosamente
 * @returns {Object} 401 - Token de autenticación inválido o faltante
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Headers:
 * {
 *   "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 *
 * // Response:
 * {
 *   "user": {
 *     "id": "123",
 *     "email": "usuario@colegio.com",
 *     "nombre_usuario": "juan_perez",
 *     "nombre_real": "Juan Pérez",
 *     "rol": "estudiante",
 *     "centro_id": "1"
 *   },
 *   "message": "Authentication valid"
 * }
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({
      user: req.user,
      message: 'Authentication valid'
    });
  } catch (error) {
    console.error('Error en GET /auth/me:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Diagnostic endpoint to check database connection and table
router.get('/diagnostic', async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connectionString: process.env.DB_CONNECTION_STRING ? 'Present' : 'Missing',
        connectionStringLength: process.env.DB_CONNECTION_STRING?.length || 0
      },
      jwt: {
        secret: process.env.JWT_SECRET ? 'Present' : 'Missing'
      }
    };

    // Test database connection
    try {
      const result = await db.query('SELECT NOW() as current_time');
      diagnostics.database.connection = 'Success';
      diagnostics.database.currentTime = result.rows[0].current_time;
    } catch (dbError) {
      diagnostics.database.connection = 'Failed';
      diagnostics.database.error = dbError.message;
    }

    // Test usuarios table
    try {
      const result = await db.query('SELECT COUNT(*) as user_count FROM usuarios');
      diagnostics.database.usuariosTable = 'Exists';
      diagnostics.database.userCount = parseInt(result.rows[0].user_count);
    } catch (tableError) {
      diagnostics.database.usuariosTable = 'Missing or Error';
      diagnostics.database.tableError = tableError.message;
    }

    // Test specific user
    try {
      const user = await Usuario.getByEmail('llavesukeprogram@gmail.com');
      diagnostics.database.testUser = user ? 'Found' : 'Not Found';
      if (user) {
        diagnostics.database.testUserData = {
          id: user.id,
          rol: user.rol,
          nombre_real: user.nombre_real,
          centro_id: user.centro_id
        };
      }
    } catch (userError) {
      diagnostics.database.testUser = 'Error';
      diagnostics.database.userError = userError.message;
    }

    res.json(diagnostics);
  } catch (error) {
    console.error('Error in diagnostic endpoint:', error);
    res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get current user from Supabase session
router.get('/current-user-from-supabase', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const supabaseToken = authHeader.split(' ')[1];

    // Verify the Supabase token and get user
    const { data: { user }, error } = await supabase.auth.getUser(supabaseToken);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid Supabase token' });
    }

    // Get the complete user data from our custom table
    const usuario = await Usuario.getByEmail(user.email);

    if (!usuario) {
      return res.status(404).json({ message: 'User not found in custom table' });
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

    res.json({
      user: userWithMetadata,
      message: 'User data retrieved successfully'
    });
  } catch (error) {
    console.error('Error en GET /auth/current-user-from-supabase:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});



// Verificar email usando nuestro sistema personalizado
router.post('/verify-email', async (req, res) => {
  try {
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({
        message: 'Email and userId are required'
      });
    }

    console.log('Email verification request:', { email, userId });

    // Verify email using our custom system
    const result = await EmailService.verifyEmail(email, userId);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in POST /auth/verify-email:', error);
    res.status(500).json({
      message: 'Error verifying email',
      error: error.message
    });
  }
});

// Reenviar email de verificación
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, userId, userName } = req.body;

    if (!email || !userId) {
      return res.status(400).json({
        message: 'Email and userId are required'
      });
    }

    console.log('Resend verification email request:', { email, userId });

    // Generate verification URL
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email-direct?email=${encodeURIComponent(email)}&userId=${userId}`;

    // Send verification email
    await EmailService.sendVerificationEmail(email, {
      verificationUrl,
      userName: userName || 'Usuario'
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error in POST /auth/resend-verification:', error);
    res.status(500).json({
      message: 'Error sending verification email',
      error: error.message
    });
  }
});

export default router;
