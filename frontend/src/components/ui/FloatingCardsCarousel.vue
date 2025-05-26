<template>
  <div class="floating-cards-carousel" :class="{ 'is-mobile': isMobile }">
    <!-- Desktop Floating Cards View -->
    <div v-if="!isMobile" class="floating-cards-container">
      <slot></slot>
    </div>

    <!-- Mobile Carousel View -->
    <div v-else class="mobile-carousel-container">
      <div
        class="carousel-track"
        ref="carouselTrack"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }"
      >
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="carousel-item"
          :class="{ 'active': index === currentIndex }"
        >
          <div class="floating-card mobile-card" :data-animation="step.animation">
            <div class="card-number">{{ step.number }}</div>
            <div class="card-content">
              <div class="card-icon" :class="step.iconClass">
                <i :class="step.icon"></i>
              </div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
            <div class="card-glow" :class="step.glowClass"></div>
          </div>
        </div>
      </div>

      <!-- Navigation Dots -->
      <div class="carousel-indicators">
        <button
          v-for="(step, index) in steps"
          :key="index"
          class="indicator"
          :class="{ 'active': index === currentIndex }"
          @click="goToSlide(index)"
          :aria-label="`Go to step ${index + 1}`"
        ></button>
      </div>

      <!-- Navigation Arrows - Hidden for better text readability -->
      <!-- <div class="carousel-navigation">
        <button
          class="nav-button prev"
          @click="previousSlide"
          :disabled="currentIndex === 0"
          aria-label="Previous step"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button
          class="nav-button next"
          @click="nextSlide"
          :disabled="currentIndex === steps.length - 1"
          aria-label="Next step"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div> -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  autoPlay: {
    type: Boolean,
    default: false
  },
  autoPlayInterval: {
    type: Number,
    default: 4000
  }
})

const currentIndex = ref(0)
const carouselTrack = ref(null)
const cardWidth = ref(300)
const isMobile = ref(false)
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)
const autoPlayTimer = ref(null)

// Steps data for the How It Works section
const steps = ref([
  {
    id: 'journey-step-1',
    number: 1,
    title: 'Create Your Profile',
    description: 'Tell us about your learning goals and preferences to get a fully personalized experience.',
    icon: 'fas fa-user-plus',
    iconClass: 'orange-gradient',
    glowClass: 'orange-glow',
    animation: 'float-reveal'
  },
  {
    id: 'journey-step-2',
    number: 2,
    title: 'Choose Your Subjects',
    description: 'Explore our extensive library of subjects and specialized topics designed to match your learning pace.',
    icon: 'fas fa-book',
    iconClass: 'green-gradient',
    glowClass: 'green-glow',
    animation: 'float-reveal'
  },
  {
    id: 'journey-step-3',
    number: 3,
    title: 'Meet Your AI Tutor',
    description: 'Connect with your personalized AI tutor that adapts to your unique learning style.',
    icon: 'fas fa-robot',
    iconClass: 'purple-gradient',
    glowClass: 'purple-glow',
    animation: 'float-reveal'
  },
  {
    id: 'journey-step-4',
    number: 4,
    title: 'Interactive Learning',
    description: 'Engage with dynamic content, exercises, and real-time feedback for effective learning.',
    icon: 'fas fa-laptop',
    iconClass: 'orange-gradient',
    glowClass: 'orange-glow',
    animation: 'float-reveal'
  },
  {
    id: 'journey-step-5',
    number: 5,
    title: 'Track Your Progress',
    description: 'Monitor your improvement with detailed analytics and achievement milestones.',
    icon: 'fas fa-chart-line',
    iconClass: 'green-gradient',
    glowClass: 'green-glow',
    animation: 'float-reveal'
  }
])

// Check if device is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    nextTick(() => {
      updateCardWidth()
    })
  }
}

// Update card width for mobile carousel
const updateCardWidth = () => {
  if (carouselTrack.value && isMobile.value) {
    const container = carouselTrack.value.parentElement
    cardWidth.value = container.offsetWidth * 0.9 // 90% of container width
  }
}

// Navigation methods
const goToSlide = (index) => {
  if (index >= 0 && index < steps.value.length) {
    currentIndex.value = index
  }
}

const nextSlide = () => {
  if (currentIndex.value < steps.value.length - 1) {
    currentIndex.value++
  }
}

const previousSlide = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// Touch handling
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX
  isDragging.value = true
  stopAutoPlay()
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
}

const handleTouchEnd = (e) => {
  if (!isDragging.value) return

  touchEndX.value = e.changedTouches[0].clientX
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextSlide()
    } else {
      previousSlide()
    }
  }

  isDragging.value = false
  startAutoPlay()
}

// Auto-play functionality
const startAutoPlay = () => {
  if (props.autoPlay && isMobile.value) {
    autoPlayTimer.value = setInterval(() => {
      if (currentIndex.value < steps.value.length - 1) {
        nextSlide()
      } else {
        currentIndex.value = 0
      }
    }, props.autoPlayInterval)
  }
}

const stopAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  startAutoPlay()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  stopAutoPlay()
})
</script>

<style lang="scss" scoped>
.floating-cards-carousel {
  width: 100%;
  position: relative;

  .floating-cards-container {
    // Desktop styles will be inherited from existing floating cards styles
  }

  &.is-mobile {
    .mobile-carousel-container {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: 0 var(--spacing-md);

      .carousel-track {
        display: flex;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        gap: var(--spacing-md);
        padding: var(--spacing-lg) 0;

        .carousel-item {
          flex: 0 0 90%;
          max-width: 90%;

          @media (max-width: 320px) {
            flex: 0 0 95%;
            max-width: 95%;
          }

          .mobile-card {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }
        }
      }

      .carousel-indicators {
        display: flex;
        justify-content: center;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-lg);

        .indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background-color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;

          &.active {
            background-color: var(--color-vivid-orange);
            transform: scale(1.2);
          }

          &:hover {
            background-color: rgba(230, 83, 29, 0.7);
          }
        }
      }

      .carousel-navigation {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        padding: 0 var(--spacing-sm);

        .nav-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background-color: rgba(0, 0, 0, 0.5);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          pointer-events: auto;
          backdrop-filter: blur(10px);

          &:hover:not(:disabled) {
            background-color: var(--color-vivid-orange);
            transform: scale(1.1);
          }

          &:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }
        }
      }
    }
  }
}
</style>
