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

    console.log('Login successful:', result);
    console.log('Login result details:');
    console.log('- User:', result.user);
    console.log('- Token:', result.token ? 'Present' : 'Missing');
    console.log('- RefreshToken:', result.refreshToken ? 'Present' : 'Missing');
    console.log('- IsEmailVerified:', result.isEmailVerified);

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

      console.log('Storing user data in auth store:', userData);

      // Store user data and tokens
      authStore.setUser(
        userData,
        result.token,         // JWT token
        result.refreshToken   // Refresh token
      );

      console.log('JWT token stored:', result.token ? 'Yes' : 'No');
      console.log('Refresh token stored:', result.refreshToken ? 'Yes' : 'No');
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
/* Import Poppins font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #000;
  font-family: 'Poppins', sans-serif;
  padding: 1rem; /* Añadido padding para dispositivos móviles */
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1;
}

.login-container {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
  /* Removed any background styling */
}

.login-icon {
  margin-bottom: 1.5rem;
  color: #e6531d;
  font-size: 2rem;
  background-color: transparent;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 2.5rem;
  }
}

.login-title {
  font-size: 2.25rem;
  margin-bottom: 2rem;
  color: #FEF0D1; /* Corrected to cream/beige color */
  text-align: center;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
}

.login-form {
  width: 100%;

  .form-group {
    margin-bottom: 1rem;

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: none;
      background-color: #1a1a1a; /* Dark gray background like in the image */
      color: #fff;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
      margin-bottom: 0.5rem; /* Add a bit more space between fields */

      &:focus {
        outline: none;
        border: 1px solid rgba(255, 255, 255, 0.3);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }

    &.has-error input {
      border: 1px solid #ff4d4d;
    }
  }

  .forgot-password-link {
    text-align: right;
    margin-bottom: 1.5rem;

    .forgot-password {
      color: #e6531d;
      font-size: 0.85rem;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .error-message {
    color: #ff4d4d;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    text-align: center;
  }

  .login-button {
    width: 100%;
    padding: 0.85rem;
    font-size: 1rem;
    background-color: #007142; /* Green color for button */
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    margin-top: 0.5rem; /* Add a bit more space above button */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3); /* Add shadow for depth */

    &:hover {
      background-color: #005f37; /* Manually darkened by 5% instead of using darken() */
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;

  .sign-up-link {
    color: #e6531d;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* Media queries para responsividad */
@media (max-width: 480px) {
  .login-title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }

  .login-icon {
    margin-bottom: 1rem;

    i {
      font-size: 2rem;
    }
  }

  .login-form {
    .form-group {
      margin-bottom: 0.75rem;

      input {
        padding: 0.7rem 0.9rem;
        font-size: 0.95rem;
      }
    }

    .forgot-password-link {
      margin-bottom: 1.25rem;

      .forgot-password {
        font-size: 0.8rem;
      }
    }

    .login-button {
      padding: 0.75rem;
      font-size: 0.95rem;
    }
  }

  .login-footer {
    margin-top: 1.5rem;
    font-size: 0.85rem;
  }
}
</style>
