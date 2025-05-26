import supabase from '../config/supabase.js';
import Usuario from '../models/usuario.js';

class SupabaseAuthService {
  /**
   * Registrar un nuevo usuario utilizando Supabase Auth
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.email - Email
   * @param {string} userData.password - Contraseña
   * @param {string} userData.centroId - ID del centro educativo
   * @param {string} userData.rol - Rol (admin, profesor, estudiante)
   * @param {string} userData.nombreUsuario - Nombre de usuario
   * @param {string} userData.fotoPerfil - URL de la foto de perfil (opcional)
   * @param {string} userData.createdBy - ID del usuario que creó este usuario (opcional)
   * @param {string} userData.curso - Curso del estudiante (ej: "1º ESO", "2º ESO") (requerido para estudiantes)
   * @param {string} userData.clase - Clase del estudiante (ej: "A", "B", "C") (opcional)
   * @returns {Object} El usuario creado y la sesión
   */
  static async register(userData) {
    try {
      const { email, password, centroId, rol, nombreUsuario, fotoPerfil, createdBy, curso, clase } = userData;

      console.log('Starting registration process for:', nombreUsuario);

      // Validate required fields based on role
      if (!centroId || !rol || !nombreUsuario || !password) {
        throw new Error('Missing required fields for registration');
      }

      // Email is required for professors and admins
      if ((rol === 'profesor' || rol === 'admin') && !email) {
        throw new Error('Email is required for professors and admins');
      }

      // For students, email is optional
      console.log(`Registering ${rol} with${email ? '' : 'out'} email`);
      if (rol === 'estudiante' && !email) {
        console.log('Email is not required for students, continuing with registration');
      }

      // Curso is required for students
      if (rol === 'estudiante' && !curso) {
        throw new Error('Curso is required for students');
      }

      // Check if username already exists
      const existingUserByUsername = await Usuario.getByUsername(nombreUsuario);
      if (existingUserByUsername) {
        console.log('User already exists with username:', nombreUsuario);
        throw new Error('Username already exists');
      }

      // If email is provided, check if it already exists
      if (email) {
        // Check if user already exists in our custom table
        const existingUser = await Usuario.getByEmail(email);
        if (existingUser) {
          console.log('User already exists with email:', email);
          throw new Error('Email already exists');
        }
      }

      let authData = null;
      let emailVerificado = false;

      // Skip Supabase Auth for center registration and professor invitations
      // Use custom email system instead
      if (email && (rol === 'admin' || rol === 'profesor')) {
        console.log('Skipping Supabase Auth for center/professor registration - using custom email system');
        // Set email as not verified initially - will be verified through our custom email flow
        emailVerificado = false;
      } else if (email && rol === 'estudiante') {
        console.log('Registering student in Supabase Auth');
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                centro_id: centroId,
                rol,
                nombre_usuario: nombreUsuario,
                nombre_real: userData.nombreReal || nombreUsuario
              },
              emailRedirectTo: `${process.env.FRONTEND_URL}/login`
            }
          });

          if (error) {
            console.error('Supabase Auth registration error:', error);
            throw error;
          }

          console.log('Supabase Auth registration successful');
          authData = data;
        } catch (authError) {
          console.error('Error during Supabase Auth registration:', authError);
          console.warn('Continuing with student registration despite Supabase Auth error');
        }
      } else {
        console.log('Skipping Supabase Auth registration as no email was provided');
      }

      // Crear el usuario en nuestra tabla personalizada
      console.log('Creating user in custom table');

      // Ensure nombreReal is never null or undefined
      let nombreReal = userData.nombreReal || userData.adminFullName || nombreUsuario;

      // Extra validation
      if (!nombreReal) {
        nombreReal = nombreUsuario || (email ? email.split('@')[0] : '');
        console.log('Fallback for nombre_real:', nombreReal);
      }

      if (!nombreReal) {
        throw new Error('Cannot determine a valid nombre_real value');
      }

      console.log('Using nombre_real:', nombreReal, 'Type:', typeof nombreReal);

      // Log all userData for debugging
      console.log('Full userData:', {
        ...userData,
        password: '***REDACTED***',
        nombreReal,
        adminFullName: userData.adminFullName,
        nombreUsuario,
        emailVerificado
      });

      const usuario = await Usuario.create(
        centroId,
        rol,
        nombreUsuario,
        email,
        password, // La contraseña será hasheada en el modelo
        fotoPerfil,
        createdBy,
        nombreReal, // Pass the nombre_real parameter
        emailVerificado, // Pass the email_verificado parameter
        curso, // Pass the curso parameter
        clase // Pass the clase parameter
      );

      console.log('User created successfully in custom table');

      // Send verification email for admins and professors using our custom email system
      if (email && (rol === 'admin' || rol === 'profesor')) {
        try {
          console.log('Sending verification email using custom email system');
          const EmailService = (await import('./emailService.js')).default;

          // Generate verification URL that goes to the token verification page
          const verificationUrl = `${process.env.FRONTEND_URL}/verify-email-direct?email=${encodeURIComponent(email)}&userId=${usuario.id}`;

          await EmailService.sendVerificationEmail(email, {
            verificationUrl,
            userName: userData.nombreReal || nombreUsuario
          });

          console.log('Verification email sent successfully');
        } catch (emailError) {
          console.error('Error sending verification email:', emailError);
          // Don't fail the registration if email sending fails
        }
      }

      return {
        user: usuario,
        session: authData?.session || null
      };
    } catch (error) {
      console.error('Error en el registro:', error);
      // Add more context to the error
      if (error.message.includes('duplicate key') ||
          error.message.includes('already exists') ||
          error.message.includes('already registered')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Iniciar sesión utilizando credenciales
   * @param {string} identifier - Email o nombre de usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Object} Datos del usuario y la sesión
   */
  static async login(identifier, password) {
    try {
      console.log('Attempting login with identifier:', identifier);

      // Determinar si el identificador es un email o un nombre de usuario
      const isEmail = identifier.includes('@');
      console.log('Identifier type:', isEmail ? 'email' : 'username');

      let usuario;
      let authData = null;
      let isEmailVerified = false;

      // Si es un email, intentar iniciar sesión con Supabase Auth
      if (isEmail) {
        try {
          console.log('Attempting Supabase Auth login with email');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: identifier,
            password
          });

          if (error) {
            console.error('Supabase Auth login error:', error);
            // No lanzar error aquí, intentaremos con la tabla personalizada
          } else {
            console.log('Supabase Auth login successful');
            authData = data;

            // Verificar si el correo electrónico está confirmado en Supabase Auth
            isEmailVerified = !!authData.user?.email_confirmed_at;
            console.log('Email verification status from Supabase Auth:', isEmailVerified);
            console.log('Email confirmation timestamp:', authData.user?.email_confirmed_at);
          }
        } catch (authError) {
          console.error('Error during Supabase Auth login:', authError);
          // Continuar con la autenticación personalizada
        }

        // Obtener el usuario de nuestra tabla personalizada por email
        usuario = await Usuario.getByEmail(identifier);
      } else {
        // Si es un nombre de usuario, obtener el usuario de nuestra tabla personalizada
        usuario = await Usuario.getByUsername(identifier);
      }

      // Verificar si el usuario existe
      if (!usuario) {
        console.error('User not found in custom table:', identifier);
        throw new Error('Usuario no encontrado');
      }

      console.log('User found in custom table:', usuario.id);

      // Verificar la contraseña si no se autenticó con Supabase Auth
      if (!authData) {
        const isPasswordValid = await Usuario.verifyPassword(password, usuario.contraseña_hash);
        if (!isPasswordValid) {
          console.error('Invalid password for user:', usuario.id);
          throw new Error('Contraseña incorrecta');
        }
        console.log('Password verified successfully');
      }

      // Si el usuario tiene email, actualizar el estado de verificación en nuestra tabla
      if (usuario.email && isEmailVerified) {
        try {
          await Usuario.updateEmailVerificationStatus(usuario.id, true);
          console.log('Email verification status updated in custom table');
          usuario.email_verificado = true;
        } catch (updateError) {
          console.error('Error updating email verification status:', updateError);
          // No interrumpir el flujo de login por este error
        }
      }

      // Actualizar último acceso
      await Usuario.updateLastLogin(usuario.id);
      console.log('Last login timestamp updated');

      // Eliminar la contraseña hash de la respuesta
      const { contraseña_hash, ...usuarioSinContraseña } = usuario;

      return {
        user: usuarioSinContraseña,
        session: authData?.session || null,
        isEmailVerified: usuario.email_verificado || isEmailVerified // Usar el estado de verificación de nuestra tabla o de Supabase Auth
      };
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   * @returns {Object} Resultado de cerrar sesión
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Restablecer contraseña
   * @param {string} email - Email del usuario
   * @returns {Object} Resultado de la solicitud
   */
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      throw error;
    }
  }

  /**
   * Actualizar contraseña
   * @param {string} newPassword - Nueva contraseña
   * @returns {Object} Resultado de la actualización
   */
  static async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario actual
   * @returns {Object} Usuario actual
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return null;

      // Obtener el usuario de nuestra tabla personalizada
      const usuario = await Usuario.getByEmail(user.email);

      return usuario;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por email desde Supabase Auth
   * @param {string} email - Email del usuario
   * @returns {Object} Datos del usuario de Supabase Auth
   */
  static async getUserByEmail(email) {
    try {
      console.log('Getting user by email from Supabase Auth:', email);

      // Buscar usuario por email en Supabase Auth
      const { data, error } = await supabase.auth.admin.getUserByEmail(email);

      if (error) {
        console.error('Error getting user by email from Supabase Auth:', error);
        throw error;
      }

      if (!data || !data.user) {
        console.log('User not found in Supabase Auth by email:', email);
        return null;
      }

      console.log('User found in Supabase Auth by email:', email);
      console.log('Email verification status:', !!data.user.email_confirmed_at);

      return data.user;
    } catch (error) {
      console.error('Error al obtener usuario por email desde Supabase Auth:', error);
      throw error;
    }
  }
}

export default SupabaseAuthService;
