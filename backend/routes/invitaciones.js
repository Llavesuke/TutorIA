/**
 * @fileoverview Rutas de invitaciones para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la gestión de invitaciones
 * para profesores y administradores, incluyendo creación, validación, uso y eliminación.
 *
 * Endpoints disponibles:
 * - GET /invitaciones/centro/:centroId - Obtener invitaciones activas por centro
 * - POST /invitaciones - Crear nueva invitación
 * - GET /invitaciones/validate/:token - Validar invitación por token
 * - PUT /invitaciones/use/:token - Marcar invitación como usada
 * - DELETE /invitaciones/:token - Eliminar invitación
 * - POST /invitaciones/resend/:token - Reenviar invitación
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
import InvitationService from '../services/invitationService.js';

const router = Router();

// Middleware to check if user is admin (placeholder - implement actual auth later)
const isAdmin = (req, res, next) => {
  // This is a placeholder. In a real app, you would check the user's role from the auth token
  // For now, we'll just pass through
  next();
};

/**
 * GET /api/invitaciones/centro/:centroId
 *
 * Obtiene todas las invitaciones activas para un centro educativo
 *
 * @description Este endpoint devuelve todas las invitaciones pendientes y activas
 * para un centro educativo específico. Solo administradores pueden acceder.
 *
 * @requires Admin - Solo administradores pueden ver invitaciones
 *
 * @param {string} req.params.centroId - ID del centro educativo
 *
 * @returns {Object[]} 200 - Lista de invitaciones activas
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "token": "abc123def456",
 *     "email": "profesor@email.com",
 *     "tipo_rol": "profesor",
 *     "centro_id": "1",
 *     "fecha_creacion": "2024-01-15T10:30:00Z",
 *     "fecha_expiracion": "2024-01-22T10:30:00Z",
 *     "usado": false
 *   }
 * ]
 */
router.get('/centro/:centroId', isAdmin, async (req, res) => {
  try {
    const invitations = await InvitationService.getActiveInvitationsByCentro(req.params.centroId);
    res.json(invitations);
  } catch (error) {
    console.error('Error in GET /invitaciones/centro/:centroId:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST create a new invitation
router.post('/', isAdmin, async (req, res) => {
  try {
    const { centroId, tipoRol, email, diasValidez } = req.body;

    if (!centroId || !tipoRol || !email) {
      return res.status(400).json({ message: 'Centro ID, role type, and email are required' });
    }

    if (tipoRol !== 'profesor' && tipoRol !== 'admin') {
      return res.status(400).json({ message: 'Role type must be "profesor" or "admin"' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const invitation = await InvitationService.createInvitation(
      centroId,
      tipoRol,
      email,
      diasValidez || 7
    );

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error in POST /invitaciones:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET validate an invitation
router.get('/validate/:token', async (req, res) => {
  try {
    const invitation = await InvitationService.validateInvitation(req.params.token);

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    res.json(invitation);
  } catch (error) {
    console.error('Error in GET /invitaciones/validate/:token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT mark an invitation as used
router.put('/use/:token', async (req, res) => {
  try {
    const invitation = await InvitationService.validateInvitation(req.params.token);

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }

    const updatedInvitation = await InvitationService.markInvitationAsUsed(req.params.token);
    res.json(updatedInvitation);
  } catch (error) {
    console.error('Error in PUT /invitaciones/use/:token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE an invitation
router.delete('/:token', isAdmin, async (req, res) => {
  try {
    const result = await InvitationService.deleteInvitation(req.params.token);
    res.json(result);
  } catch (error) {
    console.error('Error in DELETE /invitaciones/:token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST resend an invitation
router.post('/resend/:token', isAdmin, async (req, res) => {
  try {
    const invitation = await InvitationService.resendInvitation(req.params.token);
    res.json({
      message: `Invitation resent to ${invitation.email}`,
      invitation
    });
  } catch (error) {
    console.error('Error in POST /invitaciones/resend/:token:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
