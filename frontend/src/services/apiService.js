import authStore from '../stores/authStore';

/**
 * Service for making API calls to the backend
 */
class ApiService {
  /**
   * Get the base URL for API calls
   * @returns {string} The base URL
   */
  static getBaseUrl() {
    // Use environment variable or fallback to localhost
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  }

  /**
   * Get the authentication token
   * @returns {string|null} The authentication token or null if not available
   */
  static getAuthToken() {
    // Get token from authStore
    const token = authStore.token?.value;

    if (token) {
      console.log('Using JWT token from authStore');
      return token;
    }

    // Fallback to localStorage for backward compatibility
    try {
      // Try to get token directly from localStorage first
      const storedToken = localStorage.getItem('tutoria_token');
      if (storedToken) {
        console.log('Using token directly from localStorage');
        return storedToken;
      }

      // If no direct token, try to get it from user object
      const storedUser = localStorage.getItem('tutoria_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.token) {
          console.log('Using token from localStorage user object');
          return userData.token;
        } else if (userData.session?.access_token) {
          console.log('Using Supabase session token from localStorage');
          return userData.session.access_token;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }

    return null;
  }

  /**
   * Get the authorization headers for API calls
   * @returns {Object} Headers object with Authorization if available
   */
  static getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Generated auth headers:', headers);
    return headers;
  }

  /**
   * Handle unauthorized errors by refreshing the token
   * @param {string} endpoint - The API endpoint that failed
   * @param {Object} options - Request options
   * @param {string} method - HTTP method
   * @param {Object|FormData} [body] - Request body for POST/PUT requests
   * @returns {Promise} - Promise with the retry result
   */
  static async handleUnauthorized(endpoint, options, method, body = null) {
    console.log('Handling 401 Unauthorized error, attempting to refresh token');

    try {
      // Try to refresh the token
      const refreshResult = await authStore.refreshAuthToken();

      if (!refreshResult) {
        console.error('Token refresh failed');
        throw new Error('Session expired. Please log in again.');
      }

      console.log('Token refreshed successfully, retrying request');

      // Get the new token from authStore
      const newToken = authStore.token.value;

      if (!newToken) {
        console.error('No token available after refresh');
        throw new Error('Authentication failed. Please log in again.');
      }

      // Retry the request with the new token
      const headers = {
        ...options.headers || {},
        'Authorization': `Bearer ${newToken}`
      };

      // Only set Content-Type for non-FormData requests
      if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const requestOptions = {
        method,
        headers,
        ...options
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        // Handle FormData differently
        if (body instanceof FormData) {
          // Remove Content-Type header to let the browser set it with the boundary
          delete requestOptions.headers['Content-Type'];

          // Make sure Authorization header is preserved
          requestOptions.headers['Authorization'] = `Bearer ${newToken}`;

          requestOptions.body = body;

          console.log('Retry with FormData and auth token:', newToken ? 'Token set' : 'No token');
        } else {
          // For regular JSON data
          requestOptions.body = JSON.stringify(body);
        }
      }

      console.log('Retry request options:', {
        method: requestOptions.method,
        headers: requestOptions.headers,
        hasBody: !!requestOptions.body
      });

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, requestOptions);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`Retry failed for ${endpoint}:`, error);
        throw new Error(error.message || 'Request failed after token refresh');
      }

      return await response.json();
    } catch (error) {
      console.error('Error during token refresh and retry:', error);
      throw error;
    }
  }

  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise} - Promise with the response data
   */
  static async get(endpoint, options = {}) {
    try {
      console.log(`ApiService: Making GET request to ${endpoint}`);

      // Use auth headers for all requests
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers
      };

      console.log('ApiService: Request headers:', headers);

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers,
        ...options
      });

      if (!response.ok) {
        // Handle 401 Unauthorized errors (expired token)
        if (response.status === 401) {
          return await this.handleUnauthorized(endpoint, options, 'GET');
        }

        const error = await response.json();
        console.error(`ApiService: Error response from ${endpoint}:`, error);
        throw new Error(error.message || 'An error occurred');
      }

      const data = await response.json();
      console.log(`ApiService: Successful response from ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error(`Error in GET ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object|FormData} data - The data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise} - Promise with the response data
   */
  static async post(endpoint, data, options = {}) {
    try {
      // Get the authentication token
      const token = this.getAuthToken();

      // Use auth headers for all requests
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers
      };

      console.log(`Making POST request to ${endpoint} with headers:`, headers);
      console.log('Request data type:', data instanceof FormData ? 'FormData' : typeof data);

      // Prepare request options
      const requestOptions = {
        method: 'POST',
        headers,
        ...options
      };

      // Handle FormData differently - don't stringify and don't set Content-Type
      if (data instanceof FormData) {
        // Remove Content-Type header to let the browser set it with the boundary
        delete requestOptions.headers['Content-Type'];

        // Make sure Authorization header is preserved for FormData requests
        if (token) {
          requestOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        requestOptions.body = data;

        console.log('FormData request with auth header:',
          token ? 'Authorization header set' : 'No auth token available');
      } else {
        // For regular JSON data
        if (!requestOptions.headers['Content-Type']) {
          requestOptions.headers['Content-Type'] = 'application/json';
        }
        requestOptions.body = JSON.stringify(data);
      }

      console.log('Final request options:', {
        method: requestOptions.method,
        headers: requestOptions.headers,
        hasBody: !!requestOptions.body
      });

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, requestOptions);

      if (!response.ok) {
        // Handle 401 Unauthorized errors (expired token)
        if (response.status === 401) {
          return await this.handleUnauthorized(endpoint, options, 'POST', data);
        }

        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in POST ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise} - Promise with the response data
   */
  static async put(endpoint, data, options = {}) {
    try {
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers
      };

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        // Handle 401 Unauthorized errors (expired token)
        if (response.status === 401) {
          return await this.handleUnauthorized(endpoint, options, 'PUT', data);
        }

        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in PUT ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} options - Additional fetch options
   * @returns {Promise} - Promise with the response data
   */
  static async delete(endpoint, options = {}) {
    try {
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers
      };

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'DELETE',
        headers,
        ...options
      });

      if (!response.ok) {
        // Handle 401 Unauthorized errors (expired token)
        if (response.status === 401) {
          return await this.handleUnauthorized(endpoint, options, 'DELETE');
        }

        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in DELETE ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make a PATCH request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - The data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise} - Promise with the response data
   */
  static async patch(endpoint, data, options = {}) {
    try {
      const headers = {
        ...this.getAuthHeaders(),
        ...options.headers
      };

      const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        // Handle 401 Unauthorized errors (expired token)
        if (response.status === 401) {
          return await this.handleUnauthorized(endpoint, options, 'PATCH', data);
        }

        const error = await response.json();
        throw new Error(error.message || 'An error occurred');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error in PATCH ${endpoint}:`, error);
      throw error;
    }
  }
}

export default ApiService;
