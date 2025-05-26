<script setup>
// App.vue - Root component
import ToastNotification from '@/components/common/ToastNotification.vue';
</script>

<template>
  <router-view />
  <ToastNotification position="top-right" :duration="3000" />
</template>

<style>
/* Global styles */
</style>
