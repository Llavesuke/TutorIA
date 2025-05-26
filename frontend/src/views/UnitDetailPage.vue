<template>
  <div class="unit-detail-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Notification -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <div class="notification-content">
        <i class="notification-icon" :class="getNotificationIcon(notification.type)"></i>
        <span>{{ notification.message }}</span>
        <button class="notification-close" @click="hideNotification">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Contenido principal -->
    <main class="unit-detail-main">
      <div class="container">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading unit details...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchUnitDetails" class="retry-button">Retry</button>
        </div>

        <!-- Unit details -->
        <div v-else-if="unit" class="unit-details">
          <!-- Navigation breadcrumbs -->
          <div class="breadcrumbs">
            <button @click="goBack" class="back-button">
              <i class="fas fa-arrow-left"></i> Back to Module
            </button>
          </div>

          <!-- Unit header -->
          <div class="unit-header">
            <h1>{{ unit.nombre }}</h1>
            <div class="unit-badges">
              <span class="module-badge">{{ moduleName }}</span>
              <span class="order-badge">Unit {{ unit.orden }}</span>
            </div>
          </div>

          <!-- Unit content with tabs -->
          <div class="unit-content">
            <!-- Tabs navigation -->
            <div class="content-tabs">
              <div
                class="tab-item"
                :class="{ 'active': activeTab === 'tutors' }"
                @click="activeTab = 'tutors'"
              >
                <i class="fas fa-robot"></i> Tutors
              </div>
              <div
                class="tab-item"
                :class="{ 'active': activeTab === 'assignments' }"
                @click="activeTab = 'assignments'"
              >
                <i class="fas fa-tasks"></i> Assignments
              </div>
            </div>

            <!-- Tab content -->
            <div class="tab-content">
              <!-- Tutors tab -->
              <div v-if="activeTab === 'tutors'" class="tutors-tab">
                <div class="tutors-grid">
                  <!-- Loading state -->
                  <div v-if="isLoadingTutors" class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading tutors...</p>
                  </div>

                  <!-- Error state -->
                  <div v-else-if="tutorsError" class="error-message">
                    <p>{{ tutorsError }}</p>
                    <button @click="fetchTutors" class="retry-button">Retry</button>
                  </div>

                  <!-- Empty state -->
                  <div v-else-if="tutors.length === 0" class="empty-state">
                    <p>No tutors found for this unit.</p>
                    <button
                      v-if="userRole === 'admin' || userRole === 'profesor'"
                      class="add-tutor-btn"
                      @click="openAddTutorModal"
                    >
                      <i class="fas fa-plus"></i> Create Tutor
                    </button>
                  </div>

                  <!-- Tutors grid -->
                  <div v-else class="tutors-cards">
                    <TutorCard
                      v-for="tutor in tutors"
                      :key="tutor.id"
                      :tutor="tutor"
                      @view="viewTutor"
                      @edit="editTutor"
                      @delete="deleteTutor"
                      @toggle-status="toggleTutorStatus"
                    />
                  </div>

                  <!-- Add tutor button when tutors exist -->
                  <div
                    v-if="(userRole === 'admin' || userRole === 'profesor') && tutors.length > 0"
                    class="add-tutor-container"
                  >
                    <button class="add-tutor-btn" @click="openAddTutorModal">
                      <i class="fas fa-plus"></i> Create Tutor
                    </button>
                  </div>
                </div>
              </div>

              <!-- Assignments tab -->
              <div v-else-if="activeTab === 'assignments'" class="assignments-tab">
                <div class="assignments-list">
                  <!-- Loading state -->
                  <div v-if="isLoadingAssignments" class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading assignments...</p>
                  </div>

                  <!-- Error state -->
                  <div v-else-if="assignmentsError" class="error-message">
                    <p>{{ assignmentsError }}</p>
                    <button @click="fetchAssignments" class="retry-button">Retry</button>
                  </div>

                  <!-- Empty state -->
                  <div v-else-if="assignments.length === 0" class="empty-state">
                    <p>No assignments found for this unit.</p>
                    <button
                      v-if="userRole === 'admin' || userRole === 'profesor'"
                      class="add-assignment-btn"
                      @click="openAddAssignmentModal"
                    >
                      <i class="fas fa-plus"></i> Create Assignment
                    </button>
                  </div>

                  <!-- Assignments list -->
                  <div v-else class="assignments-items">
                    <AssignmentItem
                      v-for="assignment in assignments"
                      :key="assignment.id"
                      :assignment="assignment"
                      @view="viewAssignment"
                      @submit="submitAssignment"
                      @edit="editAssignment"
                      @delete="deleteAssignment"
                      @toggle-status="toggleAssignmentStatus"
                    />
                  </div>

                  <!-- Add assignment button when assignments exist -->
                  <div
                    v-if="(userRole === 'admin' || userRole === 'profesor') && assignments.length > 0"
                    class="add-assignment-container"
                  >
                    <button class="add-assignment-btn" @click="openAddAssignmentModal">
                      <i class="fas fa-plus"></i> Create Assignment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modals -->
    <AddTutorModal
      :isOpen="isAddTutorModalOpen"
      :unitId="route.params.id"
      :currentGroup="currentGroup"
      @close="isAddTutorModalOpen = false"
      @tutor-created="handleTutorCreated"
    />

    <AddAssignmentModal
      :isOpen="isAddAssignmentModalOpen"
      :unitId="route.params.id"
      @close="isAddAssignmentModalOpen = false"
      @assignment-created="handleAssignmentCreated"
    />

    <!-- Edit Tutor Modal -->
    <EditTutorModal
      v-if="selectedTutor"
      :isOpen="isEditTutorModalOpen"
      :tutor="selectedTutor"
      @close="isEditTutorModalOpen = false"
      @tutor-updated="fetchTutors"
    />

    <!-- Confirm Delete Tutor Modal -->
    <ConfirmDeleteModal
      :isOpen="isConfirmDeleteTutorModalOpen"
      :title="'Confirm Tutor Deletion'"
      :message="tutorDeleteMessage"
      :details="'This action cannot be undone. All data associated with this tutor will be permanently deleted.'"
      @close="isConfirmDeleteTutorModalOpen = false"
      @confirm="handleDeleteTutorConfirmed"
    />

    <!-- Confirm Delete Assignment Modal -->
    <ConfirmDeleteModal
      :isOpen="isConfirmDeleteAssignmentModalOpen"
      :title="'Confirm Assignment Deletion'"
      :message="assignmentDeleteMessage"
      :details="'This action cannot be undone. All data associated with this assignment will be permanently deleted.'"
      @close="isConfirmDeleteAssignmentModalOpen = false"
      @confirm="handleDeleteAssignmentConfirmed"
    />

    <!-- Edit Assignment Modal -->
    <EditAssignmentModal
      v-if="selectedAssignment"
      :isOpen="isEditAssignmentModalOpen"
      :assignment="selectedAssignment"
      @close="isEditAssignmentModalOpen = false"
      @assignment-updated="fetchAssignments"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import TutorCard from '@/components/tutors/TutorCard.vue';
