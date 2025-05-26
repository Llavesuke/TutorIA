/**
 * Utility functions for user data handling
 */

/**
 * Normalize user data to ensure consistent structure
 * @param {Object} userData - Raw user data from any source
 * @returns {Object} Normalized user data with consistent structure
 */
export function normalizeUserData(userData) {
  if (!userData) return null;

  // If it's already in the correct format, return as is
  if (userData.rol && userData.nombre_real && userData.nombre_usuario) {
    return {
      ...userData,
      user_metadata: {
        ...(userData.user_metadata || {}),
        rol: userData.rol,
        nombre_real: userData.nombre_real,
        nombre_usuario: userData.nombre_usuario,
        centro_id: userData.centro_id
      }
    };
  }

  // If it's Supabase Auth data, try to extract from user_metadata
  if (userData.user_metadata && !userData.rol) {
    const metadata = userData.user_metadata;
    return {
      ...userData,
      rol: metadata.rol,
      nombre_real: metadata.nombre_real,
      nombre_usuario: metadata.nombre_usuario,
      centro_id: metadata.centro_id,
      user_metadata: {
        ...metadata,
        rol: metadata.rol,
        nombre_real: metadata.nombre_real,
        nombre_usuario: metadata.nombre_usuario,
        centro_id: metadata.centro_id
      }
    };
  }

  // Fallback: return the data as is but add empty user_metadata
  return {
    ...userData,
    user_metadata: {
      rol: userData.rol || null,
      nombre_real: userData.nombre_real || null,
      nombre_usuario: userData.nombre_usuario || null,
      centro_id: userData.centro_id || null
    }
  };
}

/**
 * Check if user data has the complete structure
 * @param {Object} userData - User data to check
 * @returns {boolean} True if user data is complete
 */
export function isCompleteUserData(userData) {
  if (!userData) return false;

  return !!(
    userData.id &&
    userData.rol &&
    userData.nombre_real &&
    userData.nombre_usuario &&
    userData.centro_id
  );
}

/**
 * Get user role from user data
 * @param {Object} userData - User data
 * @returns {string|null} User role
 */
export function getUserRole(userData) {
  if (!userData) return null;

  return userData.rol || userData.user_metadata?.rol || null;
}

/**
 * Get user display name from user data
 * @param {Object} userData - User data
 * @returns {string} User display name
 */
export function getUserDisplayName(userData) {
  if (!userData) return 'Usuario';

  return userData.nombre_real ||
         userData.user_metadata?.nombre_real ||
         userData.nombre_usuario ||
         userData.user_metadata?.nombre_usuario ||
         userData.email?.split('@')[0] ||
         'Usuario';
}

/**
 * Get user username from user data
 * @param {Object} userData - User data
 * @returns {string} Username
 */
export function getUserUsername(userData) {
  if (!userData) return '';

  return userData.nombre_usuario ||
         userData.user_metadata?.nombre_usuario ||
         userData.email?.split('@')[0] ||
         '';
}
