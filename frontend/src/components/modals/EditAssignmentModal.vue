<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Edit Assignment</h3>
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
          <i class="fas fa-check-circle"></i> Assignment updated successfully!
        </div>

        <form @submit.prevent="updateAssignment" class="assignment-form">
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
              min="1"
              max="100"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Submission Options</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="allowText"
                  :disabled="isLoading"
                />
                <span>Allow text submissions</span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="allowFiles"
                  :disabled="isLoading"
                />
                <span>Allow file uploads</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assignment Status</label>
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="isActive"
                  :disabled="isLoading"
                />
                <span>Active (visible to students)</span>
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="submit-btn"
              :disabled="!isFormValid || isLoading"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Updating...
              </span>
              <span v-else>
                <i class="fas fa-save"></i> Update Assignment
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import AssignmentService from '@/services/assignmentService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  assignment: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'assignment-updated']);

// State
const assignmentTitle = ref('');
const assignmentDescription = ref('');
const dueDate = ref('');
const dueTime = ref('');
const maxPoints = ref(100);
const allowText = ref(true);
const allowFiles = ref(true);
const isActive = ref(true);
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Initialize form with assignment data when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue && props.assignment) {
    initializeForm();
  }
});

// Also initialize when assignment prop changes
watch(() => props.assignment, (newValue) => {
  if (props.isOpen && newValue) {
    initializeForm();
  }
});

// Initialize form with assignment data
const initializeForm = () => {
  assignmentTitle.value = props.assignment.titulo || '';
  assignmentDescription.value = props.assignment.descripcion || '';
  
  // Handle due date and time
  const dueDateStr = props.assignment.fechaEntrega || props.assignment.fecha_entrega;
  if (dueDateStr) {
    const dueDateTime = new Date(dueDateStr);
    
    // Format date as YYYY-MM-DD for input[type="date"]
    dueDate.value = dueDateTime.toISOString().split('T')[0];
    
    // Format time as HH:MM for input[type="time"]
    const hours = dueDateTime.getHours().toString().padStart(2, '0');
    const minutes = dueDateTime.getMinutes().toString().padStart(2, '0');
    dueTime.value = `${hours}:${minutes}`;
  } else {
    // Default to tomorrow at noon
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    
    dueDate.value = tomorrow.toISOString().split('T')[0];
    dueTime.value = '12:00';
  }
  
  // Set other fields
  maxPoints.value = props.assignment.puntuacionMaxima || props.assignment.puntuacion_maxima || 100;
  allowText.value = props.assignment.permitirTexto !== undefined ? props.assignment.permitirTexto : 
                    props.assignment.permitir_texto !== undefined ? props.assignment.permitir_texto : true;
  allowFiles.value = props.assignment.permitirArchivos !== undefined ? props.assignment.permitirArchivos : 
                     props.assignment.permitir_archivos !== undefined ? props.assignment.permitir_archivos : true;
  isActive.value = props.assignment.active !== undefined ? props.assignment.active : 
                   props.assignment.activo !== undefined ? props.assignment.activo : true;
  
  errorMessage.value = '';
  showSuccess.value = false;
};

// Computed properties
const isFormValid = computed(() => {
  return assignmentTitle.value.trim() !== '' && 
         assignmentDescription.value.trim() !== '' && 
         dueDate.value && 
         dueTime.value && 
         maxPoints.value > 0 && 
         (allowText.value || allowFiles.value); // At least one submission method must be allowed
});

const updateAssignment = async () => {
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

    // Create the assignment data
    const assignmentData = {
      titulo: assignmentTitle.value,
      descripcion: assignmentDescription.value,
      fechaEntrega: dueDateTime.toISOString(),
      puntuacionMaxima: parseInt(maxPoints.value),
      permitirTexto: allowText.value,
      permitirArchivos: allowFiles.value,
      activo: isActive.value
    };

    console.log('Updating assignment with data:', assignmentData);
    
    // Call API to update assignment
    const updatedAssignment = await AssignmentService.updateAssignment(props.assignment.id, assignmentData);
    
    console.log('Assignment updated successfully:', updatedAssignment);

    // Show success message
    showSuccess.value = true;

    // Emit event to parent component
    emit('assignment-updated', {
      ...props.assignment,
      ...assignmentData,
      id: props.assignment.id
    });

    // Close modal after a short delay
    setTimeout(() => {
      closeModal();
    }, 1500);

  } catch (error) {
    console.error('Error updating assignment:', error);
    errorMessage.value = error.message || 'Failed to update assignment. Please try again.';
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
  if (props.isOpen && props.assignment) {
    initializeForm();
  }
});
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

.form-group {
  .form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: var(--font-weight-medium);
    color: var(--color-cashmere);
  }
  
  .form-control {
    width: 100%;
    padding: 0.75rem;
    background-color: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: var(--color-cashmere);
    
    &:focus {
      outline: none;
      border-color: var(--color-orange);
    }
  }
  
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      
      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
  
  .submit-btn {
    padding: 0.75rem 1.5rem;
    background-color: var(--color-forest-green);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: background-color 0.2s;
    
    &:hover:not(:disabled) {
      background-color: darken(#007142, 5%);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.error-message, .success-message {
  padding: 1rem;
  border-radius: 4px;
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
