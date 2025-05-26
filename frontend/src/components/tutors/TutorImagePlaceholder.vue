<template>
  <div class="tutor-placeholder" :class="tutorType">
    <div class="placeholder-icon">
      <i :class="iconClass"></i>
    </div>
    <div class="placeholder-text">{{ tutorName }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tutorName: {
    type: String,
    required: true
  },
  tutorType: {
    type: String,
    default: 'general'
  }
});

// Compute the appropriate icon based on tutor type
const iconClass = computed(() => {
  switch (props.tutorType) {
    case 'teorico':
      return 'fas fa-book';
    case 'practico':
      return 'fas fa-tools';
    case 'evaluador':
      return 'fas fa-clipboard-check';
    default:
      return 'fas fa-robot';
  }
});
</script>

<style lang="scss" scoped>
.tutor-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 70%);
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    background: linear-gradient(
      45deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.05) 50%,
      rgba(255,255,255,0) 100%
    );
    transform: rotate(45deg);
    animation: shine 3s infinite ease-in-out;
  }

  &.teorico {
    background-color: var(--color-forest-green);
    background-image: linear-gradient(135deg, var(--color-forest-green) 0%, darken(#007142, 15%) 100%);
  }

  &.practico {
    background-color: var(--color-purple);
    background-image: linear-gradient(135deg, var(--color-purple) 0%, darken(#34307b, 15%) 100%);
  }

  &.evaluador {
    background-color: var(--color-orange);
    background-image: linear-gradient(135deg, var(--color-orange) 0%, darken(#e6531d, 15%) 100%);
  }

  &.general {
    background-color: #2c3e50;
    background-image: linear-gradient(135deg, #2c3e50 0%, darken(#2c3e50, 15%) 100%);
  }

  .placeholder-icon {
    font-size: 3rem;
    margin-bottom: 0.8rem;
    position: relative;
    z-index: 2;

    i {
      opacity: 0.9;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
  }

  .placeholder-text {
    font-size: 1.2rem;
    font-weight: var(--font-weight-bold);
    max-width: 90%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    z-index: 2;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  20%, 100% {
    left: 100%;
  }
}
</style>
