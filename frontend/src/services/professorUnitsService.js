import supabase from '@/utils/supabaseClient';
import authStore from '@/stores/authStore';

/**
 * Service for handling professor's units and modules
 */
class ProfessorUnitsService {
  /**
   * Get all modules and units available to the current professor
   * @returns {Promise<Object>} - Object with modules and their units
   */
  static async getProfessorModulesAndUnits() {
    try {
      const user = authStore.user.value;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const userId = user.id;
      console.log('Getting modules and units for professor:', userId);

      // Get professor's modules
      const { data: professorModules, error: modulesError } = await supabase
        .from('usuarios_modulos')
        .select(`
          modulo_id,
          modulos (
            id,
            nombre,
            curso,
            clase,
            descripcion
          )
        `)
        .eq('usuario_id', userId);

      if (modulesError) {
        console.error('Error fetching professor modules:', modulesError);
        throw modulesError;
      }

      if (!professorModules || professorModules.length === 0) {
        return {
          modules: [],
          units: [],
          moduleUnits: {}
        };
      }

      const moduleIds = professorModules.map(pm => pm.modulo_id);
      console.log('Professor module IDs:', moduleIds);

      // Get units for these modules
      const { data: units, error: unitsError } = await supabase
        .from('unidades')
        .select('id, nombre, modulo_id, orden')
        .in('modulo_id', moduleIds)
        .order('orden');

      if (unitsError) {
        console.error('Error fetching units:', unitsError);
        throw unitsError;
      }

      // Organize data
      const modules = professorModules.map(pm => pm.modulos).filter(Boolean);
      const moduleUnits = {};

      // Group units by module
      modules.forEach(module => {
        moduleUnits[module.id] = units?.filter(unit => unit.modulo_id === module.id) || [];
      });

      console.log('Organized data:', { modules, units, moduleUnits });

      return {
        modules,
        units: units || [],
        moduleUnits
      };

    } catch (error) {
      console.error('Error getting professor modules and units:', error);
      throw error;
    }
  }

  /**
   * Get units for a specific module
   * @param {string} moduleId - Module ID
   * @returns {Promise<Array>} - Array of units
   */
  static async getUnitsByModule(moduleId) {
    try {
      const { data: units, error } = await supabase
        .from('unidades')
        .select('id, nombre, modulo_id, orden')
        .eq('modulo_id', moduleId)
        .order('orden');

      if (error) {
        console.error('Error fetching units for module:', error);
        throw error;
      }

      return units || [];
    } catch (error) {
      console.error('Error getting units by module:', error);
      throw error;
    }
  }

  /**
   * Check if professor has access to a specific unit
   * @param {string} unitId - Unit ID
   * @returns {Promise<boolean>} - True if professor has access
   */
  static async hasAccessToUnit(unitId) {
    try {
      const user = authStore.user.value;
      if (!user) {
        return false;
      }

      // Get the unit's module
      const { data: unit, error: unitError } = await supabase
        .from('unidades')
        .select('modulo_id')
        .eq('id', unitId)
        .single();

      if (unitError || !unit) {
        return false;
      }

      // Check if professor is assigned to this module
      const { data: assignment, error: assignmentError } = await supabase
        .from('usuarios_modulos')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('modulo_id', unit.modulo_id)
        .single();

      if (assignmentError || !assignment) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking unit access:', error);
      return false;
    }
  }

  /**
   * Format module and unit data for display
   * @param {Object} data - Data from getProfessorModulesAndUnits
   * @returns {Array} - Formatted data for selection
   */
  static formatForSelection(data) {
    const { modules, moduleUnits } = data;
    
    return modules.map(module => ({
      id: module.id,
      name: module.nombre,
      course: module.curso,
      class: module.clase,
      description: module.descripcion,
      units: moduleUnits[module.id] || [],
      displayName: `${module.nombre} (${module.curso}${module.clase ? ` - ${module.clase}` : ''})`
    }));
  }
}

export default ProfessorUnitsService;
