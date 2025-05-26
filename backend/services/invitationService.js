import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import EmailService from './emailService.js';

class InvitationService {
  /**
   * Create a new invitation for a specific role in an educational center
   * @param {string} centroId - UUID of the educational center
   * @param {string} tipoRol - Role type ('profesor' or 'admin')
   * @param {string} email - Email to send the invitation to
   * @param {number} diasValidez - Number of days the invitation is valid
   * @returns {Object} The created invitation
   */
  static async createInvitation(centroId, tipoRol, email, diasValidez = 7) {
    try {
      // Validar parámetros
      if (!centroId || !tipoRol || !email) {
        throw new Error('Centro ID, role type, and email are required');
      }

      // Validar tipo de rol
      if (tipoRol !== 'profesor' && tipoRol !== 'admin') {
        throw new Error('Role type must be "profesor" or "admin"');
      }

      // Calcular fecha de expiración
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + diasValidez);

      // Obtener el nombre del centro educativo
      const centroResult = await db.query(
        'SELECT nombre FROM centros_educativos WHERE id = $1',
        [centroId]
      );

      const centroNombre = centroResult.rows[0]?.nombre || 'Centro Educativo';

      // Crear la invitación en la base de datos
      const result = await db.query(
        'INSERT INTO tabla_invitaciones (centro_id, tipo_rol, fecha_expiracion, email) VALUES ($1, $2, $3, $4) RETURNING *',
        [centroId, tipoRol, fechaExpiracion, email]
      );

      const invitation = result.rows[0];

      // Enviar el correo de invitación
      await EmailService.sendInvitation(email, {
        token: invitation.token,
        centroId: centroId,
        centroNombre: centroNombre,
        tipoRol: tipoRol
      });

      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Validate an invitation token
   * @param {string} token - UUID token of the invitation
   * @returns {Object|null} The invitation if valid, null otherwise
   */
  static async validateInvitation(token) {
    try {
      const result = await db.query(
        'SELECT * FROM tabla_invitaciones WHERE token = $1 AND usado = false AND fecha_expiracion > NOW()',
        [token]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw error;
    }
  }

  /**
   * Mark an invitation as used
   * @param {string} token - UUID token of the invitation
   * @returns {Object} The updated invitation
   */
  static async markInvitationAsUsed(token) {
    try {
      const result = await db.query(
        'UPDATE tabla_invitaciones SET usado = true WHERE token = $1 RETURNING *',
        [token]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      throw error;
    }
  }

  /**
   * Get all active invitations for a center
   * @param {string} centroId - UUID of the educational center
   * @returns {Array} List of active invitations
   */
  static async getActiveInvitationsByCentro(centroId) {
    try {
      const result = await db.query(
        'SELECT * FROM tabla_invitaciones WHERE centro_id = $1 AND usado = false AND fecha_expiracion > NOW() ORDER BY fecha_expiracion',
        [centroId]
      );

      return result.rows;
    } catch (error) {
      console.error(`Error getting active invitations for centro ID ${centroId}:`, error);
      throw error;
    }
  }

  /**
   * Resend an invitation email
   * @param {string} token - UUID token of the invitation
   * @returns {Object} The updated invitation
   */
  static async resendInvitation(token) {
    try {
      // Verificar que la invitación existe y es válida
      const invitation = await this.validateInvitation(token);

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Obtener el nombre del centro educativo
      const centroResult = await db.query(
        'SELECT nombre FROM centros_educativos WHERE id = $1',
        [invitation.centro_id]
      );

      const centroNombre = centroResult.rows[0]?.nombre || 'Centro Educativo';

      // Reenviar el correo
      await EmailService.resendInvitation(invitation.email, {
        token: invitation.token,
        centroId: invitation.centro_id,
        centroNombre: centroNombre,
        tipoRol: invitation.tipo_rol
      });

      return invitation;
    } catch (error) {
      console.error(`Error resending invitation with token ${token}:`, error);
      throw error;
    }
  }

  /**
   * Delete an invitation
   * @param {string} token - UUID token of the invitation
   * @returns {Object} Message indicating success
   */
  static async deleteInvitation(token) {
    try {
      await db.query('DELETE FROM tabla_invitaciones WHERE token = $1', [token]);
      return { message: `Invitation with token ${token} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting invitation with token ${token}:`, error);
      throw error;
    }
  }
}

export default InvitationService;
