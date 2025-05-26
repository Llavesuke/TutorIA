<template>
  <div class="mobile-carousel" :class="{ 'is-mobile': isMobile }">
    <!-- Desktop Grid View -->
    <div v-if="!isMobile" class="desktop-grid" :class="gridClass">
      <div v-for="(item, index) in safeItems" :key="item.id || index">
        <slot :item="item" :index="index" name="default"></slot>
      </div>
    </div>

    <!-- Mobile Carousel View -->
    <div v-else class="carousel-container">
      <div
        class="carousel-track"
        ref="carouselTrack"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @scroll="handleScroll"
        :style="{ transform: `translateX(-${currentIndex * cardWidth}px)` }"
      >
        <div
          v-for="(item, index) in safeItems"
          :key="item.id || index"
          class="carousel-item"
          :class="{ 'active': index === currentIndex }"
          style="pointer-events: none; cursor: default; user-select: none;"
          @click.prevent.stop
          @mousedown.prevent.stop
          @touchstart.prevent.stop
        >
          <div style="pointer-events: none; cursor: default; user-select: none;" @click.prevent.stop>
            <slot :item="item" :index="index" name="default"></slot>
          </div>
        </div>
      </div>

      <!-- Navigation Dots -->
      <div class="carousel-indicators" v-if="showIndicators && safeItems.length > 1">
        <button
          v-for="(item, index) in safeItems"
          :key="index"
          class="indicator"
          :class="{ 'active': index === currentIndex }"
          @click="goToSlide(index)"
          :aria-label="`Go to slide ${index + 1}`"
        ></button>
      </div>

      <!-- Navigation Arrows (optional) -->
      <div class="carousel-navigation" v-if="showArrows">
        <button
          class="nav-button prev"
          @click="previousSlide"
          :disabled="currentIndex === 0"
          aria-label="Previous slide"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <button
          class="nav-button next"
          @click="nextSlide"
          :disabled="currentIndex === safeItems.length - 1"
          aria-label="Next slide"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  gridClass: {
    type: String,
    default: 'features-grid'
  },
  showIndicators: {
    type: Boolean,
    default: true
  },
  showArrows: {
    type: Boolean,
    default: false
  },
  autoPlay: {
    type: Boolean,
    default: false
  },
  autoPlayInterval: {
    type: Number,
    default: 5000
  }
})

// Computed property to ensure items is always an array
const safeItems = computed(() => {
  return Array.isArray(props.items) ? props.items : []
})

const currentIndex = ref(0)
const carouselTrack = ref(null)
const cardWidth = ref(300)
const isMobile = ref(false)
const touchStartX = ref(0)
const touchEndX = ref(0)
const isDragging = ref(false)
const autoPlayTimer = ref(null)

// Check if device is mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    nextTick(() => {
      updateCardWidth()
    })
  }
}

// Validate current index
const validateCurrentIndex = () => {
  if (currentIndex.value >= safeItems.value.length) {
    currentIndex.value = Math.max(0, safeItems.value.length - 1)
  }
  if (currentIndex.value < 0) {
    currentIndex.value = 0
  }
}

// Update card width for mobile carousel
const updateCardWidth = () => {
  if (carouselTrack.value && isMobile.value) {
    const container = carouselTrack.value.parentElement
    cardWidth.value = container.offsetWidth * 0.85 // 85% of container width
  }
}

// Navigation methods
const goToSlide = (index) => {
  if (index >= 0 && index < safeItems.value.length) {
    currentIndex.value = index
  }
}

const nextSlide = () => {
  if (currentIndex.value < safeItems.value.length - 1) {
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

const handleScroll = () => {
  // Handle scroll-based navigation if needed
}

// Auto-play functionality
const startAutoPlay = () => {
  if (props.autoPlay && isMobile.value && safeItems.value.length > 1) {
    autoPlayTimer.value = setInterval(() => {
      if (currentIndex.value < safeItems.value.length - 1) {
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

// Watch for changes in items to validate current index
watch(safeItems, () => {
  validateCurrentIndex()
}, { immediate: true })

// Lifecycle
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  validateCurrentIndex()
  startAutoPlay()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  stopAutoPlay()
})
</script>

<style lang="scss">
.mobile-carousel {
  width: 100%;
  position: relative;

  .desktop-grid {
    display: grid;
    gap: var(--spacing-lg);

    &.features-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }

    &.testimonials-grid {
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));

      // TESTIMONIAL CARDS - Brand color rotation for desktop grid
      > div:nth-child(3n+1) .testimonial-card {
        background: linear-gradient(135deg, #e6531d, #d14a1a) !important;
        border-top: 4px solid #e6531d !important;
        color: white !important;

        .testimonial-content p,
        .testimonial-author .author-info h4,
        .testimonial-author .author-info p {
          color: white !important;
        }

        .testimonial-author .author-avatar {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        .quote-icon {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }

      > div:nth-child(3n+2) .testimonial-card {
        background: linear-gradient(135deg, #007142, #005a35) !important;
        border-top: 4px solid #007142 !important;
        color: white !important;

        .testimonial-content p,
        .testimonial-author .author-info h4,
        .testimonial-author .author-info p {
          color: white !important;
        }

        .testimonial-author .author-avatar {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        .quote-icon {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }

      > div:nth-child(3n+3) .testimonial-card {
        background: linear-gradient(135deg, #34307b, #2a2562) !important;
        border-top: 4px solid #34307b !important;
        color: white !important;

        .testimonial-content p,
        .testimonial-author .author-info h4,
        .testimonial-author .author-info p {
          color: white !important;
        }

        .testimonial-author .author-avatar {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        .quote-icon {
          color: rgba(255, 255, 255, 0.9) !important;
        }
      }
    }

    &.fun-learning-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

      // FUN LEARNING CARDS - Brand color rotation for desktop grid
      > div:nth-child(3n+1) .fun-learning-card {
        background: linear-gradient(135deg, #e6531d, #d14a1a) !important;
        border-top: 4px solid #e6531d !important;
        color: white !important;

        .card-icon {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        h3, p {
          color: white !important;
        }
      }

      > div:nth-child(3n+2) .fun-learning-card {
        background: linear-gradient(135deg, #007142, #005a35) !important;
        border-top: 4px solid #007142 !important;
        color: white !important;

        .card-icon {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        h3, p {
          color: white !important;
        }
      }

      > div:nth-child(3n+3) .fun-learning-card {
        background: linear-gradient(135deg, #34307b, #2a2562) !important;
        border-top: 4px solid #34307b !important;
        color: white !important;

        .card-icon {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }

        h3, p {
          color: white !important;
        }
      }
    }
  }

  &.is-mobile {
    .carousel-container {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: 0 var(--spacing-md);

      .carousel-track {
        display: flex;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        gap: var(--spacing-md);
        padding: var(--spacing-sm) 0;

        .carousel-item {
          flex: 0 0 85%;
          max-width: 85%;

          @media (max-width: 320px) {
            flex: 0 0 90%;
            max-width: 90%;
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
            box-shadow: 0 0 8px rgba(230, 83, 29, 0.5);
          }

          &:hover {
            background-color: rgba(230, 83, 29, 0.7);
            transform: scale(1.1);
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

  // FORCE WHITE ICONS for all card types
  .card-icon {
    color: white !important;
    background-color: rgba(255, 255, 255, 0.2) !important;

    i {
      color: white !important;
    }
  }
}
</style>
