import { ref, computed } from 'vue';
import supabase from '../utils/supabaseClient';
import AuthService from '../services/authService';
import router from '../router';
import { normalizeUserData, isCompleteUserData } from '../utils/userUtils';
import ApiService from '../services/apiService';

// Create a reactive state
const user = ref(null);
const loading = ref(true);
const token = ref(null);
const refreshToken = ref(null);
const tokenExpiry = ref(null);

// Function to detect if user data is from Supabase Auth (incomplete structure)
const isSupabaseAuthData = (userData) => {
  if (!userData) return false;

  // Supabase Auth data has these characteristics:
  // - Has 'aud', 'role', 'created_at', 'email_confirmed_at'
  // - Missing 'rol', 'nombre_real', 'nombre_usuario' directly
  // - Has user_metadata but it's nested differently
  return !!(
    userData.aud &&
    userData.role === 'authenticated' &&
    userData.created_at &&
    !userData.rol && // Missing our custom fields
    !userData.nombre_real &&
    !userData.nombre_usuario
  );
};

// Function to get complete user data from backend using email
const getCompleteUserDataFromBackend = async (email) => {
  try {
    console.log('Getting complete user data from backend for email:', email);

    const result = await ApiService.get(`/api/usuarios/by-email/${encodeURIComponent(email)}`);

    if (result && result.user) {
      console.log('Got complete user data from backend:', result.user);
      return normalizeUserData(result.user);
    }

    return null;
  } catch (error) {
    console.error('Error getting complete user data from backend:', error);
    return null;
  }
};

// Try to load user from localStorage
const loadUserFromStorage = async () => {
  try {
    const storedUser = localStorage.getItem('tutoria_user');
    const storedToken = localStorage.getItem('tutoria_token');
    const storedRefreshToken = localStorage.getItem('tutoria_refresh_token');
    const storedTokenExpiry = localStorage.getItem('tutoria_token_expiry');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      // Check if stored user is Supabase Auth data and replace it
      if (isSupabaseAuthData(parsedUser)) {
        console.log('🔍 Detected stored Supabase Auth data, fetching complete user data...');
        try {
          const completeUserData = await getCompleteUserDataFromBackend(parsedUser.email);
          if (completeUserData) {
            console.log('✅ Replaced stored Supabase data with complete user data');
            user.value = completeUserData;
            saveUserToStorage(completeUserData);
            return true;
          }
        } catch (error) {
          console.error('❌ Error replacing stored Supabase data:', error);
        }
      }

      user.value = normalizeUserData(parsedUser);
      console.log('Loaded and normalized user from localStorage:', user.value);
    }

    if (storedToken) {
      token.value = storedToken;
      console.log('Loaded token from localStorage');
    }

    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken;
      console.log('Loaded refresh token from localStorage');
    }

    if (storedTokenExpiry) {
      tokenExpiry.value = parseInt(storedTokenExpiry);
      console.log('Loaded token expiry from localStorage:', new Date(tokenExpiry.value));

      // Check if token is expired
      if (tokenExpiry.value < Date.now()) {
        console.log('Token is expired, attempting to refresh');
        refreshAuthToken();
      }
    }

    return !!storedUser;
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
  }
  return false;
};