import AssignmentItem from '@/components/assignments/AssignmentItem.vue';
import AddTutorModal from '@/components/modals/AddTutorModal.vue';
import EditTutorModal from '@/components/modals/EditTutorModal.vue';
import AddAssignmentModal from '@/components/modals/AddAssignmentModal.vue';
import EditAssignmentModal from '@/components/modals/EditAssignmentModal.vue';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal.vue';
import UnitService from '@/services/unitService';
import ModuleService from '@/services/moduleService';
import TutorService from '@/services/tutorService';
import AssignmentService from '@/services/assignmentService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State for unit details
const unit = ref(null);
const module = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const moduleName = ref('');

// State for notifications
const notification = ref({
  show: false,
  message: '',
  type: 'success', // success, error, warning, info
  timeout: null
});

// State for tabs
const activeTab = ref('tutors');

// State for tutors tab
const tutors = ref([]);
const isLoadingTutors = ref(false);
const tutorsError = ref('');
const isAddTutorModalOpen = ref(false);
const isEditTutorModalOpen = ref(false);
const selectedTutor = ref(null);
const isConfirmDeleteTutorModalOpen = ref(false);
const tutorToDelete = ref(null);

// State for assignments tab
const assignments = ref([]);
const isLoadingAssignments = ref(false);
const assignmentsError = ref('');
const isAddAssignmentModalOpen = ref(false);
const isEditAssignmentModalOpen = ref(false);
const selectedAssignment = ref(null);
const isConfirmDeleteAssignmentModalOpen = ref(false);
const assignmentToDelete = ref(null);

