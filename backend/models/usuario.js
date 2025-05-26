import db from '../config/db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

class Usuario {
  // Get all usuarios
  static async getAll() {
    try {
      const result = await db.query('SELECT * FROM usuarios ORDER BY nombre_usuario');
      return result.rows;
    } catch (error) {
      console.error('Error fetching usuarios:', error);
      throw error;
    }
  }

  // Get usuarios by centro_id
  static async getByCentroId(centroId) {
    try {
      const result = await db.query(
        'SELECT * FROM usuarios WHERE centro_id = $1 ORDER BY nombre_usuario',
        [centroId]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching usuarios for centro ID ${centroId}:`, error);
      throw error;
    }
  }

  // Get usuarios by rol
  static async getByRol(rol) {
    try {
      const result = await db.query(
        'SELECT * FROM usuarios WHERE rol = $1 ORDER BY nombre_usuario',
        [rol]
      );
      return result.rows;
    } catch (error) {
      console.error(`Error fetching usuarios with rol ${rol}:`, error);
      throw error;
    }
  }

  // Get usuario by ID
  static async getById(id) {
    try {
      const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Get usuario by email
  static async getByEmail(email) {
    try {
      const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching usuario with email ${email}:`, error);
      throw error;
    }
  }

  // Get usuario by username
  static async getByUsername(nombreUsuario) {
    try {
      const result = await db.query('SELECT * FROM usuarios WHERE nombre_usuario = $1', [nombreUsuario]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error fetching usuario with username ${nombreUsuario}:`, error);
      throw error;
    }
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Create new usuario with password hashing
  static async create(centroId, rol, nombreUsuario, email, contraseña, fotoPerfil = null, createdBy = null, nombreReal = null, emailVerificado = false, curso = null, clase = null) {
    try {
      // Force nombreUsuario as nombreReal if not provided or if it's null/undefined
      const realName = nombreReal || nombreUsuario;

      // Extra validation to ensure nombreReal is never null
      if (!realName) {
        throw new Error('nombre_real cannot be null. nombreUsuario and nombreReal are both null or undefined.');
      }

      // Validate role-specific requirements
      if (rol === 'profesor' || rol === 'admin') {
        // Email is required for professors and admins
        if (!email) {
          throw new Error('Email is required for professors and admins');
        }
      }

      // Validate that students have a curso
      if (rol === 'estudiante' && !curso) {
        throw new Error('Curso is required for students');
      }

      console.log('Creating user with data:', {
        centroId,
        rol,
        nombreUsuario,
        email: email || 'N/A',
        nombreReal: realName,
        nombreRealType: typeof realName,
        hasPassword: !!contraseña,
        hasFotoPerfil: !!fotoPerfil,
        hasCreatedBy: !!createdBy,
        emailVerificado,
        curso: curso || 'N/A'
      });

      // Force realName to be a string and provide a default if it's empty
      // Make sure we always have a value for nombre_real
      const realNameStr = realName ? String(realName) : nombreUsuario || (email ? email.split('@')[0] : '') || 'User';

      // Use a SQL query that includes the email_verificado, curso and clase fields
      const sql = 'INSERT INTO usuarios (centro_id, rol, nombre_usuario, nombre_real, email, contraseña_hash, foto_perfil, created_by, email_verificado, curso, clase) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *';
      console.log('SQL Query:', sql);

      const contraseñaHash = await this.hashPassword(contraseña);

      // Log all parameters being passed to the query
      console.log('Query parameters:', [
        centroId,
        rol,
        nombreUsuario,
        realNameStr,
        email || null, // Allow null for email
        'HASHED_PASSWORD', // Don't log the actual hash
        fotoPerfil,
        createdBy,
        emailVerificado,
        curso, // Add curso parameter
        clase  // Add clase parameter
      ]);

      // Double check that we have a value for nombreUsuario at least
      if (!nombreUsuario) {
        throw new Error('nombre_usuario cannot be null or empty');
      }

      console.log('Final nombre_real value being used:', realNameStr);

      const result = await db.query(
        sql,
        [centroId, rol, nombreUsuario, realNameStr, email || null, contraseñaHash, fotoPerfil, createdBy, emailVerificado, curso, clase]
      );

      console.log('User created successfully with ID:', result.rows[0]?.id);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating usuario:', error);
      throw error;
    }
  }

  // Update usuario
  static async update(id, nombreUsuario, email, fotoPerfil, curso = null, clase = null) {
    try {
      // First, check if the user exists and get their role
      const userCheck = await db.query('SELECT rol FROM usuarios WHERE id = $1', [id]);

      if (userCheck.rows.length === 0) {
        throw new Error(`User with ID ${id} not found`);
      }

      const userRole = userCheck.rows[0].rol;

      // Validate that students have a curso
      if (userRole === 'estudiante' && curso === null) {
        // If updating a student, curso is required
        throw new Error('Curso is required for students');
      }

      // If not a student, curso and clase should be null
      const cursoValue = userRole === 'estudiante' ? curso : null;
      const claseValue = userRole === 'estudiante' ? clase : null;

      const result = await db.query(
        'UPDATE usuarios SET nombre_usuario = $1, email = $2, foto_perfil = $3, curso = $4, clase = $5 WHERE id = $6 RETURNING *',
        [nombreUsuario, email, fotoPerfil, cursoValue, claseValue, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete usuario
  static async delete(id) {
    try {
      await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
      return { message: `Usuario with ID ${id} deleted successfully` };
    } catch (error) {
      console.error(`Error deleting usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    try {
      const contraseñaHash = await this.hashPassword(newPassword);
      const result = await db.query(
        'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2 RETURNING id, nombre_usuario, email',
        [contraseñaHash, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating password for usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Update last login timestamp
  static async updateLastLogin(id) {
    try {
      const result = await db.query(
        'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating last login for usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Update email verification status
  static async updateEmailVerificationStatus(id, isVerified) {
    try {
      console.log(`Updating email verification status for user ${id} to ${isVerified}`);
      const result = await db.query(
        'UPDATE usuarios SET email_verificado = $1 WHERE id = $2 RETURNING id, email, email_verificado',
        [isVerified, id]
      );

      if (result.rows.length === 0) {
        throw new Error(`User with ID ${id} not found`);
      }

      console.log('Email verification status updated:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating email verification status for usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Get email verification status
  static async getEmailVerificationStatus(id) {
    try {
      const result = await db.query(
        'SELECT email_verificado FROM usuarios WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        throw new Error(`User with ID ${id} not found`);
      }

      return result.rows[0].email_verificado;
    } catch (error) {
      console.error(`Error getting email verification status for usuario with ID ${id}:`, error);
      throw error;
    }
  }

  // Get user by username
  static async getByUsername(nombreUsuario) {
    try {
      const result = await db.query(
        'SELECT * FROM usuarios WHERE nombre_usuario = $1',
        [nombreUsuario]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`Error getting usuario by username ${nombreUsuario}:`, error);
      throw error;
    }
  }

  // Password reset token methods
  static async createPasswordResetToken(userId) {
    try {
      const token = crypto.randomUUID();
      const expirationTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Delete any existing reset token for this user
      await db.query('DELETE FROM tabla_reseteo_contrasena WHERE usuario_id = $1', [userId]);

      // Insert new reset token
      await db.query(
        'INSERT INTO tabla_reseteo_contrasena (usuario_id, token, fecha_expiracion) VALUES ($1, $2, $3)',
        [userId, token, expirationTime]
      );

      return token;
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw error;
    }
  }

  static async validatePasswordResetToken(token) {
    try {
      const result = await db.query(
        'SELECT usuario_id, fecha_expiracion FROM tabla_reseteo_contrasena WHERE token = $1',
        [token]
      );

      if (result.rows.length === 0) {
        return { valid: false, message: 'Invalid reset token' };
      }

      const { usuario_id, fecha_expiracion } = result.rows[0];
      const now = new Date();

      if (now > fecha_expiracion) {
        // Token has expired, delete it
        await db.query('DELETE FROM tabla_reseteo_contrasena WHERE token = $1', [token]);
        return { valid: false, message: 'Reset token has expired' };
      }

      return { valid: true, userId: usuario_id };
    } catch (error) {
      console.error('Error validating password reset token:', error);
      throw error;
    }
  }

  static async resetPassword(token, newPassword) {
    try {
      // Validate token first
      const tokenValidation = await this.validatePasswordResetToken(token);
      if (!tokenValidation.valid) {
        throw new Error(tokenValidation.message);
      }

      // Hash the new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update user's password
      await db.query(
        'UPDATE usuarios SET contraseña_hash = $1 WHERE id = $2',
        [hashedPassword, tokenValidation.userId]
      );

      // Delete the used reset token
      await db.query('DELETE FROM tabla_reseteo_contrasena WHERE token = $1', [token]);

      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }
}

export default Usuario;
