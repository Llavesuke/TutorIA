import ApiService from './apiService';
import authStore from '@/stores/authStore';

/**
 * Service for handling virtual tutor-related API calls
 */
class TutorService {
  /**
   * Get all tutors
   * @returns {Promise} - Promise with all tutors
   */
  static async getAllTutors() {
    try {
      return await ApiService.get('/api/tutores-virtuales');
    } catch (error) {
      console.error('Error fetching all tutors:', error);
      throw error;
    }
  }

  /**
   * Get tutors by unit ID
   * @param {string} unitId - ID of the unit
   * @returns {Promise} - Promise with tutors of the specified unit
   */
  static async getTutorsByUnit(unitId) {
    try {
      console.log(`TutorService: Fetching tutors for unit ID: ${unitId}`);
      const result = await ApiService.get(`/api/tutores-virtuales/unidad/${unitId}`);
      console.log(`TutorService: Received ${result ? result.length : 0} tutors for unit ID: ${unitId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching tutors for unit ${unitId}:`, error);
      throw error;
    }
  }

  /**
   * Get tutor by ID
   * @param {string} tutorId - ID of the tutor
   * @returns {Promise} - Promise with the tutor data
   */
  static async getTutorById(tutorId) {
    try {
      return await ApiService.get(`/api/tutores-virtuales/${tutorId}`);
    } catch (error) {
      console.error(`Error fetching tutor with ID ${tutorId}:`, error);
      throw error;
    }
  }

  /**
   * Get tutor details with related information
   * @param {string} tutorId - ID of the tutor
   * @returns {Promise} - Promise with the tutor data
   */
  static async getTutorDetailsFromSupabase(tutorId) {
    try {
      console.log('Fetching tutor details for ID:', tutorId);

      // Get tutor details from API
      const tutor = await this.getTutorById(tutorId);

      if (!tutor) {
        throw new Error(`Tutor with ID ${tutorId} not found`);
      }

      // Format the tutor data
      return {
        id: tutor.id,
        nombre: tutor.nombre,
        tipo: tutor.tipo,
        configuracion: tutor.configuracion,
        modeloIa: tutor.modelo_ia,
        imagen: tutor.imagen,
        objetivo: tutor.objetivo,
        instrucciones: tutor.instrucciones,
        grupo: tutor.grupo,
        activo: tutor.activo,
        unidadId: tutor.unidad_id,
        unidad: tutor.unidad
      };
    } catch (error) {
      console.error(`Error fetching tutor details for ID ${tutorId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new tutor
   * @param {Object|FormData} tutorData - Tutor data or FormData with tutor information
   * @returns {Promise} - Promise with the created tutor
   */
  static async createTutor(tutorData) {
    try {
      console.log('TutorService: Creating tutor with data:', tutorData);

      const options = {};

      // If tutorData is FormData, don't set Content-Type as browser will set it with boundary
      if (tutorData instanceof FormData) {
        options.headers = { 'Content-Type': undefined };
      }

      const result = await ApiService.post('/api/tutores-virtuales', tutorData, options);
      console.log('TutorService: Tutor created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating tutor:', error);
      throw error;
    }
  }

  /**
   * Update a tutor
   * @param {string} tutorId - ID of the tutor to update
   * @param {Object} tutorData - Updated tutor data
   * @returns {Promise} - Promise with the updated tutor
   */
  static async updateTutor(tutorId, tutorData) {
    try {
      return await ApiService.put(`/api/tutores-virtuales/${tutorId}`, tutorData);
    } catch (error) {
      console.error(`Error updating tutor with ID ${tutorId}:`, error);
      throw error;
    }
  }

  /**
   * Update a tutor's active status
   * @param {string} tutorId - ID of the tutor to update
   * @param {boolean} active - New active status
   * @returns {Promise} - Promise with the updated tutor
   */
  static async updateTutorActiveStatus(tutorId, active) {
    try {
      // Use PATCH method with the correct endpoint from the backend
      // The backend has a specific endpoint for updating active status
      return await ApiService.patch(`/api/tutores-virtuales/${tutorId}/active`, {
        activo: active
      });
    } catch (error) {
      console.error(`Error updating active status for tutor with ID ${tutorId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a tutor
   * @param {string} tutorId - ID of the tutor to delete
   * @returns {Promise} - Promise with the result of the deletion
   */
  static async deleteTutor(tutorId) {
    try {
      return await ApiService.delete(`/api/tutores-virtuales/${tutorId}`);
    } catch (error) {
      console.error(`Error deleting tutor with ID ${tutorId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a tutor
   * @param {string} tutorId - ID of the tutor
   * @param {Object} messageData - Message data
   * @returns {Promise} - Promise with the tutor's response
   */
  static async sendMessage(tutorId, messageData) {
    try {
      return await ApiService.post(`/api/tutores-virtuales/${tutorId}/message`, messageData);
    } catch (error) {
      console.error(`Error sending message to tutor with ID ${tutorId}:`, error);
      throw error;
    }
  }
}

export default TutorService;