// Save user to localStorage
const saveUserToStorage = (userData) => {
  try {
    if (userData) {
      localStorage.setItem('tutoria_user', JSON.stringify(userData));
      console.log('User saved to localStorage');
    } else {
      localStorage.removeItem('tutoria_user');
      console.log('User removed from localStorage');
    }
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

// Save token to localStorage
const saveTokenToStorage = (newToken, newRefreshToken) => {
  try {
    if (newToken) {
      localStorage.setItem('tutoria_token', newToken);
      token.value = newToken;

      // Calculate and store token expiry (default to 24 hours)
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('tutoria_token_expiry', expiryTime.toString());
      tokenExpiry.value = expiryTime;

      console.log('Token saved to localStorage, expires:', new Date(expiryTime));
    } else {
      localStorage.removeItem('tutoria_token');
      localStorage.removeItem('tutoria_token_expiry');
      token.value = null;
      tokenExpiry.value = null;
      console.log('Token removed from localStorage');
    }

    if (newRefreshToken) {
      localStorage.setItem('tutoria_refresh_token', newRefreshToken);
      refreshToken.value = newRefreshToken;
      console.log('Refresh token saved to localStorage');
    } else {
      localStorage.removeItem('tutoria_refresh_token');
      refreshToken.value = null;
      console.log('Refresh token removed from localStorage');
    }
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
};

// Refresh the authentication token
const refreshAuthToken = async () => {
  try {
    if (!refreshToken.value) {
      console.error('No refresh token available');
      return false;
    }

    console.log('Attempting to refresh token');
    const result = await AuthService.refreshToken(refreshToken.value);

    if (result.success && result.token) {
      console.log('Token refreshed successfully');
      saveTokenToStorage(result.token, refreshToken.value);
      return true;
    } else {
      console.error('Failed to refresh token:', result);
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);

    // If refresh fails, redirect to login
    clearAuth();
    router.push('/login');
    return false;
  }
};

// Initialize the store by checking for existing session
const initializeAuth = async () => {
  loading.value = true;
  try {
    // First try to load from localStorage
    const hasStoredUser = await loadUserFromStorage();

    if (hasStoredUser && token.value) {
      // If we have a stored user and JWT token, validate the token with the backend
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });

        if (!response.ok) {
          console.log('Token validation failed, attempting to refresh');
          await refreshAuthToken();
        } else {
          console.log('Token validated successfully, using stored user data');
          // Don't overwrite the stored user data - it's from our custom database
        }
      } catch (validationError) {
        console.error('Error validating token:', validationError);
        // If validation fails, try to refresh token
        await refreshAuthToken();
      }
    } else if (!hasStoredUser) {
      // Only check Supabase session if we don't have stored user data
      console.log('No stored user found, checking Supabase session');
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        // Get user data from our backend using Supabase session
        try {
          console.log('Found Supabase session, getting complete user data from backend');
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

          // Try to get the complete user data from our backend
          const response = await fetch(`${baseUrl}/api/auth/current-user-from-supabase`, {
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.user) {
              console.log('Got complete user data from backend:', result.user);
              const normalizedUser = normalizeUserData(result.user);
              user.value = normalizedUser;
              saveUserToStorage(normalizedUser);
            }
          } else {
            // Fallback to basic Supabase user data, but try to get complete data
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              console.log('Fallback: got basic Supabase user data, trying to get complete data...');

              // Try to get complete user data
              try {
                const completeUserData = await getCompleteUserDataFromBackend(userData.user.email);
                if (completeUserData) {
                  console.log('✅ Got complete user data as fallback:', completeUserData);
                  user.value = completeUserData;
                  saveUserToStorage(completeUserData);
                } else {
                  console.log('⚠️ Using normalized Supabase data as final fallback');
                  const normalizedUser = normalizeUserData(userData.user);
                  user.value = normalizedUser;
                  saveUserToStorage(normalizedUser);
                }
              } catch (error) {
                console.error('❌ Error getting complete data as fallback:', error);
                const normalizedUser = normalizeUserData(userData.user);
                user.value = normalizedUser;
                saveUserToStorage(normalizedUser);
              }
            }
          }
        } catch (error) {
          console.error('Error getting user data from backend:', error);
          // Fallback to basic Supabase user data, but try to get complete data
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            console.log('Fallback: got basic Supabase user data, trying to get complete data...');

            try {
              const completeUserData = await getCompleteUserDataFromBackend(userData.user.email);
              if (completeUserData) {
                console.log('✅ Got complete user data as fallback:', completeUserData);
                user.value = completeUserData;
                saveUserToStorage(completeUserData);
              } else {
                console.log('⚠️ Using normalized Supabase data as final fallback');
                const normalizedUser = normalizeUserData(userData.user);
                user.value = normalizedUser;
                saveUserToStorage(normalizedUser);
              }
            } catch (fallbackError) {
              console.error('❌ Error getting complete data as fallback:', fallbackError);
              const normalizedUser = normalizeUserData(userData.user);
              user.value = normalizedUser;
              saveUserToStorage(normalizedUser);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error initializing auth store:', error);
  } finally {
    loading.value = false;
  }
};

// Call initialize on import
initializeAuth();

// Computed properties
const isAuthenticated = computed(() => !!user.value);
const userRole = computed(() => user.value?.rol || user.value?.user_metadata?.rol || null);
const isAdmin = computed(() => userRole.value === 'admin');
const isTeacher = computed(() => userRole.value === 'profesor');

// Methods
const setUser = async (userData, newToken = null, newRefreshToken = null) => {
  console.log('AuthStore.setUser called with:');
  console.log('- userData:', userData);
  console.log('- newToken:', newToken ? 'Present' : 'Missing');
  console.log('- newRefreshToken:', newRefreshToken ? 'Present' : 'Missing');

  // Check if this is Supabase Auth data (incomplete)
  if (isSupabaseAuthData(userData)) {
    console.log('🔍 Detected Supabase Auth data, fetching complete user data from backend...');

    try {
      const completeUserData = await getCompleteUserDataFromBackend(userData.email);

      if (completeUserData) {
        console.log('✅ Successfully replaced Supabase data with complete user data:', completeUserData);
        user.value = completeUserData;
        saveUserToStorage(completeUserData);

        if (newToken) {
          saveTokenToStorage(newToken, newRefreshToken);
        }
        return;
      } else {
        console.warn('⚠️ Could not get complete user data, falling back to normalized Supabase data');
      }
    } catch (error) {
      console.error('❌ Error getting complete user data:', error);
    }
  }

  // Normalize user data to ensure consistent structure
  const normalizedUserData = normalizeUserData(userData);
  console.log('- normalizedUserData:', normalizedUserData);
  console.log('- isComplete:', isCompleteUserData(normalizedUserData));

  user.value = normalizedUserData;
  saveUserToStorage(normalizedUserData);

  if (newToken) {
    saveTokenToStorage(newToken, newRefreshToken);
  }
};

const clearAuth = () => {
  user.value = null;
  saveUserToStorage(null);
  saveTokenToStorage(null, null);
};

const logout = async () => {
  try {
    // Call the backend logout endpoint
    if (token.value) {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });
      } catch (apiError) {
        console.error('Error calling logout API:', apiError);
        // Continue with local logout even if API call fails
      }
    }

    // Also try Supabase logout
    try {
      await AuthService.logout();
    } catch (supabaseError) {
      console.error('Error during Supabase logout:', supabaseError);
    }

    // Clear local auth state
    clearAuth();
    return { success: true };
  } catch (error) {
    console.error('Error during logout:', error);

    // Still clear local auth state even if logout fails
    clearAuth();
    return { success: true, error };
  }
};

// Get the current token
const getToken = () => {
  // Check if token is expired
  if (tokenExpiry.value && tokenExpiry.value < Date.now()) {
    console.log('Token is expired, attempting to refresh');
    refreshAuthToken();
  }
  return token.value;
};

// Export the store
export default {
  user,
  loading,
  token,
  refreshToken,
  tokenExpiry,
  isAuthenticated,
  userRole,
  isAdmin,
  isTeacher,
  setUser,
  clearAuth,
  logout,
  refreshAuthToken,
  initializeAuth,
  getToken
};
