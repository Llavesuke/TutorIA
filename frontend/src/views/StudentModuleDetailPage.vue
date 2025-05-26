<template>
  <div class="student-module-detail">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Main content -->
    <main class="module-detail-main">
      <div class="container">
        <!-- Settings button -->
        <SettingsButton />

        <!-- Back button -->
        <div class="back-button">
          <button @click="goBack" class="back-link">
            <div class="back-icon">
              <i class="fas fa-arrow-left"></i>
            </div>
            <span>Back to Home</span>
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="bubble-loader">
            <div class="bubble bubble-1"></div>
            <div class="bubble bubble-2"></div>
            <div class="bubble bubble-3"></div>
          </div>
          <p class="loading-text">Loading module details...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchModuleDetails" class="retry-button">
            <span>Try Again</span>
          </button>
        </div>

        <!-- Module details -->
        <div v-else-if="module" class="module-details">
          <!-- Module header -->
          <div class="module-header">
            <h1>{{ module.nombre }}</h1>
            <p class="professor-name" v-if="professorName">Professor: {{ professorName }}</p>
            <div class="module-badges">
              <span class="grade-badge">{{ module.curso }}</span>
              <span class="class-badge" v-if="module.clase">Class {{ module.clase }}</span>
            </div>
          </div>

          <!-- Units section -->
          <div class="units-section">
            <h2 class="units-title">Units</h2>

            <!-- Units loading state -->
            <div v-if="isLoadingUnits" class="loading-container">
              <div class="bubble-loader">
                <div class="bubble bubble-1"></div>
                <div class="bubble bubble-2"></div>
                <div class="bubble bubble-3"></div>
              </div>
              <p class="loading-text">Loading units...</p>
            </div>

            <!-- Units error state -->
            <div v-else-if="unitsError" class="error-message">
              <p>{{ unitsError }}</p>
              <button @click="fetchUnits" class="retry-button">
                <span>Try Again</span>
              </button>
            </div>

            <!-- Empty units state -->
            <div v-else-if="units.length === 0" class="empty-state">
              <p>No units available for this module yet.</p>
            </div>

            <!-- Units grid -->
            <div v-else class="units-grid">
              <div
                v-for="unit in units"
                :key="unit.id"
                class="unit-card"
                @click="navigateToUnit(unit.id)"
              >
                <div class="unit-number">U{{ unit.orden }}</div>
                <h3 class="unit-title">{{ unit.nombre }}</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import gsap from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import ModuleService from '@/services/moduleService';
import UnitService from '@/services/unitService';
import UserService from '@/services/userService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const module = ref(null);
const units = ref([]);
const professorName = ref('');
const isLoading = ref(true);
const isLoadingUnits = ref(true);
const errorMessage = ref('');
const unitsError = ref('');

// Methods
const fetchModuleDetails = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const moduleId = route.params.id;
    if (!moduleId) {
      errorMessage.value = 'No module ID provided';
      return;
    }

    // Fetch module details
    module.value = await ModuleService.getModuleById(moduleId);
    console.log('Module details:', module.value);

    // Fetch professor information
    if (module.value) {
      const professors = await ModuleService.getProfessorsByModule(moduleId);
      console.log('Professors data:', professors);

      if (professors && professors.length > 0) {
        // Check if the response already contains the professor name
        if (professors[0].name) {
          professorName.value = professors[0].name;
        } else if (professors[0].id) {
          // If we only have the ID, fetch the full professor data
          const professor = await UserService.getUserById(professors[0].id);
          if (professor) {
            professorName.value = professor.nombre_real;
          }
        }
      }
    }

    // After loading module details, fetch units
    fetchUnits();
  } catch (error) {
    console.error('Error fetching module details:', error);
    errorMessage.value = 'Failed to load module details. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const fetchUnits = async () => {
  try {
    isLoadingUnits.value = true;
    unitsError.value = '';

    if (!module.value || !module.value.id) {
      unitsError.value = 'Module information not available';
      return;
    }

    // Fetch units for this module
    const unitData = await UnitService.getUnitsByModule(module.value.id);
    console.log('Units data:', unitData);

    // Sort units by order
    units.value = unitData.sort((a, b) => a.orden - b.orden);
  } catch (error) {
    console.error('Error fetching units:', error);
    unitsError.value = 'Failed to load units. Please try again.';
  } finally {
    isLoadingUnits.value = false;
  }
};



const navigateToUnit = (unitId) => {
  router.push(`/student/unit/${unitId}`);
};

const goBack = () => {
  router.push('/student/home');
};

// Lifecycle hooks
onMounted(() => {
  fetchModuleDetails();

  // Add GSAP animations
  gsap.from('.back-button', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.module-header', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    delay: 0.3
  });

  gsap.from('.units-section', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.6
  });
});
</script>

