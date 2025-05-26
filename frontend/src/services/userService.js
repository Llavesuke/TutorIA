import ApiService from './apiService';

/**
 * Service for handling user-related API calls
 */
class UserService {
  /**
   * Get all users
   * @returns {Promise} - Promise with all users
   */
  static async getAllUsers() {
    try {
      return await ApiService.get('/api/usuarios');
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - Role to filter by ('admin', 'profesor', or 'estudiante')
   * @param {string} [centerId] - Optional center ID to filter by
   * @returns {Promise} - Promise with users of the specified role
   */
  static async getUsersByRole(role, centerId = null) {
    try {
      let endpoint = `/api/usuarios/rol/${role}`;

      // If centerId is provided, add it as a query parameter
      if (centerId) {
        endpoint += `?centroId=${centerId}`;
      }

      return await ApiService.get(endpoint);
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  }

  /**
   * Get users by educational center
   * @param {string} centerId - ID of the educational center
   * @returns {Promise} - Promise with users of the specified center
   */
  static async getUsersByCenter(centerId) {
    try {
      return await ApiService.get(`/api/usuarios/centro/${centerId}`);
    } catch (error) {
      console.error(`Error fetching users for center ${centerId}:`, error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - ID of the user
   * @returns {Promise} - Promise with the user data
   */
  static async getUserById(userId) {
    try {
      return await ApiService.get(`/api/usuarios/${userId}`);
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} - Promise with the created user
   */
  static async createUser(userData) {
    try {
      return await ApiService.post('/api/usuarios', userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   * @param {string} userId - ID of the user to update
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Promise with the updated user
   */
  static async updateUser(userId, userData) {
    try {
      return await ApiService.put(`/api/usuarios/${userId}`, userData);
    } catch (error) {
      console.error(`Error updating user with ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a user
   * @param {string} userId - ID of the user to delete
   * @returns {Promise} - Promise with the result of the deletion
   */
  static async deleteUser(userId) {
    try {
      return await ApiService.delete(`/api/usuarios/${userId}`);
    } catch (error) {
      console.error(`Error deleting user with ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} - Promise with the result of the password change
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      return await ApiService.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Update user email
   * @param {string} email - New email
   * @returns {Promise} - Promise with the updated user
   */
  static async updateUserEmail(email) {
    try {
      return await ApiService.post('/api/usuarios/update-email', { email });
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }
}

export default UserService;
