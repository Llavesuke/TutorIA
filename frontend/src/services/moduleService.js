import ApiService from './apiService';

/**
 * Service for handling module-related API calls
 */
class ModuleService {
  /**
   * Get all modules
   * @returns {Promise} - Promise with all modules
   */
  static async getAllModules() {
    try {
      return await ApiService.get('/api/modulos');
    } catch (error) {
      console.error('Error fetching all modules:', error);
      throw error;
    }
  }

  /**
   * Get modules by educational center
   * @param {string} centerId - ID of the educational center
   * @returns {Promise} - Promise with modules of the specified center
   */
  static async getModulesByCenter(centerId) {
    try {
      console.log(`ModuleService: Fetching modules for center ID: ${centerId}`);
      const result = await ApiService.get(`/api/modulos/centro/${centerId}`);
      console.log(`ModuleService: Received ${result ? result.length : 0} modules for center ID: ${centerId}`);
      console.log('ModuleService: Modules data:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching modules for center ${centerId}:`, error);
      throw error;
    }
  }

  /**
   * Get modules assigned to a specific professor
   * @param {string} professorId - ID of the professor
   * @param {string} centerId - ID of the educational center
   * @returns {Promise} - Promise with modules assigned to the professor
   */
  static async getModulesByProfessor(professorId, centerId) {
    try {
      console.log(`ModuleService: Fetching modules for professor ID: ${professorId} in center ID: ${centerId}`);
      const result = await ApiService.get(`/api/modulos/profesor/${professorId}/${centerId}`);
      console.log(`ModuleService: Received ${result ? result.length : 0} modules for professor ID: ${professorId}`);
      console.log('ModuleService: Professor modules data:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching modules for professor ${professorId}:`, error);
      throw error;
    }
  }

  /**
   * Get professors assigned to a module
   * @param {string} moduleId - ID of the module
   * @returns {Promise} - Promise with professors assigned to the module
   */
  static async getProfessorsByModule(moduleId) {
    try {
      console.log(`ModuleService: Fetching professors for module ID: ${moduleId}`);
      const result = await ApiService.get(`/api/usuarios-modulos/modulo/${moduleId}`);
      console.log(`ModuleService: Received ${result ? result.length : 0} professors for module ID: ${moduleId}`);
      console.log('ModuleService: Professors data:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching professors for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Assign a professor to a module
   * @param {string} professorId - ID of the professor
   * @param {string} moduleId - ID of the module
   * @returns {Promise} - Promise with the result of the assignment
   */
  static async assignProfessorToModule(professorId, moduleId) {
    try {
      console.log(`ModuleService: Assigning professor ${professorId} to module ${moduleId}`);
      const result = await ApiService.post('/api/usuarios-modulos', {
        usuarioId: professorId,
        moduloId: moduleId
      });
      console.log('ModuleService: Professor assigned successfully:', result);
      return result;
    } catch (error) {
      console.error(`Error assigning professor ${professorId} to module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove a professor from a module
   * @param {string} professorId - ID of the professor
   * @param {string} moduleId - ID of the module
   * @returns {Promise} - Promise with the result of the removal
   */
  static async removeProfessorFromModule(professorId, moduleId) {
    try {
      console.log(`ModuleService: Removing professor ${professorId} from module ${moduleId}`);
      const result = await ApiService.delete(`/api/usuarios-modulos/${professorId}/${moduleId}`);
      console.log('ModuleService: Professor removed successfully:', result);
      return result;
    } catch (error) {
      console.error(`Error removing professor ${professorId} from module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get module by ID
   * @param {string} moduleId - ID of the module
   * @returns {Promise} - Promise with the module data
   */
  static async getModuleById(moduleId) {
    try {
      return await ApiService.get(`/api/modulos/${moduleId}`);
    } catch (error) {
      console.error(`Error fetching module with ID ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get modules by grade (curso)
   * @param {string} centerId - ID of the educational center
   * @param {string} grade - Grade (e.g., "1º ESO", "2º ESO")
   * @returns {Promise} - Promise with modules for the specified grade
   */
  static async getModulesByGrade(centerId, grade) {
    try {
      return await ApiService.get(`/api/modulos/curso/${centerId}/${encodeURIComponent(grade)}`);
    } catch (error) {
      console.error(`Error fetching modules for grade ${grade}:`, error);
      throw error;
    }
  }

  /**
   * Get modules by grade and class
   * @param {string} centerId - ID of the educational center
   * @param {string} grade - Grade (e.g., "1º ESO", "2º ESO")
   * @param {string} className - Class name (e.g., "A", "B")
   * @returns {Promise} - Promise with modules for the specified grade and class
   */
  static async getModulesByGradeAndClass(centerId, grade, className) {
    try {
      return await ApiService.get(`/api/modulos/clase/${centerId}/${encodeURIComponent(grade)}/${encodeURIComponent(className)}`);
    } catch (error) {
      console.error(`Error fetching modules for grade ${grade} and class ${className}:`, error);
      throw error;
    }
  }

  /**
   * Create a new module
   * @param {Object} moduleData - Module data
   * @returns {Promise} - Promise with the created module
   */
  static async createModule(moduleData) {
    try {
      console.log('ModuleService: Creating module with data:', moduleData);
      const result = await ApiService.post('/api/modulos', moduleData);
      console.log('ModuleService: Module created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Update a module
   * @param {string} moduleId - ID of the module to update
   * @param {Object} moduleData - Updated module data
   * @returns {Promise} - Promise with the updated module
   */
  static async updateModule(moduleId, moduleData) {
    try {
      return await ApiService.put(`/api/modulos/${moduleId}`, moduleData);
    } catch (error) {
      console.error(`Error updating module with ID ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a module
   * @param {string} moduleId - ID of the module to delete
   * @returns {Promise} - Promise with the result of the deletion
   */
  static async deleteModule(moduleId) {
    try {
      return await ApiService.delete(`/api/modulos/${moduleId}`);
    } catch (error) {
      console.error(`Error deleting module with ID ${moduleId}:`, error);
      throw error;
    }
  }
}

export default ModuleService;
