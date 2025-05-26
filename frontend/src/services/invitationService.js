import ApiService from './apiService';

/**
 * Service for handling invitations
 */
class InvitationService {
  /**
   * Create a new invitation
   * @param {Object} data - Invitation data
   * @param {string} data.centroId - ID of the educational center
   * @param {string} data.tipoRol - Role type ('profesor' or 'admin')
   * @param {string} data.email - Email to send the invitation to
   * @param {number} [data.diasValidez=7] - Number of days the invitation is valid
   * @returns {Promise} - Promise with the invitation result
   */
  static async createInvitation(data) {
    try {
      const { centroId, tipoRol, email, diasValidez = 7 } = data;

      // Validate required fields
      if (!centroId || !tipoRol || !email) {
        throw new Error('Centro ID, role type, and email are required');
      }

      // Validate role type
      if (tipoRol !== 'profesor' && tipoRol !== 'admin') {
        throw new Error('Role type must be "profesor" or "admin"');
      }

      // Create invitation via API
      const result = await ApiService.post('/api/invitaciones', {
        centroId,
        tipoRol,
        diasValidez,
        email // This will be used by the backend to send the email
      });

      return result;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Get all active invitations for a center
   * @param {string} centroId - ID of the educational center
   * @returns {Promise} - Promise with the list of invitations
   */
  static async getActiveInvitations(centroId) {
    try {
      if (!centroId) {
        throw new Error('Centro ID is required');
      }

      const result = await ApiService.get(`/api/invitaciones/centro/${centroId}`);
      return result;
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  }

  /**
   * Delete an invitation
   * @param {string} token - Token of the invitation to delete
   * @returns {Promise} - Promise with the deletion result
   */
  static async deleteInvitation(token) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const result = await ApiService.delete(`/api/invitaciones/${token}`);
      return result;
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  }

  /**
   * Validate an invitation token
   * @param {string} token - Token to validate
   * @returns {Promise} - Promise with the validation result
   */
  static async validateInvitation(token) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const result = await ApiService.get(`/api/invitaciones/validate/${token}`);
      return result;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw error;
    }
  }

  /**
   * Mark an invitation as used
   * @param {string} token - Token of the invitation to mark as used
   * @returns {Promise} - Promise with the result
   */
  static async markInvitationAsUsed(token) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const result = await ApiService.put(`/api/invitaciones/use/${token}`);
      return result;
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw error;
    }
  }

  /**
   * Resend an invitation
   * @param {string} token - Token of the invitation to resend
   * @returns {Promise} - Promise with the resend result
   */
  static async resendInvitation(token) {
    try {
      if (!token) {
        throw new Error('Invitation token is required');
      }

      const result = await ApiService.post(`/api/invitaciones/resend/${token}`);
      return result;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Get the registration URL for an invitation
   * @param {string} token - Invitation token
   * @returns {string} - Registration URL
   */
  static getRegistrationUrl(token) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register-professor/${token}`;
  }
}

export default InvitationService;
