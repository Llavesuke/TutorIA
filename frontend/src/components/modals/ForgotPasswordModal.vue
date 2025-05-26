<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">Forgot Password</h3>
        <button class="modal-close" @click="closeModal" :disabled="isLoading" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <p class="modal-description">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>

        <!-- Success message -->
        <div v-if="successMessage" class="success-message">
          <i class="fas fa-check-circle"></i> {{ successMessage }}
        </div>

        <!-- Form -->
        <form v-if="!successMessage" @submit.prevent="handleSubmit" class="forgot-password-form">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              type="email"
              id="email"
              v-model="email"
              class="form-control"
              :class="{ 'is-invalid': emailError }"
              placeholder="Enter your email address"
              required
              :disabled="isLoading"
            />
            <div v-if="emailError" class="invalid-feedback">
              {{ emailError }}
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeModal"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isLoading || !isValidEmail"
            >
              <span v-if="isLoading">
                <i class="fas fa-spinner fa-spin"></i> Sending...
              </span>
              <span v-else>
                <i class="fas fa-paper-plane"></i> Send Reset Link
              </span>
            </button>
          </div>
        </form>

        <!-- Success state actions -->
        <div v-if="successMessage" class="form-actions">
          <button
            type="button"
            class="btn btn-primary"
            @click="closeModal"
          >
            <i class="fas fa-check"></i> Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AuthService from '@/services/authService';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['close']);

// State
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const emailError = ref('');

// Computed
const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.value);
});

// Watch for modal open/close to reset form
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm();
  }
});

// Methods
const resetForm = () => {
  email.value = '';
  errorMessage.value = '';
  successMessage.value = '';
  emailError.value = '';
  isLoading.value = false;
};

const validateEmail = () => {
  emailError.value = '';

  if (!email.value) {
    emailError.value = 'Email is required';
    return false;
  }

  if (!isValidEmail.value) {
    emailError.value = 'Please enter a valid email address';
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  // Reset messages
  errorMessage.value = '';
  successMessage.value = '';

  // Validate form
  if (!validateEmail()) {
    return;
  }

  isLoading.value = true;

  try {
    const result = await AuthService.forgotPassword(email.value);

    if (result.success) {
      successMessage.value = result.message || 'If the email exists in our system, you will receive a password reset link.';
      console.log('Password reset email sent successfully');
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    errorMessage.value = error.message || 'An error occurred while sending the reset email. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};
</script>

<style scoped>
.modal-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.forgot-password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.form-control:focus {
  outline: none;
  border-color: #e6531d;
  box-shadow: 0 0 0 2px rgba(230, 83, 29, 0.2);
}

.form-control:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-control.is-invalid {
  border-color: var(--color-error);
}

.invalid-feedback {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #e6531d 0%, #d44819 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(230, 83, 29, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #d44819 0%, #c23e15 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(230, 83, 29, 0.4);
}

.btn-secondary {
  background-color: var(--color-background-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: var(--color-error);
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.success-message {
  background-color: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
  color: var(--color-success);
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
