<template>
  <div class="verification-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <div class="verification-container">
      <!-- Loading state -->
      <div v-if="isLoading" class="verification-content">
        <div class="verification-icon">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <h1 class="verification-title">Verifying Email...</h1>
        <p class="verification-message">Please wait while we verify your email address.</p>
      </div>

      <!-- Success state -->
      <div v-else-if="isSuccess" class="verification-content">
        <div class="verification-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="verification-title">Email Verified!</h1>
        <p class="verification-message">Your email has been successfully verified.</p>
        <p class="redirect-message">Redirecting you to your dashboard...</p>
      </div>

      <!-- Error state -->
      <div v-else class="verification-content">
        <div class="verification-icon error">
          <i class="fas fa-times-circle"></i>
        </div>
        <h1 class="verification-title">Verification Failed</h1>
        <p class="verification-message">{{ errorMessage }}</p>
        <div class="verification-actions">
          <button @click="goToLogin" class="verification-button">
            Go to Login
          </button>
          <button @click="goToSettings" class="verification-button secondary">
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import authStore from '@/stores/authStore';
import ApiService from '@/services/apiService';

const router = useRouter();
const route = useRoute();

// State
const isLoading = ref(true);
const isSuccess = ref(false);
const errorMessage = ref('');

// Methods
const verifyEmail = async () => {
  try {
    const email = route.query.email;
    const userId = route.query.userId;

    if (!email || !userId) {
      throw new Error('Invalid verification link. Missing required parameters.');
    }

    // Use our custom email verification system
    const apiService = new ApiService();
    const response = await apiService.post('/api/auth/verify-email', {
      email,
      userId
    });

    if (response && response.success) {
      isSuccess.value = true;

      // Update only the email verification status in the user store
      // without breaking other user data
      const currentUser = authStore.user.value;
      if (currentUser && currentUser.email === email) {
        await authStore.setUser({
          ...currentUser,
          email_verificado: true
        });
        console.log('Email verification status updated in user store');
      }

      // Redirect based on user role - check if it's a professor or student
      setTimeout(() => {
        // For now, redirect to login page where they can access their appropriate dashboard
        router.push('/login?verified=true');
      }, 2000);
    } else {
      throw new Error(response?.message || 'Verification failed');
    }
  } catch (error) {
    console.error('Email verification error:', error);
    errorMessage.value = error.message || 'An error occurred during verification';
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};

const goToSettings = () => {
  router.push('/student/settings');
};

// Lifecycle
onMounted(() => {
  verifyEmail();
});
</script>

<style lang="scss" scoped>
.verification-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #171717;
  font-family: 'Poppins', sans-serif;
  padding: 1rem;
}

.verification-container {
  max-width: 500px;
  width: 100%;
  text-align: center;
  z-index: 2;
  position: relative;
}

.verification-content {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: 3rem 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.verification-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #34307b;

  &.success {
    color: #007142;
  }

  &.error {
    color: #e6531d;
  }

  i {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
}

.verification-title {
  color: #FEF0D1;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.verification-message {
  color: rgba(254, 240, 209, 0.8);
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.redirect-message {
  color: rgba(254, 240, 209, 0.6);
  font-size: 1rem;
  font-style: italic;
  margin-top: 1rem;
}

.verification-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.verification-button {
  background: linear-gradient(135deg, #007142 0%, #005a35 100%);
  color: #FEF0D1;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 113, 66, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 113, 66, 0.4);
  }

  &.secondary {
    background: linear-gradient(135deg, #34307b 0%, #282461 100%);
    box-shadow: 0 4px 15px rgba(52, 48, 123, 0.3);

    &:hover {
      box-shadow: 0 6px 20px rgba(52, 48, 123, 0.4);
    }
  }
}

@media (max-width: 768px) {
  .verification-content {
    padding: 2rem 1.5rem;
  }

  .verification-title {
    font-size: 2rem;
  }

  .verification-message {
    font-size: 1.1rem;
  }

  .verification-actions {
    flex-direction: column;
    align-items: center;
  }

  .verification-button {
    width: 100%;
    max-width: 200px;
  }
}
</style>
