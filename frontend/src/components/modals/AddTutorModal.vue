<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal tutor-modal" :class="{ 'active': isOpen, 'loading-mode': isLoading }">
      <div class="modal-header">
        <h1 class="modal-title">{{ isLoading ? 'Creating Virtual Tutor' : 'Create tutor' }}</h1>
        <button class="modal-close" @click="closeModal" :disabled="isLoading" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">


        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="showSuccess" class="success-message">
          <i class="fas fa-check-circle"></i> Tutor created successfully!
        </div>

        <form @submit.prevent="createTutor" class="tutor-form">
          <!-- Image upload section -->
          <div class="image-upload-section">
            <div class="image-upload-container" @click="triggerFileInput">
              <input
                type="file"
                id="tutorImage"
                ref="fileInput"
                @change="handleFileChange"
                accept="image/*"
                :disabled="isLoading"
                class="hidden-file-input"
              />
              <div v-if="imagePreview" class="image-preview">
                <img :src="imagePreview" alt="Preview" />
              </div>
              <div v-else class="upload-placeholder">
                <i class="fas fa-camera"></i>
                <span>Upload photo</span>
              </div>
            </div>
          </div>

          <!-- Tutor name -->
          <div class="form-group">
            <label for="tutorName" class="form-label">Tutor name</label>
            <input
              type="text"
              id="tutorName"
              v-model="tutorName"
              class="form-control orange-input"
              placeholder="Write the name here"
              required
              :disabled="isLoading"
            />
          </div>

          <!-- Tutor objective/type -->
          <div class="form-group">
            <label for="tutorObjective" class="form-label">Tutor objective</label>
            <input
              type="text"
              id="tutorObjective"
              v-model="tutorObjective"
              class="form-control dark-input"
              placeholder="Write the objective of the tutor"
              :disabled="isLoading"
            />
          </div>

          <!-- Tutor type (hidden but still used) -->
          <div class="form-group hidden">
            <select
              id="tutorType"
              v-model="tutorType"
              class="form-control"
              required
              :disabled="isLoading"
            >
              <option value="teorico">Theoretical</option>
              <option value="practico">Practical</option>
              <option value="evaluador">Evaluator</option>
              <option value="general">General</option>
            </select>
          </div>

          <!-- Current group/course info (read-only) -->
          <div class="form-group">
            <label class="form-label">Course/Group</label>
            <div class="current-group-display dark-input">
              <i class="fas fa-users-class"></i>
              <span>{{ props.currentGroup || 'Current group' }}</span>
            </div>
          </div>

          <!-- Instructions section -->
          <div class="form-group">
            <label class="form-label">Specific Instructions</label>
            <div class="instructions-info">
              <i class="fas fa-info-circle"></i>
              <span>All tutors include a predefined system prompt that encourages active learning and critical thinking. These specific instructions will be added to that prompt.</span>
            </div>
            <div class="rag-info">
              <i class="fas fa-file-alt"></i>
              <span>Upload PDF or DOCX files to provide context documents. The tutor will use these documents to answer questions with relevant information from your materials.</span>
            </div>
            <div class="instructions-container">
              <textarea
                v-model="instructions"
                class="instructions-textarea orange-input"
                placeholder="Provide specific instructions for this tutor. For example: 'This tutor should help students understand the basics of prehistoric art and guide them through their assignments.'"
                :disabled="isLoading"
              ></textarea>

              <div class="upload-files-btn" @click="triggerFilesInput">
                <i class="fas fa-upload"></i>
                <span>Upload PDF/DOCX</span>
                <input
                  type="file"
                  ref="filesInput"
                  @change="handleFilesChange"
                  multiple
                  accept=".pdf,.docx"
                  class="hidden-file-input"
                  :disabled="isLoading"
                />
              </div>
            </div>
          </div>

          <!-- Context files -->
          <div v-if="selectedFiles.length > 0" class="context-files-section">
            <label class="form-label">Context files</label>
            <div class="context-files-container">
              <div
                v-for="(file, index) in selectedFiles"
                :key="index"
                class="context-file-item"
              >
                <div class="file-icon" :class="getFileIconClass(file)">
                  <i :class="getFileIconClass(file)"></i>
                  <span class="file-type">{{ getFileType(file) }}</span>
                  <span class="file-name">{{ getFileName(file) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Form actions -->
          <div class="form-actions">
            <button
              type="button"
              class="cancel-btn"
              @click="closeModal"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="submit-btn"
              :disabled="isLoading || !isFormValid"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Creating...
              </span>
              <span v-else>Create Tutor</span>
            </button>
          </div>
        </form>

        <!-- Enhanced Loading Screen -->
        <div v-if="isLoading" class="enhanced-loading-screen">
          <!-- Loading Header -->
          <div class="loading-main-section">
            <div class="loading-spinner-container">
              <div class="loading-spinner"></div>
            </div>
            <div class="loading-text-section">
              <h3 class="loading-title">{{ loadingState.currentStepLabel }}</h3>
              <p class="loading-subtitle">
                Step {{ loadingState.currentStep + 1 }} of {{ loadingState.totalSteps }}
                <span v-if="loadingState.estimatedTimeRemaining">
                  • ~{{ loadingState.estimatedTimeRemaining }}s remaining
                </span>
              </p>
            </div>
          </div>

          <!-- Progress Steps -->
          <div class="progress-steps-container">
            <div
              v-for="(step, index) in loadingState.stepLabels"
              :key="index"
              class="progress-step"
              :class="{
                'active': index === loadingState.currentStep,
                'completed': index < loadingState.currentStep
              }"
            >
              <div class="step-icon">
                <i v-if="index < loadingState.currentStep" class="fas fa-check"></i>
                <i v-else-if="index === loadingState.currentStep" class="fas fa-spinner fa-spin"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="step-label">{{ step }}</span>
            </div>
            <div
              v-for="index in loadingState.stepLabels.length - 1"
              :key="`connector-${index}`"
              class="progress-connector"
              :class="{ 'active': index <= loadingState.currentStep }"
            ></div>
          </div>

          <!-- RAG Files Processing Section -->
          <div v-if="loadingState.ragFiles.length > 0" class="rag-processing-section">
            <div class="section-header">
              <i class="fas fa-file-alt"></i>
              <h4>Document Processing</h4>
            </div>
            <div class="rag-files-grid">
              <div
                v-for="file in loadingState.ragFiles"
                :key="file.name"
                class="rag-file-card"
              >
                <div class="file-icon-section">
                  <i
                    :class="[
                      getFileIconClass({ name: file.name }),
                      {
                        'fa-spin': file.status === 'uploading' || file.status === 'processing',
                        'text-blue': file.status === 'uploading',
                        'text-orange': file.status === 'processing',
                        'text-green': file.status === 'completed',
                        'text-red': file.status === 'error',
                        'text-gray': file.status === 'pending'
                      }
                    ]"
                  ></i>
                </div>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <div
                    class="status-badge"
                    :class="file.status"
                  >
                    <span class="status-text">{{ file.status.toUpperCase() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Cancel Button -->
          <div v-if="loadingState.canCancel" class="loading-actions">
            <button @click="cancelCreation" class="cancel-loading-btn">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ApiService from '@/services/apiService';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  unitId: {
    type: String,
    required: true
  },
  currentGroup: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'tutor-created']);

