<template>
  <div class="student-chat-view">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Main content -->
    <main class="chat-main">
      <div class="chat-container">
        <!-- Back button -->
        <div class="back-button">
          <button @click="goBack" class="back-link">
            <div class="back-icon">
              <i class="fas fa-arrow-left"></i>
            </div>
            <span>Back</span>
          </button>
        </div>

        <!-- Settings button -->
        <SettingsButton />

        <!-- Tutor header -->
        <div class="tutor-header">
          <h1>{{ tutor ? tutor.nombre : 'Tutor' }}</h1>
          <p v-if="tutor && tutor.objetivo" class="tutor-objective">{{ tutor.objetivo }}</p>
        </div>

        <!-- Chat interface -->
        <div class="chat-interface-container">
          <ChatInterface
            :tutorId="tutorId"
            :tutorName="tutor ? tutor.nombre : 'Tutor'"
            :tutorAvatar="tutor && tutor.imagen ? tutor.imagen : null"
            @message-sent="handleMessageSent"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { gsap } from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import ChatInterface from '@/components/chat/ChatInterface.vue';
import TutorService from '@/services/tutorService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const tutorId = ref(null);
const tutor = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');

// Methods
const fetchTutorDetails = async () => {
  if (!tutorId.value) return;

  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Fetch tutor details
    const tutorData = await TutorService.getTutorById(tutorId.value);
    tutor.value = tutorData;

    // Set document title
    document.title = `TutorIA - Chat with ${tutor.value.nombre}`;

  } catch (error) {
    console.error('Error fetching tutor details:', error);
    errorMessage.value = 'Failed to load tutor details. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleMessageSent = (messageData) => {
  console.log('Message sent:', messageData);
  // You can add analytics or other processing here
};

// Go back function
const goBack = () => {
  if (tutor.value && tutor.value.unidad_id) {
    router.push(`/student/unit/${tutor.value.unidad_id}`);
  } else {
    router.push('/student/home');
  }
};

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId) {
    tutorId.value = newId;
    fetchTutorDetails();
  }
});

// Initialize on component mount
onMounted(() => {
  // Get tutor ID from route params
  if (route.params.id) {
    tutorId.value = route.params.id;
    fetchTutorDetails();
  } else {
    errorMessage.value = 'No tutor specified';
  }

  // Add GSAP animations
  gsap.from('.back-button', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.tutor-header', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    delay: 0.3
  });

  gsap.from('.chat-interface-container', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.6
  });
});
</script>

<style lang="scss" scoped>
@import './StudentChatView.scss';
</style>
