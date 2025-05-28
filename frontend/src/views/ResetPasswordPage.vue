<template>
  <div class="reset-password-page">
    <!-- Background component -->
    <OriginalSvgBackground />

    <!-- Dark overlay -->
    <div class="dark-overlay"></div>

    <!-- Content container -->
    <div class="reset-password-container">
      <!-- Logo -->
      <div class="logo-container">
        <h1 class="logo">TutorIA</h1>
      </div>

      <!-- Title -->
      <h1 class="reset-password-title">Reset Your Password</h1>

      <!-- Loading state -->
      <div v-if="isValidatingToken" class="loading-container">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <p>Validating reset token...</p>
      </div>

      <!-- Invalid token state -->
      <div v-else-if="!isTokenValid" class="error-container">
        <div class="error-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h2>Invalid or Expired Link</h2>
        <p>This password reset link is invalid or has expired. Please request a new password reset.</p>
        <button @click="goToLogin" class="btn btn-primary">
          <i class="fas fa-arrow-left"></i> Back to Login
        </button>
      </div>

      <!-- Reset password form -->
      <div v-else class="reset-form-container">
        <!-- Success message -->
        <div v-if="successMessage" class="success-container">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2>Password Reset Successful</h2>
          <p>{{ successMessage }}</p>
          <button @click="goToLogin" class="btn btn-primary">
            <i class="fas fa-sign-in-alt"></i> Go to Login
          </button>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="reset-password-form">
          <div v-if="errorMessage" class="error-message">
            <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
          </div>

          <div class="form-group">
            <label for="newPassword" class="form-label">New Password</label>
            <input
              type="password"
              id="newPassword"
              v-model="newPassword"
              class="form-control"
              :class="{ 'is-invalid': passwordError }"
              placeholder="Enter your new password"
              required
              :disabled="isLoading"
            />
            <div v-if="passwordError" class="invalid-feedback">
              {{ passwordError }}
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              class="form-control"
              :class="{ 'is-invalid': confirmPasswordError }"
              placeholder="Confirm your new password"
              required
              :disabled="isLoading"
            />
            <div v-if="confirmPasswordError" class="invalid-feedback">
              {{ confirmPasswordError }}
            </div>
          </div>

          <button
            type="submit"
            class="reset-button"
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> Resetting Password...
            </span>
            <span v-else>
              <i class="fas fa-key"></i> Reset Password
            </span>
          </button>
        </form>
      </div>

      <!-- Back to login link -->
      <div v-if="!successMessage" class="back-to-login">
        <a href="#" @click.prevent="goToLogin" class="back-link">
          <i class="fas fa-arrow-left"></i> Back to Login
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AuthService from '@/services/authService';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';

const router = useRouter();
const route = useRoute();

// State
const token = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const isValidatingToken = ref(true);
const isTokenValid = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

// Computed
const isFormValid = computed(() => {
  return newPassword.value.length >= 6 &&
         newPassword.value === confirmPassword.value &&
         !passwordError.value &&
         !confirmPasswordError.value;
});

// Methods
const validateForm = () => {
  passwordError.value = '';
  confirmPasswordError.value = '';

  if (!newPassword.value) {
    passwordError.value = 'Password is required';
    return false;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long';
    return false;
  }

  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Please confirm your password';
    return false;
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match';
    return false;
  }

  return true;
};

const validateToken = async () => {
  try {
    isValidatingToken.value = true;

    if (!token.value) {
      isTokenValid.value = false;
      return;
    }

    const result = await AuthService.validateResetToken(token.value);
    isTokenValid.value = result.valid;

    if (!result.valid) {
      console.error('Token validation failed:', result.message);
    }
  } catch (error) {
    console.error('Token validation error:', error);
    isTokenValid.value = false;
  } finally {
    isValidatingToken.value = false;
  }
};

const handleSubmit = async () => {
  // Reset messages
  errorMessage.value = '';
  successMessage.value = '';

  // Validate form
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    const result = await AuthService.resetPassword(token.value, newPassword.value);

    if (result.success) {
      successMessage.value = result.message || 'Your password has been reset successfully. You can now log in with your new password.';
      console.log('Password reset successful');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    errorMessage.value = error.message || 'An error occurred while resetting your password. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};

// Lifecycle
onMounted(async () => {
  // Get token from query parameters
  token.value = route.query.token || '';

  if (token.value) {
    await validateToken();
  } else {
    isValidatingToken.value = false;
    isTokenValid.value = false;
  }
});
</script>

<style lang="scss" scoped>
@import './ResetPasswordPage.scss';
</style>
