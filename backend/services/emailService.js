import nodemailer from 'nodemailer';
import supabase from '../config/supabase.js';
import 'dotenv/config';
import EmailTemplates from './emailTemplates.js';

class EmailService {
  /**
   * Obtener el transportador de correo configurado
   * @returns {Object} Transportador de nodemailer
   */
  static getTransporter() {
    // Configuración para el servicio de correo
    // Nota: En producción, deberías usar un servicio SMTP real

    // Log email credentials (without showing full password)
    console.log('Email configuration:');
    console.log('- User:', process.env.EMAIL_USER);
    console.log('- Password length:', process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 0);

    // Configuración SMTP directa para Gmail
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER || 'tu-correo@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'tu-contraseña'
      },
      debug: true, // Enable debug output
      logger: true // Log information about the mail
    });
  }

  /**
   * Enviar correo de restablecimiento de contraseña
   * @param {string} email - Correo electrónico del destinatario
   * @param {Object} data - Datos adicionales para el restablecimiento
   * @param {string} data.resetUrl - URL de restablecimiento
   * @param {string} data.userName - Nombre del usuario
   * @returns {Promise<Object>} Resultado del envío
   */
  static async sendPasswordResetEmail(email, data) {
    try {
      console.log('Sending password reset email to:', email);

      // Obtener el transportador
      const transporter = this.getTransporter();

      // Plantilla HTML del correo de restablecimiento usando el nuevo sistema
      const htmlTemplate = EmailTemplates.getPasswordResetTemplate(data.resetUrl, data.userName);

      // Configuración del correo
      const mailOptions = {
        from: `"TutorIA" <llavesukeprogram@gmail.com>`,
        to: email,
        subject: 'Restablecimiento de contraseña - TutorIA',
        html: htmlTemplate,
        // Versión de texto plano como alternativa
        text: `Hola ${data.userName}, para restablecer tu contraseña en TutorIA, visita: ${data.resetUrl}`
      };

      console.log('Sending password reset email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Enviar correo de verificación de email
   * @param {string} email - Correo electrónico del destinatario
   * @param {Object} data - Datos adicionales para la verificación
   * @param {string} data.verificationUrl - URL de verificación
   * @param {string} data.userName - Nombre del usuario
   * @returns {Promise<Object>} Resultado del envío
   */
  static async sendVerificationEmail(email, data) {
    try {
      console.log('Sending verification email to:', email);

      // Obtener el transportador
      const transporter = this.getTransporter();

      // Plantilla HTML del correo de verificación usando el nuevo sistema
      const htmlTemplate = EmailTemplates.getVerificationTemplate(data.verificationUrl, data.userName);

      // Configuración del correo
      const mailOptions = {
        from: `"TutorIA" <llavesukeprogram@gmail.com>`,
        to: email,
        subject: 'Verificación de correo electrónico - TutorIA',
        html: htmlTemplate,
        // Versión de texto plano como alternativa
        text: `Hola ${data.userName}, para verificar tu correo electrónico en TutorIA, visita: ${data.verificationUrl}`
      };

      console.log('Sending verification email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  /**
   * Enviar una invitación por correo electrónico
   * @param {string} email - Correo electrónico del destinatario
   * @param {Object} data - Datos adicionales para la invitación
   * @param {string} data.token - Token de invitación
   * @param {string} data.centroId - ID del centro educativo
   * @param {string} data.centroNombre - Nombre del centro educativo
   * @param {string} data.tipoRol - Tipo de rol ('profesor' o 'admin')
   * @returns {Promise<Object>} Resultado del envío
   */
  static async sendInvitation(email, data) {
    try {
      // Use our custom email system directly for all professor invitations
      console.log('Using custom email system to send invitation email to:', email);

      const transporter = this.getTransporter();

      // URL de registro con el token
      const registrationUrl = `${process.env.FRONTEND_URL}/register-professor/${data.token}`;
      console.log('Registration URL:', registrationUrl);

      // Plantilla HTML del correo usando el nuevo sistema
      const htmlTemplate = EmailTemplates.getInvitationTemplate(registrationUrl, data.centroNombre);

      // Configuración del correo
      const mailOptions = {
        from: `"TutorIA" <llavesukeprogram@gmail.com>`,
        to: email,
        subject: 'Invitación para unirte como Profesor en TutorIA',
        html: htmlTemplate,
        // Versión de texto plano como alternativa
        text: `Has sido invitado a unirte como profesor en TutorIA. Para completar tu registro, visita: ${registrationUrl}`
      };

      console.log('Sending invitation email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);
      console.log('Invitation email sent successfully:', info.messageId);

      return { success: true, method: 'custom-email', messageId: info.messageId };
    } catch (error) {
      console.error('Error sending invitation email:', error);

      // Check if it's an authentication error
      if (error.code === 'EAUTH') {
        console.error('Authentication failed. Please check your Gmail credentials and make sure:');
        console.error('1. You\'re using an App Password if 2FA is enabled');
        console.error('2. The App Password is correctly formatted (16 characters without spaces)');
        console.error('3. "Less secure app access" is enabled if not using an App Password');
      }

      throw error;
    }
  }

  /**
   * Reenviar una invitación por correo electrónico
   * @param {string} email - Correo electrónico del destinatario
   * @param {Object} data - Datos adicionales para la invitación
   * @returns {Promise<Object>} Resultado del envío
   */
  static async resendInvitation(email, data) {
    return this.sendInvitation(email, data);
  }

  /**
   * Enviar correo de bienvenida
   * @param {string} email - Correo electrónico del destinatario
   * @param {Object} data - Datos adicionales para el correo de bienvenida
   * @param {string} data.userName - Nombre del usuario
   * @param {string} data.userRole - Rol del usuario
   * @returns {Promise<Object>} Resultado del envío
   */
  static async sendWelcomeEmail(email, data) {
    try {
      console.log('Sending welcome email to:', email);

      // Obtener el transportador
      const transporter = this.getTransporter();

      // Plantilla HTML del correo de bienvenida usando el nuevo sistema
      const htmlTemplate = EmailTemplates.getWelcomeTemplate(data.userName, data.userRole);

      // Configuración del correo
      const mailOptions = {
        from: `"TutorIA" <llavesukeprogram@gmail.com>`,
        to: email,
        subject: '¡Bienvenido a TutorIA! - Tu aventura educativa comienza aquí',
        html: htmlTemplate,
        // Versión de texto plano como alternativa
        text: `¡Bienvenido a TutorIA, ${data.userName}! Estamos emocionados de tenerte en nuestra plataforma educativa.`
      };

      console.log('Sending welcome email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });

      // Enviar el correo
      const info = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', info.messageId);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Verificar email usando nuestro sistema personalizado
   * @param {string} email - Email a verificar
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la verificación
   */
  static async verifyEmail(email, userId) {
    try {
      console.log('Verifying email using custom system:', email, 'for user:', userId);

      // Import Usuario model
      const Usuario = (await import('../models/usuario.js')).default;

      // Update user's email verification status
      const result = await Usuario.updateEmailVerificationStatus(userId, true);

      if (result) {
        console.log('Email verification successful for user:', userId);
        return { success: true, message: 'Email verified successfully' };
      } else {
        throw new Error('Failed to update email verification status');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }
}

export default EmailService;
