<template>
  <div class="manage-professors-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="manage-main">
      <div class="container">
        <!-- Encabezado de bienvenida -->
        <div class="welcome-section">
          <div class="title-section">
            <h1>Manage Professors</h1>
            <router-link to="/manage-users" class="back-link">
              <i class="fas fa-arrow-left"></i> Back to User Management
            </router-link>
          </div>
          <p class="subtitle">View and manage professor accounts in your educational center</p>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading professors...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchProfessors" class="retry-button">Retry</button>
        </div>

        <!-- Tabla de profesores -->
        <UserTable
          v-else
          :users="professors"
          userType="Professor"
          @add-user="openAddProfessorModal"
          @delete-user="confirmDeleteProfessor"
        />
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modal para añadir profesor -->
    <AddProfessorModal
      :isOpen="isAddProfessorModalOpen"
      :centerId="centerId"
      @close="isAddProfessorModalOpen = false"
      @invitation-sent="handleInvitationSent"
    />

    <!-- Modal de confirmación para eliminar profesor -->
    <ConfirmDeleteModal
      :isOpen="isConfirmDeleteModalOpen"
      :title="'Confirm Professor Deletion'"
      :message="professorToDelete ? `Are you sure you want to delete ${professorToDelete.name}?` : 'Are you sure you want to delete this professor?'"
      :details="'This action cannot be undone. All data associated with this professor will be permanently deleted.'"
      @close="isConfirmDeleteModalOpen = false"
      @confirm="handleDeleteConfirmed"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import UserTable from '@/components/users/UserTable.vue';
import AddProfessorModal from '@/components/modals/AddProfessorModal.vue';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal.vue';
import authStore from '@/stores/authStore';
import UserService from '@/services/userService';

// Initialize empty professors array
const professors = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Modal states
const isAddProfessorModalOpen = ref(false);
const isConfirmDeleteModalOpen = ref(false);
const professorToDelete = ref(null);

// Get center ID from authenticated user
const centerId = computed(() => {
  // Try different paths to find centro_id
  const user = authStore.user.value;
  if (!user) return null;

  // Check different possible locations for centro_id
  const id = user.centro_id ||
             user.user_metadata?.centro_id ||
             user.app_metadata?.centro_id;

  // If we can't find a valid centro_id, use a fallback UUID for testing
  // In a production environment, you would want to handle this differently
  if (!id) {
    console.warn('Using fallback UUID for testing. In production, you should get the actual centro_id.');
    return '00000000-0000-0000-0000-000000000000'; // Fallback UUID for testing
  }

  return id;
});

// Methods for handling user actions
const openAddProfessorModal = () => {
  isAddProfessorModalOpen.value = true;
};

const handleInvitationSent = (data) => {
  console.log('Invitation sent to:', data.email);
  // After an invitation is sent, refresh the list to get the latest data
  fetchProfessors();
};

const confirmDeleteProfessor = (id) => {
  // Find the professor to delete
  const professor = professors.value.find(p => p.id === id);

  if (professor) {
    // Set the professor to delete
    professorToDelete.value = professor;

    // Open the confirmation modal
    isConfirmDeleteModalOpen.value = true;
  }
};

const handleDeleteConfirmed = async () => {
  try {
    isLoading.value = true;

    // Call the API to delete the professor
    await UserService.deleteUser(professorToDelete.value.id);

    // After deletion, refresh the list
    await fetchProfessors();

  } catch (error) {
    console.error('Error deleting professor:', error);
    errorMessage.value = 'Failed to delete professor. Please try again later.';
  } finally {
    isLoading.value = false;
    professorToDelete.value = null;
  }
};

// Function to fetch professors from the API
const fetchProfessors = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    if (!centerId.value) {
      console.error('No center ID available');
      errorMessage.value = 'No educational center ID found. Please contact support.';
      return;
    }

    console.log('Fetching professors for center ID:', centerId.value);

    // Fetch professors from the API with center ID
    const data = await UserService.getUsersByRole('profesor', centerId.value);
    professors.value = data;

    console.log('Fetched professors:', professors.value);
  } catch (error) {
    console.error('Error fetching professors:', error);
    errorMessage.value = 'Failed to load professors. Please try again later.';
    // Keep the current professors if there's an error
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Añadir clase al body para estilos globales
  document.body.classList.add('minimalist-theme');

  // Log user and center ID for debugging
  console.log('Current user:', authStore.user.value);
  console.log('User metadata:', authStore.user.value?.user_metadata);
  console.log('App metadata:', authStore.user.value?.app_metadata);
  console.log('Center ID:', centerId.value);

  // If we don't have a center ID, let's log a warning
  if (!centerId.value) {
    console.warn('No center ID found in user object. This will cause issues with invitations.');
  }

  // Fetch professors from the API
  fetchProfessors();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/pages/_manage_table.scss';

.manage-professors-page {
  @extend .manage-table-page;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--color-cashmere);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 113, 66, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-green);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background-color: rgba(0, 113, 66, 0.1);
  border-left: 4px solid var(--color-green);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  color: var(--color-cashmere);
  text-align: center;
}

.retry-button {
  background-color: var(--color-green);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-top: 0.5rem;
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: background-color 0.3s ease;
}

.retry-button:hover {
  background-color: #005e36;
}
</style>
