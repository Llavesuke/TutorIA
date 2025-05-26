<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AuthService from '../services/authService';
import ApiService from '../services/apiService';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';

const router = useRouter();
const email = ref('');
const isLoading = ref(true);
const isVerified = ref(false);
const message = ref('Please verify your email to continue.');

// Navigate to login page
const goToLogin = () => {
  router.push('/login');
};

// Check verification status using our custom system
const checkVerificationStatus = async () => {
  try {
    isLoading.value = true;
    console.log('Checking verification status for email:', email.value);

    // Use our custom API endpoint to check verification status
    const verificationResult = await ApiService.get(`/api/auth/verify-email-status?email=${encodeURIComponent(email.value)}`);

    console.log('Verification API response:', verificationResult);

    if (verificationResult && verificationResult.isEmailVerified) {
      console.log('Email is verified, redirecting to dashboard');
      isVerified.value = true;
      message.value = 'Email verified! Redirecting to dashboard...';

      // Clear the pending verification email
      localStorage.removeItem('pendingVerificationEmail');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 1500);
    } else {
      console.log('Email is still not verified');
      isVerified.value = false;
      message.value = 'Email is not verified yet. Please check your inbox and click the verification link.';
    }
  } catch (error) {
    console.error('Error checking verification status:', error);
    message.value = 'Error checking verification status. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Try to check verification status again
const tryLoginAgain = async () => {
  message.value = 'Checking email verification status...';
  await checkVerificationStatus();
};

// Resend verification email
const resendVerificationEmail = async () => {
  try {
    isLoading.value = true;
    message.value = 'Sending verification email...';

    if (!email.value) {
      throw new Error('No email address available');
    }

    // Get user data from multiple sources
    let userData = null;
    let userId = null;
    let userName = 'Usuario';

    // Try to get from pending verification data first
    const pendingUserData = localStorage.getItem('pendingVerificationUserData');
    if (pendingUserData) {
      try {
        const pendingData = JSON.parse(pendingUserData);
        userName = pendingData.adminName || pendingData.adminFullName || 'Usuario';
        console.log('Using pending user data for resend:', pendingData);
      } catch (error) {
        console.error('Error parsing pending user data:', error);
      }
    }

    // Try to get from logged user data
    const loggedUserData = localStorage.getItem('tutoria_user');
    if (loggedUserData) {
      try {
        userData = JSON.parse(loggedUserData);
        userId = userData.id;
        userName = userData.nombre_usuario || userData.nombre_real || userName;
        console.log('Using logged user data for resend:', userData);
      } catch (error) {
        console.error('Error parsing logged user data:', error);
      }
    }

    // Call resend verification endpoint
    const response = await ApiService.post('/api/auth/resend-verification', {
      email: email.value,
      userId: userId, // May be null for pending registrations
      userName: userName
    });

    if (response && response.success) {
      message.value = 'Verification email sent successfully! Please check your inbox.';
    } else {
      throw new Error(response?.message || 'Failed to send verification email');
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    message.value = `Error sending verification email: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // Get email from multiple sources
  const routeEmail = router.currentRoute.value.query.email;
  const storedEmail = localStorage.getItem('pendingVerificationEmail');
  const pendingUserData = localStorage.getItem('pendingVerificationUserData');
  const userEmail = localStorage.getItem('tutoria_user') ? JSON.parse(localStorage.getItem('tutoria_user')).email : null;

  console.log('Route email:', routeEmail);
  console.log('Stored email:', storedEmail);
  console.log('Pending user data:', pendingUserData);
  console.log('User email:', userEmail);

  // Get email from pending verification data if available
  let pendingEmail = null;
  if (pendingUserData) {
    try {
      const userData = JSON.parse(pendingUserData);
      pendingEmail = userData.email;
      console.log('Email from pending user data:', pendingEmail);
    } catch (error) {
      console.error('Error parsing pending user data:', error);
    }
  }

  // Priority: route query > pending user data > localStorage > user email
  email.value = routeEmail || pendingEmail || storedEmail || userEmail || '';

  console.log('Final email value:', email.value);

  // Store email in localStorage for persistence
  if (email.value) {
    localStorage.setItem('pendingVerificationEmail', email.value);
  }

  // Only check verification status if we have an email
  if (email.value) {
    await checkVerificationStatus();
  } else {
    console.error('No email found for verification');
    message.value = 'No email address found. Please try registering again or contact support.';
    isLoading.value = false;
  }

  // If the user is already verified, redirect to dashboard
  if (isVerified.value) {
    console.log('User already verified, redirecting to dashboard');
    setTimeout(() => {
      router.push('/teacher/dashboard');
    }, 1500);
  }
});
</script>

<template>
  <div class="verification-page">
    <!-- Background component -->
    <OriginalSvgBackground />

    <!-- Dark overlay -->
    <div class="dark-overlay"></div>

    <div class="verification-container">
      <!-- Icon -->
      <div class="verification-icon">
        <i class="fas fa-envelope"></i>
      </div>

      <!-- Title -->
      <h1 class="verification-title">Verify Your Email</h1>

      <!-- Verification Content -->
      <div class="verification-content">
        <div v-if="isLoading" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i>
          <p>{{ message }}</p>
        </div>

        <div v-else-if="isVerified" class="verification-success">
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h2>Email Verified!</h2>
          <p>Your email has been successfully verified.</p>
          <button @click="goToLogin" class="verification-button">
            Go to Login
          </button>
        </div>

        <div v-else class="verification-pending">
          <div v-if="email">
            <p class="verification-message">
              We've sent a verification link to <strong>{{ email }}</strong>
            </p>
            <p class="verification-instructions">
              Please check your email and click the verification link to activate your account.
            </p>
            <p class="verification-status" v-if="message">
              {{ message }}
            </p>
            <p class="verification-warning">
              <i class="fas fa-exclamation-triangle"></i>
              You cannot access the professor dashboard until your account is verified.
            </p>
          </div>
          <div v-else class="no-email-error">
            <p class="verification-message error">
              <i class="fas fa-exclamation-circle"></i>
              No email address found for verification
            </p>
            <p class="verification-instructions">
              Please try logging in again or contact support if the problem persists.
            </p>
          </div>

          <div class="verification-actions">
            <button @click="tryLoginAgain" class="verification-button secondary" :disabled="isLoading">
              <i class="fas fa-sync-alt"></i> Check Verification Status
            </button>
            <button @click="resendVerificationEmail" class="verification-button secondary" :disabled="isLoading">
              <i class="fas fa-paper-plane"></i> Resend Verification Email
            </button>
            <button @click="goToLogin" class="verification-button">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Import Poppins font */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.verification-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #000;
  font-family: 'Poppins', sans-serif;
  padding: 1rem;
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

.verification-container {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.verification-icon {
  width: 80px;
  height: 80px;
  background-color: #e6531d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 16px rgba(230, 83, 29, 0.3);

  i {
    font-size: 2.5rem;
    color: #FEF0D1;
  }
}

.verification-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #FEF0D1;
  margin-bottom: 1.5rem;
  text-align: center;
}

.verification-content {
  width: 100%;
  background-color: #171717;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.verification-message {
  font-size: 1.1rem;
  color: #FEF0D1;
  margin-bottom: 1rem;
  text-align: center;
  line-height: 1.5;

  &.error {
    color: #dc3545;
    background-color: rgba(220, 53, 69, 0.1);
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #dc3545;

    i {
      margin-right: 0.5rem;
    }
  }
}

.verification-instructions {
  font-size: 1rem;
  color: rgba(254, 240, 209, 0.8);
  margin-bottom: 1rem;
  text-align: center;
  line-height: 1.5;
}

.verification-status {
  font-size: 1rem;
  color: #e6531d;
  margin-bottom: 1rem;
  text-align: center;
  line-height: 1.5;
  font-weight: 500;
  background-color: rgba(230, 83, 29, 0.1);
  padding: 0.75rem;
  border-radius: 8px;
}

.verification-warning {
  background-color: rgba(230, 83, 29, 0.15);
  border-left: 4px solid #e6531d;
  padding: 1rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 1.5rem;
  color: #FEF0D1;
  font-size: 0.95rem;
  line-height: 1.5;

  i {
    color: #e6531d;
    margin-right: 0.5rem;
  }
}

.verification-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.verification-button {
  width: 100%;
  padding: 0.9rem;
  border-radius: 8px;
  border: none;
  background-color: #e6531d;
  color: #FEF0D1;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Poppins', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    background-color: darken(#e6531d, 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.secondary {
    background-color: transparent;
    border: 1px solid rgba(254, 240, 209, 0.3);

    &:hover:not(:disabled) {
      background-color: rgba(254, 240, 209, 0.05);
    }
  }

  i {
    font-size: 1rem;
  }
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #FEF0D1;

  i {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: #e6531d;
  }

  p {
    font-size: 1rem;
  }
}

.verification-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  .success-icon {
    font-size: 3rem;
    color: #007142;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    color: #FEF0D1;
    margin-bottom: 0.5rem;
  }

  p {
    color: rgba(254, 240, 209, 0.8);
    margin-bottom: 1.5rem;
  }
}

/* Media queries for responsiveness */
@media (max-width: 480px) {
  .verification-title {
    font-size: 2rem;
  }

  .verification-content {
    padding: 1.5rem;
  }
}
</style>