// Get user role from auth store
const userRole = computed(() => authStore.userRole.value);

// Get current group/course from module
const currentGroup = computed(() => {
  if (module.value && module.value.curso) {
    return `${module.value.curso}${module.value.clase ? ' ' + module.value.clase : ''}`;
  }
  return '';
});

// Computed properties for delete confirmation messages
const tutorDeleteMessage = computed(() => {
  if (tutorToDelete.value) {
    return 'Are you sure you want to delete the tutor "' + tutorToDelete.value.nombre + '"?';
  }
  return 'Are you sure you want to delete this tutor?';
});

const assignmentDeleteMessage = computed(() => {
  if (assignmentToDelete.value) {
    return 'Are you sure you want to delete the assignment "' + assignmentToDelete.value.titulo + '"?';
  }
  return 'Are you sure you want to delete this assignment?';
});

// Notification methods
const showNotification = (message, type = 'success', duration = 3000) => {
  // Clear any existing timeout
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }

  // Update notification
  notification.value = {
    show: true,
    message,
    type,
    timeout: setTimeout(() => {
      hideNotification();
    }, duration)
  };
};

const hideNotification = () => {
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }
  notification.value.show = false;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle';
    case 'error':
      return 'fas fa-exclamation-circle';
    case 'warning':
      return 'fas fa-exclamation-triangle';
    case 'info':
      return 'fas fa-info-circle';
    default:
      return 'fas fa-bell';
  }
};

// Methods for unit details
const fetchUnitDetails = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const unitId = route.params.id;
    if (!unitId) {
      errorMessage.value = 'No unit ID provided';
      return;
    }

    // Fetch unit details
    unit.value = await UnitService.getUnitById(unitId);
    console.log('Unit details:', unit.value);

    if (unit.value && unit.value.modulo_id) {
      // Fetch module details
      module.value = await ModuleService.getModuleById(unit.value.modulo_id);
      console.log('Module details:', module.value);

      if (module.value) {
        moduleName.value = module.value.nombre;
      }
    }

    // After loading unit details, fetch tutors and assignments
    fetchTutors();
    fetchAssignments();

  } catch (error) {
    console.error('Error fetching unit details:', error);
    errorMessage.value = 'Failed to load unit details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  if (module.value) {
    router.push(`/module/${module.value.id}`);
  } else {
    router.push('/teacher/modules');
  }
};

// Methods for tutors tab
const fetchTutors = async () => {
  if (!unit.value || !unit.value.id) return;

  try {
    isLoadingTutors.value = true;
    tutorsError.value = '';

    // Get token from auth store
    const token = authStore.token.value;

    // Fetch tutors from the API
    const result = await TutorService.getTutorsByUnit(unit.value.id, token);
    console.log('Fetched tutors:', result);

    // If we have tutors, use them
    if (result && Array.isArray(result)) {
      // Add 'active' property to each tutor (based on 'activo' field from backend)
      tutors.value = result.map(tutor => ({
        ...tutor,
        active: tutor.activo !== undefined ? tutor.activo : true
      }));
    } else {
      // If no tutors or invalid response, use empty array
      tutors.value = [];
    }



  } catch (error) {
    console.error('Error fetching tutors:', error);
    tutorsError.value = 'Failed to load tutors. Please try again.';
  } finally {
    isLoadingTutors.value = false;
  }
};

