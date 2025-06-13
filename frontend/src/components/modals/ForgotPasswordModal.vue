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

<style lang="scss" scoped>
@import '@/assets/sass/components/forgot_password_modal';
</style>
