<script setup>
import { ref } from 'vue';
import NavigationLinks from './NavigationLinks.vue';
import MobileMenu from './MobileMenu.vue';
import CreateSelectionModal from '@/components/modals/CreateSelectionModal.vue';

const isMenuOpen = ref(false);
const showCreateModal = ref(false);

// Toggle mobile menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Toggle create modal
const openCreateModal = () => {
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

// Handle creation events
const onTutorCreated = (tutor) => {
  console.log('Tutor created:', tutor);
  // You can emit events or handle the creation as needed
};

const onUnitCreated = (unit) => {
  console.log('Unit created:', unit);
  // You can emit events or handle the creation as needed
};

const onAssignmentCreated = (assignment) => {
  console.log('Assignment created:', assignment);
  // You can emit events or handle the creation as needed
};
</script>

<style lang="scss" scoped>

  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  .logo {
    display: flex;
    align-items: center;

    .logo-image {
      height: 40px;
      width: auto;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .create-btn {
    background-color: #007142;
    color: #FEF0D1;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;

    &:hover {
      background-color: darken(#007142, 10%);
      transform: translateY(-2px);
    }
  }

  .settings-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #34307b;
    color: #FEF0D1;
    text-decoration: none;
    transition: all 0.3s ease;

    i {
      font-size: 1.2rem;
    }

    &:hover {
      background-color: #e6531d;
      transform: rotate(30deg);
    }
  }

  .mobile-menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 20px;

    @media (max-width: 768px) {
      display: flex;
    }

    .bar {
      display: block;
      width: 100%;
      height: 2px;
      background-color: #FEF0D1;
      transition: all 0.3s ease;
      border-radius: 1px;
    }

    &.active {
      .bar:nth-child(1) {
        transform: translateY(9px) rotate(45deg);
      }

      .bar:nth-child(2) {
        opacity: 0;
      }

      .bar:nth-child(3) {
        transform: translateY(-9px) rotate(-45deg);
      }
    }
  }

  @media (max-width: 768px) {
    .header-right {
      .create-btn {
        display: none;
      }
    }
  }

</style>

<template>
  <header class="professor-header" role="banner">
    <div class="container">
      <!-- Logo -->
      <div class="logo">
        <img src="@/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" class="logo-image" />
      </div>

      <!-- Navigation links -->
      <NavigationLinks />

      <!-- Header right section -->
      <div class="header-right">
        <!-- Create button -->
        <button
          class="create-btn"
          @click="openCreateModal"
          aria-label="Create new item"
        >
          <span aria-hidden="true">+</span> Create
        </button>
      </div>

      <!-- Mobile menu toggle -->
      <button
        class="mobile-menu-toggle"
        @click="toggleMenu"
        :class="{ 'active': isMenuOpen }"
        :aria-expanded="isMenuOpen"
        aria-controls="mobile-menu"
        aria-label="Toggle menu"
      >
        <span class="sr-only">Menu</span>
        <span class="bar" aria-hidden="true"></span>
        <span class="bar" aria-hidden="true"></span>
        <span class="bar" aria-hidden="true"></span>
      </button>

      <!-- Mobile menu toggle end -->
    </div>

  <!-- Mobile menu component moved outside of container -->
  <MobileMenu
    :isOpen="isMenuOpen"
    @close="toggleMenu"
    @openCreateModal="openCreateModal"
    id="mobile-menu"
  />
  </header>

  <!-- Create Selection Modal -->
  <CreateSelectionModal
    :isOpen="showCreateModal"
    @close="closeCreateModal"
    @tutor-created="onTutorCreated"
    @unit-created="onUnitCreated"
    @assignment-created="onAssignmentCreated"
  />
</template>

<style lang="scss" scoped>
@use '@/assets/sass/components/_professor_header.scss' as professor_header;

// Screen reader only class
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