const openAddTutorModal = () => {
  isAddTutorModalOpen.value = true;
};

const handleTutorCreated = async (newTutor) => {
  try {
    console.log('Tutor created from modal:', newTutor);

    // The tutor has already been created by the modal, just add it to the local list
    tutors.value.push({
      ...newTutor,
      active: newTutor.activo !== undefined ? newTutor.activo : true
    });

    console.log('Tutor added to local list successfully');

  } catch (error) {
    console.error('Error handling tutor creation:', error);
  } finally {
    isAddTutorModalOpen.value = false;
  }
};

const viewTutor = (tutor) => {
  console.log('View tutor:', tutor);
  // Navigate to the tutor detail page
  router.push(`/tutor/${tutor.id}`);
};

const editTutor = (tutor) => {
  console.log('Edit tutor:', tutor);
  selectedTutor.value = tutor;
  isEditTutorModalOpen.value = true;
};

const deleteTutor = (tutor) => {
  console.log('Delete tutor:', tutor);
  tutorToDelete.value = tutor;
  isConfirmDeleteTutorModalOpen.value = true;
};

const handleDeleteTutorConfirmed = async () => {
  if (!tutorToDelete.value) return;

  try {
    // Remove from local state first for better UX
    tutors.value = tutors.value.filter(t => t.id !== tutorToDelete.value.id);

    // Call API to delete from database
    await TutorService.deleteTutor(tutorToDelete.value.id);
    console.log(`Tutor ${tutorToDelete.value.id} deleted successfully`);

    // Show success message
    showNotification(`Tutor "${tutorToDelete.value.nombre}" has been deleted`, 'success');
  } catch (error) {
    console.error(`Error deleting tutor ${tutorToDelete.value.id}:`, error);

    // If there's an error, add the tutor back to the list
    if (!tutorToDelete.value.id.startsWith('temp-')) { // Only add back if it's not a temporary ID
      tutors.value.push(tutorToDelete.value);
    }

    // Show error message
    showNotification('Failed to delete tutor. Please try again.', 'error');
  } finally {
    tutorToDelete.value = null;
  }
};

const toggleTutorStatus = async (tutor) => {
  console.log('Toggle tutor status:', tutor);

  try {
    // Update the tutor in the local state first for better UX
    const tutorIndex = tutors.value.findIndex(t => t.id === tutor.id);
    if (tutorIndex !== -1) {
      tutors.value[tutorIndex].active = tutor.active;
      tutors.value[tutorIndex].activo = tutor.active;
    }

    // Call API to update the tutor's active status
    // Using PUT instead of PATCH to avoid CORS issues
    await TutorService.updateTutorActiveStatus(tutor.id, tutor.active);

    console.log(`Tutor ${tutor.id} status updated to ${tutor.active ? 'active' : 'inactive'}`);

    // Show a success message
    showNotification(`Tutor "${tutor.nombre}" is now ${tutor.active ? 'active' : 'inactive'}`, 'success');
  } catch (error) {
    console.error(`Error updating tutor ${tutor.id} status:`, error);

    // If there's an error, revert the change in the local state
    const tutorIndex = tutors.value.findIndex(t => t.id === tutor.id);
    if (tutorIndex !== -1) {
      tutors.value[tutorIndex].active = !tutor.active;
      tutors.value[tutorIndex].activo = !tutor.active;
    }

    // Show an error message
    showNotification('Failed to update tutor status. Please try again.', 'error');
  }
};

// Methods for assignments tab
const fetchAssignments = async () => {
  if (!unit.value || !unit.value.id) return;

  try {
    isLoadingAssignments.value = true;
    assignmentsError.value = '';

    try {
      // Fetch assignments from the API
      const result = await AssignmentService.getAssignmentsByUnit(unit.value.id);
      console.log('Fetched assignments:', result);

      // If we have assignments, use them
      if (result && Array.isArray(result)) {
        assignments.value = result;
      } else {
        // If no assignments or invalid response, use empty array
        assignments.value = [];
      }
    } catch (apiError) {
      console.log('Error fetching assignments from API, using empty array:', apiError);
      assignments.value = [];
    }



  } catch (error) {
    console.error('Error fetching assignments:', error);
    assignmentsError.value = 'Failed to load assignments. Please try again.';
  } finally {
    isLoadingAssignments.value = false;
  }
};

