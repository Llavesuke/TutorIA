<template>
  <nav :class="['nav-links', { 'mobile': isMobile }]" :aria-label="isMobile ? 'Mobile Navigation' : 'Main Navigation'">
    <router-link
      to="/teacher/dashboard"
      :class="['nav-link', { 'active': isActive('/teacher/dashboard'), 'mobile-link': isMobile }]"
      @click="isMobile ? $emit('linkClicked') : null"
      aria-current="page"
    >
      Dashboard
    </router-link>
    <router-link
      :to="isAdmin ? '/manage-users' : '/teacher/students'"
      :class="['nav-link', { 'active': isAdmin ? isActive('/manage-users') || isActive('/manage-professors') || isActive('/manage-students') : isActive('/teacher/students'), 'mobile-link': isMobile }]"
      @click="isMobile ? $emit('linkClicked') : null"
    >
      {{ isAdmin ? 'Manage' : 'Students' }}
    </router-link>

    <router-link
      to="/teacher/modules"
      :class="['nav-link', { 'active': isActive('/teacher/modules'), 'mobile-link': isMobile }]"
      @click="isMobile ? $emit('linkClicked') : null"
    >
      Modules
    </router-link>
    <router-link
      to="/teacher/settings"
      :class="['nav-link', { 'active': isActive('/teacher/settings'), 'mobile-link': isMobile }]"
      @click="isMobile ? $emit('linkClicked') : null"
    >
      Settings
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '@/stores/authStore';

const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['linkClicked']);

const route = useRoute();

// Get user role from auth store
const isAdmin = computed(() => authStore.isAdmin.value);

// Function to check if a route is active
const isActive = (path) => {
  return route.path === path;
};
</script>

<style lang="scss" scoped>
.nav-links {
  &.mobile {
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;

    .nav-link {
      color: var(--color-cashmere);
      text-decoration: none;
      padding: 1.5rem 1rem;
      font-size: 1.4rem;
      font-weight: 500;
      border-bottom: 1px solid var(--color-border);
      transition: color var(--transition-normal);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        color: var(--color-vivid-orange);
      }

      &.active {
        color: var(--color-vivid-orange);
      }
    }
  }

  &:not(.mobile) {
    display: flex; // Mostrar por defecto
    align-items: center;
    gap: 0.25rem; // Add consistent spacing between nav links

    @media (max-width: 767px) {
      display: none; // Ocultar en móvil
    }

    .nav-link {
      color: var(--color-cashmere);
      text-decoration: none;
      padding: 0.5rem 0.5rem; // Reduced padding to bring links closer
      font-weight: 500;
      font-size: 0.85rem;
      transition: color 0.3s ease;

      &:hover {
        color: var(--color-vivid-orange);
      }

      &.active {
        color: var(--color-vivid-orange);
        font-weight: 600;
      }
    }
  }
}
</style>
