<template>
  <div class="manage-students-page">
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
            <h1>Manage Students</h1>
            <router-link to="/manage-users" class="back-link">
              <i class="fas fa-arrow-left"></i> Back to User Management
            </router-link>
          </div>
          <p class="subtitle">View and manage student accounts in your educational center</p>


        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading students...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchStudents" class="retry-button">Retry</button>
        </div>

        <!-- Tabla de estudiantes -->
        <UserTable
          v-else
          :users="students"
          userType="Student"
          @add-user="openAddStudentModal"
          @delete-user="confirmDeleteStudent"
        />
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modal para añadir estudiante -->
    <AddStudentModal
      :isOpen="isAddStudentModalOpen"
      :centerId="centerId"
      :existingClasses="existingClasses"
      @close="isAddStudentModalOpen = false"
      @student-created="handleStudentCreated"
    />

    <!-- Modal de confirmación para eliminar estudiante -->
    <ConfirmDeleteModal
      :isOpen="isConfirmDeleteModalOpen"
      :title="'Confirm Student Deletion'"
      :message="studentToDelete ? `Are you sure you want to delete ${studentToDelete.name}?` : 'Are you sure you want to delete this student?'"
      :details="'This action cannot be undone. All data associated with this student will be permanently deleted.'"
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
import AddStudentModal from '@/components/modals/AddStudentModal.vue';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal.vue';
import authStore from '@/stores/authStore';
import UserService from '@/services/userService';

// Initialize empty students array
const students = ref([]);
const existingClasses = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');

// Modal states
const isAddStudentModalOpen = ref(false);
const isConfirmDeleteModalOpen = ref(false);
const studentToDelete = ref(null);

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
const openAddStudentModal = () => {
  isAddStudentModalOpen.value = true;
};



const handleStudentCreated = (data) => {
  console.log('Student created:', data);

  // If a new class was created, add it to the existing classes
  if (data.newClassCreated && data.grade && data.class) {
    const newClass = { grade: data.grade, class: data.class };

    // Check if this class already exists in our list
    const exists = existingClasses.value.some(c =>
      c.grade === newClass.grade && c.class === newClass.class
    );

    if (!exists) {
      existingClasses.value.push(newClass);
      console.log('Added new class to existing classes:', newClass);
    }
  }

  // After a student is created, refresh the list to get the latest data
  fetchStudents();
};



const confirmDeleteStudent = (id) => {
  // Find the student to delete
  const student = students.value.find(s => s.id === id);

  if (student) {
    // Set the student to delete
    studentToDelete.value = student;

    // Open the confirmation modal
    isConfirmDeleteModalOpen.value = true;
  }
};

const handleDeleteConfirmed = async () => {
  try {
    isLoading.value = true;

    // Call the API to delete the student
    await UserService.deleteUser(studentToDelete.value.id);

    // After deletion, refresh the list
    await fetchStudents();

  } catch (error) {
    console.error('Error deleting student:', error);
    errorMessage.value = 'Failed to delete student. Please try again later.';
  } finally {
    isLoading.value = false;
    studentToDelete.value = null;
  }
};

// Function to fetch students from the API
const fetchStudents = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    if (!centerId.value) {
      console.error('No center ID available');
      errorMessage.value = 'No educational center ID found. Please contact support.';
      return;
    }

    console.log('Fetching students for center ID:', centerId.value);

    // Fetch students from the API with center ID
    const data = await UserService.getUsersByRole('estudiante', centerId.value);
    students.value = data;

    // Extract unique grade/class combinations
    extractExistingClasses();

    console.log('Fetched students:', students.value);
  } catch (error) {
    console.error('Error fetching students:', error);
    errorMessage.value = 'Failed to load students. Please try again later.';
    // Keep the current students if there's an error
  } finally {
    isLoading.value = false;
  }
};

// Function to extract unique grade/class combinations from students
const extractExistingClasses = () => {
  const uniqueClasses = new Map();

  students.value.forEach(student => {
    if (student.curso && student.clase) {
      const key = `${student.curso}-${student.clase}`;
      uniqueClasses.set(key, { grade: student.curso, class: student.clase });
    }
  });

  existingClasses.value = Array.from(uniqueClasses.values());
  console.log('Extracted existing classes:', existingClasses.value);
};

onMounted(() => {
  // Añadir clase al body para estilos globales
  document.body.classList.add('minimalist-theme');

  // Fetch students from the API
  fetchStudents();
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/pages/_manage_table.scss';

.manage-students-page {
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
  border: 5px solid rgba(230, 83, 29, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-orange);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background-color: rgba(230, 83, 29, 0.1);
  border-left: 4px solid var(--color-orange);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  color: var(--color-cashmere);
  text-align: center;
}

.retry-button {
  background-color: var(--color-orange);
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
  background-color: #d14817;
}

.management-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.action-button {
  background-color: var(--color-forest-green);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: var(--font-weight-medium);
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-button:hover {
  background-color: #005a35;
}

.action-button i {
  font-size: 1rem;
}
</style>
