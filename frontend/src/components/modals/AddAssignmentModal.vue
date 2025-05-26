<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Create Assignment</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Create a new assignment for this unit. Students will be able to submit text responses or upload documents/images.
        </p>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="showSuccess" class="success-message">
          <i class="fas fa-check-circle"></i> Assignment created successfully!
        </div>

        <form @submit.prevent="createAssignment" class="assignment-form">
          <div class="form-group">
            <label for="assignmentTitle" class="form-label">Assignment Title</label>
            <input
              type="text"
              id="assignmentTitle"
              v-model="assignmentTitle"
              class="form-control"
              placeholder="Research on Cavemen Culture"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="assignmentDescription" class="form-label">Description</label>
            <textarea
              id="assignmentDescription"
              v-model="assignmentDescription"
              class="form-control"
              placeholder="Describe the assignment and what students need to do..."
              rows="4"
              required
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="dueDate" class="form-label">Due Date</label>
              <input
                type="date"
                id="dueDate"
                v-model="dueDate"
                class="form-control"
                required
                :disabled="isLoading"
              />
            </div>

            <div class="form-group">
              <label for="dueTime" class="form-label">Due Time</label>
              <input
                type="time"
                id="dueTime"
                v-model="dueTime"
                class="form-control"
                required
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="maxPoints" class="form-label">Maximum Points</label>
            <input
              type="number"
              id="maxPoints"
              v-model="maxPoints"
              class="form-control"
              placeholder="100"
              min="1"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Submission Types Allowed</label>
            <div class="checkbox-group">
              <div class="checkbox-item">
                <input
                  type="checkbox"
                  id="allowText"
                  v-model="allowText"
                  :disabled="isLoading"
                />
                <label for="allowText">Text</label>
              </div>
              <div class="checkbox-item">
                <input
                  type="checkbox"
                  id="allowFiles"
                  v-model="allowFiles"
                  :disabled="isLoading"
                />
                <label for="allowFiles">Files (Documents/Images)</label>
              </div>
            </div>
          </div>

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
              <span v-else>Create Assignment</span>
            </button>
          </div>
        </form>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Creating assignment...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AssignmentService from '@/services/assignmentService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  unitId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'assignment-created']);

// State
const assignmentTitle = ref('');
const assignmentDescription = ref('');
const dueDate = ref('');
const dueTime = ref('');
const maxPoints = ref(100);
const allowText = ref(true);
const allowFiles = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Computed properties
const isFormValid = computed(() => {
  return (
    assignmentTitle.value.trim() !== '' &&
    assignmentDescription.value.trim() !== '' &&
    dueDate.value !== '' &&
    dueTime.value !== '' &&
    maxPoints.value > 0 &&
    (allowText.value || allowFiles.value)
  );
});

// Methods
const resetForm = () => {
  assignmentTitle.value = '';
  assignmentDescription.value = '';
  dueDate.value = '';
  dueTime.value = '';
  maxPoints.value = 100;
  allowText.value = true;
  allowFiles.value = true;
  errorMessage.value = '';
  showSuccess.value = false;
};

const createAssignment = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Combine date and time for due date
    const dueDateTimeString = `${dueDate.value}T${dueTime.value}:00`;
    const dueDateTime = new Date(dueDateTimeString);

    // Create the assignment using the API
    const assignmentData = {
      unidadId: props.unitId,
      titulo: assignmentTitle.value,
      descripcion: assignmentDescription.value,
      fechaEntrega: dueDateTime.toISOString(),
      puntuacionMaxima: parseInt(maxPoints.value),
      permitirTexto: allowText.value,
      permitirArchivos: allowFiles.value
    };

    console.log('Creating assignment with data:', assignmentData);
    
    // TODO: Replace with actual API call when implemented
    // For now, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate a response
    const result = {
      id: 'temp-' + Date.now(),
      ...assignmentData,
      fechaCreacion: new Date().toISOString()
    };

    console.log('Assignment created successfully:', result);

    // Show success message
    showSuccess.value = true;

    // Emit event to parent component
    emit('assignment-created', result);

    // Close modal after a short delay
    setTimeout(() => {
      closeModal();
    }, 1500);

  } catch (error) {
    console.error('Error creating assignment:', error);
    errorMessage.value = error.message || 'Failed to create assignment. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (!isLoading.value) {
    resetForm();
    emit('close');
  }
};
</script>

<style lang="scss" scoped>
@import '@/assets/sass/components/modals';

.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.assignment-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  
  .form-group {
    flex: 1;
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    input[type="checkbox"] {
      width: auto;
    }
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}
</style>