const openAddAssignmentModal = () => {
  isAddAssignmentModalOpen.value = true;
};

const handleAssignmentCreated = async (newAssignment) => {
  try {
    // Create the assignment in the backend
    const createdAssignment = await AssignmentService.createAssignment({
      unidadId: unit.value.id,
      titulo: newAssignment.titulo,
      descripcion: newAssignment.descripcion,
      fechaEntrega: newAssignment.fechaEntrega,
      puntuacionMaxima: newAssignment.puntuacionMaxima,
      permitirTexto: newAssignment.permitirTexto,
      permitirArchivos: newAssignment.permitirArchivos
    });

    console.log('Assignment created successfully:', createdAssignment);

    // Add the created assignment to the list
    assignments.value.push(createdAssignment);

  } catch (error) {
    console.error('Error creating assignment:', error);
    // If there's an error, still add the assignment to the local state in development mode
    if (process.env.NODE_ENV === 'development') {
      assignments.value.push({
        ...newAssignment,
        id: 'temp-' + Date.now()
      });
    }
  } finally {
    isAddAssignmentModalOpen.value = false;
  }
};

const viewAssignment = (assignment) => {
  console.log('View assignment:', assignment);
  // Navigate to the assignment detail page
  router.push(`/assignment/${assignment.id}`);
};

const submitAssignment = (assignment) => {
  console.log('Submit assignment:', assignment);
  // TODO: Implement submit assignment functionality
  // This could open a submission form
};

const editAssignment = (assignment) => {
  console.log('Edit assignment:', assignment);
  selectedAssignment.value = assignment;
  isEditAssignmentModalOpen.value = true;
};

const deleteAssignment = (assignment) => {
  console.log('Delete assignment:', assignment);
  assignmentToDelete.value = assignment;
  isConfirmDeleteAssignmentModalOpen.value = true;
};

const handleDeleteAssignmentConfirmed = async () => {
  if (!assignmentToDelete.value) return;

  try {
    // Remove from local state first for better UX
    assignments.value = assignments.value.filter(a => a.id !== assignmentToDelete.value.id);

    // Call API to delete from database
    await AssignmentService.deleteAssignment(assignmentToDelete.value.id);
    console.log(`Assignment ${assignmentToDelete.value.id} deleted successfully`);

    // Show success message
    showNotification(`Assignment "${assignmentToDelete.value.titulo}" has been deleted`, 'success');
  } catch (error) {
    console.error(`Error deleting assignment ${assignmentToDelete.value.id}:`, error);

    // If there's an error, add the assignment back to the list
    if (!assignmentToDelete.value.id.startsWith('temp-')) { // Only add back if it's not a temporary ID
      assignments.value.push(assignmentToDelete.value);
    }

    // Show error message
    showNotification('Failed to delete assignment. Please try again.', 'error');
  } finally {
    assignmentToDelete.value = null;
  }
};

const toggleAssignmentStatus = async (assignment) => {
  console.log('Toggle assignment status:', assignment);

  try {
    // Update the assignment in the local state first for better UX
    const assignmentIndex = assignments.value.findIndex(a => a.id === assignment.id);
    if (assignmentIndex !== -1) {
      assignments.value[assignmentIndex].active = assignment.active;
      assignments.value[assignmentIndex].activo = assignment.active;
    }

    // Call API to update just the assignment's active status
    await AssignmentService.updateAssignmentStatus(assignment.id, assignment.active);

    console.log(`Assignment ${assignment.id} status updated to ${assignment.active ? 'active' : 'inactive'}`);

    // Show a success message
    showNotification(`Assignment "${assignment.titulo}" is now ${assignment.active ? 'active' : 'inactive'}`, 'success');
  } catch (error) {
    console.error(`Error updating assignment ${assignment.id} status:`, error);

    // If there's an error, revert the change in the local state
    const assignmentIndex = assignments.value.findIndex(a => a.id === assignment.id);
    if (assignmentIndex !== -1) {
      assignments.value[assignmentIndex].active = !assignment.active;
      assignments.value[assignmentIndex].activo = !assignment.active;
    }

    // Show an error message
    showNotification('Failed to update assignment status. Please try again.', 'error');
  }
};

