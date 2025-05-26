import ApiService from './apiService';

/**
 * Service for handling unit-related API calls
 */
class UnitService {
  /**
   * Get all units
   * @returns {Promise} - Promise with all units
   */
  static async getAllUnits() {
    try {
      return await ApiService.get('/api/unidades');
    } catch (error) {
      console.error('Error fetching all units:', error);
      throw error;
    }
  }

  /**
   * Get units by module ID
   * @param {string} moduleId - ID of the module
   * @returns {Promise} - Promise with units of the specified module
   */
  static async getUnitsByModule(moduleId) {
    try {
      console.log(`UnitService: Fetching units for module ID: ${moduleId}`);
      const result = await ApiService.get(`/api/unidades/modulo/${moduleId}`);
      console.log(`UnitService: Received ${result ? result.length : 0} units for module ID: ${moduleId}`);
      console.log('UnitService: Units data:', result);
      return result;
    } catch (error) {
      console.error(`Error fetching units for module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get unit by ID
   * @param {string} unitId - ID of the unit
   * @returns {Promise} - Promise with the unit data
   */
  static async getUnitById(unitId) {
    try {
      return await ApiService.get(`/api/unidades/${unitId}`);
    } catch (error) {
      console.error(`Error fetching unit with ID ${unitId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new unit
   * @param {Object} unitData - Unit data
   * @returns {Promise} - Promise with the created unit
   */
  static async createUnit(unitData) {
    try {
      console.log('UnitService: Creating unit with data:', unitData);
      const result = await ApiService.post('/api/unidades', unitData);
      console.log('UnitService: Unit created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating unit:', error);
      throw error;
    }
  }

  /**
   * Update a unit
   * @param {string} unitId - ID of the unit to update
   * @param {Object} unitData - Updated unit data
   * @returns {Promise} - Promise with the updated unit
   */
  static async updateUnit(unitId, unitData) {
    try {
      return await ApiService.put(`/api/unidades/${unitId}`, unitData);
    } catch (error) {
      console.error(`Error updating unit with ID ${unitId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a unit
   * @param {string} unitId - ID of the unit to delete
   * @returns {Promise} - Promise with the result of the deletion
   */
  static async deleteUnit(unitId) {
    try {
      return await ApiService.delete(`/api/unidades/${unitId}`);
    } catch (error) {
      console.error(`Error deleting unit with ID ${unitId}:`, error);
      throw error;
    }
  }
}

export default UnitService;
