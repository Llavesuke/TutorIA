<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Assign Professor to Module</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Select a professor to assign to this module. Multiple professors can be assigned to the same module.
        </p>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading professors...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Professor selection form -->
        <form v-else @submit.prevent="assignProfessor" class="assign-form">
          <div v-if="availableProfessors.length === 0" class="no-professors">
            <p>No available professors to assign. All professors are already assigned to this module or there are no professors in this educational center.</p>
          </div>

          <div v-else class="form-group">
            <label for="professorSelect" class="form-label">Select Professor</label>
            <select
              id="professorSelect"
              v-model="selectedProfessorId"
              class="form-control"
              required
              :disabled="isSubmitting"
            >
              <option value="" disabled selected>Select a professor</option>
              <option
                v-for="professor in availableProfessors"
                :key="professor.id"
                :value="professor.id"
              >
                {{ professor.name }}
              </option>
            </select>
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="isSubmitting"
        >
          Close
        </button>
        <button
          v-if="availableProfessors.length > 0"
          class="btn btn-primary"
          @click="assignProfessor"
          :disabled="!selectedProfessorId || isSubmitting"
        >
          <span v-if="isSubmitting">
            <i class="fas fa-spinner fa-spin"></i> Assigning...
          </span>
          <span v-else>
            <i class="fas fa-user-plus"></i> Assign Professor
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import UserService from '@/services/userService';
import ModuleService from '@/services/moduleService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  centerId: {
    type: String,
    required: true
  },
  moduleId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close', 'professor-assigned']);

// State
const availableProfessors = ref([]);
const selectedProfessorId = ref('');
const isLoading = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Fetch available professors when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    fetchAvailableProfessors();
    selectedProfessorId.value = '';
    successMessage.value = '';
    errorMessage.value = '';
  }
});

// Also fetch when moduleId changes
watch(() => props.moduleId, () => {
  if (props.isOpen) {
    fetchAvailableProfessors();
  }
});

const fetchAvailableProfessors = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // 1. Fetch all professors from the center
    const allProfessors = await UserService.getUsersByRole('profesor', props.centerId);
    console.log('All professors from center:', allProfessors);

    // 2. Fetch professors already assigned to this module
    const assignedProfessors = await ModuleService.getProfessorsByModule(props.moduleId);
    console.log('Professors already assigned to module:', assignedProfessors);

    // 3. Filter out professors already assigned to this module
    const assignedIds = new Set(assignedProfessors.map(p => p.id));

    // 4. Format the professors for the dropdown
    availableProfessors.value = allProfessors
      .filter(p => !assignedIds.has(p.id))
      .map(p => ({
        id: p.id,
        name: p.nombre_real || p.name
      }));

    console.log('Available professors for assignment:', availableProfessors.value);

  } catch (error) {
    console.error('Error fetching available professors:', error);
    errorMessage.value = 'Failed to load professors. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const assignProfessor = async () => {
  if (!selectedProfessorId.value) {
    errorMessage.value = 'Please select a professor';
    return;
  }

  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    successMessage.value = '';

    // Find the selected professor's name for the success message
    const professor = availableProfessors.value.find(p => p.id === selectedProfessorId.value);

    if (!professor) {
      throw new Error('Selected professor not found');
    }

    console.log(`Assigning professor ${professor.name} (${selectedProfessorId.value}) to module ${props.moduleId}`);

    // Call the API to assign the professor to the module
    await ModuleService.assignProfessorToModule(selectedProfessorId.value, props.moduleId);

    // Show success message
    successMessage.value = `Professor ${professor.name} has been assigned to the module.`;

    // Remove the assigned professor from the available list
    availableProfessors.value = availableProfessors.value.filter(p => p.id !== selectedProfessorId.value);

    // Reset selection
    const professorId = selectedProfessorId.value;
    selectedProfessorId.value = '';

    // Emit event to parent component
    emit('professor-assigned', {
      moduleId: props.moduleId,
      professorId: professorId,
      professorName: professor.name
    });

  } catch (error) {
    console.error('Error assigning professor:', error);
    errorMessage.value = 'Failed to assign professor. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};

onMounted(() => {
  if (props.isOpen) {
    fetchAvailableProfessors();
  }
});
</script>

<style lang="scss" scoped>
.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(230, 83, 29, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-orange);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--color-error);
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(230, 83, 29, 0.1);
  border-left: 4px solid var(--color-orange);
  border-radius: 4px;
}

.success-message {
  color: var(--color-forest-green);
  margin: 1rem 0;
  padding: 0.75rem;
  background-color: rgba(0, 113, 66, 0.1);
  border-left: 4px solid var(--color-forest-green);
  border-radius: 4px;
}

.no-professors {
  color: var(--color-text-light);
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  text-align: center;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-cashmere);
  font-weight: var(--font-weight-medium);
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: var(--color-cashmere);

  &:focus {
    outline: none;
    border-color: var(--color-forest-green);
    box-shadow: 0 0 0 2px rgba(0, 113, 66, 0.2);
  }
}
</style>