onMounted(() => {
  // Add class to body for global styles
  document.body.classList.add('minimalist-theme');

  // Fetch unit details
  fetchUnitDetails();
});
</script>

<style lang="scss" scoped>
.unit-detail-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease-out forwards;

  &.success {
    background-color: #171717;
    border-left: 4px solid #007142;
    color: #FEF0D1;

    .notification-icon {
      color: #007142;
    }
  }

  &.error {
    background-color: #171717;
    border-left: 4px solid #f44336;
    color: #FEF0D1;

    .notification-icon {
      color: #f44336;
    }
  }

  &.warning {
    background-color: #171717;
    border-left: 4px solid #ff9800;
    color: #FEF0D1;

    .notification-icon {
      color: #ff9800;
    }
  }

  &.info {
    background-color: #171717;
    border-left: 4px solid #34307b;
    color: #FEF0D1;

    .notification-icon {
      color: #34307b;
    }
  }

  .notification-content {
    display: flex;
    align-items: center;

    .notification-icon {
      margin-right: 0.75rem;
      font-size: 1.2rem;
    }

    span {
      flex: 1;
    }

    .notification-close {
      background: transparent;
      border: none;
      color: #FEF0D1;
      opacity: 0.7;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }
  }
}

@keyframes slideDown {
  from {
    transform: translate(-50%, -20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
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

.unit-detail-main {
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

.breadcrumbs {
  margin-bottom: 2rem;

  .back-button {
    background: none;
    border: none;
    color: var(--color-cashmere);
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      color: var(--color-orange);
    }
  }
}

.unit-header {
  margin-bottom: 2rem;
  color: var(--color-cashmere);

  h1 {
    font-size: 3rem;
    font-weight: var(--font-weight-bold);
    margin-bottom: 1rem;
  }

  .unit-badges {
    display: flex;
    gap: 0.5rem;

    .module-badge, .order-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: var(--font-weight-medium);
    }

    .module-badge {
      background-color: var(--color-forest-green);
      color: white;
    }

    .order-badge {
      background-color: var(--color-orange);
      color: white;
    }
  }
}

.unit-content {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 2rem;
  color: var(--color-cashmere);

  .content-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 2rem;

    .tab-item {
      padding: 0.8rem 1.5rem;
      color: var(--color-cashmere);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.3s ease;
      font-weight: var(--font-weight-medium);
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        font-size: 1.1rem;
      }

      &:hover {
        color: var(--color-orange);
      }

      &.active {
        color: var(--color-orange);
        border-bottom-color: var(--color-orange);
      }
    }
  }

  .tab-content {
    min-height: 300px;

    .tutors-tab, .assignments-tab {
      padding: 1rem 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
      text-align: center;

      p {
        margin-bottom: 1.5rem;
        opacity: 0.8;
      }
    }

    .tutors-grid {
      display: flex;
      flex-direction: column;
      gap: 2rem;

      .tutors-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2rem;

        @media (max-width: 768px) {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
      }

      .add-tutor-container {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
      }
    }

    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;

      .assignments-items {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .add-assignment-container {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
      }
    }
  }

  .add-tutor-btn, .add-assignment-btn {
    background-color: var(--color-forest-green);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 0.85rem 1.8rem;
    font-size: 1.1rem;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    &:hover {
      background-color: darken(#007142, 5%);
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: translateY(-1px);
    }

    i {
      font-size: 1.2rem;
    }
  }
}
</style>
