import { ref, computed } from 'vue';
import supabase from '../utils/supabaseClient';
import AuthService from '../services/authService';
import router from '../router';

// Create a reactive state
const user = ref(null);
const loading = ref(true);
const token = ref(null);
const refreshToken = ref(null);
const tokenExpiry = ref(null);

// Try to load user from localStorage
const loadUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('tutoria_user');
    const storedToken = localStorage.getItem('tutoria_token');
    const storedRefreshToken = localStorage.getItem('tutoria_refresh_token');
    const storedTokenExpiry = localStorage.getItem('tutoria_token_expiry');

    if (storedUser) {
      user.value = JSON.parse(storedUser);
      console.log('Loaded user from localStorage:', user.value);
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
    const hasStoredUser = loadUserFromStorage();

    if (!hasStoredUser) {
      // If no stored user, check Supabase session
      const { data: sessionData } = await supabase.auth.getSession();

      if (sessionData?.session) {
        // Get user data
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          user.value = userData.user;
          saveUserToStorage(userData.user);
        }
      }
    } else if (token.value) {
      // Validate the token with the backend
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
          console.log('Token validated successfully');
        }
      } catch (validationError) {
        console.error('Error validating token:', validationError);
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
const userRole = computed(() => user.value?.user_metadata?.rol || null);
const isAdmin = computed(() => userRole.value === 'admin');
const isTeacher = computed(() => userRole.value === 'profesor');

// Methods
const setUser = (userData, newToken = null, newRefreshToken = null) => {
  console.log('AuthStore.setUser called with:');
  console.log('- userData:', userData);
  console.log('- newToken:', newToken ? 'Present' : 'Missing');
  console.log('- newRefreshToken:', newRefreshToken ? 'Present' : 'Missing');

  user.value = userData;
  saveUserToStorage(userData);

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
