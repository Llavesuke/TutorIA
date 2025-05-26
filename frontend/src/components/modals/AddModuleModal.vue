<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Add Module</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Create a new module for a specific grade and class. You will be automatically assigned as the professor for this module.
        </p>

        <form @submit.prevent="createModule" class="module-form">
          <div class="form-group">
            <label for="moduleName" class="form-label">Module Name</label>
            <input
              type="text"
              id="moduleName"
              v-model="moduleName"
              class="form-control"
              placeholder="Mathematics"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="moduleDescription" class="form-label">Description</label>
            <textarea
              id="moduleDescription"
              v-model="moduleDescription"
              class="form-control"
              placeholder="Brief description of the module"
              rows="3"
              :disabled="isLoading"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="moduleGrade" class="form-label">Grade</label>
            <select
              id="moduleGrade"
              v-model="grade"
              class="form-control"
              required
              :disabled="isLoading"
            >
              <option value="" disabled selected>Select a grade</option>
              <option value="1º ESO">1º ESO</option>
              <option value="2º ESO">2º ESO</option>
              <option value="3º ESO">3º ESO</option>
              <option value="4º ESO">4º ESO</option>
              <option value="1º BACH">1º BACH</option>
              <option value="2º BACH">2º BACH</option>
            </select>
          </div>

          <div class="form-group">
            <label for="moduleClass" class="form-label">Class</label>
            <select
              id="moduleClass"
              v-model="classGroup"
              class="form-control"
              required
              :disabled="isLoading"
            >
              <option value="" disabled selected>Select a class</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E</option>
            </select>
            <small class="form-text">Select a class for this module. If the class doesn't exist, it will be created automatically.</small>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>

        <!-- Success message -->
        <div v-if="showSuccess" class="success-container">
          <h4>Module Created Successfully</h4>
          <p>The module has been created and you have been automatically assigned as its professor.</p>
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
          @click="createModule"
          :disabled="!isFormValid || isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> Creating...
          </span>
          <span v-else>
            <i class="fas fa-plus"></i> Create Module
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ModuleService from '@/services/moduleService';
import ClassService from '@/services/classService';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  centerId: {
    type: String,
    required: true
  },
  existingClasses: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['close', 'module-created']);

// State
const moduleName = ref('');
const moduleDescription = ref('');
const grade = ref('');
const classGroup = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Computed
const isFormValid = computed(() => {
  return moduleName.value.trim() !== '' && grade.value !== '' && classGroup.value !== '';
});

// Filter available classes based on selected grade
const availableClasses = computed(() => {
  if (!grade.value) return [];

  return props.existingClasses.filter(c => c.grade === grade.value);
});

// Methods
const resetForm = () => {
  moduleName.value = '';
  moduleDescription.value = '';
  grade.value = '';
  classGroup.value = '';
  errorMessage.value = '';
  isLoading.value = false;
  showSuccess.value = false;
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const createModule = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    console.log('Creating module for center ID:', props.centerId);

    // Always try to create the class (it will be ignored if it already exists)
    if (grade.value && classGroup.value) {
      console.log(`Ensuring class ${grade.value} ${classGroup.value} exists for center ${props.centerId}`);

      try {
        // Add the class using ClassService
        await ClassService.addClass(props.centerId, grade.value, classGroup.value);
        console.log(`Class ${grade.value} ${classGroup.value} created or already exists`);
      } catch (classError) {
        console.error('Error creating class:', classError);
        // Continue with module creation even if class creation fails
      }
    }

    // Create the module using the ModuleService
    const moduleData = {
      centroId: props.centerId,
      nombre: moduleName.value,
      descripcion: moduleDescription.value,
      curso: grade.value,
      clase: classGroup.value || null // Use null if no class is selected
    };

    console.log('Creating module with data:', moduleData);
    const result = await ModuleService.createModule(moduleData);

    console.log('Module created successfully:', result);

    // Show success message
    showSuccess.value = true;

    // Emit event to parent component
    emit('module-created', {
      id: result.id,
      name: moduleName.value,
      description: moduleDescription.value,
      grade: grade.value,
      class: classGroup.value
    });

  } catch (error) {
    console.error('Error creating module:', error);
    errorMessage.value = error.message || 'Failed to create module. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.module-form {
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-error);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.form-text {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;

  &.error-text {
    color: var(--color-error);
  }
}



.success-container {
  background-color: rgba(0, 113, 66, 0.1);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  margin-top: 1rem;

  h4 {
    color: var(--color-forest-green);
    margin-top: 0;
    margin-bottom: 0.75rem;
  }

  p {
    margin-bottom: 0;
  }
}
</style>
