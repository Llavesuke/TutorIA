<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Add Unit</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Create a new unit for this module. Units are organized sections of content within a module.
        </p>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>

        <form @submit.prevent="createUnit" class="unit-form">
          <div class="form-group">
            <label for="unitName" class="form-label">Unit Name</label>
            <input
              type="text"
              id="unitName"
              v-model="unitName"
              class="form-control"
              placeholder="Introduction to the subject"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="unitOrder" class="form-label">Unit Order</label>
            <input
              type="number"
              id="unitOrder"
              v-model="unitOrder"
              class="form-control"
              placeholder="1"
              min="1"
              required
              :disabled="isLoading"
            />
            <small class="form-text">The order in which this unit appears in the module</small>
          </div>
        </form>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Creating unit...</p>
        </div>

        <!-- Success message -->
        <div v-if="showSuccess" class="success-container">
          <h4>Unit Created Successfully</h4>
          <p>The unit has been added to this module.</p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="isLoading"
        >
          {{ showSuccess ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="!showSuccess"
          class="btn btn-primary"
          @click="createUnit"
          :disabled="!isFormValid || isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> Creating...
          </span>
          <span v-else>
            <i class="fas fa-plus"></i> Create Unit
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import UnitService from '@/services/unitService';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  currentUnitsCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['close', 'unit-created']);

// State
const unitName = ref('');
const unitOrder = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    console.log('AddUnitModal opened with props:', {
      moduleId: props.moduleId,
      currentUnitsCount: props.currentUnitsCount
    });
    resetForm();
    // Set default order to next available number
    unitOrder.value = props.currentUnitsCount + 1;
  }
});

// Computed
const isFormValid = computed(() => {
  return unitName.value.trim() !== '' && unitOrder.value !== '';
});

// Methods
const resetForm = () => {
  unitName.value = '';
  unitOrder.value = '';
  errorMessage.value = '';
  isLoading.value = false;
  showSuccess.value = false;
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const createUnit = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  // Validate moduleId
  if (!props.moduleId) {
    errorMessage.value = 'Module ID is required but not provided';
    console.error('Module ID is missing:', props.moduleId);
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Create the unit using the UnitService
    const unitData = {
      moduloId: props.moduleId,
      nombre: unitName.value,
      orden: parseInt(unitOrder.value)
    };

    console.log('Creating unit with data:', unitData);
    console.log('Module ID being sent:', props.moduleId);

    const result = await UnitService.createUnit(unitData);

    console.log('Unit created successfully:', result);

    // Show success message
    showSuccess.value = true;

    // Emit event to parent component
    emit('unit-created', {
      id: result.id,
      name: unitName.value,
      order: parseInt(unitOrder.value)
    });

  } catch (error) {
    console.error('Error creating unit:', error);
    errorMessage.value = error.message || 'Failed to create unit. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;

  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.modal {
  background-color: var(--color-carbon);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &.active {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  color: var(--color-cashmere);
  font-size: 1.5rem;
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-cashmere);
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
}

.modal-body {
  padding: 1.5rem;
}

.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-cashmere);
  opacity: 0.8;
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
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: var(--color-dark-bg);
  color: var(--color-cashmere);
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--color-deep-green);
  }
}

.form-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--color-cashmere);
  opacity: 0.7;
}

.error-message {
  background-color: rgba(220, 53, 69, 0.2);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-deep-green);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.success-container {
  text-align: center;
  padding: 1.5rem;
  color: var(--color-cashmere);

  h4 {
    color: var(--color-deep-green);
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  font-family: 'Poppins', sans-serif;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--color-cashmere);

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.btn-primary {
  background-color: var(--color-deep-green);
  color: white;

  &:hover:not(:disabled) {
    background-color: darken(#007142, 5%);
  }
}
</style>
