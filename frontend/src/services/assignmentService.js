import ApiService from './apiService';

/**
 * Service for handling assignment-related API calls
 */
class AssignmentService {
  /**
   * Get all assignments
   * @returns {Promise} - Promise with all assignments
   */
  static async getAllAssignments() {
    try {
      return await ApiService.get('/api/assignments');
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignments by unit ID
   * @param {string} unitId - ID of the unit
   * @returns {Promise} - Promise with assignments of the specified unit
   */
  static async getAssignmentsByUnit(unitId) {
    try {
      console.log(`AssignmentService: Fetching assignments for unit ID: ${unitId}`);
      const result = await ApiService.get(`/api/assignments/unidad/${unitId}`);
      console.log(`AssignmentService: Received ${result ? result.length : 0} assignments for unit ID: ${unitId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching assignments for unit ${unitId}:`, error);
      throw error;
    }
  }

  /**
   * Get assignment by ID
   * @param {string} assignmentId - ID of the assignment
   * @returns {Promise} - Promise with the assignment data
   */
  static async getAssignmentById(assignmentId) {
    try {
      return await ApiService.get(`/api/assignments/${assignmentId}`);
    } catch (error) {
      console.error(`Error fetching assignment with ID ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new assignment
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise} - Promise with the created assignment
   */
  static async createAssignment(assignmentData) {
    try {
      console.log('AssignmentService: Creating assignment with data:', assignmentData);
      const result = await ApiService.post('/api/assignments', assignmentData);
      console.log('AssignmentService: Assignment created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Update an assignment
   * @param {string} assignmentId - ID of the assignment to update
   * @param {Object} assignmentData - Updated assignment data
   * @returns {Promise} - Promise with the updated assignment
   */
  static async updateAssignment(assignmentId, assignmentData) {
    try {
      return await ApiService.put(`/api/assignments/${assignmentId}`, assignmentData);
    } catch (error) {
      console.error(`Error updating assignment with ID ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Update an assignment's active status
   * @param {string} assignmentId - ID of the assignment to update
   * @param {boolean} active - New active status
   * @returns {Promise} - Promise with the updated assignment
   */
  static async updateAssignmentStatus(assignmentId, active) {
    try {
      console.log(`AssignmentService: Updating active status for assignment ${assignmentId} to ${active}`);
      // Use PUT instead of PATCH to match the backend endpoint
      return await ApiService.put(`/api/assignments/${assignmentId}/active`, { active });
    } catch (error) {
      console.error(`Error updating status for assignment with ID ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an assignment
   * @param {string} assignmentId - ID of the assignment to delete
   * @returns {Promise} - Promise with the result of the deletion
   */
  static async deleteAssignment(assignmentId) {
    try {
      return await ApiService.delete(`/api/assignments/${assignmentId}`);
    } catch (error) {
      console.error(`Error deleting assignment with ID ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Submit an assignment response
   * @param {string} assignmentId - ID of the assignment
   * @param {Object} responseData - Response data including text and/or files
   * @returns {Promise} - Promise with the submitted response
   */
  static async submitAssignmentResponse(assignmentId, responseData) {
    try {
      console.log(`AssignmentService: Submitting response for assignment ID: ${assignmentId}`);
      console.log('Response data:', JSON.stringify(responseData));

      // Validar los datos antes de enviar
      if (!responseData.textoRespuesta && (!responseData.archivosUrls || responseData.archivosUrls.length === 0)) {
        throw new Error('Debe proporcionar texto o archivos para la respuesta');
      }

      // Asegurarse de que archivosUrls sea un array válido
      if (responseData.archivosUrls) {
        // Verificar que cada objeto en el array tenga los campos necesarios
        responseData.archivosUrls = responseData.archivosUrls.map(file => ({
          name: file.name || 'unknown',
          url: file.url || '',
          type: file.type || 'unknown',
          size: file.size || 0
        }));
      }

      // Submit the assignment with text and file URLs
      const result = await ApiService.post(`/api/assignments/${assignmentId}/submit`, responseData);

      console.log('AssignmentService: Response submitted successfully:', result);
      return result;
    } catch (error) {
      console.error(`Error submitting response for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's submission for an assignment
   * @param {string} assignmentId - ID of the assignment
   * @returns {Promise} - Promise with the user's submission
   */
  static async getMySubmission(assignmentId) {
    try {
      console.log(`AssignmentService: Fetching my submission for assignment ID: ${assignmentId}`);

      // Use fetch directly to handle 404 properly
      const baseUrl = ApiService.getBaseUrl();
      const endpoint = `/api/assignments/${assignmentId}/my-submission`;
      const headers = ApiService.getAuthHeaders();

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers
      });

      // If 404, it means no submission exists yet
      if (response.status === 404) {
        console.log(`No submission found for assignment ${assignmentId}`);
        return null;
      }

      // For other non-200 responses, throw an error
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An error occurred');
      }

      // Parse and return the successful response
      const result = await response.json();
      console.log('AssignmentService: Submission fetched successfully:', result);
      return result;
    } catch (error) {
      // If the error message indicates no submission, return null
      if (error.message && error.message.includes('No has enviado ninguna respuesta')) {
        console.log(`No submission found for assignment ${assignmentId}`);
        return null;
      }

      console.error(`Error fetching submission for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Get all user submissions
   * @returns {Promise} - Promise with all user submissions
   */
  static async getMySubmissions() {
    try {
      console.log('AssignmentService: Fetching all my submissions');
      const result = await ApiService.get('/api/assignments/my-submissions');
      console.log(`AssignmentService: Received ${result ? result.length : 0} submissions`);
      return result;
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      throw error;
    }
  }

  /**
   * Get all submissions for an assignment (for professors)
   * @param {string} assignmentId - ID of the assignment
   * @returns {Promise} - Promise with all submissions for the assignment
   */
  static async getAssignmentSubmissions(assignmentId) {
    try {
      console.log(`AssignmentService: Fetching all submissions for assignment ID: ${assignmentId}`);
      const result = await ApiService.get(`/api/assignments/${assignmentId}/submissions`);
      console.log(`AssignmentService: Received ${result ? result.length : 0} submissions for assignment ${assignmentId}`);
      return result;
    } catch (error) {
      console.error(`Error fetching submissions for assignment ${assignmentId}:`, error);
      throw error;
    }
  }

  /**
   * Grade a submission
   * @param {string} submissionId - ID of the submission
   * @param {number} grade - Grade to assign (0-100)
   * @returns {Promise} - Promise with the updated submission
   */
  static async gradeSubmission(submissionId, grade) {
    try {
      console.log(`AssignmentService: Grading submission ${submissionId} with grade ${grade}`);
      const result = await ApiService.post(`/api/assignments/submissions/${submissionId}/grade`, {
        calificacion: grade
      });
      console.log('AssignmentService: Submission graded successfully:', result);
      return result;
    } catch (error) {
      console.error(`Error grading submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Provide feedback for a submission
   * @param {string} submissionId - ID of the submission
   * @param {string} feedback - Feedback text
   * @returns {Promise} - Promise with the updated submission
   */
  static async provideFeedback(submissionId, feedback) {
    try {
      console.log(`AssignmentService: Providing feedback for submission ${submissionId}`);
      const result = await ApiService.post(`/api/assignments/submissions/${submissionId}/feedback`, {
        comentarios: feedback
      });
      console.log('AssignmentService: Feedback provided successfully:', result);
      return result;
    } catch (error) {
      console.error(`Error providing feedback for submission ${submissionId}:`, error);
      throw error;
    }
  }
}

export default AssignmentService;