// State
const tutorName = ref('');
const tutorType = ref('general'); // Default to general type
const tutorObjective = ref('');
const instructions = ref('');
const fileInput = ref(null);
const filesInput = ref(null);
const selectedFile = ref(null);
const selectedFiles = ref([]);
const imagePreview = ref('');
const errorMessage = ref('');
const showSuccess = ref(false);
const isLoading = ref(false);

// Enhanced loading state
const loadingState = ref({
  currentStep: 0,
  totalSteps: 4,
  stepLabels: [
    'Validating data',
    'Uploading image',
    'Creating tutor',
    'Processing documents'
  ],
  currentStepLabel: '',
  progress: 0,
  ragFiles: [],
  estimatedTimeRemaining: null,
  canCancel: true,
  startTime: null
});



// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Computed properties
const isFormValid = computed(() => {
  return tutorName.value.trim() !== '';
});

// Methods
const resetForm = () => {
  tutorName.value = '';
  tutorType.value = 'general';
  tutorObjective.value = '';
  instructions.value = '';
  selectedFile.value = null;
  selectedFiles.value = [];
  imagePreview.value = '';
  errorMessage.value = '';
  showSuccess.value = false;
  isLoading.value = false;

  // Reset loading state
  loadingState.value = {
    currentStep: 0,
    totalSteps: 4,
    stepLabels: [
      'Validating data',
      'Uploading image',
      'Creating tutor',
      'Processing documents'
    ],
    currentStepLabel: '',
    progress: 0,
    ragFiles: [],
    estimatedTimeRemaining: null,
    canCancel: true,
    startTime: null
  };

  // Reset file inputs
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  if (filesInput.value) {
    filesInput.value.value = '';
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const triggerFilesInput = () => {
  filesInput.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  selectedFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const handleFilesChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  // Filter only PDF and DOCX files for RAG
  const validFiles = Array.from(files).filter(file => {
    const extension = file.name.split('.').pop().toLowerCase();
    return ['pdf', 'docx'].includes(extension);
  });

  if (validFiles.length !== files.length) {
    errorMessage.value = 'Solo se permiten archivos PDF y DOCX para el contexto del tutor';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
  }

  selectedFiles.value = validFiles;
};

const getFileIconClass = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  if (['doc', 'docx'].includes(extension)) {
    return 'fas fa-file-word word-file';
  } else if (['pdf'].includes(extension)) {
    return 'fas fa-file-pdf pdf-file';
  } else if (['xls', 'xlsx'].includes(extension)) {
    return 'fas fa-file-excel excel-file';
  } else if (['ppt', 'pptx'].includes(extension)) {
    return 'fas fa-file-powerpoint powerpoint-file';
  } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'fas fa-file-image image-file';
  } else {
    return 'fas fa-file generic-file';
  }
};

const getFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  if (['doc', 'docx'].includes(extension)) {
    return 'Word';
  } else if (['pdf'].includes(extension)) {
    return 'PDF';
  } else if (['xls', 'xlsx'].includes(extension)) {
    return 'Excel';
  } else if (['ppt', 'pptx'].includes(extension)) {
    return 'PowerPoint';
  } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'Image';
  } else {
    return extension.toUpperCase();
  }
};

const getFileName = (file) => {
  // Return truncated filename if too long
  return file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;
};

// Loading state management functions
const initializeLoadingState = () => {
  isLoading.value = true;
  loadingState.value.startTime = Date.now();
  loadingState.value.currentStep = 0;
  loadingState.value.progress = 0;
  loadingState.value.currentStepLabel = loadingState.value.stepLabels[0];

  // Initialize RAG files tracking
  loadingState.value.ragFiles = selectedFiles.value.map(file => ({
    name: file.name,
    type: getFileType(file),
    status: 'pending',
    progress: 0,
    error: null
  }));
};

const updateLoadingStep = (stepIndex, stepLabel = null) => {
  loadingState.value.currentStep = stepIndex;
  loadingState.value.currentStepLabel = stepLabel || loadingState.value.stepLabels[stepIndex];
  loadingState.value.progress = (stepIndex / loadingState.value.totalSteps) * 100;

  // Update estimated time remaining
  if (loadingState.value.startTime) {
    const elapsed = Date.now() - loadingState.value.startTime;
    const avgTimePerStep = elapsed / (stepIndex + 1);
    const remainingSteps = loadingState.value.totalSteps - stepIndex - 1;
    loadingState.value.estimatedTimeRemaining = Math.ceil((avgTimePerStep * remainingSteps) / 1000);
  }
};

const updateRagFileStatus = (fileName, status, progress = null, error = null) => {
  const fileIndex = loadingState.value.ragFiles.findIndex(f => f.name === fileName);
  if (fileIndex !== -1) {
    loadingState.value.ragFiles[fileIndex].status = status;
    if (progress !== null) {
      loadingState.value.ragFiles[fileIndex].progress = progress;
    }
    if (error) {
      loadingState.value.ragFiles[fileIndex].error = error;
    }
  }
};

const completeLoading = () => {
  loadingState.value.currentStep = loadingState.value.totalSteps;
  loadingState.value.progress = 100;
  loadingState.value.currentStepLabel = 'Complete!';
  loadingState.value.canCancel = false;

  // Brief delay before closing to show completion
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);
};

const cancelCreation = () => {
  if (loadingState.value.canCancel) {
    isLoading.value = false;
    errorMessage.value = 'Tutor creation was cancelled.';
    // Note: In a real implementation, you'd want to cancel any ongoing API calls
  }
};



