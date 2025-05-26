<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// Header component for TutorIA application
const isMobileMenuOpen = ref(false)

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value

  // Prevent body scroll when menu is open
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Close mobile menu when clicking outside
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

// Handle navigation with smooth scrolling
const handleNavigation = (event, targetId) => {
  event.preventDefault()

  // Close mobile menu if open
  if (isMobileMenuOpen.value) {
    closeMobileMenu()
  }

  // Smooth scroll to target
  const target = document.querySelector(targetId)
  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Close mobile menu on escape key
const handleKeydown = (event) => {
  if (event.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = '' // Reset body overflow
})
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header-logo">
        <img src="/src/assets/logo.svg" alt="TutorIA Logo" v-if="false" />
        <div class="logo-text">TutorIA</div>
      </div>

      <nav class="header-nav">
        <ul>
          <li><a href="#features" class="nav-link" @click="handleNavigation($event, '#features')">Features</a></li>
          <li><a href="#how-it-works" class="nav-link" @click="handleNavigation($event, '#how-it-works')">How It Works</a></li>
          <li><a href="#why-tutoria" class="nav-link" @click="handleNavigation($event, '#why-tutoria')">Why TutorIA</a></li>
          <li><a href="#testimonials" class="nav-link" @click="handleNavigation($event, '#testimonials')">Testimonials</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <router-link to="/login" class="btn btn-outline">Sign In</router-link>
        <router-link to="/get-started" class="btn btn-primary">Get Started</router-link>
      </div>

      <button
        class="mobile-menu-toggle"
        :class="{ 'active': isMobileMenuOpen }"
        @click="toggleMobileMenu"
        aria-label="Toggle menu"
        :aria-expanded="isMobileMenuOpen"
      >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <!-- Mobile Menu Overlay -->
      <div
        v-if="isMobileMenuOpen"
        class="mobile-menu-overlay"
        @click="closeMobileMenu"
        aria-hidden="true"
      ></div>

      <!-- Mobile Menu -->
      <nav
        class="mobile-menu"
        :class="{ 'active': isMobileMenuOpen }"
        :aria-hidden="!isMobileMenuOpen"
      >
        <div class="mobile-menu-header">
          <div class="mobile-logo">TutorIA</div>
          <button
            class="mobile-menu-close"
            @click="closeMobileMenu"
            aria-label="Close menu"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="mobile-menu-content">
          <ul class="mobile-nav-links">
            <li><a href="#features" class="mobile-nav-link" @click="handleNavigation($event, '#features')">Features</a></li>
            <li><a href="#how-it-works" class="mobile-nav-link" @click="handleNavigation($event, '#how-it-works')">How It Works</a></li>
            <li><a href="#why-tutoria" class="mobile-nav-link" @click="handleNavigation($event, '#why-tutoria')">Why TutorIA</a></li>
            <li><a href="#testimonials" class="mobile-nav-link" @click="handleNavigation($event, '#testimonials')">Testimonials</a></li>
          </ul>

          <div class="mobile-menu-actions">
            <router-link to="/login" class="btn btn-outline btn-mobile" @click="closeMobileMenu">Sign In</router-link>
            <router-link to="/get-started" class="btn btn-primary btn-mobile" @click="closeMobileMenu">Get Started</router-link>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  background-color: var(--color-carbon);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: var(--z-index-sticky);

  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-logo {
    display: flex;
    align-items: center;

    img {
      height: 2.5rem;
      width: auto;
    }

    .logo-text {
      font-family: var(--font-family-heading);
      font-size: 1.5rem;
      font-weight: var(--font-weight-bold);
      margin-left: var(--spacing-sm);
      color: var(--color-cashmere);

      &::before {
        content: '';
        display: inline-block;
        width: 1.5rem;
        height: 1.5rem;
        background-color: var(--color-vivid-orange);
        border-radius: 50%;
        margin-right: 0.5rem;
        vertical-align: middle;
      }
    }
  }

  .header-nav {
    display: none;

    @media (min-width: 768px) {
      display: flex;
      align-items: center;
    }

    ul {
      display: flex;
      gap: var(--spacing-md);

      li {
        a {
          color: var(--color-text);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-sm);
          transition: color var(--transition-normal), background-color var(--transition-normal);

          &:hover, &.active {
            color: var(--color-vivid-orange);
          }
        }
      }
    }
  }

  .header-actions {
    display: none;
    gap: var(--spacing-md);

    @media (min-width: 768px) {
      display: flex;
    }

    // Ensure buttons are properly sized on all devices
    .btn {
      white-space: nowrap;
      min-height: 40px;

      @media (max-width: 1024px) {
        padding: 0.5em 1em;
        font-size: 0.9rem;
      }
    }
  }

  .mobile-menu-toggle {
    display: block;
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-xs);
    z-index: 1001;
    position: relative;
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--border-radius-sm);
    transition: background-color 0.3s ease;

    @media (min-width: 768px) {
      display: none;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &:focus {
      outline: 2px solid var(--color-vivid-orange);
      outline-offset: 2px;
    }

    .bar {
      display: block;
      width: 25px;
      height: 3px;
      margin: 5px auto;
      background-color: var(--color-text);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center;
      border-radius: 2px;
    }

    &:hover .bar {
      background-color: var(--color-vivid-orange);
    }

    &.active {
      .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
        background-color: var(--color-vivid-orange);
      }

      .bar:nth-child(2) {
        opacity: 0;
        transform: scaleX(0);
      }

      .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
        background-color: var(--color-vivid-orange);
      }
    }
  }

  // Mobile Menu Overlay
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
  }

  // Mobile Menu
  .mobile-menu {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 320px;
    background-color: var(--color-carbon);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    // Responsive adjustments for very small screens
    @media (max-width: 360px) {
      max-width: 100%;
      width: 100%;
    }

    // Ensure proper sizing for 320px screens
    @media (max-width: 320px) {
      max-width: 100%;
      width: 100%;
      padding: 0;
    }

    &.active {
      transform: translateX(0);
    }

    .mobile-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border);

      .mobile-logo {
        font-family: var(--font-family-heading);
        font-size: 1.5rem;
        font-weight: var(--font-weight-bold);
        color: var(--color-cashmere);

        &::before {
          content: '';
          display: inline-block;
          width: 1.2rem;
          height: 1.2rem;
          background-color: var(--color-vivid-orange);
          border-radius: 50%;
          margin-right: 0.5rem;
          vertical-align: middle;
        }
      }

      .mobile-menu-close {
        background: none;
        border: none;
        color: var(--color-text);
        font-size: 1.5rem;
        cursor: pointer;
        padding: var(--spacing-xs);
        transition: color 0.3s ease;

        &:hover {
          color: var(--color-vivid-orange);
        }
      }
    }

    .mobile-menu-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-lg);

      .mobile-nav-links {
        list-style: none;
        padding: 0;
        margin: 0 0 var(--spacing-xl) 0;

        li {
          margin-bottom: var(--spacing-sm);

          .mobile-nav-link {
            display: block;
            color: var(--color-text);
            text-decoration: none;
            font-size: 1.1rem;
            font-weight: var(--font-weight-medium);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius-md);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            min-height: 48px;
            display: flex;
            align-items: center;
            position: relative;
            overflow: hidden;

            // Add touch-friendly sizing
            @media (max-width: 320px) {
              padding: var(--spacing-md);
              font-size: 1rem;
            }

            // Subtle background effect
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(230, 83, 29, 0.1), transparent);
              transition: left 0.5s ease;
            }

            &:hover, &:focus {
              background-color: rgba(255, 255, 255, 0.08);
              color: var(--color-vivid-orange);
              transform: translateX(8px);
              outline: none;

              &::before {
                left: 100%;
              }
            }

            &:active {
              transform: translateX(4px) scale(0.98);
              background-color: rgba(230, 83, 29, 0.1);
            }
          }
        }
      }

      .mobile-menu-actions {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
        margin-top: auto;

        .btn-mobile {
          width: 100%;
          justify-content: center;
          padding: var(--spacing-md);
          font-size: 1rem;
        }
      }
    }
  }

  // Animations
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}
</style>
