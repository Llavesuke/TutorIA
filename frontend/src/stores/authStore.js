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
    console.log('🔄 Loading user from localStorage...');
    const storedUser = localStorage.getItem('tutoria_user');
    const storedToken = localStorage.getItem('tutoria_token');
    const storedRefreshToken = localStorage.getItem('tutoria_refresh_token');
    const storedTokenExpiry = localStorage.getItem('tutoria_token_expiry');

    console.log('📋 localStorage contents:');
    console.log('- User:', storedUser ? 'Present' : 'Missing');
    console.log('- Token:', storedToken ? 'Present' : 'Missing');
    console.log('- Refresh Token:', storedRefreshToken ? 'Present' : 'Missing');
    console.log('- Token Expiry:', storedTokenExpiry ? 'Present' : 'Missing');

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
            // Don't return here, continue to load tokens
          }
        } catch (error) {
          console.error('❌ Error replacing stored Supabase data:', error);
        }
      } else {
        user.value = normalizeUserData(parsedUser);
        console.log('✅ Loaded and normalized user from localStorage:', user.value);
      }
    }

    if (storedToken) {
      token.value = storedToken;
      console.log('✅ Loaded access token from localStorage');
    }

    if (storedRefreshToken) {
      refreshToken.value = storedRefreshToken;
      console.log('✅ Loaded refresh token from localStorage');
      console.log('- Refresh token preview:', storedRefreshToken.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No refresh token found in localStorage');
    }

    if (storedTokenExpiry) {
      tokenExpiry.value = parseInt(storedTokenExpiry);
      console.log('✅ Loaded token expiry from localStorage:', new Date(tokenExpiry.value));

      // Check if token is expired
      if (tokenExpiry.value < Date.now()) {
        console.log('⏰ Token is expired, attempting to refresh');
        refreshAuthToken();
      }
    }

    console.log('🔍 Final state after loading from localStorage:');
    console.log('- User:', !!user.value);
    console.log('- Access token:', !!token.value);
    console.log('- Refresh token:', !!refreshToken.value);
    console.log('- Token expiry:', tokenExpiry.value ? new Date(tokenExpiry.value) : 'Not set');

    return !!storedUser;
  } catch (error) {
    console.error('❌ Error loading user from localStorage:', error);
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
    console.log('🔧 saveTokenToStorage called with:');
    console.log('- newToken:', newToken ? 'Present' : 'Missing');
    console.log('- newRefreshToken:', newRefreshToken ? 'Present' : 'Missing');

    // Debug: Log the actual values (first 20 chars for security)
    if (newToken) {
      console.log('- newToken preview:', newToken.substring(0, 20) + '...');
    }
    if (newRefreshToken) {
      console.log('- newRefreshToken preview:', newRefreshToken.substring(0, 20) + '...');
    }

    if (newToken) {
      console.log('💾 Saving access token to localStorage...');
      localStorage.setItem('tutoria_token', newToken);
      token.value = newToken;

      // Calculate and store token expiry (default to 24 hours)
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('tutoria_token_expiry', expiryTime.toString());
      tokenExpiry.value = expiryTime;

      console.log('✅ Access token saved to localStorage, expires:', new Date(expiryTime));
    } else if (newToken === null) {
      console.log('🗑️ Removing access token from localStorage...');
      localStorage.removeItem('tutoria_token');
      localStorage.removeItem('tutoria_token_expiry');
      token.value = null;
      tokenExpiry.value = null;
      console.log('❌ Access token removed from localStorage');
    }

    if (newRefreshToken) {
      console.log('💾 Saving refresh token to localStorage...');
      localStorage.setItem('tutoria_refresh_token', newRefreshToken);
      refreshToken.value = newRefreshToken;
      console.log('✅ Refresh token saved to localStorage');

      // Verify it was actually saved
      const savedRefreshToken = localStorage.getItem('tutoria_refresh_token');
      console.log('🔍 Verification - refresh token in localStorage:', savedRefreshToken ? 'Present' : 'Missing');
    } else if (newRefreshToken === null) {
      console.log('🗑️ Removing refresh token from localStorage...');
      localStorage.removeItem('tutoria_refresh_token');
      refreshToken.value = null;
      console.log('❌ Refresh token removed from localStorage');
    }

    // Log current state
    console.log('📊 Current token state after save:');
    console.log('- Access token in memory:', token.value ? 'Present' : 'Missing');
    console.log('- Refresh token in memory:', refreshToken.value ? 'Present' : 'Missing');
    console.log('- Token expiry:', tokenExpiry.value ? new Date(tokenExpiry.value) : 'Not set');

    // Verify localStorage state
    console.log('📊 Current localStorage state:');
    console.log('- tutoria_token:', localStorage.getItem('tutoria_token') ? 'Present' : 'Missing');
    console.log('- tutoria_refresh_token:', localStorage.getItem('tutoria_refresh_token') ? 'Present' : 'Missing');
    console.log('- tutoria_token_expiry:', localStorage.getItem('tutoria_token_expiry') ? 'Present' : 'Missing');
  } catch (error) {
    console.error('❌ Error saving token to localStorage:', error);
  }
};

