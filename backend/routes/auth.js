import { Router } from 'express';
import crypto from 'crypto';
import SupabaseAuthService from '../services/supabaseAuthService.js';
import JwtAuthService from '../services/jwtAuthService.js';
import EmailService from '../services/emailService.js';
import { requireAuth } from '../middleware/auth.js';
import Usuario from '../models/usuario.js';
import db from '../config/db.js';

const router = Router();

// Registrar un nuevo usuario
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

// Iniciar sesión
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

// Cerrar sesión
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



// Refresh token
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

// Actualizar contraseña
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

// Solicitar restablecimiento de contraseña
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

// Restablecer contraseña con token
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

// Validar token de restablecimiento
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

// Cambiar contraseña (requiere contraseña actual)
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

// Verificar estado de verificación de correo electrónico
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

// Get current user (protected route)
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
