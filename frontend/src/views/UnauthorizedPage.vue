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
@import './UnauthorizedPage.scss';
</style>
