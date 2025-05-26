<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal tutor-modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h1 class="modal-title">Edit tutor</h1>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
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
          <i class="fas fa-check-circle"></i> Tutor updated successfully!
        </div>

        <form @submit.prevent="updateTutor" class="tutor-form">
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
              <div v-else-if="tutor.imagen" class="image-preview">
                <img :src="tutor.imagen" alt="Tutor image" />
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

          <!-- Tutor objective -->
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

          <!-- Instructions section -->
          <div class="form-group">
            <label class="form-label">Specific Instructions</label>
            <div class="instructions-info">
              <i class="fas fa-info-circle"></i>
              <span>All tutors include a predefined system prompt that encourages active learning and critical thinking. These specific instructions will be added to that prompt.</span>
            </div>
            <div class="instructions-container">
              <textarea
                v-model="instructions"
                class="instructions-textarea orange-input"
                placeholder="Provide specific instructions for this tutor. For example: 'This tutor should help students understand the basics of prehistoric art and guide them through their assignments.'"
                :disabled="isLoading"
              ></textarea>
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
                <i class="fas fa-spinner fa-spin"></i> Updating...
              </span>
              <span v-else>Update Tutor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import ApiService from '@/services/apiService';
import TutorService from '@/services/tutorService';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  tutor: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'tutor-updated']);

// State
const tutorName = ref('');
const tutorType = ref('general');
const tutorObjective = ref('');
const instructions = ref('');
const fileInput = ref(null);
const selectedFile = ref(null);
const imagePreview = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Initialize form with tutor data when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.tutor) {
    initializeForm();
  }
});

// Also initialize when tutor prop changes
watch(() => props.tutor, (newValue) => {
  if (props.isOpen && newValue) {
    initializeForm();
  }
});

// Initialize form with tutor data
const initializeForm = () => {
  tutorName.value = props.tutor.nombre || '';
  tutorType.value = props.tutor.tipo || 'general';
  tutorObjective.value = props.tutor.objetivo || '';
  instructions.value = props.tutor.instrucciones || '';
  imagePreview.value = '';
  selectedFile.value = null;
  errorMessage.value = '';
  showSuccess.value = false;
};

// Computed properties
const isFormValid = computed(() => {
  return tutorName.value.trim() !== '';
});

// Methods
const triggerFileInput = () => {
  if (!isLoading.value) {
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const updateTutor = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Get token from auth store
    const token = authStore.token.value;

    // Prepare form data for file upload if there's a file
    let imageUrl = props.tutor.imagen;
    if (selectedFile.value) {
      const formData = new FormData();
      formData.append('image', selectedFile.value);
      formData.append('unidadId', props.tutor.unidad_id);

      // Upload image to Cloudinary via backend
      const uploadResult = await ApiService.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      imageUrl = uploadResult.url;
    }

    // Update the tutor using the API
    const tutorData = {
      nombre: tutorName.value,
      tipo: tutorType.value,
      objetivo: tutorObjective.value,
      instrucciones: instructions.value,
      imagen: imageUrl,
      activo: props.tutor.active
    };

    console.log('Updating tutor with data:', tutorData);

    // Make API call to update tutor
    const response = await TutorService.updateTutor(props.tutor.id, tutorData);

    console.log('Tutor updated successfully:', response);

    // Show success message
    showSuccess.value = true;

    // Emit event to parent component
    emit('tutor-updated', {
      ...props.tutor,
      ...tutorData
    });

    // Close modal after a short delay
    setTimeout(() => {
      closeModal();
    }, 1500);

  } catch (error) {
    console.error('Error updating tutor:', error);
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to update tutor. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

// Initialize form when component is mounted
onMounted(() => {
  if (props.isOpen && props.tutor) {
    initializeForm();
  }
});
</script>

<style lang="scss" scoped>
@import '@/assets/sass/components/modals';

.tutor-modal {
  max-width: 500px;
  background-color: #171717;
  border-radius: 12px;

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;

    .modal-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #FEF0D1;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .modal-close {
      color: #FEF0D1;
      font-size: 1.2rem;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      padding: 0.5rem;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(230, 83, 29, 0.8);
        transform: scale(1.1);
      }
    }
  }

  .modal-body {
    padding: 1rem 1.5rem 1.5rem;

    // Apply custom scrollbar to modal body
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(23, 23, 23, 0.8);
      border-radius: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, var(--color-deep-koamaru), var(--color-vivid-orange));
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, var(--color-vivid-orange), var(--color-forest-green));
      }
    }
  }
}

.tutor-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #FEF0D1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.hidden {
    display: none;
  }

  .form-label {
    font-size: 1rem;
    font-weight: 500;
    color: #FEF0D1;
  }

  .form-control {
    // Use the global modal form control styles
    // Override specific styling if needed

    &.orange-input {
      background-color: #e6531d;
      border-color: rgba(230, 83, 29, 0.6);
      color: #FEF0D1;

      &::placeholder {
        color: rgba(254, 240, 209, 0.8);
      }

      &:focus {
        border-color: var(--color-forest-green);
        box-shadow: 0 4px 12px rgba(0, 113, 66, 0.25), 0 0 0 3px rgba(0, 113, 66, 0.1);
      }
    }

    &.dark-input {
      background-color: #2a2a2a;
      border-color: rgba(255, 255, 255, 0.2);
      color: #FEF0D1;

      &::placeholder {
        color: rgba(254, 240, 209, 0.6);
      }

      &:focus {
        border-color: var(--color-vivid-orange);
        box-shadow: 0 4px 12px rgba(230, 83, 29, 0.25), 0 0 0 3px rgba(230, 83, 29, 0.1);
      }
    }
  }
}

.image-upload-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;

  .image-upload-container {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    background-color: #2a2a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }

    .hidden-file-input {
      display: none;
    }

    .image-preview {
      width: 100%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #FEF0D1;
      opacity: 0.7;

      i {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      span {
        font-size: 0.8rem;
      }
    }
  }
}

.instructions-info {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  font-size: 0.9rem;

  i {
    color: #e6531d;
    margin-top: 0.2rem;
  }
}

.instructions-container {
  position: relative;

  .instructions-textarea {
    width: 100%;
    min-height: 120px;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: none;
    resize: vertical;
    background-color: #e6531d;
    color: #FEF0D1;

    &::placeholder {
      color: rgba(254, 240, 209, 0.7);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;

  .cancel-btn, .submit-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cancel-btn {
    background-color: transparent;
    color: #FEF0D1;
    border: 1px solid rgba(254, 240, 209, 0.3);

    &:hover:not(:disabled) {
      border-color: rgba(254, 240, 209, 0.6);
    }
  }

  .submit-btn {
    background-color: #007142;
    color: white;

    &:hover:not(:disabled) {
      background-color: darken(#007142, 5%);
    }
  }
}

.error-message, .success-message {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.success-message {
  background-color: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}
</style>
