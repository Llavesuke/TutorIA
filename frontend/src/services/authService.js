import supabase from '../utils/supabaseClient';
import ApiService from './apiService';

// Base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Service for handling authentication with Supabase
 */
class AuthService {
  /**
   * Register a new educational center and admin user
   * @param {Object} data - Registration data
   * @param {string} data.centreName - Name of the educational center
   * @param {string} data.adminName - Username for the admin
   * @param {string} data.adminFullName - Full name of the admin
   * @param {string} data.email - Admin email
   * @param {string} data.password - Admin password
   * @returns {Promise} - Promise with the registration result
   */
  static async registerEducationalCenter(data) {
    try {
      // Use the backend API to register the center and admin
      const result = await ApiService.post('/api/auth/register', {
        centroId: null, // Will be created by the backend
        rol: 'admin',
        nombreUsuario: data.adminName,
        nombreReal: data.adminFullName,
        email: data.email,
        password: data.password,
        centreName: data.centreName
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new user (professor or student)
   * @param {Object} userData - User data
   * @param {string} userData.centroId - ID of the educational center
   * @param {string} userData.rol - Role of the user ('profesor' or 'estudiante')
   * @param {string} userData.nombreUsuario - Username
   * @param {string} userData.nombreReal - Full name
   * @param {string} [userData.email] - Email (required for professors)
   * @param {string} userData.password - Password
   * @param {string} [userData.curso] - Grade (only for students)
   * @returns {Promise} - Promise with the registration result
   */
  static async register(userData) {
    try {
      // Validate required fields
      if (!userData.centroId || !userData.rol || !userData.nombreUsuario || !userData.nombreReal || !userData.password) {
        throw new Error('Missing required fields for registration');
      }

      // Validate email for professor role
      if (userData.rol === 'profesor' && !userData.email) {
        throw new Error('Email is required for professor role');
      }

      // Validate curso for student role
      if (userData.rol === 'estudiante' && !userData.curso) {
        throw new Error('Grade is required for student role');
      }

      // For students, ensure email is explicitly null
      let dataToSend = { ...userData };

      if (userData.rol === 'estudiante') {
        if (!userData.email || userData.email.trim() === '') {
          // Ensure email is explicitly null for students
          dataToSend.email = null;
          console.log('Registering student with null email:', dataToSend);
        }
      }

      // Register user via API
      const result = await ApiService.post('/api/auth/register', dataToSend);

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login with identifier (email or username) and password
   * @param {string} identifier - User email or username
   * @param {string} password - User password
   * @returns {Promise} - Promise with the login result
   */
  static async login(identifier, password) {
    try {
      console.log('Attempting login with identifier:', identifier);

      // Determine if the identifier is an email or a username
      const isEmail = identifier.includes('@');
      console.log('Identifier type:', isEmail ? 'email' : 'username');

      // Try to use the backend API first
      try {
        console.log('Trying backend API login...');
        const result = await ApiService.post('/api/auth/login', {
          identifier,
          password
        });

        console.log('Backend API login successful:', result);

        // If it's an email, check verification status
        let isVerified = true; // Default to true for username logins

        if (isEmail && result.user && result.user.email) {
          // Use the isEmailVerified from the backend response if available
          isVerified = result.isEmailVerified !== undefined
            ? result.isEmailVerified
            : await this.isEmailVerified(identifier);

          console.log('Email verification status after backend login:', isVerified);
        } else {
          console.log('No email verification needed (username login or student without email)');
        }

        return {
          success: true,
          isEmailVerified: isVerified,
          ...result
        };
      } catch (apiError) {
        console.warn('Backend API login failed, falling back to direct Supabase:', apiError);

        // If it's not an email, we can't use Supabase Auth directly
        if (!isEmail) {
          console.error('Cannot use Supabase Auth directly with username');
          throw new Error('Login failed. Please try again or contact support.');
        }

        // Fallback to direct Supabase login for email
        console.log('Trying direct Supabase login with email...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });

        if (error) {
          console.error('Supabase login error:', error);
          throw error;
        }

        console.log('Direct Supabase login successful:', data);

        // Check if email is verified
        const isVerified = !!data.user?.email_confirmed_at;
        console.log('Email verification status from Supabase login:', isVerified);
        console.log('Email confirmation timestamp:', data.user?.email_confirmed_at);

        return {
          success: true,
          isEmailVerified: isVerified,
          user: data.user,
          session: data.session
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   * @returns {Promise} - Promise with the logout result
   */
  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get the current logged in user
   * @returns {Promise} - Promise with the current user
   */
  static async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh the JWT token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise} - Promise with the new token
   */
  static async refreshToken(refreshToken) {
    try {
      console.log('Attempting to refresh token');

      // Try to use the backend API to refresh the token
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to refresh token');
        }

        const result = await response.json();
        console.log('Token refreshed successfully:', result);

        return {
          success: true,
          token: result.token
        };
      } catch (apiError) {
        console.error('API token refresh failed:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if email has been verified
   * @param {string} [specificEmail] - Optional specific email to check
   * @returns {Promise<boolean>} - Promise with verification status
   */
  static async isEmailVerified(specificEmail = null) {
    try {
      // First try to use the backend API to check verification status
      if (specificEmail) {
        try {
          console.log('Checking email verification status via backend API for:', specificEmail);
          const result = await ApiService.get(`/api/auth/verify-email-status?email=${encodeURIComponent(specificEmail)}`);

          if (result && result.isEmailVerified !== undefined) {
            console.log('Backend API verification status:', result.isEmailVerified);
            return result.isEmailVerified;
          }
        } catch (apiError) {
          console.warn('Backend API verification check failed, falling back to direct Supabase:', apiError);
        }
      }

      // Fallback to direct Supabase check
      console.log('Checking email verification status via direct Supabase');

      // Get current session and user
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error getting user data:', error);
        throw error;
      }

      const user = userData.user;
      console.log('Current user data:', user);

      // If no user is found, return false
      if (!user) {
        console.log('No user found in session');
        return false;
      }

      // If a specific email was provided, check if it matches the current user
      if (specificEmail && user.email !== specificEmail) {
        console.log(`Current user email (${user.email}) doesn't match specified email (${specificEmail})`);
        return false;
      }

      // Check if email is confirmed
      const isConfirmed = !!user.email_confirmed_at;
      console.log('Email verification status:', isConfirmed ? 'Verified' : 'Not verified');
      console.log('Email confirmation timestamp:', user.email_confirmed_at);

      return isConfirmed;
    } catch (error) {
      console.error('Email verification check error:', error);
      return false;
    }
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} - Promise with the result
   */
  static async forgotPassword(email) {
    try {
      const result = await ApiService.post('/api/auth/forgot-password', {
        email
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise} - Promise with the result
   */
  static async resetPassword(token, newPassword) {
    try {
      const result = await ApiService.post('/api/auth/reset-password', {
        token,
        newPassword
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Validate reset token
   * @param {string} token - Reset token
   * @returns {Promise} - Promise with the validation result
   */
  static async validateResetToken(token) {
    try {
      const result = await ApiService.get(`/api/auth/validate-reset-token/${token}`);

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('Validate reset token error:', error);
      throw error;
    }
  }
}

export default AuthService;
