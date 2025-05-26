<template>
  <div class="unauthorized-page">
    <!-- Background -->
    <MinimalistDashboardBackground />

    <!-- Animated shapes -->
    <div class="floating-shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
    </div>

    <!-- Main content -->
    <div class="container">
      <div class="content">
        <!-- Error icon -->
        <div class="error-icon">
          <div class="icon-circle">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="pulse-ring"></div>
          <div class="pulse-ring-2"></div>
        </div>

        <!-- Error code -->
        <div class="error-code">403</div>

        <!-- Title -->
        <h1 class="error-title">Access Denied</h1>

        <!-- Description -->
        <p class="error-description">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <!-- User info -->
        <div class="user-info" v-if="userRole">
          <div class="info-card">
            <i class="fas fa-user"></i>
            <span>Current Role: <strong>{{ formatRole(userRole) }}</strong></span>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button @click="goBack" class="btn btn-back">
            <i class="fas fa-arrow-left"></i>
            <span>Go Back</span>
          </button>
          <button @click="goToDashboard" class="btn btn-dashboard">
            <i class="fas fa-home"></i>
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import gsap from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import authStore from '@/stores/authStore';

const router = useRouter();

// Computed properties
const userRole = computed(() => authStore.userRole.value);

// Methods
const formatRole = (role) => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'profesor':
      return 'Professor';
    case 'estudiante':
      return 'Student';
    default:
      return role?.charAt(0).toUpperCase() + role?.slice(1) || 'Unknown';
  }
};

const goBack = () => {
  router.back();
};

const goToDashboard = () => {
  // Redirect based on user role
  const role = userRole.value;
  if (role === 'estudiante') {
    router.push('/student/home');
  } else {
    router.push('/teacher/dashboard');
  }
};

// GSAP Animations
onMounted(() => {
  // Set initial states
  gsap.set('.error-icon', { scale: 0, rotation: -180, opacity: 0 });
  gsap.set('.error-code', { y: 50, opacity: 0 });
  gsap.set('.error-title', { y: 30, opacity: 0 });
  gsap.set('.error-description', { y: 20, opacity: 0 });
  gsap.set('.user-info', { y: 20, opacity: 0 });
  gsap.set('.actions', { y: 30, opacity: 0 });
  gsap.set('.shape', { scale: 0, opacity: 0 });

  // Create timeline
  const tl = gsap.timeline();

  // Animate floating shapes first
  tl.to('.shape', {
    scale: 1,
    opacity: 0.6,
    duration: 1,
    stagger: 0.2,
    ease: 'elastic.out(1, 0.5)'
  });

  // Animate error icon with dramatic effect
  tl.to('.error-icon', {
    scale: 1,
    rotation: 0,
    opacity: 1,
    duration: 1.5,
    ease: 'elastic.out(1, 0.6)'
  }, "-=0.5");

  // Animate error code
  tl.to('.error-code', {
    y: 0,
    opacity: 1,
    duration: 1,
    ease: 'back.out(2)'
  }, "-=0.8");

  // Animate title
  tl.to('.error-title', {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out'
  }, "-=0.5");

  // Animate description
  tl.to('.error-description', {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out'
  }, "-=0.4");

  // Animate user info
  tl.to('.user-info', {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out'
  }, "-=0.3");

  // Animate buttons
  tl.to('.actions', {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'power3.out'
  }, "-=0.2");

  // Continuous animations
  gsap.to('.pulse-ring', {
    scale: 1.5,
    opacity: 0,
    duration: 2,
    repeat: -1,
    ease: 'power2.out'
  });

  gsap.to('.pulse-ring-2', {
    scale: 2,
    opacity: 0,
    duration: 2.5,
    repeat: -1,
    ease: 'power2.out',
    delay: 0.5
  });

  // Floating animation for shapes
  gsap.to('.shape-1', {
    y: -20,
    rotation: 360,
    duration: 6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-2', {
    x: 15,
    rotation: -360,
    duration: 8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-3', {
    y: 25,
    x: -10,
    duration: 7,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-4', {
    rotation: 180,
    duration: 10,
    repeat: -1,
    ease: 'none'
  });

  gsap.to('.shape-5', {
    scale: 1.2,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
});
</script>

<style lang="scss" scoped>
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.floating-shapes {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;

  .shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.6;

    &.shape-1 {
      width: 120px;
      height: 120px;
      background-color: rgba(230, 83, 29, 0.3);
      top: 10%;
      left: 15%;
      border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
    }

    &.shape-2 {
      width: 80px;
      height: 80px;
      background-color: rgba(52, 48, 123, 0.4);
      top: 20%;
      right: 20%;
      border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
    }

    &.shape-3 {
      width: 100px;
      height: 100px;
      background-color: rgba(0, 113, 66, 0.3);
      bottom: 25%;
      left: 10%;
      border-radius: 40% 60% 60% 40% / 60% 40% 40% 60%;
    }

    &.shape-4 {
      width: 60px;
      height: 60px;
      background-color: rgba(254, 240, 209, 0.2);
      bottom: 15%;
      right: 15%;
      border-radius: 70% 30% 30% 70% / 30% 70% 70% 30%;
    }

    &.shape-5 {
      width: 140px;
      height: 140px;
      background-color: rgba(230, 83, 29, 0.2);
      top: 50%;
      right: 5%;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    }
  }
}

.container {
  max-width: 700px;
  width: 90%;
  position: relative;
  z-index: 2;
}

.content {
  text-align: center;
  background: rgba(23, 23, 23, 0.95);
  border-radius: 30px;
  padding: 4rem 3rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(254, 240, 209, 0.1);
  backdrop-filter: blur(20px);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: #e6531d;
    border-radius: 30px 30px 0 0;
  }
}

