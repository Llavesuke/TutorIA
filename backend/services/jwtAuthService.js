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
      // Determine if identifier is email or username
      const isEmail = identifier.includes('@');

      // For email logins, verify credentials with Supabase Auth first
      if (isEmail) {
        console.log('Verifying email credentials with Supabase Auth');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password: password
        });

        if (error) {
          console.error('Supabase Auth verification failed:', error.message);
          throw new Error('Credenciales inválidas');
        }

        console.log('Supabase Auth verification successful');

        // Now get user from our custom table
        const user = await Usuario.getByEmail(identifier);
        if (!user) {
          throw new Error('Usuario no encontrado en tabla personalizada');
        }

        // Note: We don't sign out from Supabase immediately to avoid session conflicts
      } else {
        // For username logins, find user and verify password with our custom table
        const user = await Usuario.getByUsername(identifier);
        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        // Verify password
        const isPasswordValid = await Usuario.verifyPassword(password, user.contraseña_hash);
        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }
      }

      // Get user data for token generation
      let user;
      if (isEmail) {
        user = await Usuario.getByEmail(identifier);
      } else {
        user = await Usuario.getByUsername(identifier);
      }

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
