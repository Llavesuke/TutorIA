<template>
  <div class="tutor-detail-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="tutor-detail-main">
      <div class="container">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading tutor details...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchTutorDetails" class="retry-button">
            <i class="fas fa-sync-alt"></i> Retry
          </button>
        </div>

        <!-- Tutor details -->
        <div v-else-if="tutor" class="tutor-details">
          <!-- Navigation breadcrumbs -->
          <div class="breadcrumbs">
            <button @click="goBack" class="back-button">
              <i class="fas fa-arrow-left"></i> Back to Unit
            </button>
          </div>

          <!-- Tutor header -->
          <div class="tutor-header" :class="tutor.tipo">
            <div class="tutor-header-content">
              <div class="tutor-image-container">
                <div class="tutor-image">
                  <img v-if="tutor.imagen" :src="tutor.imagen" :alt="tutor.nombre" />
                  <div v-else class="tutor-placeholder" :class="tutor.tipo">
                    <i :class="getTutorTypeIcon(tutor.tipo)"></i>
                  </div>
                </div>
                <div class="tutor-status-indicator" :class="{ 'active': tutor.activo, 'inactive': !tutor.activo }">
                  <i class="fas" :class="tutor.activo ? 'fa-check-circle' : 'fa-times-circle'"></i>
                  <span>{{ tutor.activo ? 'Active' : 'Inactive' }}</span>
                </div>
              </div>

              <div class="tutor-info">
                <h1>{{ tutor.nombre }}</h1>
                <div class="tutor-badges">
                  <span class="type-badge" :class="tutor.tipo">
                    <i :class="getTutorTypeIcon(tutor.tipo)"></i>
                    {{ getTutorTypeLabel(tutor.tipo) }}
                  </span>
                  <span v-if="tutor.grupo" class="group-badge">
                    <i class="fas fa-users"></i>
                    {{ tutor.grupo }}
                  </span>
                  <span v-if="tutor.unidad && tutor.unidad.modulo" class="module-badge">
                    <i class="fas fa-book"></i>
                    {{ tutor.unidad.modulo.nombre }}
                  </span>
                </div>

                <div class="tutor-details-cards">
                  <div class="tutor-detail-card objective-card" v-if="tutor.objetivo">
                    <div class="card-header">
                      <i class="fas fa-bullseye"></i>
                      <h3>Objective</h3>
                    </div>
                    <p>{{ tutor.objetivo }}</p>
                  </div>

                  <div class="tutor-detail-card instructions-card" v-if="tutor.instrucciones">
                    <div class="card-header">
                      <i class="fas fa-clipboard-list"></i>
                      <h3>Instructions</h3>
                    </div>
                    <p>{{ tutor.instrucciones }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Student interactions section -->
          <div class="students-section">
            <div class="section-header">
              <h2><i class="fas fa-users"></i> Student Interactions</h2>
              <div class="section-actions">
                <button class="refresh-btn" @click="fetchStudentInteractions" :disabled="isLoadingStudents">
                  <i class="fas fa-sync-alt" :class="{ 'fa-spin': isLoadingStudents }"></i>
                  Refresh
                </button>
              </div>
            </div>

            <!-- Loading state for students -->
            <div v-if="isLoadingStudents" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading student interactions...</p>
            </div>

            <!-- Error state for students -->
            <div v-else-if="studentsError" class="error-message">
              <p>{{ studentsError }}</p>
              <div class="error-actions">
                <button @click="fetchStudentInteractions" class="retry-button">
                  <i class="fas fa-sync-alt"></i> Retry
                </button>
                <button @click="reloadPage" class="reload-button">
                  <i class="fas fa-redo-alt"></i> Reload Page
                </button>
              </div>
            </div>

            <!-- Empty state for students -->
            <div v-else-if="studentInteractions.length === 0" class="empty-state">
              <i class="fas fa-user-slash empty-icon"></i>
              <p>No students have interacted with this tutor yet.</p>
            </div>

            <!-- Students table -->
            <div v-else class="students-table-container">
              <table class="students-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade/Class</th>
                    <th>Last Interaction</th>
                    <th>Messages</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="interaction in studentInteractions" :key="interaction.id">
                    <td class="student-name">
                      <div class="student-avatar" v-if="interaction.student.avatar">
                        <img :src="interaction.student.avatar" :alt="interaction.student.name">
                      </div>
                      <div class="student-avatar default-avatar" v-else>
                        <span>{{ getStudentInitials(interaction.student.name) }}</span>
                      </div>
                      <span>{{ interaction.student.name }}</span>
                    </td>
                    <td>{{ interaction.student.grade }} {{ interaction.student.class }}</td>
                    <td>{{ formatDate(interaction.lastInteraction) }}</td>
                    <td class="message-count">
                      <span class="message-badge">{{ interaction.messageCount }}</span>
                    </td>
                    <td class="actions-cell">
                      <button class="view-chat-btn" @click="viewConversation(interaction)">
                        <i class="fas fa-comments"></i> View Chat
                      </button>
                      <button v-if="canAddComments" class="add-comment-btn" @click="addComment(interaction)">
                        <i class="fas fa-comment-medical"></i> Add Comment
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Conversation Modal -->
    <ConversationModal
      v-if="selectedConversation"
      :isOpen="isConversationModalOpen"
      :conversation="selectedConversation"
      :tutorName="tutor ? tutor.nombre : ''"
      :studentName="selectedStudent ? selectedStudent.name : ''"
      @close="closeConversationModal"
      @add-comment="saveComment"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import ConversationModal from '@/components/modals/ConversationModal.vue';
import TutorService from '@/services/tutorService';
import ChatService from '@/services/chatService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State for tutor details
const tutor = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');

// State for student interactions
const studentInteractions = ref([]);
const isLoadingStudents = ref(false);
const studentsError = ref('');

// State for conversation modal
const isConversationModalOpen = ref(false);
const selectedConversation = ref(null);
const selectedStudent = ref(null);

// Get user role from auth store
const userRole = computed(() => authStore.userRole.value);

// Check if user can add comments (admin or professor)
const canAddComments = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

// Methods for tutor details
const fetchTutorDetails = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const tutorId = route.params.id;
    if (!tutorId) {
      errorMessage.value = 'No tutor ID provided';
      return;
    }

    // Fetch tutor details from Supabase
    tutor.value = await TutorService.getTutorDetailsFromSupabase(tutorId);
    console.log('Tutor details:', tutor.value);

    // After loading tutor details, fetch student interactions
    fetchStudentInteractions();

  } catch (error) {
    console.error('Error fetching tutor details:', error);
    errorMessage.value = 'Failed to load tutor details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.go(-1);
};

