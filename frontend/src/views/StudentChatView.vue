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
.student-chat-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .chat-main {
    flex: 1;
    padding: 1rem;
    z-index: 1;
    display: flex;
    flex-direction: column;
    margin-top: 1rem;

    .chat-container {
      max-width: 800px;
      width: 100%;
      margin: 0 auto;
      height: calc(100vh - 80px);
      display: flex;
      flex-direction: column;
      position: relative;

      .back-button {
        position: fixed;
        top: 1.5rem;
        left: 1.5rem;
        z-index: 100;

        .back-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background-color: #34307b;
          color: #FEF0D1;
          border: none;
          padding: 1rem 1.75rem;
          border-radius: 50px;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(52, 48, 123, 0.3);

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background-color: #e6531d;
            transition: left 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            z-index: 0;
          }

          &:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 12px 35px rgba(52, 48, 123, 0.4);

            &::before {
              left: 0;
            }

            .back-icon {
              transform: translateX(-3px) rotate(-5deg);
            }
          }

          .back-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            background: rgba(254, 240, 209, 0.2);
            border-radius: 50%;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;

            i {
              font-size: 1.1rem;
            }
          }

          span {
            position: relative;
            z-index: 1;
            letter-spacing: 0.5px;
          }
        }
      }



      .tutor-header {
        padding: 1.5rem 0;
        text-align: center;
        background-color: #007142;
        border-radius: 12px 12px 0 0;
        margin-bottom: 1px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 15px rgba(0, 113, 66, 0.3);

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
          z-index: 1;
        }

        h1 {
          color: #FEF0D1;
          font-size: 2.2rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.5px;
        }

        .tutor-objective {
          color: rgba(254, 240, 209, 0.9);
          font-size: 1.1rem;
          margin: 0;
          position: relative;
          z-index: 2;
          max-width: 80%;
          margin: 0 auto;
          background-color: rgba(0, 0, 0, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          animation: fadeIn 0.6s ease-out 0.3s both;

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        }
      }

      .chat-interface-container {
        flex: 1;
        border-radius: 0 0 12px 12px;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        height: calc(100vh - 180px);
        background: rgba(23, 23, 23, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-top: none;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 90% 10%, rgba(230, 83, 29, 0.1) 0%, transparent 30%),
            radial-gradient(circle at 10% 90%, rgba(0, 113, 66, 0.1) 0%, transparent 30%);
          pointer-events: none;
          z-index: 0;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .chat-main {
      padding: 0.5rem;

      .chat-container {
        height: calc(100vh - 70px);

        .back-button {
          top: 1rem;
          left: 1rem;

          .back-link {
            padding: 0.75rem 1.25rem;
            font-size: 0.9rem;

            .back-icon {
              width: 28px;
              height: 28px;

              i {
                font-size: 1rem;
              }
            }
          }
        }

        .tutor-header {
          padding: 0.5rem 0;

          h1 {
            font-size: 1.5rem;
          }
        }

        .chat-interface-container {
          height: calc(100vh - 150px);
        }
      }
    }
  }
}
</style>
