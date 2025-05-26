<template>
  <div class="mobile-menu" :class="{ 'active': isOpen }" aria-hidden="!isOpen">
    <div class="mobile-menu-header">
      <div class="logo" aria-label="TutorIA Logo">TutorIA</div>
      <button
        class="close-menu"
        @click="$emit('close')"
        aria-label="Close menu"
      >
        <i class="fas fa-times" aria-hidden="true"></i>
      </button>
    </div>

    <div class="mobile-menu-links">
      <NavigationLinks
        :isMobile="true"
        @linkClicked="$emit('close')"
      />
    </div>

    <div class="mobile-menu-footer">
      <button class="logout-btn" @click="logout" aria-label="Log out">
        <i class="fas fa-sign-out-alt" aria-hidden="true"></i>
        <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import NavigationLinks from './NavigationLinks.vue';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close']);

const router = useRouter();

// Function to handle logout
const logout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
    emit('close');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
</script>

<style lang="scss" scoped>
@use '@/assets/sass/components/_mobile_menu.scss' as mobile_menu;
</style>