.error-icon {
  position: relative;
  margin-bottom: 2rem;
  display: inline-block;

  .icon-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background-color: rgba(230, 83, 29, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    border: 3px solid rgba(230, 83, 29, 0.3);
    position: relative;
    z-index: 3;

    i {
      font-size: 3rem;
      color: #e6531d;
      text-shadow: 0 0 20px rgba(230, 83, 29, 0.5);
    }
  }

  .pulse-ring,
  .pulse-ring-2 {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border: 2px solid rgba(230, 83, 29, 0.4);
    border-radius: 50%;
    z-index: 1;
  }

  .pulse-ring-2 {
    border-color: rgba(52, 48, 123, 0.3);
  }
}

.error-code {
  font-family: 'Poppins', sans-serif;
  font-size: 8rem;
  font-weight: 900;
  color: #e6531d;
  margin-bottom: 1rem;
  line-height: 1;
  text-shadow: 0 0 30px rgba(230, 83, 29, 0.5);
}

.error-title {
  font-family: 'Poppins', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  color: #FEF0D1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.error-description {
  font-family: 'Poppins', sans-serif;
  font-size: 1.2rem;
  color: rgba(254, 240, 209, 0.8);
  margin-bottom: 2.5rem;
  line-height: 1.6;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  font-weight: 400;
}

.user-info {
  margin-bottom: 3rem;

  .info-card {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: rgba(52, 48, 123, 0.2);
    padding: 1rem 1.5rem;
    border-radius: 20px;
    border: 1px solid rgba(52, 48, 123, 0.3);
    backdrop-filter: blur(10px);

    i {
      font-size: 1.2rem;
      color: #34307b;
    }

    span {
      font-family: 'Poppins', sans-serif;
      color: #FEF0D1;
      font-size: 1rem;
      font-weight: 500;

      strong {
        color: #e6531d;
        font-weight: 700;
      }
    }
  }
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 25px;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  gap: 0.8rem;
  position: relative;
  overflow: hidden;
  min-width: 160px;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    transition: left 0.5s ease;
    z-index: 0;
  }

  &:hover::before {
    left: 0;
  }

  i, span {
    position: relative;
    z-index: 1;
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);

    i {
      transform: translateX(-3px);
    }
  }

  &.btn-back {
    background-color: rgba(254, 240, 209, 0.1);
    color: #FEF0D1;
    border: 2px solid rgba(254, 240, 209, 0.2);

    &::before {
      background-color: #34307b;
    }

    &:hover {
      box-shadow: 0 15px 35px rgba(52, 48, 123, 0.4);
    }
  }

  &.btn-dashboard {
    background-color: #e6531d;
    color: #FEF0D1;

    &::before {
      background-color: #007142;
    }

    &:hover {
      box-shadow: 0 15px 35px rgba(230, 83, 29, 0.5);
    }
  }
}

@media (max-width: 768px) {
  .content {
    padding: 3rem 2rem;
  }

  .error-code {
    font-size: 6rem;
  }

  .error-title {
    font-size: 2.2rem;
  }

  .error-description {
    font-size: 1.1rem;
  }

  .actions {
    flex-direction: column;
    align-items: center;

    .btn {
      width: 100%;
      max-width: 280px;
    }
  }

  .floating-shapes .shape {
    &.shape-1 { width: 80px; height: 80px; }
    &.shape-2 { width: 60px; height: 60px; }
    &.shape-3 { width: 70px; height: 70px; }
    &.shape-4 { width: 40px; height: 40px; }
    &.shape-5 { width: 90px; height: 90px; }
  }
}
</style>
