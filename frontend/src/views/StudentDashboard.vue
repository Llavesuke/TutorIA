<template>
  <div class="student-dashboard">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Student Header -->
    <StudentHeader />

    <!-- Main content -->
    <main class="dashboard-main">
      <div class="container">
        <!-- Settings button -->
        <SettingsButton />

        <!-- Welcome section -->
        <div class="welcome-section">
          <h1>Welcome, <span class="student-name">{{ studentName }}</span>!</h1>
          <p class="subtitle">Here are your virtual tutors</p>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading your tutors...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchTutors" class="retry-button">Try Again</button>
        </div>

        <!-- Empty state -->
        <div v-else-if="tutors.length === 0" class="empty-state">
          <p>You don't have any tutors assigned yet.</p>
        </div>

        <!-- Tutors grid -->
        <div v-else class="tutors-grid">
          <div
            v-for="tutor in tutors"
            :key="tutor.id"
            class="tutor-card"
            :class="getTutorTypeClass(tutor.tipo)"
            @click="openChat(tutor.id)"
          >
            <div class="tutor-avatar">
              <img v-if="tutor.imagen" :src="tutor.imagen" :alt="tutor.nombre">
              <div v-else class="default-avatar">
                <span>{{ getInitials(tutor.nombre) }}</span>
              </div>
            </div>
            <div class="tutor-info">
              <h3 class="tutor-name">{{ tutor.nombre }}</h3>
              <p class="tutor-type">{{ formatTutorType(tutor.tipo) }}</p>
              <p class="tutor-module">{{ tutor.modulo_nombre }}</p>
              <p class="tutor-unit">{{ tutor.unidad_nombre }}</p>
            </div>
            <div class="tutor-action">
              <button class="chat-button">
                <i class="fas fa-comments"></i> Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import StudentHeader from '@/components/dashboard/StudentHeader.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import authStore from '@/stores/authStore';

// Router
const router = useRouter();

// State
const tutors = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');

// Computed
const studentName = computed(() => {
  return authStore.userName.value || 'Student';
});

// Methods
const fetchTutors = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Import supabase client
    const supabase = (await import('@/utils/supabaseClient')).default;

    // Get user ID from auth store
    const userId = authStore.userId.value;

    if (!userId) {
      errorMessage.value = 'User not authenticated';
      return;
    }

    // Get student's grade and class
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('curso, clase, centro_id')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      errorMessage.value = 'Failed to load user data';
      return;
    }

    // Get modules for the student's grade and class
    const { data: modules, error: modulesError } = await supabase
      .from('modulos')
      .select('id, nombre')
      .eq('centro_id', userData.centro_id)
      .eq('curso', userData.curso)
      .eq('clase', userData.clase);

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      errorMessage.value = 'Failed to load modules';
      return;
    }

    // Get all tutors for these modules
    const moduleIds = modules.map(m => m.id);

    if (moduleIds.length === 0) {
      tutors.value = [];
      return;
    }

    // Get units for these modules
    const { data: units, error: unitsError } = await supabase
      .from('unidades')
      .select('id, nombre, modulo_id')
      .in('modulo_id', moduleIds);

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      errorMessage.value = 'Failed to load units';
      return;
    }

    // Get tutors for these units
    const unitIds = units.map(u => u.id);

    if (unitIds.length === 0) {
      tutors.value = [];
      return;
    }

    const { data: tutorData, error: tutorsError } = await supabase
      .from('tutores_virtuales')
      .select('*')
      .in('unidad_id', unitIds)
      .eq('activo', true);

    if (tutorsError) {
      console.error('Error fetching tutors:', tutorsError);
      errorMessage.value = 'Failed to load tutors';
      return;
    }

    // Enrich tutor data with module and unit names
    tutors.value = tutorData.map(tutor => {
      const unit = units.find(u => u.id === tutor.unidad_id);
      const module = unit ? modules.find(m => m.id === unit.modulo_id) : null;

      return {
        ...tutor,
        unidad_nombre: unit ? unit.nombre : 'Unknown Unit',
        modulo_nombre: module ? module.nombre : 'Unknown Module'
      };
    });

  } catch (error) {
    console.error('Error in fetchTutors:', error);
    errorMessage.value = 'An error occurred while loading tutors';
  } finally {
    isLoading.value = false;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatTutorType = (type) => {
  if (!type) return 'General';

  const types = {
    'teorico': 'Theoretical',
    'practico': 'Practical',
    'evaluador': 'Evaluator',
    'general': 'General'
  };

  return types[type] || 'General';
};

const getTutorTypeClass = (type) => {
  if (!type) return 'general-tutor';

  const classes = {
    'teorico': 'theory-tutor',
    'practico': 'practical-tutor',
    'evaluador': 'evaluator-tutor',
    'general': 'general-tutor'
  };

  return classes[type] || 'general-tutor';
};

const openChat = (tutorId) => {
  router.push(`/student/chat/${tutorId}`);
};

// Load tutors when component is mounted
onMounted(() => {
  fetchTutors();
});
</script>

<style lang="scss" scoped>
.student-dashboard {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .dashboard-main {
    flex: 1;
    padding: 2rem 1rem;
    z-index: 1;
    margin-top: 1rem;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;



      .welcome-section {
        margin-bottom: 2rem;
        text-align: center;

        h1 {
          color: #FEF0D1;
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;

          .student-name {
            color: #e6531d;
          }
        }

        .subtitle {
          color: rgba(254, 240, 209, 0.7);
          font-size: 1.2rem;
        }
      }

      .loading-container, .error-message, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
        color: #FEF0D1;
        text-align: center;

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(230, 83, 29, 0.3);
          border-radius: 50%;
          border-top-color: #e6531d;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .retry-button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: #e6531d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            background-color: darken(#e6531d, 10%);
          }
        }
      }

      .tutors-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;

        .tutor-card {
          background-color: #1a1a1a;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          min-height: 279px;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }

          &.theory-tutor {
            border-top: 4px solid #34307b;
          }

          &.practical-tutor {
            border-top: 4px solid #007142;
          }

          &.evaluator-tutor {
            border-top: 4px solid #e6531d;
          }

          &.general-tutor {
            border-top: 4px solid #FEF0D1;
          }

          .tutor-avatar {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            margin-bottom: 1rem;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .default-avatar {
              width: 100%;
              height: 100%;
              background-color: #2a2a2a;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #FEF0D1;
              font-size: 1.5rem;
              font-weight: bold;
            }
          }

          .tutor-info {
            text-align: center;
            margin-bottom: 1rem;

            .tutor-name {
              color: #FEF0D1;
              font-size: 1.2rem;
              font-weight: bold;
              margin-bottom: 0.25rem;
            }

            .tutor-type {
              color: rgba(254, 240, 209, 0.7);
              font-size: 0.9rem;
              margin-bottom: 0.5rem;
            }

            .tutor-module, .tutor-unit {
              color: rgba(254, 240, 209, 0.5);
              font-size: 0.8rem;
              margin-bottom: 0.25rem;
            }
          }

          .tutor-action {
            margin-top: auto;

            .chat-button {
              background-color: #e6531d;
              color: white;
              border: none;
              border-radius: 24px;
              padding: 0.5rem 1.5rem;
              font-weight: bold;
              cursor: pointer;
              transition: background-color 0.2s;

              &:hover {
                background-color: darken(#e6531d, 10%);
              }

              i {
                margin-right: 0.5rem;
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .dashboard-main {
      padding: 1rem;

      .container {
        .welcome-section {
          h1 {
            font-size: 2rem;
          }
        }

        .tutors-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style>
