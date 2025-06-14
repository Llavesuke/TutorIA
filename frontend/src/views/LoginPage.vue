<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../services/authService';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';
import ForgotPasswordModal from '@/components/modals/ForgotPasswordModal.vue';
import authStore from '@/stores/authStore';

const router = useRouter();

// Form data
const identifier = ref(''); // Can be email or username
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// Modal state
const showForgotPasswordModal = ref(false);

// Handle login form submission
const handleLogin = async (e) => {
  e.preventDefault();

  // Reset error message
  errorMessage.value = '';

  // Validate form
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Please enter both identifier (email or username) and password';
    return;
  }

  try {
    isLoading.value = true;

    // Authenticate with Supabase
    const result = await AuthService.login(identifier.value, password.value);

    console.log('🎉 Login successful:', result);
    console.log('📋 Login result details:');
    console.log('- User:', result.user);
    console.log('- Token:', result.token ? 'Present' : 'Missing');
    console.log('- RefreshToken:', result.refreshToken ? 'Present' : 'Missing');
    console.log('- IsEmailVerified:', result.isEmailVerified);

    // Log the actual refresh token value (first 20 chars for security)
    if (result.refreshToken) {
      console.log('- RefreshToken preview:', result.refreshToken.substring(0, 20) + '...');
    }

    // Store user in auth store
    if (result.user) {
      // Prepare user data with metadata
      const userData = {
        ...result.user,
        user_metadata: {
          ...(result.user.user_metadata || {}),
          rol: result.user.rol,
          nombre_real: result.user.nombre_real,
          nombre_usuario: result.user.nombre_usuario
        }
      };

      console.log('💾 Storing user data in auth store:', userData);

      // Store user data and tokens
      await authStore.setUser(
        userData,
        result.token,         // JWT token
        result.refreshToken   // Refresh token
      );

      console.log('✅ JWT token stored:', result.token ? 'Yes' : 'No');
      console.log('✅ Refresh token stored:', result.refreshToken ? 'Yes' : 'No');

      // Verify tokens are actually in localStorage
      const storedToken = localStorage.getItem('tutoria_token');
      const storedRefreshToken = localStorage.getItem('tutoria_refresh_token');
      console.log('🔍 Verification - Token in localStorage:', storedToken ? 'Present' : 'Missing');
      console.log('🔍 Verification - Refresh token in localStorage:', storedRefreshToken ? 'Present' : 'Missing');

      // Verify tokens are in authStore
      console.log('🔍 Verification - Token in authStore:', authStore.token.value ? 'Present' : 'Missing');
      console.log('🔍 Verification - Refresh token in authStore:', authStore.refreshToken.value ? 'Present' : 'Missing');
    }

    // Check if the user has an email that needs verification
    const isEmail = identifier.value.includes('@');

    if (isEmail && result.user && result.user.email) {
      // Check if email is verified - use the isVerified property from the login result
      // or fall back to checking directly
      const isVerified = result.isEmailVerified !== undefined
        ? result.isEmailVerified
        : await AuthService.isEmailVerified(identifier.value);

      console.log('Email verification status:', isVerified);

      if (!isVerified) {
        console.log('Email not verified, redirecting to verification page');

        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', identifier.value);

        // Redirect to email verification page
        router.push({
          path: '/email-verification',
          query: { email: identifier.value }
        });
        return;
      }
    } else {
      console.log('No email verification needed (username login or student without email)');
    }

    console.log('Email verified, redirecting to dashboard');

    // Clear pending verification data since user is now logged in and verified
    localStorage.removeItem('pendingVerificationEmail');
    localStorage.removeItem('pendingVerificationUserData');
    console.log('Cleared pending verification data');

    // If verified, redirect based on user role
    const userRole = result.user?.rol;
    if (userRole === 'estudiante') {
      router.push('/student/home');
    } else {
      router.push('/teacher/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Invalid email or password';
  } finally {
    isLoading.value = false;
  }
};

// Navigate to sign up page
const goToSignUp = () => {
  router.push('/create-centre');
};

// Forgot password modal methods
const openForgotPasswordModal = () => {
  showForgotPasswordModal.value = true;
};

const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false;
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
        <i class="fas fa-graduation-cap"></i>
      </div>

      <!-- Title -->
      <h1 class="login-title">Log in to your account</h1>

      <!-- Login Form -->
      <form @submit="handleLogin" class="login-form">
        <div class="form-group" :class="{ 'has-error': errorMessage }">
          <input
            type="text"
            id="identifier"
            v-model="identifier"
            placeholder="Email or Username"
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

        <div class="forgot-password-link">
          <a href="#" @click.prevent="openForgotPasswordModal" class="forgot-password">Forgot password?</a>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>Login</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Don't have a centre yet? <a @click="goToSignUp" class="sign-up-link">Sign up</a></p>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <ForgotPasswordModal
      :isOpen="showForgotPasswordModal"
      @close="closeForgotPasswordModal"
    />
  </div>
</template>

<style lang="scss" scoped>
@import './LoginPage.scss';
</style>
