import Usuario from '../models/usuario.js';
import supabase from '../config/supabase.js';
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  setTokenCookie,
  clearTokenCookie
} from '../utils/jwtUtils.js';

/**
 * Service for JWT-based authentication
 */
class JwtAuthService {
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Object} User data and tokens
   */
  static async register(userData) {
    try {
      const {
        centroId,
        rol,
        nombreUsuario,
        nombreReal,
        email,
        contraseña,
        fotoPerfil,
        createdBy,
        curso,
        clase
      } = userData;

      // Check if user already exists
      if (email) {
        const existingUser = await Usuario.getByEmail(email);
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }

      // Check if username already exists
      const existingUsername = await Usuario.getByUsername(nombreUsuario);
      if (existingUsername) {
        throw new Error('Username already exists');
      }

      // Validate that students have a curso
      if (rol === 'estudiante' && !curso) {
        throw new Error('Curso is required for students');
      }

      // Create user
      const user = await Usuario.create(
        centroId,
        rol,
        nombreUsuario,
        email,
        contraseña,
        fotoPerfil,
        createdBy,
        nombreReal,
        false, // emailVerificado
        curso,
        clase
      );

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Remove password from response and add user_metadata
      const { contraseña_hash, ...userWithoutPassword } = user;

      // Asegurar que tenga la estructura completa con user_metadata
      const userWithMetadata = {
        ...userWithoutPassword,
        user_metadata: {
          rol: user.rol,
          nombre_real: user.nombre_real,
          nombre_usuario: user.nombre_usuario,
          centro_id: user.centro_id
        }
      };

      return {
        user: userWithMetadata,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  /**
   * Login a user
   * @param {string} identifier - Email or username
   * @param {string} password - User password
   * @param {Object} res - Express response object (for setting cookies)
   * @returns {Object} User data and tokens
   */
  static async login(identifier, password, res = null) {
    try {
      console.log('🔍 JwtAuthService.login called with identifier:', identifier);
      console.log('🔍 Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING ? 'Present' : 'Missing',
        JWT_SECRET: process.env.JWT_SECRET ? 'Present' : 'Missing'
      });

      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');
      console.log('🔍 Identifier type:', isEmail ? 'email' : 'username');

      // First, try to find user in our custom table and verify password
      let user;
      if (isEmail) {
        console.log('🔍 Getting user from custom table for email:', identifier);
        user = await Usuario.getByEmail(identifier);
      } else {
        console.log('🔍 Getting user from custom table for username:', identifier);
        user = await Usuario.getByUsername(identifier);
      }

      if (!user) {
        console.error('❌ User not found in custom table for identifier:', identifier);
        throw new Error('Usuario no encontrado');
      }
      console.log('✅ User found in custom table:', { id: user.id, rol: user.rol, nombre_real: user.nombre_real });

      // Verify password with our custom table
      console.log('🔍 Verifying password for user:', user.id);
      const isPasswordValid = await Usuario.verifyPassword(password, user.contraseña_hash);
      if (!isPasswordValid) {
        console.error('❌ Password verification failed for user:', user.id);
        throw new Error('Contraseña incorrecta');
      }
      console.log('✅ Password verified successfully for user:', user.id);

      // User is already obtained above, no need to get it again

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      // Update last login
      await Usuario.updateLastLogin(user.id);

      // Set cookies if response object is provided
      if (res) {
        setTokenCookie(res, token, 'jwt_token');
        setTokenCookie(res, refreshToken, 'jwt_refresh_token', process.env.JWT_REFRESH_EXPIRES_IN);
      }

      // Remove password from response and add user_metadata
      const { contraseña_hash, ...userWithoutPassword } = user;

      // Asegurar que tenga la estructura completa con user_metadata
      const userWithMetadata = {
        ...userWithoutPassword,
        user_metadata: {
          rol: user.rol,
          nombre_real: user.nombre_real,
          nombre_usuario: user.nombre_usuario,
          centro_id: user.centro_id
        }
      };

      return {
        user: userWithMetadata,
        token,
        refreshToken,
        isEmailVerified: user.email_verificado
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @param {Object} res - Express response object (for setting cookies)
   * @returns {Object} New access token
   */
  static async refreshToken(refreshToken, res = null) {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        throw new Error('Invalid refresh token');
      }

      // Get user from database
      const user = await Usuario.getById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newToken = generateToken(user);

      // Set cookie if response object is provided
      if (res) {
        setTokenCookie(res, newToken, 'jwt_token');
      }

      return {
        token: newToken
      };
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Logout a user
   * @param {Object} res - Express response object (for clearing cookies)
   * @returns {Object} Success message
   */
  static async logout(res = null) {
    try {
      // Clear cookies if response object is provided
      if (res) {
        clearTokenCookie(res, 'jwt_token');
        clearTokenCookie(res, 'jwt_refresh_token');
      }

      return {
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  }
}

export default JwtAuthService;
