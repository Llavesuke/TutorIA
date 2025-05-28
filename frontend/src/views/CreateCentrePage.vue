<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../services/authService';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';

const router = useRouter();

// Form data
const centreName = ref('');
const adminName = ref('');
const adminFullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const agreeTerms = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  // Reset messages
  errorMessage.value = '';
  successMessage.value = '';

  // Validate form
  if (!centreName.value || !adminName.value || !adminFullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all required fields';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  if (!agreeTerms.value) {
    errorMessage.value = 'You must agree to the terms and conditions';
    return;
  }

  try {
    isLoading.value = true;

    // Register the educational center and admin user with Supabase
    const result = await AuthService.registerEducationalCenter({
      centreName: centreName.value,
      adminName: adminName.value,
      adminFullName: adminFullName.value,
      email: email.value,
      password: password.value
    });

    // Show success message
    successMessage.value = 'Educational center created successfully! Please check your email for verification.';

    console.log('Center creation successful:', result);

    // Store email and user data for verification page
    const emailToVerify = email.value;
    localStorage.setItem('pendingVerificationEmail', emailToVerify);
    localStorage.setItem('pendingVerificationUserData', JSON.stringify({
      email: emailToVerify,
      centreName: centreName.value,
      adminName: adminName.value,
      adminFullName: adminFullName.value,
      rol: 'admin'
    }));

    // Reset form
    centreName.value = '';
    adminName.value = '';
    adminFullName.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
    agreeTerms.value = false;

    // Redirect to email verification page
    setTimeout(() => {
      router.push({
        path: '/email-verification',
        query: { email: emailToVerify }
      });
    }, 1500);
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value = error.message || 'An error occurred during registration';
  } finally {
    isLoading.value = false;
  }
};

// Navigate to login page
const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="login-page">
    <!-- Background component -->
    <OriginalSvgBackground />

    <!-- Dark overlay -->
    <div class="dark-overlay"></div>

    <div class="login-container">
      <!-- Logo/Icon -->
      <div class="login-icon">
        <i class="fas fa-building"></i>
      </div>

      <!-- Title -->
      <h1 class="login-title">Create Educational Center</h1>

      <!-- Create Centre Form -->
      <form @submit="handleSubmit" class="login-form">
        <div class="form-group" :class="{ 'has-error': errorMessage }">
          <input
            type="text"
            id="centre-name"
            v-model="centreName"
            placeholder="Educational Center Name"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="text"
            id="admin-name"
            v-model="adminName"
            placeholder="Username"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="text"
            id="admin-full-name"
            v-model="adminFullName"
            placeholder="Full name"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="Admin email"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="Password"
            required
          />
        </div>

        <div class="form-group">
          <input
            type="password"
            id="confirm-password"
            v-model="confirmPassword"
            placeholder="Confirm Password"
            required
          />
        </div>

        <div class="terms-checkbox">
          <input
            type="checkbox"
            id="agree-terms"
            v-model="agreeTerms"
            required
          />
          <label for="agree-terms">
            I agree to the <a href="#" class="terms-link">Terms and Conditions</a>
          </label>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Creating...</span>
          <span v-else>Create Educational Center</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Already have an account? <a @click="goToLogin" class="sign-up-link">Login</a></p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import './CreateCentrePage.scss';
</style>
