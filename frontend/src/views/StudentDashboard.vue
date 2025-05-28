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
@import './StudentDashboard.scss';
</style>
