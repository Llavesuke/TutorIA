/**
 * Service for managing classes and grades
 * This service provides methods for storing and retrieving class information
 * from Supabase and local storage as a fallback
 */

import ApiService from './apiService';
import UserService from './userService';

// Storage key for classes (used as fallback)
const STORAGE_KEY = 'tutoria_classes';

/**
 * Class Service for managing grade/class combinations
 */
class ClassService {
  /**
   * Get all classes for a specific educational center
   * @param {string} centerId - ID of the educational center
   * @returns {Array} - Array of class objects with grade and class properties
   */
  static getClasses(centerId) {
    try {
      // First try to get from localStorage as a cache
      const allClasses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      // Return classes for this center or empty array if none exist
      return allClasses[centerId] || [];
    } catch (error) {
      console.error('Error getting classes from localStorage:', error);
      return [];
    }
  }

  /**
   * Get all classes for a specific educational center from the API
   * @param {string} centerId - ID of the educational center
   * @returns {Promise<Array>} - Promise resolving to array of class objects with grade and class properties
   */
  static async getClassesFromAPI(centerId) {
    try {
      // Get students from the API
      const students = await UserService.getUsersByRole('estudiante', centerId);

      // Extract unique grade/class combinations
      const uniqueClasses = new Map();
      students.forEach(student => {
        if (student.curso && student.clase) {
          const key = `${student.curso}-${student.clase}`;
          uniqueClasses.set(key, { grade: student.curso, class: student.clase });
        }
      });

      // Convert map to array
      const classes = Array.from(uniqueClasses.values());

      // Update local cache
      this.saveClasses(centerId, classes);

      return classes;
    } catch (error) {
      console.error('Error fetching classes from API:', error);

      // Fall back to local cache
      return this.getClasses(centerId);
    }
  }

  /**
   * Save classes for a specific educational center
   * @param {string} centerId - ID of the educational center
   * @param {Array} classes - Array of class objects with grade and class properties
   */
  static saveClasses(centerId, classes) {
    try {
      // Get all classes
      const allClasses = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      // Update classes for this center
      allClasses[centerId] = classes;

      // Save back to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allClasses));

      console.log(`Saved ${classes.length} classes for center ${centerId}`);
    } catch (error) {
      console.error('Error saving classes to localStorage:', error);
    }
  }

  /**
   * Add a new class for a specific educational center
   * @param {string} centerId - ID of the educational center
   * @param {string} grade - Grade (e.g., "1º ESO")
   * @param {string} className - Class name (e.g., "A")
   * @returns {Promise<boolean>} - Promise resolving to true if class was added, false if it already exists
   */
  static async addClass(centerId, grade, className) {
    try {
      console.log(`Adding class ${grade} ${className} for center ${centerId}`);

      // First check if the class already exists in our local cache
      const classes = this.getClasses(centerId);

      // Check if class already exists
      const exists = classes.some(c =>
        c.grade === grade && c.class === className
      );

      if (exists) {
        console.log(`Class ${grade} ${className} already exists in local cache`);
        return false;
      }

      // Add to local cache first
      classes.push({ grade, class: className });
      this.saveClasses(centerId, classes);

      // No need to create a database record for the class itself since classes
      // are derived from student records. Instead, we'll create a placeholder student
      // that can be used later or deleted.

      // For now, we'll just update the local cache and consider it successful
      console.log(`Added class ${grade} ${className} for center ${centerId} to local cache`);
      return true;
    } catch (error) {
      console.error('Error adding class:', error);
      return false;
    }
  }

  /**
   * Remove a class for a specific educational center
   * @param {string} centerId - ID of the educational center
   * @param {string} grade - Grade (e.g., "1º ESO")
   * @param {string} className - Class name (e.g., "A")
   * @returns {boolean} - True if class was removed, false if it doesn't exist
   */
  static removeClass(centerId, grade, className) {
    try {
      // Get existing classes
      const classes = this.getClasses(centerId);

      // Filter out the class to remove
      const filteredClasses = classes.filter(c =>
        !(c.grade === grade && c.class === className)
      );

      // If a class was removed, save the updated list
      if (filteredClasses.length < classes.length) {
        this.saveClasses(centerId, filteredClasses);
        console.log(`Removed class ${grade} ${className} for center ${centerId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error removing class:', error);
      return false;
    }
  }

  /**
   * Get all available grades for a specific educational center
   * @param {string} centerId - ID of the educational center
   * @returns {Array} - Array of unique grades
   */
  static getGrades(centerId) {
    try {
      const classes = this.getClasses(centerId);
      const grades = new Set(classes.map(c => c.grade));
      return Array.from(grades);
    } catch (error) {
      console.error('Error getting grades:', error);
      return [];
    }
  }

  /**
   * Get all available classes for a specific grade in an educational center
   * @param {string} centerId - ID of the educational center
   * @param {string} grade - Grade (e.g., "1º ESO")
   * @returns {Array} - Array of class names
   */
  static getClassesForGrade(centerId, grade) {
    try {
      const classes = this.getClasses(centerId);
      const filteredClasses = classes
        .filter(c => c.grade === grade)
        .map(c => c.class);
      return filteredClasses;
    } catch (error) {
      console.error('Error getting classes for grade:', error);
      return [];
    }
  }

  /**
   * Extract classes from students data and save them
   * @param {string} centerId - ID of the educational center
   * @param {Array} students - Array of student objects with curso and clase properties
   */
  static extractClassesFromStudents(centerId, students) {
    try {
      // Get existing classes
      const existingClasses = this.getClasses(centerId);

      // Extract unique grade/class combinations from students
      const uniqueClasses = new Map();

      // First add existing classes to the map
      existingClasses.forEach(c => {
        const key = `${c.grade}-${c.class}`;
        uniqueClasses.set(key, c);
      });

      // Then add classes from students
      students.forEach(student => {
        if (student.curso && student.clase) {
          const key = `${student.curso}-${student.clase}`;
          uniqueClasses.set(key, { grade: student.curso, class: student.clase });
        }
      });

      // Convert map back to array
      const classes = Array.from(uniqueClasses.values());

      // Save classes
      this.saveClasses(centerId, classes);

      console.log(`Extracted ${classes.length} classes from students for center ${centerId}`);
      return classes;
    } catch (error) {
      console.error('Error extracting classes from students:', error);
      return [];
    }
  }
}

export default ClassService;
