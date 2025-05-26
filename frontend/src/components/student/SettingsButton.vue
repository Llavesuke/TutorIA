<template>
  <div class="settings-button">
    <router-link to="/student/settings" class="settings-link">
      <i class="fas fa-cog"></i>
    </router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';

// Add entrance animation when component mounts
onMounted(() => {
  gsap.from('.settings-button', {
    scale: 0,
    rotation: -180,
    opacity: 0,
    duration: 0.8,
    ease: 'back.out(1.7)',
    delay: 0.5
  });
});
</script>

<style lang="scss" scoped>
.settings-button {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;

  .settings-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.5rem;
    height: 3.5rem;
    background-color: #34307b;
    border-radius: 50%;
    color: #FEF0D1;
    box-shadow: 0 4px 12px rgba(52, 48, 123, 0.3);
    transition: all 0.3s ease;
    text-decoration: none;

    &:hover {
      background-color: #e6531d;
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(230, 83, 29, 0.4);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(52, 48, 123, 0.3);
    }

    i {
      font-size: 1.6rem;
      transition: transform 0.3s ease;
    }

    &:hover i {
      transform: rotate(90deg);
    }
  }

  // Responsive adjustments
  @media (max-width: 768px) {
    top: 1rem;
    right: 1rem;

    .settings-link {
      width: 3.25rem;
      height: 3.25rem;

      i {
        font-size: 1.4rem;
      }
    }
  }
}
</style>