<style lang="scss" scoped>
.student-module-detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .module-detail-main {
    flex: 1;
    padding: 2rem 1rem;
    z-index: 1;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }
  }

  .back-button {
    margin-bottom: 3rem;
    position: relative;

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
      text-decoration: none;
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

  .module-header {
    margin-bottom: 4rem;
    text-align: center;
    padding: 2rem 0;

    h1 {
      font-family: 'Poppins', sans-serif;
      color: #FEF0D1;
      font-size: 2.8rem;
      font-weight: 700;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .professor-name {
      font-family: 'Poppins', sans-serif;
      color: rgba(254, 240, 209, 0.8);
      font-size: 1.3rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
      letter-spacing: 0.5px;
    }

    .module-badges {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      flex-wrap: wrap;

      .grade-badge, .class-badge {
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 0.3px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-1px);
        }
      }

      .grade-badge {
        background-color: #34307b;
        color: #FEF0D1;
      }

      .class-badge {
        background-color: #007142;
        color: #FEF0D1;
      }
    }
  }



  .units-section {
    margin-top: 4rem;

    .units-title {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      color: #FEF0D1;
      margin-bottom: 2.5rem;
      text-align: center;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 3px;
        background: linear-gradient(90deg, #e6531d, #34307b);
        border-radius: 2px;
      }
    }
  }

  .units-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
  }

  .unit-card {
    background-color: rgba(23, 23, 23, 0.8);
    border: 1px solid rgba(254, 240, 209, 0.1);
    border-radius: 12px;
    padding: 2rem;
    color: #FEF0D1;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
      border-color: rgba(230, 83, 29, 0.3);

      .unit-number {
        color: #e6531d;
      }
    }

    .unit-number {
      font-family: 'Poppins', sans-serif;
      font-size: 2.2rem;
      font-weight: 800;
      color: #34307b;
      margin-bottom: 1.5rem;
      transition: all 0.3s ease;
    }

    .unit-title {
      font-family: 'Poppins', sans-serif;
      font-size: 1.6rem;
      font-weight: 600;
      margin-bottom: 0.8rem;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
      letter-spacing: 0.3px;
    }

    .unit-description {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      opacity: 0.8;
      line-height: 1.5;
      position: relative;
      z-index: 1;
      font-weight: 400;
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
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    margin: 2rem 0;
  }

  .bubble-loader {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;

    .bubble {
      position: absolute;
      border-radius: 50%;
      animation: bubbleDeform 2.5s ease-in-out infinite;
    }

    .bubble-1 {
      width: 80px;
      height: 80px;
      background-color: #e6531d;
      animation-delay: 0s;
      z-index: 3;
    }

    .bubble-2 {
      width: 100px;
      height: 100px;
      background-color: #34307b;
      opacity: 0.7;
      animation-delay: 0.8s;
      z-index: 2;
    }

    .bubble-3 {
      width: 120px;
      height: 120px;
      background-color: #007142;
      opacity: 0.4;
      animation-delay: 1.6s;
      z-index: 1;
    }
  }

  .loading-text {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    font-size: 1.3rem;
    color: #FEF0D1;
    text-shadow: 0 0 10px rgba(230, 83, 29, 0.3);
    animation: textPulse 2s ease-in-out infinite;
  }

  @keyframes bubbleDeform {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      border-radius: 50%;
    }
    25% {
      transform: scale(1.2, 0.8) rotate(90deg);
      border-radius: 60% 40% 60% 40%;
    }
    50% {
      transform: scale(0.8, 1.2) rotate(180deg);
      border-radius: 40% 60% 40% 60%;
    }
    75% {
      transform: scale(1.1, 0.9) rotate(270deg);
      border-radius: 55% 45% 55% 45%;
    }
  }

  @keyframes textPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.05);
    }
  }

  .retry-button {
    margin-top: 2rem;
    padding: 0.8rem 2rem;
    background: linear-gradient(135deg, var(--color-orange) 0%, #f44336 100%);
    color: white;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    font-weight: 600;
    font-size: 1.1rem;
    box-shadow: 0 4px 15px rgba(230, 83, 29, 0.4);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #f44336 0%, var(--color-orange) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(230, 83, 29, 0.5);

      &::before {
        opacity: 1;
      }
    }

    span {
      position: relative;
      z-index: 1;
    }
  }
}

@media (max-width: 768px) {
  .student-module-detail {
    .units-grid {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }
}

@media (max-width: 480px) {
  .student-module-detail {
    .module-header {
      h1 {
        font-size: 2rem;
      }
    }

    .units-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
