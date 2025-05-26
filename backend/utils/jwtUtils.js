import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Get JWT secret from environment variables or use a default (only for development)
const JWT_SECRET = process.env.JWT_SECRET || 'tutoria_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object with id, email, rol, centro_id
 * @returns {string} JWT token
 */
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    rol: user.rol,
    centro_id: user.centro_id,
    nombre_usuario: user.nombre_usuario,
    nombre_real: user.nombre_real
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a refresh token for a user
 * @param {Object} user - User object with id
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    id: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error verifying JWT token:', error.message);
    return null;
  }
};

/**
 * Verify a refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying refresh token:', error.message);
    return null;
  }
};

/**
 * Set JWT token in HTTP-only cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 * @param {string} name - Cookie name
 * @param {string} expiresIn - Cookie expiration time
 */
export const setTokenCookie = (res, token, name = 'jwt_token', expiresIn = JWT_EXPIRES_IN) => {
  // Convert JWT expiration time (e.g., '24h') to milliseconds for cookie
  const expiryTime = parseJwtExpiryToMs(expiresIn);
  
  res.cookie(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict',
    maxAge: expiryTime
  });
};

/**
 * Clear JWT token cookie
 * @param {Object} res - Express response object
 * @param {string} name - Cookie name
 */
export const clearTokenCookie = (res, name = 'jwt_token') => {
  res.clearCookie(name);
};

/**
 * Parse JWT expiry string (e.g., '24h', '7d') to milliseconds
 * @param {string} expiryString - JWT expiry string
 * @returns {number} Expiry time in milliseconds
 */
const parseJwtExpiryToMs = (expiryString) => {
  const unit = expiryString.slice(-1);
  const value = parseInt(expiryString.slice(0, -1));
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000; // Default to 24 hours
  }
};