const createTutor = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    errorMessage.value = '';
    showSuccess.value = false;

    // Initialize loading state
    initializeLoadingState();

    // Step 1: Validate data
    updateLoadingStep(0, 'Validating form data...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

    // Get token from auth store
    const token = authStore.token.value;

    if (!token) {
      throw new Error('Authentication token not found');
    }

    // Step 2: Upload image if provided
    let imageUrl = null;
    if (selectedFile.value) {
      updateLoadingStep(1, 'Uploading tutor image...');

      const formData = new FormData();
      formData.append('image', selectedFile.value);
      formData.append('unidadId', props.unitId);

      const uploadResult = await ApiService.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      imageUrl = uploadResult.url;
    } else {
      // Skip image upload step if no image
      updateLoadingStep(1, 'No image to upload, skipping...');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Step 3: Create the tutor
    updateLoadingStep(2, 'Creating virtual tutor...');

    const tutorData = {
      unidadId: props.unitId,
      nombre: tutorName.value,
      tipo: tutorType.value,
      objetivo: tutorObjective.value,
      instrucciones: instructions.value,
      grupo: props.currentGroup || '',
      configuracion: {},
      imagen: imageUrl
    };

    console.log('Creating tutor with data:', tutorData);

    // Make API call to create tutor
    const response = await ApiService.post('/api/tutores-virtuales', tutorData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Debug logging
    console.log('Raw API response:', response);
    console.log('Response type:', typeof response);
    console.log('Response keys:', response ? Object.keys(response) : 'null/undefined');

    // Validate tutor creation response
    const createdTutor = response.data || response;
    console.log('Processed tutor data:', createdTutor);

    if (!createdTutor || !createdTutor.id) {
      console.error('Invalid tutor response structure:', {
        response,
        createdTutor,
        hasId: createdTutor?.id
      });
      throw new Error('Failed to create tutor: Invalid response from server');
    }

    // Step 4: Process RAG documents if any
    const ragDocuments = [];
    if (selectedFiles.value.length > 0 && createdTutor.id) {
      updateLoadingStep(3, `Processing ${selectedFiles.value.length} document(s)...`);

      for (let i = 0; i < selectedFiles.value.length; i++) {
        const file = selectedFiles.value[i];

        // Update current file status
        updateRagFileStatus(file.name, 'uploading', 0);

        // Validate file type
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx'].includes(fileExtension)) {
          console.warn(`Skipping file ${file.name} - only PDF and DOCX files are supported`);
          updateRagFileStatus(file.name, 'error', 0, 'Unsupported file type');
          continue;
        }

        try {
          const ragFormData = new FormData();
          ragFormData.append('document', file);
          ragFormData.append('tutorVirtualId', createdTutor.id);

          // Update progress to uploading
          updateRagFileStatus(file.name, 'uploading', 25);

          const ragUploadResult = await ApiService.post('/api/rag/upload', ragFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });

          // Update progress to processing
          updateRagFileStatus(file.name, 'processing', 75);

          if (ragUploadResult && ragUploadResult.documento) {
            ragDocuments.push({
              name: file.name,
              type: getFileType(file),
              id: ragUploadResult.documento.id,
              status: ragUploadResult.documento.estado_procesamiento
            });

            // Mark as completed
            updateRagFileStatus(file.name, 'completed', 100);
          }
        } catch (ragError) {
          console.error(`Error uploading RAG document ${file.name}:`, ragError);
          updateRagFileStatus(file.name, 'error', 0, ragError.message || 'Upload failed');
          // Continue with other files even if one fails
        }
      }
    } else {
      // Skip document processing if no files
      updateLoadingStep(3, 'No documents to process, skipping...');
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Complete the loading process
    completeLoading();

    // Emit event to parent component
    emit('tutor-created', {
      ...createdTutor,
      ragDocuments: ragDocuments
    });

    // Close modal after successful creation (handled by completeLoading)
    setTimeout(() => {
      closeModal();
    }, 1200);

  } catch (error) {
    console.error('Error creating tutor:', error);

    // Stop loading and show error
    isLoading.value = false;

    if (error.response?.status === 401) {
      errorMessage.value = 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage.value = 'You do not have permission to create tutors.';
    } else if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = error.message || 'An error occurred while creating the tutor. Please try again.';
    }
  }
};

const closeModal = () => {
  // Prevent closing during loading unless explicitly allowed
  if (isLoading.value && loadingState.value.canCancel) {
    // Show confirmation dialog
    if (confirm('Are you sure you want to cancel the tutor creation process?')) {
      cancelCreation();
      resetForm();
      emit('close');
    }
    return;
  } else if (isLoading.value) {
    // Cannot close during critical operations
    return;
  }

  resetForm();
  emit('close');
};


</script>

<style lang="scss" scoped>
@import './AddTutorModal.scss';
</style>
