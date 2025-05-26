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
}

.login-icon {
  margin-bottom: 1.5rem;
  color: #007142; /* Green color for building icon */
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
  color: #FEF0D1; /* Cream/beige color */
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
      background-color: #1a1a1a;
      color: #fff;
      font-size: 1rem;
      font-family: 'Poppins', sans-serif;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      margin-bottom: 0.5rem;

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

  .terms-checkbox {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    text-align: right;
    justify-content: flex-end;

    input {
      margin-right: 0.5rem;
    }

    label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.85rem;
      font-family: 'Poppins', sans-serif;
    }

    .terms-link {
      color: #e6531d;
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

  .success-message {
    color: #4caf50;
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
    margin-top: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

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

    .terms-checkbox {
      margin-bottom: 1.25rem;

      label {
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
