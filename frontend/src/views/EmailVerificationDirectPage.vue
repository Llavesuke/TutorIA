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
        <h1 class="verification-title">Verificando Email...</h1>
        <p class="verification-message">Por favor espera mientras verificamos tu dirección de correo electrónico.</p>
      </div>

      <!-- Success state -->
      <div v-else-if="isSuccess" class="verification-content">
        <div class="verification-icon success">
          <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="verification-title">¡Email Verificado!</h1>
        <p class="verification-message">Tu correo electrónico ha sido verificado exitosamente.</p>
        <p class="redirect-message">Redirigiendo al login...</p>
      </div>

      <!-- Error state -->
      <div v-else class="verification-content">
        <div class="verification-icon error">
          <i class="fas fa-times-circle"></i>
        </div>
        <h1 class="verification-title">Error de Verificación</h1>
        <p class="verification-message">{{ errorMessage }}</p>
        <div class="verification-actions">
          <button @click="goToLogin" class="verification-button">
            Ir al Login
          </button>
          <button @click="goToEmailVerification" class="verification-button secondary">
            Verificar Email
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
import ApiService from '@/services/apiService';

const router = useRouter();
const route = useRoute();

const isLoading = ref(true);
const isSuccess = ref(false);
const errorMessage = ref('');

// Methods
const verifyEmail = async () => {
  try {
    const email = route.query.email;
    const userId = route.query.userId;

    if (!email || !userId) {
      throw new Error('Enlace de verificación inválido. Faltan parámetros requeridos.');
    }

    // Use our custom email verification system
    const response = await ApiService.post('/api/auth/verify-email', {
      email,
      userId
    });

    if (response && response.success) {
      isSuccess.value = true;

      // Clear pending verification data since email is now verified
      localStorage.removeItem('pendingVerificationEmail');
      localStorage.removeItem('pendingVerificationUserData');
      console.log('Email verified successfully, cleared pending verification data');

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 2000);
    } else {
      throw new Error(response?.message || 'Error en la verificación');
    }
  } catch (error) {
    console.error('Error de verificación de email:', error);
    errorMessage.value = error.message || 'Ocurrió un error durante la verificación';
    isSuccess.value = false;
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};

const goToEmailVerification = () => {
  const email = route.query.email;
  router.push(`/email-verification?email=${encodeURIComponent(email || '')}`);
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
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 3rem 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.verification-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #e6531d;

  &.success {
    color: #007142;
  }

  &.error {
    color: #dc3545;
  }
}

.verification-title {
  font-size: 2rem;
  font-weight: 700;
  color: #FEF0D1;
  margin-bottom: 1rem;
}

.verification-message {
  font-size: 1.1rem;
  color: rgba(254, 240, 209, 0.8);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.redirect-message {
  font-size: 1rem;
  color: #007142;
  font-weight: 500;
  margin-top: 1rem;
}

.verification-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
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

  &:hover {
    background-color: darken(#e6531d, 10%);
    transform: translateY(-2px);
  }

  &.secondary {
    background-color: transparent;
    border: 1px solid rgba(254, 240, 209, 0.3);

    &:hover {
      background-color: rgba(254, 240, 209, 0.05);
    }
  }
}

/* Media queries for responsiveness */
@media (max-width: 480px) {
  .verification-title {
    font-size: 1.5rem;
  }

  .verification-content {
    padding: 2rem 1.5rem;
  }
}
</style>
