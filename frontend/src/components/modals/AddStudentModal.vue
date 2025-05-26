<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Add Student</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Create a new student account. The system will generate a username and temporary password.
        </p>

        <form @submit.prevent="createStudent" class="student-form">
          <div class="form-group">
            <label for="studentName" class="form-label">Full Name</label>
            <input
              type="text"
              id="studentName"
              v-model="fullName"
              class="form-control"
              placeholder="John Doe"
              required
              :disabled="isLoading"
            />
          </div>

          <div class="form-group">
            <label for="studentGrade" class="form-label">Grade</label>
            <select
              id="studentGrade"
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
            <label for="studentClass" class="form-label">Class</label>
            <select
              id="studentClass"
              v-model="classGroup"
              class="form-control"
              required
              :disabled="isLoading"
            >
              <option value="" disabled selected>Select a class</option>
              <option v-for="classOption in availableClasses" :key="classOption" :value="classOption">
                {{ classOption }}
              </option>
              <option v-if="!availableClasses.includes('A')" value="A">A</option>
              <option v-if="!availableClasses.includes('B')" value="B">B</option>
              <option v-if="!availableClasses.includes('C')" value="C">C</option>
              <option v-if="!availableClasses.includes('D')" value="D">D</option>
            </select>
            <small class="form-text">
              {{ isNewClass ? 'This will create a new class.' : 'Select an existing class or create a new one.' }}
            </small>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </form>

        <!-- Credentials display section (shown after student creation) -->
        <div v-if="showCredentials" class="credentials-container">
          <h4>Student Account Created</h4>
          <div class="credentials-box">
            <div class="credential-item">
              <span class="credential-label">Username:</span>
              <span class="credential-value">{{ generatedUsername }}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Temporary Password:</span>
              <span class="credential-value">{{ generatedPassword }}</span>
              <button class="copy-btn" @click="copyToClipboard(generatedPassword)" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <p class="credentials-note">
            <i class="fas fa-info-circle"></i>
            Please save these credentials. The password will only be shown once.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="isLoading"
        >
          {{ showCredentials ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="!showCredentials"
          class="btn btn-primary"
          @click="createStudent"
          :disabled="!isFormValid || isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> Creating...
          </span>
          <span v-else>
            <i class="fas fa-plus"></i> Create Student
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import authStore from '@/stores/authStore';
import AuthService from '@/services/authService';

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

const emit = defineEmits(['close', 'student-created']);

// State
const fullName = ref('');
const grade = ref('');
const classGroup = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const showCredentials = ref(false);
const generatedUsername = ref('');
const generatedPassword = ref('');

// Reset form when modal opens
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Computed
const isFormValid = computed(() => {
  return fullName.value.trim() !== '' && grade.value !== '' && classGroup.value !== '';
});

// Get available classes for the selected grade
const availableClasses = computed(() => {
  if (!grade.value) return [];

  // Filter classes for the selected grade
  const classesForGrade = props.existingClasses
    .filter(c => c.grade === grade.value)
    .map(c => c.class);

  return classesForGrade;
});

// Check if the selected grade and class combination already exists
const isExistingClass = computed(() => {
  return props.existingClasses.some(c =>
    c.grade === grade.value && c.class === classGroup.value
  );
});

// Check if this is a new class
const isNewClass = computed(() => {
  return grade.value && classGroup.value && !isExistingClass.value;
});

// Methods
const resetForm = () => {
  fullName.value = '';
  grade.value = '';
  classGroup.value = '';
  errorMessage.value = '';
  isLoading.value = false;
  showCredentials.value = false;
  generatedUsername.value = '';
  generatedPassword.value = '';
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

// Generate a username based on the student's name
const generateUsername = (name) => {
  // Remove accents and special characters
  const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Convert to lowercase and replace spaces with dots
  const formattedName = normalizedName.toLowerCase().replace(/\s+/g, '.');

  // Add a random number to ensure uniqueness
  const randomNum = Math.floor(Math.random() * 1000);

  return `${formattedName}.${randomNum}`;
};

// Generate a random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';

  // Generate a random 8-character password
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Password copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy password: ', err);
    });
};

const createStudent = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Generate username and password
    generatedUsername.value = generateUsername(fullName.value);
    generatedPassword.value = generatePassword();

    console.log('Creating student with center ID:', props.centerId);

    // Create the student using the AuthService
    const userData = {
      centroId: props.centerId,
      rol: 'estudiante',
      nombreUsuario: generatedUsername.value,
      nombreReal: fullName.value,
      password: generatedPassword.value,
      curso: grade.value,
      clase: classGroup.value,
      email: null // Explícitamente establecer el email como null para estudiantes
    };

    console.log('Registering student with data:', { ...userData, password: '***REDACTED***' });
    const result = await AuthService.register(userData);

    console.log('Student created successfully:', result);

    // Show credentials
    showCredentials.value = true;

    // Check if we need to add a new class to the existing classes
    const newClassCreated = !isExistingClass.value;

    // Emit event to parent component with info about whether a new class was created
    emit('student-created', {
      name: fullName.value,
      grade: grade.value,
      class: classGroup.value,
      username: generatedUsername.value,
      id: result.user?.id,
      newClassCreated: newClassCreated
    });

  } catch (error) {
    console.error('Error creating student:', error);
    errorMessage.value = error.message || 'Failed to create student. Please try again.';
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

.student-form {
  margin-bottom: 1rem;
}

.error-message {
  color: var(--color-error);
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.credentials-container {
  background-color: rgba(0, 113, 66, 0.1);
  border-radius: var(--border-radius-md);
  padding: 1rem;
  margin-top: 1rem;

  h4 {
    color: var(--color-forest-green);
    margin-top: 0;
    margin-bottom: 0.75rem;
  }
}

.credentials-box {
  background-color: var(--color-carbon);
  border-radius: var(--border-radius-sm);
  padding: 1rem;
  margin-bottom: 0.75rem;
}

.credential-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.credential-label {
  font-weight: var(--font-weight-medium);
  margin-right: 0.5rem;
  color: var(--color-text-light);
}

.credential-value {
  font-family: var(--font-family-monospace);
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  flex-grow: 1;
}

.copy-btn {
  background: none;
  border: none;
  color: var(--color-text-light);
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  transition: color var(--transition-normal);

  &:hover {
    color: var(--color-forest-green);
  }
}

.credentials-note {
  font-size: 0.85rem;
  color: var(--color-text-light);
  margin-bottom: 0;

  i {
    color: var(--color-forest-green);
  }
}
</style>
