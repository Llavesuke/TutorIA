<template>
  <div class="module-detail-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="module-detail-main">
      <div class="container">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading module details...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchModuleDetails" class="retry-button">Retry</button>
        </div>

        <!-- Module details -->
        <div v-else-if="module" class="module-details">
          <!-- Module header -->
          <div class="module-header">
            <h1>{{ module.nombre }}</h1>
            <p class="professor-name">Professor: {{ professorName }}</p>
            <div class="module-badges">
              <span class="grade-badge">{{ module.curso }}</span>
              <span class="class-badge" v-if="module.clase">Class {{ module.clase }}</span>
            </div>
          </div>

          <!-- Module content -->
          <div class="module-content">
            <!-- Module card -->
            <div class="module-card">
              <div class="module-icon">
                <i class="fas fa-book"></i>
                <h2>{{ module.nombre }}</h2>
                <p class="units-count">{{ units.length }} units</p>
              </div>
            </div>

            <!-- Units grid -->
            <div class="units-container">
              <h2 class="units-title">Units</h2>

              <div v-if="units.length === 0" class="no-units">
                <p>No units found for this module.</p>
                <button
                  v-if="userRole === 'admin' || userRole === 'profesor'"
                  class="add-unit-btn"
                  @click="openAddUnitModal"
                >
                  <i class="fas fa-plus"></i> Add Unit
                </button>
              </div>

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

                <!-- Add Unit button when units exist -->
                <div v-if="userRole === 'admin' || userRole === 'profesor'" class="add-unit-card" @click="openAddUnitModal">
                  <div class="add-icon">
                    <i class="fas fa-plus-circle"></i>
                  </div>
                  <h3 class="add-title">Add New Unit</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modal para añadir unidad -->
    <AddUnitModal
      :isOpen="isAddUnitModalOpen"
      :moduleId="route.params.id"
      :currentUnitsCount="units.length"
      @close="isAddUnitModalOpen = false"
      @unit-created="handleUnitCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import AddUnitModal from '@/components/modals/AddUnitModal.vue';
import ModuleService from '@/services/moduleService';
import UnitService from '@/services/unitService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const module = ref(null);
const units = ref([]);
const professors = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const isAddUnitModalOpen = ref(false);

// Get user role
const userRole = computed(() => {
  const user = authStore.user.value;
  if (!user) return null;

  return user.rol || user.user_metadata?.rol || user.app_metadata?.rol;
});

// Get professor name
const professorName = computed(() => {
  if (professors.value && professors.value.length > 0) {
    return professors.value[0].name;
  }
  return 'Not assigned';
});

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

    // Fetch units for this module
    units.value = await UnitService.getUnitsByModule(moduleId);
    console.log('Units:', units.value);

    // Fetch professors assigned to this module
    professors.value = await ModuleService.getProfessorsByModule(moduleId);
    console.log('Professors:', professors.value);

  } catch (error) {
    console.error('Error fetching module details:', error);
    errorMessage.value = 'Failed to load module details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const navigateToUnit = (unitId) => {
  // Navigate to unit detail page
  router.push(`/unit/${unitId}`);
};



const openAddUnitModal = () => {
  isAddUnitModalOpen.value = true;
};

const handleUnitCreated = async (data) => {
  console.log('Unit created:', data);

  // Refresh the units list
  await fetchModuleDetails();
};

onMounted(() => {
  // Add class to body for global styles
  document.body.classList.add('minimalist-theme');

  // Fetch module details
  fetchModuleDetails();
});
</script>

<style lang="scss" scoped>
.module-detail-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.module-detail-main {
  flex: 1;
  padding: 2rem 0;
  position: relative;
  z-index: 2;
}

.loading-container, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--color-cashmere);
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid var(--color-orange);
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-forest-green);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.module-header {
  margin-bottom: 2rem;
  color: var(--color-cashmere);
  text-align: center;

  h1 {
    font-size: 3rem;
    font-weight: var(--font-weight-bold);
    margin-bottom: 0.5rem;
  }

  .professor-name {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 1rem;
  }

  .module-badges {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .grade-badge, .class-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: var(--font-weight-medium);
    }

    .grade-badge {
      background-color: var(--color-purple);
      color: white;
    }

    .class-badge {
      background-color: var(--color-forest-green);
      color: white;
    }
  }
}

.module-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: center;
}

.module-card {
  background-color: var(--color-forest-green);
  border-radius: 8px;
  padding: 2rem;
  color: white;
  text-align: center;
  max-width: 300px;
  margin: 0 auto;
}

.module-icon {
  display: flex;
  flex-direction: column;
  align-items: center;

  i {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.8rem;
    font-weight: var(--font-weight-bold);
    margin-bottom: 0.5rem;
  }

  .units-count {
    font-size: 1.1rem;
    opacity: 0.9;
  }
}

.units-container {
  margin-top: 2rem;
}

.units-title {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-cashmere);
  margin-bottom: 1.5rem;
  text-align: center;
}

.no-units {
  color: var(--color-cashmere);
  text-align: center;
  padding: 2rem;

  p {
    margin-bottom: 1rem;
  }

  .add-unit-btn {
    background-color: var(--color-orange);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.unit-card {
  background-color: var(--color-dark-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  color: var(--color-cashmere);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }

  .unit-number {
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-orange);
    margin-bottom: 1rem;
  }

  .unit-title {
    font-size: 1.4rem;
    font-weight: var(--font-weight-medium);
    margin-bottom: 0.5rem;
  }

  .unit-description {
    font-size: 0.9rem;
    opacity: 0.8;
  }
}

@media (max-width: 768px) {
  .units-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.add-unit-card {
  background-color: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  color: var(--color-cashmere);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--color-deep-green);
    transform: translateY(-5px);
  }

  .add-icon {
    font-size: 3rem;
    color: var(--color-deep-green);
    margin-bottom: 1rem;
  }

  .add-title {
    font-size: 1.2rem;
    font-weight: var(--font-weight-medium);
    text-align: center;
  }
}

@media (max-width: 576px) {
  .units-grid {
    grid-template-columns: 1fr;
  }
}
</style>
