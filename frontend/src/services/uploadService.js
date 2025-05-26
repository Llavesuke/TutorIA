import ApiService from './apiService';

/**
 * Service for handling file uploads
 */
class UploadService {
  /**
   * Upload a profile picture
   * @param {File} file - The image file to upload
   * @returns {Promise} - Promise with the upload result
   */
  static async uploadProfilePicture(file) {
    try {
      console.log('UploadService: Uploading profile picture');

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // No need to set Content-Type header for FormData
      // ApiService will handle the authentication headers

      // Upload the file
      const result = await ApiService.post('/api/uploads/profile', formData);
      console.log('UploadService: Profile picture uploaded successfully', result);

      return result;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Upload an assignment submission file
   * @param {File} file - The file to upload
   * @param {string} assignmentId - ID of the assignment
   * @returns {Promise} - Promise with the upload result
   */
  static async uploadAssignmentFile(file, assignmentId) {
    try {
      console.log(`UploadService: Uploading file for assignment ${assignmentId}`);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', assignmentId);

      // No need to set Content-Type header for FormData
      // ApiService will handle the authentication headers

      // Upload the file
      const result = await ApiService.post('/api/uploads/assignment', formData);
      console.log('UploadService: Assignment file uploaded successfully', result);

      return result;
    } catch (error) {
      console.error('Error uploading assignment file:', error);
      throw error;
    }
  }
}

export default UploadService;