const reloadPage = () => {
  window.location.reload();
};

// Methods for student interactions
const fetchStudentInteractions = async () => {
  if (!tutor.value || !tutor.value.id) return;

  try {
    isLoadingStudents.value = true;
    studentsError.value = '';

    // Fetch student interactions from the API
    console.log('Fetching student interactions for tutor ID:', tutor.value.id);
    const interactions = await ChatService.getStudentInteractionsByTutor(tutor.value.id);
    studentInteractions.value = interactions;
    console.log('Student interactions loaded:', studentInteractions.value);

    // Log the length to make it clear if we got any results
    console.log('Number of student interactions:', studentInteractions.value.length);

  } catch (error) {
    console.error('Error fetching student interactions:', error);
    studentsError.value = 'Failed to load student interactions. Please try again.';
  } finally {
    isLoadingStudents.value = false;
  }
};

// Methods for conversation modal
const viewConversation = async (interaction) => {
  try {
    // Fetch the full conversation
    const conversation = await ChatService.getConversation(interaction.chatId);
    selectedConversation.value = conversation;
    selectedStudent.value = interaction.student;

    // Log para depurar
    console.log('Selected student:', selectedStudent.value);
    console.log('Student name being passed to modal:', selectedStudent.value.name);

    isConversationModalOpen.value = true;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    alert('Failed to load conversation. Please try again.');
  }
};

const closeConversationModal = () => {
  isConversationModalOpen.value = false;
  selectedConversation.value = null;
  selectedStudent.value = null;
};

const addComment = (interaction) => {
  viewConversation(interaction);
};

const saveComment = async (commentData) => {
  try {
    await ChatService.addTeacherComment(commentData.chatId, commentData.comment);
    // Refresh the conversation
    if (selectedConversation.value) {
      const updatedConversation = await ChatService.getConversation(commentData.chatId);
      selectedConversation.value = updatedConversation;
    }
  } catch (error) {
    console.error('Error saving comment:', error);
    alert('Failed to save comment. Please try again.');
  }
};

// Helper methods
const getTutorTypeLabel = (type) => {
  switch (type) {
    case 'teorico': return 'Theoretical';
    case 'practico': return 'Practical';
    case 'evaluador': return 'Evaluator';
    case 'general': return 'General';
    default: return type;
  }
};

const getTutorTypeIcon = (type) => {
  switch (type) {
    case 'teorico': return 'fas fa-book';
    case 'practico': return 'fas fa-tools';
    case 'evaluador': return 'fas fa-clipboard-check';
    default: return 'fas fa-robot';
  }
};

const getStudentInitials = (name) => {
  if (!name) return '';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

onMounted(() => {
  // Add class to body for global styles
  document.body.classList.add('minimalist-theme');

  // Fetch tutor details
  fetchTutorDetails();
});
</script>

<style lang="scss" scoped>
@import './TutorDetailPage.scss';
</style>
