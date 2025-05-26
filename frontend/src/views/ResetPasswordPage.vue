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

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1;
}

.reset-password-container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-carbon) 0%, rgba(23, 23, 23, 0.98) 100%);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(230, 83, 29, 0.2);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.logo-container {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.reset-password-title {
  text-align: center;
  color: var(--color-text-primary);
  margin-bottom: 2rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-container,
.error-container,
.success-container {
  text-align: center;
  padding: 2rem 0;
}

.loading-spinner {
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.error-icon,
.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-icon {
  color: var(--color-error);
}

.success-icon {
  color: var(--color-success);
}

.reset-form-container {
  width: 100%;
}

.reset-password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
}

.reset-button,
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.reset-button {
  background: linear-gradient(135deg, #e6531d 0%, #d44819 100%);
  color: white;
  width: 100%;
  box-shadow: 0 4px 12px rgba(230, 83, 29, 0.3);
}

.reset-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #d44819 0%, #c23e15 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(230, 83, 29, 0.4);
}

.reset-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(230, 83, 29, 0.2);
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

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: var(--color-error);
  padding: 0.75rem;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.back-to-login {
  text-align: center;
  margin-top: 2rem;
}

.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: #e6531d;
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
