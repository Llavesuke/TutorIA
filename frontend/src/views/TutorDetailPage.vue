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
.tutor-detail-page {
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
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.tutor-detail-main {
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
  width: 50px;
  height: 50px;
  border: 5px solid rgba(230, 83, 29, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-vivid-orange);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  text-align: center;

  p {
    margin-bottom: 1.5rem;
    color: #f44336;
    font-size: 1.1rem;
  }

  .error-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }

  .retry-button, .reload-button {
    padding: 0.6rem 1.2rem;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .retry-button {
    background-color: var(--color-vivid-orange);
    box-shadow: 0 4px 8px rgba(230, 83, 29, 0.3);

    &:hover {
      background-color: #c4461a;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(230, 83, 29, 0.4);
    }
  }

  .reload-button {
    background-color: var(--color-deep-koamaru);
    box-shadow: 0 4px 8px rgba(52, 48, 123, 0.3);

    &:hover {
      background-color: #252259;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(52, 48, 123, 0.4);
    }
  }

  button:active {
    transform: translateY(0);
  }
}

.breadcrumbs {
  margin-bottom: 1.5rem;

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-cashmere);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
      transform: translateX(-5px);
    }

    i {
      font-size: 1.1rem;
    }
  }
}

.tutor-header {
  margin-bottom: 2.5rem;
  background-color: var(--color-dark-bg);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  position: relative;

  // Colored top border based on tutor type
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    z-index: 1;
  }

  &.teorico::before {
    background: linear-gradient(90deg, var(--color-forest-green), #004a2c);
  }

  &.practico::before {
    background: linear-gradient(90deg, var(--color-deep-koamaru), #252259);
  }

  &.evaluador::before {
    background: linear-gradient(90deg, var(--color-vivid-orange), #c4461a);
  }

  &.general::before {
    background: linear-gradient(90deg, #2c3e50, #1a252f);
  }

  .tutor-header-content {
    display: flex;
    gap: 2.5rem;
    padding: 2rem;

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
  }

  .tutor-image-container {
    position: relative;
    flex-shrink: 0;
  }

  .tutor-image {
    width: 180px;
    height: 180px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    border: 4px solid rgba(255, 255, 255, 0.1);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .tutor-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 4rem;

      &.teorico {
        background: linear-gradient(135deg, var(--color-forest-green) 0%, darken(#007142, 15%) 100%);
      }

      &.practico {
        background: linear-gradient(135deg, var(--color-deep-koamaru) 0%, darken(#34307b, 15%) 100%);
      }

      &.evaluador {
        background: linear-gradient(135deg, var(--color-vivid-orange) 0%, darken(#e6531d, 15%) 100%);
      }

      &.general {
        background: linear-gradient(135deg, #2c3e50 0%, darken(#2c3e50, 15%) 100%);
      }

      i {
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
      }
    }
  }

  .tutor-status-indicator {
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: var(--font-weight-medium);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    &.active {
      background-color: #4caf50;
      color: white;
    }

    &.inactive {
      background-color: #f44336;
      color: white;
    }
  }

  .tutor-info {
    flex: 1;

    h1 {
      font-size: 2.8rem;
      font-weight: var(--font-weight-bold);
      margin-bottom: 1rem;
      color: var(--color-cashmere);
      line-height: 1.2;
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 0;
        width: 60px;
        height: 4px;
        background: linear-gradient(90deg, var(--color-vivid-orange), var(--color-deep-koamaru));
        border-radius: 2px;
      }
    }

    .tutor-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin: 1.5rem 0;

      .type-badge, .group-badge, .module-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: var(--font-weight-medium);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .type-badge {
        &.teorico {
          background-color: var(--color-forest-green);
          color: white;
        }

        &.practico {
          background-color: var(--color-deep-koamaru);
          color: white;
        }

        &.evaluador {
          background-color: var(--color-vivid-orange);
          color: white;
        }

        &.general {
          background-color: #2c3e50;
          color: white;
        }
      }

      .group-badge {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--color-cashmere);
      }

      .module-badge {
        background-color: rgba(52, 48, 123, 0.2);
        color: var(--color-cashmere);
      }
    }

    .tutor-details-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;

      .tutor-detail-card {
        background-color: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;

          i {
            font-size: 1.2rem;
            color: var(--color-vivid-orange);
          }

          h3 {
            font-size: 1.3rem;
            font-weight: var(--font-weight-bold);
            color: var(--color-cashmere);
            margin: 0;
          }
        }

        p {
          color: var(--color-cashmere);
          opacity: 0.9;
          line-height: 1.6;
          font-size: 1rem;
        }
      }

      .objective-card .card-header i {
        color: var(--color-vivid-orange);
      }

      .instructions-card .card-header i {
        color: var(--color-forest-green);
      }
    }
  }
}

.students-section {
  background-color: var(--color-dark-bg);
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    h2 {
      font-size: 1.8rem;
      font-weight: var(--font-weight-bold);
      color: var(--color-cashmere);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      i {
        color: var(--color-deep-koamaru);
        font-size: 1.6rem;
      }
    }

    .section-actions {
      .refresh-btn {
        padding: 0.6rem 1.2rem;
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--color-cashmere);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: var(--font-weight-medium);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        i {
          font-size: 1rem;
        }
      }
    }
  }

  .loading-container, .error-message, .empty-state {
    padding: 3rem 2rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    color: var(--color-cashmere);
    opacity: 0.7;
    font-size: 1.1rem;
    text-align: center;

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  }

  .students-table-container {
    overflow-x: auto;
    padding: 0 0 1rem 0;
  }

  .students-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;

    th, td {
      padding: 1.2rem 1.5rem;
      text-align: left;
      color: var(--color-cashmere);
    }

    th {
      background-color: rgba(0, 0, 0, 0.2);
      font-weight: var(--font-weight-medium);
      font-size: 1rem;
      position: sticky;
      top: 0;
      z-index: 10;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    tr {
      transition: all 0.2s ease;

      &:nth-child(even) {
        background-color: rgba(255, 255, 255, 0.03);
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.07);
      }
    }

    .student-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .student-avatar {
        width: 45px;
        height: 45px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.1);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        &.default-avatar {
          background: linear-gradient(135deg, var(--color-deep-koamaru) 0%, darken(#34307b, 15%) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-weight-bold);
          font-size: 1.1rem;
        }
      }
    }

    .message-count {
      .message-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 30px;
        height: 30px;
        padding: 0 0.5rem;
        background-color: var(--color-vivid-orange);
        color: white;
        border-radius: 15px;
        font-weight: var(--font-weight-bold);
        font-size: 0.9rem;
      }
    }

    .actions-cell {
      display: flex;
      gap: 0.75rem;

      button {
        padding: 0.6rem 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: var(--font-weight-medium);
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &.view-chat-btn {
          background-color: var(--color-deep-koamaru);
          color: white;

          &:hover {
            background-color: darken(#34307b, 5%);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
        }

        &.add-comment-btn {
          background-color: var(--color-forest-green);
          color: white;

          &:hover {
            background-color: darken(#007142, 5%);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
        }
      }
    }
  }
}
</style>
