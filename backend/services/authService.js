import Usuario from '../models/usuario';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @param {string} userData.centroId - UUID of the educational center
   * @param {string} userData.rol - Role ('admin', 'profesor', 'estudiante')
   * @param {string} userData.nombreUsuario - Username
   * @param {string} userData.email - Email
   * @param {string} userData.contraseña - Password
   * @param {string} userData.fotoPerfil - Profile picture URL (optional)
   * @param {string} userData.createdBy - UUID of the user who created this user (optional)
   * @param {string} userData.curso - Course of the student (e.g., "1º ESO", "2º ESO") (required for students)
   * @returns {Object} The created user
   */
  static async register(userData) {
    try {
      const { centroId, rol, nombreUsuario, email, contraseña, fotoPerfil, createdBy, curso } = userData;

      // Check if user already exists
      const existingUser = await Usuario.getByEmail(email);
      if (existingUser) {
        throw new Error('User with this email already exists');
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
        null, // nombreReal
        false, // emailVerificado
        curso
      );

      // Remove password from response
      const { contraseña_hash, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  /**
   * Login a user
   * @param {string} email - User email
   * @param {string} contraseña - User password
   * @returns {Object} User data and token
   */
  static async login(email, contraseña) {
    try {
      // Find user by email
      const user = await Usuario.getByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await Usuario.verifyPassword(contraseña, user.contraseña_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          rol: user.rol,
          centro_id: user.centro_id
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Update last login
      await this.updateLastLogin(user.id);

      // Remove password from response
      const { contraseña_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   * @param {string} userId - User ID
   */
  static async updateLastLogin(userId) {
    try {
      await Usuario.updateLastLogin(userId);
    } catch (error) {
      console.error(`Error updating last login for user ${userId}:`, error);
      // Don't throw error here, just log it
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Object} Updated user
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user
      const user = await Usuario.getById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await Usuario.verifyPassword(currentPassword, user.contraseña_hash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const updatedUser = await Usuario.updatePassword(userId, newPassword);

      return updatedUser;
    } catch (error) {
      console.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  }
}

export default AuthService;
