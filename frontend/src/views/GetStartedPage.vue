<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';
import { gsap } from 'gsap';

const router = useRouter();

// Go back to home page
const goBack = () => {
  router.push('/');
};

// Initialize animations
onMounted(() => {
  // Animate cards entrance
  gsap.from('.option-card', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'back.out(1.7)'
  });

  // Animate title
  gsap.from('.page-title', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out'
  });

  // Animate back button
  gsap.from('.back-button', {
    x: -20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
    ease: 'power2.out'
  });
});
</script>

<template>
  <div class="get-started-page">
    <!-- Background component -->
    <OriginalSvgBackground />

    <!-- Dark overlay -->
    <div class="dark-overlay"></div>

    <!-- Back button -->
    <button @click="goBack" class="back-button">
      <i class="fas fa-arrow-left"></i>
    </button>

    <div class="container">
      <div class="get-started-content">
        <h1 class="page-title">Get Started with TutorIA</h1>

        <div class="options-container">
          <!-- Login Card -->
          <router-link to="/login" class="option-card">
            <div class="card-icon">
              <i class="fas fa-brain"></i>
            </div>
            <div class="card-content">
              <h2>Login</h2>
            </div>
          </router-link>

          <!-- Create Educational Center Card -->
          <router-link to="/create-centre" class="option-card">
            <div class="card-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="card-content">
              <h2>Create Educational Center</h2>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import './GetStartedPage.scss';
</style>