// Refresh the authentication token
const refreshAuthToken = async () => {
  try {
    console.log('refreshAuthToken called');
    console.log('Current refresh token:', refreshToken.value ? 'Present' : 'Missing');

    if (!refreshToken.value) {
      console.error('No refresh token available - user needs to login again');
      clearAuth();
      router.push('/login');
      return false;
    }

    console.log('Attempting to refresh token with refresh token:', refreshToken.value.substring(0, 20) + '...');
    const result = await AuthService.refreshToken(refreshToken.value);
    console.log('Refresh token result:', result);

    if (result.success && result.token) {
      console.log('Token refreshed successfully');
      // Keep the same refresh token, only update the access token
      saveTokenToStorage(result.token, refreshToken.value);
      console.log('New access token saved, refresh token preserved');
      return true;
    } else {
      console.error('Failed to refresh token:', result);
      console.error('Clearing auth and redirecting to login');
      clearAuth();
      router.push('/login');
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    console.error('Error details:', error.message);

    // If refresh fails, redirect to login
    console.log('Clearing auth due to refresh error');
    clearAuth();
    router.push('/login');
    return false;
  }
};

// Initialize the store by checking for existing session
const initializeAuth = async () => {
  console.log('🚀 Initializing auth store...');
  loading.value = true;
  try {
    // First try to load from localStorage
    const hasStoredUser = await loadUserFromStorage();

    console.log('📋 Auth initialization state:');
    console.log('- Has stored user:', hasStoredUser);
    console.log('- Has access token:', !!token.value);
    console.log('- Has refresh token:', !!refreshToken.value);

    if (hasStoredUser && token.value) {
      // If we have a stored user and JWT token, validate the token with the backend
      try {
        console.log('🔍 Validating stored token with backend...');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        });

        if (!response.ok) {
          console.log('❌ Token validation failed, attempting to refresh');
          await refreshAuthToken();
        } else {
          console.log('✅ Token validated successfully, using stored user data');
          // Don't overwrite the stored user data - it's from our custom database
        }
      } catch (validationError) {
        console.error('❌ Error validating token:', validationError);
        // If validation fails, try to refresh token
        console.log('🔄 Attempting to refresh token due to validation error');
        await refreshAuthToken();
      }
    } else if (hasStoredUser && !token.value) {
      console.warn('⚠️ User found but no access token - this might indicate a problem');
      if (refreshToken.value) {
        console.log('🔄 Attempting to refresh token since we have refresh token');
        await refreshAuthToken();
      } else {
        console.warn('⚠️ No refresh token available, user needs to login again');
        clearAuth();
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
  console.log('🔐 AuthStore.setUser called with:');
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
          console.log('💾 Saving tokens from Supabase flow');
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
    console.log('💾 Saving tokens from direct login flow');
    saveTokenToStorage(newToken, newRefreshToken);
  }

  console.log('🔐 setUser completed. Final state:');
  console.log('- User set:', !!user.value);
  console.log('- Access token:', !!token.value);
  console.log('- Refresh token:', !!refreshToken.value);
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

    // Note: No need for Supabase logout since we're using JWT only

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

// Test function to verify token saving works
const testTokenSaving = () => {
  console.log('🧪 Testing token saving functionality...');
  const testToken = 'test_access_token_12345';
  const testRefreshToken = 'test_refresh_token_67890';

  console.log('🔧 Calling saveTokenToStorage with test tokens...');
  saveTokenToStorage(testToken, testRefreshToken);

  console.log('🔍 Verifying test results...');
  const savedToken = localStorage.getItem('tutoria_token');
  const savedRefreshToken = localStorage.getItem('tutoria_refresh_token');

  console.log('Results:');
  console.log('- Access token saved correctly:', savedToken === testToken);
  console.log('- Refresh token saved correctly:', savedRefreshToken === testRefreshToken);
  console.log('- Access token in memory:', token.value === testToken);
  console.log('- Refresh token in memory:', refreshToken.value === testRefreshToken);

  // Clean up test tokens
  console.log('🧹 Cleaning up test tokens...');
  saveTokenToStorage(null, null);

  return {
    accessTokenSaved: savedToken === testToken,
    refreshTokenSaved: savedRefreshToken === testRefreshToken,
    accessTokenInMemory: token.value === testToken,
    refreshTokenInMemory: refreshToken.value === testRefreshToken
  };
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
  getToken,
  testTokenSaving
};
