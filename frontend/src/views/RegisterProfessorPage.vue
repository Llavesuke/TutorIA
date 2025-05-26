<template>
  <div class="register-professor-page">
    <OriginalSvgBackground />
    
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <img src="@/assets/images/text_logo.png" alt="TutorIA Logo" class="logo-image" />
          <h1>Professor Registration</h1>
        </div>
        
        <!-- Loading State -->
        <div v-if="isValidatingToken" class="loading-container">
          <div class="spinner"></div>
          <p>Validating invitation...</p>
        </div>
        
        <!-- Invalid Token -->
        <div v-else-if="!isValidToken" class="invalid-token">
          <i class="fas fa-exclamation-circle"></i>
          <h2>Invalid or Expired Invitation</h2>
          <p>The invitation link you used is invalid or has expired. Please contact your educational center administrator for a new invitation.</p>
          <router-link to="/login" class="btn btn-primary">Go to Login</router-link>
        </div>
        
        <!-- Registration Form -->
        <form v-else @submit.prevent="handleRegister" class="register-form">
          <div class="center-info">
            <h3>{{ invitationData.centro_nombre || 'Educational Center' }}</h3>
            <p>You've been invited to join as a professor</p>
          </div>
          
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              v-model="fullName" 
              class="form-control" 
              placeholder="Enter your full name"
              required
              :disabled="isLoading"
            />
          </div>
          
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              v-model="username" 
              class="form-control" 
              placeholder="Choose a username"
              required
              :disabled="isLoading"
            />
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              class="form-control" 
              placeholder="Enter your email"
              required
              disabled
            />
            <small class="form-text">This email was specified in your invitation and cannot be changed.</small>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              class="form-control" 
              placeholder="Create a password"
              required
              :disabled="isLoading"
            />
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              class="form-control" 
              placeholder="Confirm your password"
              required
              :disabled="isLoading"
            />
          </div>
          
          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
          
          <button 
            type="submit" 
            class="register-button" 
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading">
              <i class="fas fa-spinner fa-spin"></i> Registering...
            </span>
            <span v-else>
              Complete Registration
            </span>
          </button>
          
          <div class="login-link">
            Already have an account? <router-link to="/login">Login</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';
import InvitationService from '@/services/invitationService';
import AuthService from '@/services/authService';

const route = useRoute();
const router = useRouter();

// State
const isValidatingToken = ref(true);
const isValidToken = ref(false);
const invitationData = ref({});
const isLoading = ref(false);
const errorMessage = ref('');

// Form fields
const fullName = ref('');
const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

// Computed
const isFormValid = computed(() => {
  return fullName.value.trim() !== '' && 
         username.value.trim() !== '' && 
         email.value.trim() !== '' && 
         password.value.trim() !== '' && 
         password.value === confirmPassword.value;
});

// Methods
const validateToken = async () => {
  const token = route.params.token;
  
  if (!token) {
    isValidToken.value = false;
    isValidatingToken.value = false;
    return;
  }
  
  try {
    // Validate the invitation token
    const invitation = await InvitationService.validateInvitation(token);
    
    if (invitation && invitation.tipo_rol === 'profesor') {
      isValidToken.value = true;
      invitationData.value = invitation;
      
      // Pre-fill email from invitation
      email.value = invitation.email || '';
    } else {
      isValidToken.value = false;
    }
  } catch (error) {
    console.error('Error validating invitation token:', error);
    isValidToken.value = false;
  } finally {
    isValidatingToken.value = false;
  }
};

const handleRegister = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields correctly.';
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    // Register the professor
    await AuthService.register({
      centroId: invitationData.value.centro_id,
      rol: 'profesor',
      nombreUsuario: username.value,
      nombreReal: fullName.value,
      email: email.value,
      password: password.value
    });
    
    // Mark the invitation as used
    await InvitationService.markInvitationAsUsed(route.params.token);
    
    // Redirect to login page with success message
    router.push({
      path: '/login',
      query: { 
        registered: 'true',
        email: email.value
      }
    });
    
  } catch (error) {
    console.error('Error registering professor:', error);
    errorMessage.value = error.message || 'Failed to register. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Initialize
onMounted(() => {
  validateToken();
});
</script>

<style lang="scss" scoped>
.register-professor-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.register-container {
  width: 100%;
  max-width: 600px;
  z-index: 1;
}

.register-card {
  background-color: rgba(23, 23, 23, 0.8);
  border-radius: var(--border-radius-lg);
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
  
  .logo-image {
    height: 60px;
    margin-bottom: 1rem;
  }
  
  h1 {
    font-size: 1.8rem;
    color: var(--color-cashmere);
    margin: 0;
    font-weight: var(--font-weight-bold);
  }
}

.center-info {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(0, 113, 66, 0.1);
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--color-forest-green);
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-forest-green);
  }
  
  p {
    margin: 0;
    color: var(--color-text-light);
  }
}

.register-form {
  .form-group {
    margin-bottom: 1.5rem;
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: var(--font-weight-medium);
    }
    
    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius-md);
      color: var(--color-text);
      
      &:focus {
        border-color: var(--color-forest-green);
        outline: none;
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
    
    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--color-text-light);
    }
  }
}

.register-button {
  width: 100%;
  padding: 0.85rem;
  background-color: var(--color-forest-green);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-normal);
  
  &:hover:not(:disabled) {
    background-color: darken(#007142, 5%);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.login-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  
  a {
    color: var(--color-forest-green);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.error-message {
  color: var(--color-error);
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: var(--border-radius-sm);
  font-size: 0.9rem;
}

// Loading and error states
.loading-container, .invalid-token {
  text-align: center;
  padding: 2rem;
  
  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top: 4px solid var(--color-forest-green);
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  
  p {
    color: var(--color-text-light);
  }
}

.invalid-token {
  i {
    font-size: 3rem;
    color: var(--color-error);
    margin-bottom: 1rem;
  }
  
  h2 {
    color: var(--color-error);
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1.5rem;
  }
  
  .btn {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: var(--color-forest-green);
    color: white;
    text-decoration: none;
    border-radius: var(--border-radius-md);
    transition: background-color var(--transition-normal);
    
    &:hover {
      background-color: darken(#007142, 5%);
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
