/**
 * Email Templates Service
 * Professional email templates for TutorIA application
 * Includes responsive design and brand consistency
 */

class EmailTemplates {
  /**
   * Get the base email template with TutorIA branding
   * @param {string} title - Email title
   * @param {string} content - Email content HTML
   * @param {string} preheader - Email preheader text
   * @returns {string} Complete HTML email template
   */
  static getBaseTemplate(title, content, preheader = '') {
    return `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>

  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Poppins', Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->

  <style>
    /* Import Google Fonts */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

    /* Reset styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f4f4f4;
      font-family: 'Inter', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }

    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    /* Brand colors */
    .brand-orange { color: #e6531d !important; }
    .brand-green { color: #007142 !important; }
    .brand-purple { color: #34307b !important; }
    .brand-carbon { color: #171717 !important; }
    .brand-cashmere { color: #fef0d1 !important; }

    /* Typography */
    .heading {
      font-family: 'Poppins', Arial, sans-serif;
      font-weight: 600;
      line-height: 1.2;
      margin: 0;
    }

    .body-text {
      font-family: 'Inter', Arial, sans-serif;
      font-weight: 400;
      line-height: 1.6;
      margin: 0 0 16px 0;
    }

    /* Button styles */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      font-family: 'Poppins', Arial, sans-serif;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      text-align: center;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background-color: #e6531d;
      color: #ffffff !important;
    }

    .btn-secondary {
      background-color: #007142;
      color: #ffffff !important;
    }

    .btn-tertiary {
      background-color: #34307b;
      color: #ffffff !important;
    }

    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
      }

      .content {
        padding: 20px !important;
      }

      .btn {
        width: 100% !important;
        padding: 16px 20px !important;
      }

      .heading {
        font-size: 24px !important;
      }

      .mobile-hide {
        display: none !important;
      }

      .mobile-center {
        text-align: center !important;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg {
        background-color: #1a1a1a !important;
      }

      .dark-mode-text {
        color: #ffffff !important;
      }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
  <!-- Main container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Email container -->
        <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #171717 0%, #2a2a2a 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Logo TutorIA -->
                    <div style="margin-bottom: 16px;">
                      <img src="${process.env.FRONTEND_URL}/src/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" style="width: 60px; height: 60px; object-fit: contain; display: block; margin: 0 auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <!-- Fallback logo CSS -->
                      <div style="display: none; width: 60px; height: 60px; background: linear-gradient(135deg, #E6531D 0%, #ff7043 100%); border-radius: 50%; position: relative; box-shadow: 0 4px 12px rgba(230, 83, 29, 0.3); margin: 0 auto;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background-color: #FEF0D1; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                          <div style="width: 0; height: 0; border-left: 10px solid #E6531D; border-top: 7px solid transparent; border-bottom: 7px solid transparent; margin-left: 3px;"></div>
                        </div>
                      </div>
                    </div>

                    <!-- Brand name with text logo -->
                    <div style="margin-bottom: 8px;">
                      <img src="${process.env.FRONTEND_URL}/src/assets/images/text_logo.png" alt="TutorIA" style="height: 40px; object-fit: contain; display: block; margin: 0 auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                      <!-- Fallback text -->
                      <h1 style="display: none; font-family: 'Poppins', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #fef0d1; margin: 0;">TutorIA</h1>
                    </div>
                    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: rgba(254, 240, 209, 0.8); margin: 0;">Plataforma Educativa Inteligente</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e9ecef;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Social links -->
                    <div style="margin-bottom: 20px;">
                      <a href="#" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #e6531d; border-radius: 50%; text-decoration: none;">
                        <span style="display: block; width: 100%; height: 100%; line-height: 36px; color: #ffffff; font-size: 16px;">📧</span>
                      </a>
                      <a href="#" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #007142; border-radius: 50%; text-decoration: none;">
                        <span style="display: block; width: 100%; height: 100%; line-height: 36px; color: #ffffff; font-size: 16px;">🌐</span>
                      </a>
                      <a href="#" style="display: inline-block; margin: 0 8px; width: 36px; height: 36px; background-color: #34307b; border-radius: 50%; text-decoration: none;">
                        <span style="display: block; width: 100%; height: 100%; line-height: 36px; color: #ffffff; font-size: 16px;">📱</span>
                      </a>
                    </div>

                    <!-- Contact info -->
                    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #6c757d; margin: 0 0 12px 0;">
                      <strong>TutorIA</strong> - Revolucionando la educación con IA
                    </p>
                    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #6c757d; margin: 0 0 12px 0;">
                      📧 llavesukeprogram@gmail.com
                    </p>

                    <!-- Copyright -->
                    <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #adb5bd; margin: 0;">
                      &copy; ${new Date().getFullYear()} TutorIA. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  /**
   * Generate password reset email template
   * @param {string} resetUrl - Password reset URL
   * @param {string} userName - User's name
   * @returns {string} HTML email template
   */
  static getPasswordResetTemplate(resetUrl, userName) {
    const content = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <h2 class="heading" style="font-size: 28px; color: #34307b; margin: 0 0 24px 0;">
              🔐 Restablecimiento de Contraseña
            </h2>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Hola <strong>${userName}</strong>,
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en TutorIA. Si has solicitado este cambio, puedes crear una nueva contraseña haciendo clic en el botón de abajo.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
              <tr>
                <td align="center">
                  <a href="${resetUrl}" class="btn btn-primary" style="background-color: #e6531d; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Poppins', Arial, sans-serif; font-weight: 600; font-size: 16px; display: inline-block;">
                    Restablecer Contraseña
                  </a>
                </td>
              </tr>
            </table>

            <!-- Security notice -->
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #856404; margin: 0;">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad. Si no has solicitado este restablecimiento, puedes ignorar este correo de forma segura.
              </p>
            </div>

            <!-- Alternative link -->
            <p class="body-text" style="font-size: 14px; color: #6c757d;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #e6531d; word-break: break-all;">${resetUrl}</a>
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333; margin-top: 32px;">
              Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Saludos cordiales,<br>
              <strong style="color: #e6531d;">El equipo de TutorIA</strong>
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.getBaseTemplate(
      'Restablecimiento de contraseña - TutorIA',
      content,
      'Restablece tu contraseña de TutorIA de forma segura'
    );
  }

  /**
   * Generate email verification template
   * @param {string} verificationUrl - Email verification URL
   * @param {string} userName - User's name
   * @returns {string} HTML email template
   */
  static getVerificationTemplate(verificationUrl, userName) {
    const content = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <h2 class="heading" style="font-size: 28px; color: #007142; margin: 0 0 24px 0;">
              ✉️ Verificación de Correo Electrónico
            </h2>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              ¡Hola <strong>${userName}</strong>!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              ¡Bienvenido a TutorIA! Para completar la configuración de tu cuenta y acceder a todas las funcionalidades de nuestra plataforma educativa, necesitamos verificar tu dirección de correo electrónico.
            </p>

            <!-- CTA Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
              <tr>
                <td align="center">
                  <a href="${verificationUrl}" class="btn btn-secondary" style="background-color: #007142; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Poppins', Arial, sans-serif; font-weight: 600; font-size: 16px; display: inline-block;">
                    Verificar Correo Electrónico
                  </a>
                </td>
              </tr>
            </table>

            <!-- Benefits section -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; color: #007142; margin: 0 0 16px 0;">
                🎓 ¿Qué puedes hacer con TutorIA?
              </h3>
              <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #333333; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Crear tutores virtuales personalizados con IA</li>
                <li style="margin-bottom: 8px;">Subir documentos y generar contenido educativo</li>
                <li style="margin-bottom: 8px;">Gestionar estudiantes y seguir su progreso</li>
                <li style="margin-bottom: 8px;">Acceder a herramientas de evaluación avanzadas</li>
              </ul>
            </div>

            <!-- Alternative link -->
            <p class="body-text" style="font-size: 14px; color: #6c757d;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${verificationUrl}" style="color: #007142; word-break: break-all;">${verificationUrl}</a>
            </p>

            <p class="body-text" style="font-size: 14px; color: #6c757d;">
              Si no has creado una cuenta en TutorIA, puedes ignorar este correo de forma segura.
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333; margin-top: 32px;">
              ¡Estamos emocionados de tenerte en nuestra comunidad educativa!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Saludos cordiales,<br>
              <strong style="color: #007142;">El equipo de TutorIA</strong>
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.getBaseTemplate(
      'Verificación de correo electrónico - TutorIA',
      content,
      'Verifica tu correo y comienza a usar TutorIA'
    );
  }

  /**
   * Generate professor invitation template
   * @param {string} registrationUrl - Registration completion URL
   * @param {string} centroNombre - Educational center name
   * @returns {string} HTML email template
   */
  static getInvitationTemplate(registrationUrl, centroNombre) {
    const content = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <h2 class="heading" style="font-size: 28px; color: #34307b; margin: 0 0 24px 0;">
              🎓 Invitación para unirse como Profesor
            </h2>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              ¡Saludos!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Has sido invitado a unirte a <strong style="color: #34307b;">${centroNombre || 'un centro educativo'}</strong> como profesor en la plataforma TutorIA, la revolucionaria herramienta educativa impulsada por inteligencia artificial.
            </p>

            <!-- Institution highlight -->
            <div style="background: linear-gradient(135deg, #34307b 0%, #4a3f8a 100%); border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 20px; color: #ffffff; margin: 0 0 12px 0;">
                🏫 ${centroNombre || 'Centro Educativo'}
              </h3>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0;">
                Te está invitando a formar parte de la revolución educativa
              </p>
            </div>

            <!-- CTA Button -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
              <tr>
                <td align="center">
                  <a href="${registrationUrl}" class="btn btn-tertiary" style="background-color: #34307b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Poppins', Arial, sans-serif; font-weight: 600; font-size: 16px; display: inline-block;">
                    Completar Registro
                  </a>
                </td>
              </tr>
            </table>

            <!-- Features section -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; color: #34307b; margin: 0 0 16px 0;">
                🚀 Como profesor en TutorIA podrás:
              </h3>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #333333; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Crear tutores virtuales personalizados</li>
                      <li style="margin-bottom: 8px;">Gestionar estudiantes eficientemente</li>
                      <li style="margin-bottom: 8px;">Generar contenido educativo con IA</li>
                    </ul>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #333333; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Evaluar progreso en tiempo real</li>
                      <li style="margin-bottom: 8px;">Colaborar con otros profesores</li>
                      <li style="margin-bottom: 8px;">Acceder a analytics avanzados</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Expiration notice -->
            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #1565c0; margin: 0;">
                <strong>⏰ Nota importante:</strong> Esta invitación expirará en 7 días. Te recomendamos completar tu registro lo antes posible para no perder esta oportunidad.
              </p>
            </div>

            <!-- Alternative link -->
            <p class="body-text" style="font-size: 14px; color: #6c757d;">
              Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
              <a href="${registrationUrl}" style="color: #34307b; word-break: break-all;">${registrationUrl}</a>
            </p>

            <p class="body-text" style="font-size: 14px; color: #6c757d;">
              Si no has solicitado esta invitación o no deseas unirte, puedes ignorar este correo de forma segura.
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333; margin-top: 32px;">
              ¡Esperamos verte pronto en TutorIA!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Saludos cordiales,<br>
              <strong style="color: #34307b;">El equipo de TutorIA</strong>
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.getBaseTemplate(
      'Invitación para unirte como Profesor en TutorIA',
      content,
      'Has sido invitado a revolucionar la educación con TutorIA'
    );
  }

  /**
   * Generate welcome email template
   * @param {string} userName - User's name
   * @param {string} userRole - User's role (profesor, estudiante, admin)
   * @returns {string} HTML email template
   */
  static getWelcomeTemplate(userName, userRole) {
    const roleInfo = {
      profesor: {
        title: '¡Bienvenido, Profesor!',
        icon: '👨‍🏫',
        color: '#34307b',
        features: [
          'Crear tutores virtuales personalizados',
          'Gestionar estudiantes y cursos',
          'Generar contenido educativo con IA',
          'Evaluar progreso en tiempo real'
        ]
      },
      estudiante: {
        title: '¡Bienvenido, Estudiante!',
        icon: '🎓',
        color: '#007142',
        features: [
          'Interactuar con tutores virtuales',
          'Acceder a contenido personalizado',
          'Seguir tu progreso de aprendizaje',
          'Participar en actividades interactivas'
        ]
      },
      admin: {
        title: '¡Bienvenido, Administrador!',
        icon: '⚙️',
        color: '#e6531d',
        features: [
          'Gestionar centros educativos',
          'Administrar usuarios y permisos',
          'Supervisar actividad de la plataforma',
          'Configurar ajustes del sistema'
        ]
      }
    };

    const role = roleInfo[userRole] || roleInfo.estudiante;

    const content = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <h2 class="heading" style="font-size: 28px; color: ${role.color}; margin: 0 0 24px 0; text-align: center;">
              ${role.icon} ${role.title}
            </h2>

            <p class="body-text" style="font-size: 18px; color: #333333; text-align: center; margin-bottom: 32px;">
              ¡Hola <strong>${userName}</strong>!
            </p>

            <div style="background: linear-gradient(135deg, ${role.color} 0%, ${role.color}dd 100%); border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 24px; color: #ffffff; margin: 0 0 16px 0;">
                🎉 ¡Bienvenido a TutorIA!
              </h3>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: rgba(255, 255, 255, 0.9); margin: 0;">
                Tu aventura educativa con inteligencia artificial comienza ahora
              </p>
            </div>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Estamos emocionados de tenerte en nuestra comunidad educativa. TutorIA es una plataforma revolucionaria que utiliza inteligencia artificial para transformar la manera en que enseñamos y aprendemos.
            </p>

            <!-- Features section -->
            <div style="background-color: #f8f9fa; border-radius: 12px; padding: 32px; margin: 32px 0;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 20px; color: ${role.color}; margin: 0 0 20px 0; text-align: center;">
                🚀 ¿Qué puedes hacer en TutorIA?
              </h3>
              <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #333333; margin: 0; padding-left: 0; list-style: none;">
                ${role.features.map(feature => `
                  <li style="margin-bottom: 12px; padding-left: 24px; position: relative;">
                    <span style="position: absolute; left: 0; top: 0; color: ${role.color}; font-weight: bold;">✓</span>
                    ${feature}
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- CTA Section -->
            <div style="text-align: center; margin: 40px 0;">
              <h3 style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; color: #333333; margin: 0 0 20px 0;">
                ¿Listo para comenzar?
              </h3>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td>
                    <a href="${process.env.FRONTEND_URL}/login" style="background-color: ${role.color}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: 'Poppins', Arial, sans-serif; font-weight: 600; font-size: 16px; display: inline-block;">
                      Acceder a TutorIA
                    </a>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Tips section -->
            <div style="background-color: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px; padding: 24px; margin: 32px 0;">
              <h4 style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; color: #1565c0; margin: 0 0 12px 0;">
                💡 Consejos para empezar:
              </h4>
              <ul style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; color: #1565c0; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Completa tu perfil para una experiencia personalizada</li>
                <li style="margin-bottom: 8px;">Explora las diferentes funcionalidades disponibles</li>
                <li style="margin-bottom: 8px;">No dudes en contactar soporte si necesitas ayuda</li>
              </ul>
            </div>

            <p class="body-text" style="font-size: 16px; color: #333333; margin-top: 32px;">
              Si tienes alguna pregunta o necesitas ayuda para comenzar, nuestro equipo de soporte está aquí para asistirte. ¡No dudes en contactarnos!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              ¡Esperamos verte pronto explorando todo lo que TutorIA tiene para ofrecer!
            </p>

            <p class="body-text" style="font-size: 16px; color: #333333;">
              Saludos cordiales,<br>
              <strong style="color: ${role.color};">El equipo de TutorIA</strong>
            </p>
          </td>
        </tr>
      </table>
    `;

    return this.getBaseTemplate(
      '¡Bienvenido a TutorIA! - Tu aventura educativa comienza aquí',
      content,
      'Descubre el futuro de la educación con inteligencia artificial'
    );
  }
}

export default EmailTemplates;
