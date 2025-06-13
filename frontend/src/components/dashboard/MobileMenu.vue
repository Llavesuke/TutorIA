<template>
  <div class="mobile-menu" :class="{ 'active': isOpen }" aria-hidden="!isOpen">
    <div class="mobile-menu-header">
      <div class="logo" aria-label="TutorIA Logo">
        <img src="@/assets/images/text_logo.png" alt="TutorIA Logo" class="logo-image" />
      </div>
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
      <button class="create-btn" @click="openCreateModal" aria-label="Create new item">
        <i class="fas fa-plus" aria-hidden="true"></i>
        <span>Create</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import NavigationLinks from './NavigationLinks.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'openCreateModal']);

const router = useRouter();

// Function to handle opening create modal
const openCreateModal = () => {
  emit('openCreateModal');
  emit('close');
};
</script>

<style lang="scss" scoped>
@use '@/assets/sass/components/_mobile_menu.scss' as mobile_menu;
</style>
