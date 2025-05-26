<template>
  <div class="assignment-detail-page">
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
    <main class="assignment-detail-main">
      <div class="container">
        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading assignment details...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchAssignmentDetails" class="retry-button">Retry</button>
        </div>

        <div v-else class="assignment-content">
          <!-- Breadcrumbs -->
          <div class="breadcrumbs">
            <button @click="goBack" class="back-button">
              <i class="fas fa-arrow-left"></i> Back to Unit
            </button>
          </div>

          <!-- Assignment header -->
          <div class="assignment-header">
            <h1>{{ assignment.titulo }}</h1>
            <div class="assignment-badges">
              <span class="status-badge" :class="statusClass">{{ statusText }}</span>
              <span class="points-badge">{{ assignment.puntuacion_maxima || assignment.puntuacionMaxima }} points</span>
            </div>
          </div>

          <!-- Assignment details -->
          <div class="assignment-details">
            <div class="details-section">
              <h2>Description</h2>
              <p>{{ assignment.descripcion }}</p>
            </div>

            <div class="details-section">
              <h2>Submission Details</h2>
              <div class="detail-item">
                <i class="fas fa-calendar-alt"></i>
                <span>Due: {{ formattedDueDate }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-file-alt"></i>
                <span>
                  Submission type:
                  <span v-if="assignment.permitirTexto || assignment.permitir_texto">Text</span>
                  <span v-if="(assignment.permitirTexto || assignment.permitir_texto) &&
                             (assignment.permitirArchivos || assignment.permitir_archivos)"> & </span>
                  <span v-if="assignment.permitirArchivos || assignment.permitir_archivos">Files</span>
                </span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>Created: {{ formattedCreationDate }}</span>
              </div>
            </div>

            <!-- Student submissions section (for professors) -->
            <div v-if="userRole === 'admin' || userRole === 'profesor'" class="details-section">
              <h2>Student Submissions</h2>
              <div v-if="submissions.length === 0" class="empty-state">
                <p>No submissions yet.</p>
              </div>
              <div v-else class="submissions-list">
                <div v-for="submission in submissions" :key="submission.id" class="submission-item">
                  <div class="submission-header">
                    <h3>{{ getStudentName(submission) }}</h3>
                    <span class="submission-date">{{ formatDate(getSubmissionDate(submission)) }}</span>
                  </div>

                  <!-- Submission content -->
                  <div class="submission-content">
                    <!-- Text submission -->
                    <div v-if="getSubmissionText(submission)" class="text-submission">
                      <h4>Student Response:</h4>
                      <p>{{ getSubmissionText(submission) }}</p>
                    </div>

                    <!-- File submissions -->
                    <div v-if="getSubmissionFiles(submission).length > 0" class="file-submission">
                      <h4>Attached Files:</h4>
                      <div class="submission-files">
                        <div v-for="file in getSubmissionFiles(submission)" :key="file.url" class="file-item">
                          <!-- Preview for image files -->
                          <div v-if="getFileIconClass(file) === 'fas fa-file-image'" class="file-preview">
                            <img :src="file.url" :alt="file.name || getFileName(file.url)" />
                          </div>

                          <!-- Icon for non-image files -->
                          <i v-else :class="getFileIconClass(file)"></i>

                          <!-- File link -->
                          <a :href="file.url" target="_blank" class="file-link">
                            <span class="file-name">{{ file.name || getFileName(file.url) }}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Submission status and feedback -->
                  <div class="submission-details">
                    <div class="submission-status">
                      <span class="status-badge" :class="getSubmissionStatusClass(submission)">
                        {{ getSubmissionStatusText(submission) }}
                      </span>
                      <span v-if="submission.calificacion !== undefined || submission.grade !== undefined" class="grade-badge">
                        Grade: {{ submission.calificacion !== null ? submission.calificacion : (submission.grade || 'Not graded') }}
                      </span>
                    </div>

                    <div v-if="submission.comentarios || submission.feedback || submission.comentario" class="submission-feedback">
                      <h4>Feedback:</h4>
                      <p>{{ submission.comentarios || submission.feedback || submission.comentario || '' }}</p>
                    </div>
                  </div>

                  <!-- Submission actions -->
                  <div class="submission-actions">
                    <button class="grade-btn" @click="openGradeModal(submission)">
                      <i class="fas fa-check-circle"></i>
                      {{ submission.calificado || submission.graded ? 'Update Grade' : 'Grade Submission' }}
                    </button>
                    <button class="feedback-btn" @click="openFeedbackModal(submission)">
                      <i class="fas fa-comment"></i>
                      {{ submission.feedback || submission.comentario ? 'Edit Feedback' : 'Send Feedback' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="assignment-actions">
              <button v-if="userRole === 'admin' || userRole === 'profesor'" @click="editAssignment" class="edit-btn">
                <i class="fas fa-edit"></i> Edit Assignment
              </button>
              <button v-if="userRole === 'admin' || userRole === 'profesor'" @click="toggleAssignmentStatus" class="toggle-btn">
                <i class="fas" :class="assignment.active ? 'fa-eye-slash' : 'fa-eye'"></i>
                {{ assignment.active ? 'Deactivate' : 'Activate' }}
              </button>
              <button v-if="userRole === 'admin' || userRole === 'profesor'" @click="deleteAssignment" class="delete-btn">
                <i class="fas fa-trash"></i> Delete Assignment
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modals -->
    <ConfirmDeleteModal
      :isOpen="isConfirmDeleteModalOpen"
      :title="'Confirm Assignment Deletion'"
      :message="deleteConfirmMessage"
      :details="'This action cannot be undone. All data associated with this assignment will be permanently deleted.'"
      @close="isConfirmDeleteModalOpen = false"
      @confirm="handleDeleteConfirmed"
    />

    <!-- Grade Submission Modal -->
    <div class="modal-backdrop" :class="{ 'active': isGradeModalOpen }" @click.self="closeGradeModal">
      <div class="modal grade-modal" :class="{ 'active': isGradeModalOpen }">
        <div class="modal-header">
          <h1 class="modal-title">Grade Submission</h1>
          <button class="modal-close" @click="closeGradeModal" aria-label="Close modal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="selectedSubmission" class="grade-form">
            <div class="student-info">
              <h3>{{ getStudentName(selectedSubmission) }}</h3>
              <p>Submitted on: {{ formatDate(getSubmissionDate(selectedSubmission)) }}</p>
            </div>

            <div class="grade-input">
              <label for="grade">Grade (out of {{ assignment.puntuacion_maxima || assignment.puntuacionMaxima || 100 }})</label>
              <input
                type="number"
                id="grade"
                v-model="gradeValue"
                min="0"
                :max="assignment.puntuacion_maxima || assignment.puntuacionMaxima || 100"
                class="form-control"
              />
            </div>

            <div class="modal-actions">
              <button class="cancel-btn" @click="closeGradeModal" :disabled="isSubmitting">Cancel</button>
              <button class="submit-btn" @click="submitGrade" :disabled="isSubmitting">
                <span v-if="isSubmitting"><i class="fas fa-spinner fa-spin"></i> Saving...</span>
                <span v-else>Save Grade</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    <div class="modal-backdrop" :class="{ 'active': isFeedbackModalOpen }" @click.self="closeFeedbackModal">
      <div class="modal feedback-modal" :class="{ 'active': isFeedbackModalOpen }">
        <div class="modal-header">
          <h1 class="modal-title">Provide Feedback</h1>
          <button class="modal-close" @click="closeFeedbackModal" aria-label="Close modal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div v-if="selectedSubmission" class="feedback-form">
            <div class="student-info">
              <h3>{{ getStudentName(selectedSubmission) }}</h3>
              <p>Submitted on: {{ formatDate(getSubmissionDate(selectedSubmission)) }}</p>
            </div>

            <div class="feedback-input">
              <label for="feedback">Feedback</label>
              <textarea
                id="feedback"
                v-model="feedbackText"
                class="form-control"
                rows="6"
                placeholder="Provide detailed feedback to the student..."
              ></textarea>
            </div>

            <div class="modal-actions">
              <button class="cancel-btn" @click="closeFeedbackModal" :disabled="isSubmitting">Cancel</button>
              <button class="submit-btn" @click="submitFeedback" :disabled="isSubmitting || !feedbackText.trim()">
                <span v-if="isSubmitting"><i class="fas fa-spinner fa-spin"></i> Sending...</span>
                <span v-else>Send Feedback</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal.vue';
import AssignmentService from '@/services/assignmentService';
import UnitService from '@/services/unitService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const assignment = ref({});
const unit = ref(null);
const isLoading = ref(true);
const errorMessage = ref('');
const submissions = ref([]);
const isConfirmDeleteModalOpen = ref(false);
const selectedSubmission = ref(null);
const isGradeModalOpen = ref(false);
const isFeedbackModalOpen = ref(false);
const gradeValue = ref(0);
const feedbackText = ref('');
const isSubmitting = ref(false);

// State for notifications
const notification = ref({
  show: false,
  message: '',
  type: 'success', // success, error, warning, info
  timeout: null
});

// Get user role from auth store
const userRole = computed(() => authStore.userRole.value);

// Computed property for delete confirmation message
const deleteConfirmMessage = computed(() => {
  if (assignment.value && assignment.value.titulo) {
    return 'Are you sure you want to delete the assignment "' + assignment.value.titulo + '"?';
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

// Computed properties
const formattedDueDate = computed(() => {
  if (!assignment.value) return '';

  // Handle both frontend (fechaEntrega) and backend (fecha_entrega) field names
  const dueDateStr = assignment.value.fechaEntrega || assignment.value.fecha_entrega;
  if (!dueDateStr) return 'No due date';

  const dueDate = new Date(dueDateStr);
  return dueDate.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
});

const formattedCreationDate = computed(() => {
  if (!assignment.value) return '';

  // Handle both frontend (fechaCreacion) and backend (fecha_creacion) field names
  const creationDateStr = assignment.value.fechaCreacion || assignment.value.fecha_creacion;
  if (!creationDateStr) return 'Unknown';

  const creationDate = new Date(creationDateStr);
  return creationDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
});

const isOverdue = computed(() => {
  if (!assignment.value) return false;

  const now = new Date();
  // Handle both frontend (fechaEntrega) and backend (fecha_entrega) field names
  const dueDateStr = assignment.value.fechaEntrega || assignment.value.fecha_entrega;
  if (!dueDateStr) return false;

  const dueDate = new Date(dueDateStr);
  return now > dueDate;
});

const statusClass = computed(() => {
  if (!assignment.value) return '';

  if (!assignment.value.active && !assignment.value.activo) {
    return 'status-inactive';
  }

  if (isOverdue.value) {
    return 'status-overdue';
  }

  return 'status-active';
});

const statusText = computed(() => {
  if (!assignment.value) return '';

  if (!assignment.value.active && !assignment.value.activo) {
    return 'Inactive';
  }

  if (isOverdue.value) {
    return 'Overdue';
  }

  return 'Active';
});

// Methods
const fetchAssignmentDetails = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    const assignmentId = route.params.id;
    if (!assignmentId) {
      errorMessage.value = 'No assignment ID provided';
      return;
    }

    // Fetch assignment details
    assignment.value = await AssignmentService.getAssignmentById(assignmentId);
    console.log('Assignment details:', assignment.value);

    if (assignment.value && assignment.value.unidad_id) {
      // Fetch unit details
      unit.value = await UnitService.getUnitById(assignment.value.unidad_id);
      console.log('Unit details:', unit.value);
    }

    // Fetch submissions if user is admin or professor
    if (userRole.value === 'admin' || userRole.value === 'profesor') {
      try {
        const submissionsData = await AssignmentService.getAssignmentSubmissions(assignmentId);
        submissions.value = submissionsData || [];
        console.log('Fetched submissions:', JSON.stringify(submissions.value, null, 2));

        // Add debug info to see the structure of the first submission
        if (submissions.value.length > 0) {
          const firstSubmission = submissions.value[0];
          console.log('First submission structure:', Object.keys(firstSubmission));
          console.log('Student info:', firstSubmission.estudiante || firstSubmission.alumno || firstSubmission.student);
          console.log('Files:', firstSubmission.archivos || firstSubmission.files || []);
        }
      } catch (error) {
        console.error('Error fetching submissions:', error);
        // Don't fail the whole page load if submissions fail to load
        submissions.value = [];
      }
    }

  } catch (error) {
    console.error('Error fetching assignment details:', error);
    errorMessage.value = 'Failed to load assignment details. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  if (unit.value && unit.value.id) {
    router.push(`/unit/${unit.value.id}`);
  } else {
    router.go(-1); // Fallback to browser history
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

// Helper methods for submissions
const getStudentName = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.nombre_real) {
    return submission.nombre_real;
  }

  if (submission.nombre_usuario) {
    return submission.nombre_usuario;
  }

  // Check for nested student object
  if (submission.estudiante && submission.estudiante.nombre) {
    return submission.estudiante.nombre;
  }

  if (submission.alumno && submission.alumno.nombre) {
    return submission.alumno.nombre;
  }

  if (submission.student && submission.student.nombre) {
    return submission.student.nombre;
  }

  if (submission.student && submission.student.name) {
    return submission.student.name;
  }

  // Then check for direct properties
  if (submission.student_name) return submission.student_name;
  if (submission.studentName) return submission.studentName;
  if (submission.alumno_nombre) return submission.alumno_nombre;
  if (submission.alumnoNombre) return submission.alumnoNombre;
  if (submission.nombre_estudiante) return submission.nombre_estudiante;
  if (submission.nombreEstudiante) return submission.nombreEstudiante;

  // If we have an ID but no name, try to format it nicely
  if (submission.usuario_id) return `Student #${submission.usuario_id}`;
  if (submission.estudiante_id) return `Student #${submission.estudiante_id}`;
  if (submission.alumno_id) return `Student #${submission.alumno_id}`;
  if (submission.student_id) return `Student #${submission.student_id}`;

  return 'Unknown Student';
};

const getSubmissionDate = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.fecha_envio) {
    return submission.fecha_envio;
  }

  // Try different possible field names for submission date
  if (submission.fecha_entrega) return submission.fecha_entrega;
  if (submission.fechaEntrega) return submission.fechaEntrega;
  if (submission.created_at) return submission.created_at;
  if (submission.createdAt) return submission.createdAt;
  if (submission.fecha) return submission.fecha;
  if (submission.date) return submission.date;

  // If no date found, return current date
  return new Date().toISOString();
};

const getSubmissionText = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.texto_respuesta) {
    return submission.texto_respuesta;
  }

  // Try different possible field names for submission text
  if (submission.texto) return submission.texto;
  if (submission.text) return submission.text;
  if (submission.contenido) return submission.contenido;
  if (submission.content) return submission.content;
  if (submission.respuesta) return submission.respuesta;
  if (submission.answer) return submission.answer;
  if (submission.description) return submission.description;
  if (submission.descripcion) return submission.descripcion;

  return '';
};

const getSubmissionFiles = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.archivos_urls && Array.isArray(submission.archivos_urls)) {
    return submission.archivos_urls;
  }

  // Try different possible field names for submission files
  if (submission.archivos && Array.isArray(submission.archivos)) {
    return submission.archivos;
  }
  if (submission.files && Array.isArray(submission.files)) {
    return submission.files;
  }
  if (submission.adjuntos && Array.isArray(submission.adjuntos)) {
    return submission.adjuntos;
  }
  if (submission.attachments && Array.isArray(submission.attachments)) {
    return submission.attachments;
  }
  if (submission.documentos && Array.isArray(submission.documentos)) {
    return submission.documentos;
  }
  if (submission.documents && Array.isArray(submission.documents)) {
    return submission.documents;
  }

  // Handle single file cases
  if (submission.archivo && typeof submission.archivo === 'string') {
    return [{ url: submission.archivo, name: getFileName(submission.archivo) }];
  }
  if (submission.file && typeof submission.file === 'string') {
    return [{ url: submission.file, name: getFileName(submission.file) }];
  }

  return [];
};

const getSubmissionStatusClass = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.calificacion !== null && submission.calificacion !== undefined) {
    return 'status-graded';
  } else if (submission.comentarios) {
    return 'status-reviewed';
  } else if (submission.calificado_por) {
    return 'status-graded';
  } else if (submission.fecha_calificacion) {
    return 'status-graded';
  }

  // Check other possible field names
  if (submission.calificado || submission.graded) {
    return 'status-graded';
  } else if (submission.revisado || submission.reviewed ||
            submission.feedback || submission.comentario) {
    return 'status-reviewed';
  } else {
    return 'status-submitted';
  }
};

const getSubmissionStatusText = (submission) => {
  // Based on the actual data structure we're receiving
  if (submission.calificacion !== null && submission.calificacion !== undefined) {
    return 'Graded';
  } else if (submission.comentarios) {
    return 'Reviewed';
  } else if (submission.calificado_por) {
    return 'Graded';
  } else if (submission.fecha_calificacion) {
    return 'Graded';
  }

  // Check other possible field names
  if (submission.calificado || submission.graded) {
    return 'Graded';
  } else if (submission.revisado || submission.reviewed ||
            submission.feedback || submission.comentario) {
    return 'Reviewed';
  } else {
    return 'Submitted';
  }
};

const getFileIconClass = (file) => {
  // Determine file icon based on file type or extension
  const fileUrl = file.url || '';
  const fileName = file.name || getFileName(fileUrl);
  const extension = fileName.split('.').pop().toLowerCase();

  // Check if it's an image URL (common image hosting patterns)
  const isImageUrl = /\.(jpg|jpeg|png|gif|bmp|webp)($|\?)/i.test(fileUrl) ||
                    /cloudinary|imgur|unsplash|pexels|pixabay/i.test(fileUrl) ||
                    /\/(image|img|photo)\//i.test(fileUrl);

  // Check if it's a document URL
  const isDocUrl = /\.(doc|docx|pdf|xls|xlsx|ppt|pptx)($|\?)/i.test(fileUrl) ||
                  /\/document\//i.test(fileUrl);

  // If file has a type property, use that first
  if (file.type) {
    if (file.type.startsWith('image/')) {
      return 'fas fa-file-image';
    } else if (file.type.includes('pdf')) {
      return 'fas fa-file-pdf';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'fas fa-file-word';
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return 'fas fa-file-excel';
    } else if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
      return 'fas fa-file-powerpoint';
    } else if (file.type.startsWith('audio/')) {
      return 'fas fa-file-audio';
    } else if (file.type.startsWith('video/')) {
      return 'fas fa-file-video';
    } else if (file.type.includes('zip') || file.type.includes('archive') || file.type.includes('compressed')) {
      return 'fas fa-file-archive';
    } else if (file.type.includes('text/')) {
      return 'fas fa-file-alt';
    }
  }

  // If we have a URL but no extension, try to determine from URL patterns
  if (isImageUrl) {
    return 'fas fa-file-image';
  } else if (isDocUrl) {
    if (fileUrl.includes('pdf')) {
      return 'fas fa-file-pdf';
    } else if (fileUrl.includes('doc')) {
      return 'fas fa-file-word';
    } else if (fileUrl.includes('xls')) {
      return 'fas fa-file-excel';
    } else if (fileUrl.includes('ppt')) {
      return 'fas fa-file-powerpoint';
    }
  }

  // Otherwise use extension
  if (['doc', 'docx'].includes(extension)) {
    return 'fas fa-file-word';
  } else if (['pdf'].includes(extension)) {
    return 'fas fa-file-pdf';
  } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return 'fas fa-file-excel';
  } else if (['ppt', 'pptx'].includes(extension)) {
    return 'fas fa-file-powerpoint';
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
    return 'fas fa-file-image';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'fas fa-file-archive';
  } else if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension)) {
    return 'fas fa-file-audio';
  } else if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm'].includes(extension)) {
    return 'fas fa-file-video';
  } else if (['html', 'htm', 'xml', 'js', 'css', 'php', 'py', 'java', 'c', 'cpp', 'cs'].includes(extension)) {
    return 'fas fa-file-code';
  } else if (['txt', 'md', 'rtf'].includes(extension)) {
    return 'fas fa-file-alt';
  } else {
    return 'fas fa-file';
  }
};

const getFileName = (url) => {
  if (!url) return 'Unknown file';

  // Extract filename from URL
  const parts = url.split('/');
  let fileName = parts[parts.length - 1];

  // Remove query parameters if any
  fileName = fileName.split('?')[0];

  // Decode URI components
  try {
    fileName = decodeURIComponent(fileName);
  } catch (e) {
    console.error('Error decoding filename:', e);
  }

  return fileName;
};

const editAssignment = () => {
  // TODO: Implement edit assignment functionality
  console.log('Edit assignment:', assignment.value);
  showNotification('Edit assignment functionality coming soon', 'info');
};

const toggleAssignmentStatus = async () => {
  try {
    // Toggle the status
    const newStatus = !(assignment.value.active || assignment.value.activo);

    // Update in local state first for better UX
    assignment.value.active = newStatus;
    assignment.value.activo = newStatus;

    // Call API to update status
    console.log(`Toggling assignment ${assignment.value.id} status to ${newStatus}`);
    const updatedAssignment = await AssignmentService.updateAssignmentStatus(assignment.value.id, newStatus);
    console.log('Assignment status updated:', updatedAssignment);

    // Update the assignment in the local state with the response from the server
    if (updatedAssignment) {
      assignment.value = {
        ...assignment.value,
        ...updatedAssignment
      };
    }

    showNotification(`Assignment is now ${newStatus ? 'active' : 'inactive'}`, 'success');
  } catch (error) {
    console.error('Error toggling assignment status:', error);

    // Revert the change in local state
    assignment.value.active = !assignment.value.active;
    assignment.value.activo = !assignment.value.activo;

    showNotification('Failed to update assignment status: ' + (error.message || 'Unknown error'), 'error');
  }
};

const deleteAssignment = () => {
  isConfirmDeleteModalOpen.value = true;
};

const handleDeleteConfirmed = async () => {
  try {
    await AssignmentService.deleteAssignment(assignment.value.id);
    showNotification(`Assignment "${assignment.value.titulo}" has been deleted`, 'success');

    // Navigate back to the unit page
    goBack();
  } catch (error) {
    console.error('Error deleting assignment:', error);
    showNotification('Failed to delete assignment', 'error');
  } finally {
    isConfirmDeleteModalOpen.value = false;
  }
};

// Submission grading and feedback methods
const openGradeModal = (submission) => {
  selectedSubmission.value = submission;

  // Set initial grade value based on the actual data structure
  if (submission.calificacion !== null && submission.calificacion !== undefined) {
    gradeValue.value = submission.calificacion;
  } else if (submission.grade !== null && submission.grade !== undefined) {
    gradeValue.value = submission.grade;
  } else {
    gradeValue.value = 0;
  }

  isGradeModalOpen.value = true;
  console.log('Opening grade modal for submission:', submission);
};

const closeGradeModal = () => {
  isGradeModalOpen.value = false;
  selectedSubmission.value = null;
};

const openFeedbackModal = (submission) => {
  selectedSubmission.value = submission;

  // Set initial feedback text based on the actual data structure
  if (submission.comentarios) {
    feedbackText.value = submission.comentarios;
  } else if (submission.feedback) {
    feedbackText.value = submission.feedback;
  } else if (submission.comentario) {
    feedbackText.value = submission.comentario;
  } else {
    feedbackText.value = '';
  }

  isFeedbackModalOpen.value = true;
  console.log('Opening feedback modal for submission:', submission);
};

const closeFeedbackModal = () => {
  isFeedbackModalOpen.value = false;
  selectedSubmission.value = null;
};

const submitGrade = async () => {
  if (!selectedSubmission.value) return;

  try {
    isSubmitting.value = true;

    // Update in local state first for better UX
    const submissionIndex = submissions.value.findIndex(s => s.id === selectedSubmission.value.id);
    if (submissionIndex !== -1) {
      // Update based on the actual data structure
      submissions.value[submissionIndex].calificacion = gradeValue.value;
      submissions.value[submissionIndex].calificado_por = authStore.userId;
      submissions.value[submissionIndex].fecha_calificacion = new Date().toISOString();

      // Also update other possible field names for compatibility
      submissions.value[submissionIndex].calificado = true;
      submissions.value[submissionIndex].grade = gradeValue.value;
      submissions.value[submissionIndex].graded = true;
    }

    // Call API to update grade
    const updatedSubmission = await AssignmentService.gradeSubmission(selectedSubmission.value.id, gradeValue.value);
    console.log('Grade saved to database:', updatedSubmission);

    // Update the submission in the local state with the response from the server
    if (submissionIndex !== -1 && updatedSubmission) {
      submissions.value[submissionIndex] = {
        ...submissions.value[submissionIndex],
        ...updatedSubmission
      };
    }

    showNotification(`Submission graded successfully with ${gradeValue.value} points`, 'success');
    closeGradeModal();
  } catch (error) {
    console.error('Error grading submission:', error);
    showNotification('Failed to grade submission: ' + (error.message || 'Unknown error'), 'error');
  } finally {
    isSubmitting.value = false;
  }
};

const submitFeedback = async () => {
  if (!selectedSubmission.value) return;

  try {
    isSubmitting.value = true;

    // Update in local state first for better UX
    const submissionIndex = submissions.value.findIndex(s => s.id === selectedSubmission.value.id);
    if (submissionIndex !== -1) {
      // Update based on the actual data structure
      submissions.value[submissionIndex].comentarios = feedbackText.value;

      // Also update other possible field names for compatibility
      submissions.value[submissionIndex].feedback = feedbackText.value;
      submissions.value[submissionIndex].comentario = feedbackText.value;
      submissions.value[submissionIndex].revisado = true;
      submissions.value[submissionIndex].reviewed = true;
    }

    // Call API to update feedback
    const updatedSubmission = await AssignmentService.provideFeedback(selectedSubmission.value.id, feedbackText.value);
    console.log('Feedback saved to database:', updatedSubmission);

    // Update the submission in the local state with the response from the server
    if (submissionIndex !== -1 && updatedSubmission) {
      submissions.value[submissionIndex] = {
        ...submissions.value[submissionIndex],
        ...updatedSubmission
      };
    }

    showNotification('Feedback sent successfully', 'success');
    closeFeedbackModal();
  } catch (error) {
    console.error('Error sending feedback:', error);
    showNotification('Failed to send feedback: ' + (error.message || 'Unknown error'), 'error');
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  // Add class to body for global styles
  document.body.classList.add('minimalist-theme');

  // Fetch assignment details
  fetchAssignmentDetails();
});
</script>

<style lang="scss" scoped>
.assignment-detail-page {
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

.assignment-detail-main {
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

.assignment-content {
  color: var(--color-cashmere);
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

.assignment-header {
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    font-weight: var(--font-weight-bold);
    margin-bottom: 1rem;
  }

  .assignment-badges {
    display: flex;
    gap: 1rem;

    .status-badge, .points-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: var(--font-weight-medium);
    }

    .status-badge {
      &.status-active {
        background-color: var(--color-forest-green);
        color: white;
      }

      &.status-overdue {
        background-color: #f44336;
        color: white;
      }

      &.status-inactive {
        background-color: #757575;
        color: white;
      }
    }

    .points-badge {
      background-color: var(--color-orange);
      color: white;
    }
  }
}

.assignment-details {
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  padding: 2rem;

  .details-section {
    margin-bottom: 2rem;

    h2 {
      font-size: 1.5rem;
      font-weight: var(--font-weight-bold);
      margin-bottom: 1rem;
      color: var(--color-orange);
    }

    p {
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 0.8rem;

      i {
        color: var(--color-orange);
        width: 20px;
        text-align: center;
      }
    }
  }

  .empty-state {
    padding: 2rem;
    text-align: center;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .submissions-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;

    .submission-item {
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border-left: 4px solid var(--color-orange);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      }

      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        h3 {
          font-size: 1.2rem;
          font-weight: var(--font-weight-bold);
          color: var(--color-orange);
        }

        .submission-date {
          font-size: 0.9rem;
          opacity: 0.7;
          background-color: rgba(0, 0, 0, 0.2);
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
        }
      }

      .submission-content {
        margin-bottom: 1.5rem;

        h4 {
          font-size: 1rem;
          font-weight: var(--font-weight-medium);
          margin-bottom: 0.5rem;
          color: var(--color-cashmere);
          opacity: 0.8;
        }

        .text-submission {
          margin-bottom: 1.5rem;

          p {
            margin-bottom: 1rem;
            line-height: 1.6;
            background-color: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 4px;
            font-style: italic;
          }
        }

        .file-submission {
          margin-bottom: 1rem;
        }

        .submission-files {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem;

          .file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background-color: rgba(255, 255, 255, 0.1);
            padding: 0.75rem;
            border-radius: 8px;
            transition: all 0.2s ease;
            margin-bottom: 0.75rem;

            &:hover {
              background-color: rgba(255, 255, 255, 0.15);
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }

            .file-preview {
              width: 60px;
              height: 60px;
              border-radius: 4px;
              overflow: hidden;
              background-color: #000;
              display: flex;
              align-items: center;
              justify-content: center;

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;

                &:hover {
                  transform: scale(1.1);
                }
              }
            }

            i {
              font-size: 1.5rem;
              color: var(--color-orange);
              width: 30px;
              text-align: center;
            }

            .file-link {
              color: var(--color-cashmere);
              text-decoration: none;
              display: flex;
              align-items: center;
              flex: 1;

              &:hover {
                text-decoration: underline;
              }

              .file-name {
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-weight: var(--font-weight-medium);
              }
            }
          }
        }
      }

      .submission-details {
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1.5rem;

        .submission-status {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;

          .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: var(--font-weight-medium);

            &.status-submitted {
              background-color: var(--color-purple);
              color: white;
            }

            &.status-reviewed {
              background-color: var(--color-orange);
              color: white;
            }

            &.status-graded {
              background-color: var(--color-forest-green);
              color: white;
            }
          }

          .grade-badge {
            background-color: rgba(255, 255, 255, 0.1);
            padding: 0.3rem 0.8rem;
            border-radius: 4px;
            font-size: 0.9rem;
          }
        }

        .submission-feedback {
          h4 {
            font-size: 1rem;
            font-weight: var(--font-weight-medium);
            margin-bottom: 0.5rem;
            color: var(--color-cashmere);
          }

          p {
            background-color: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 4px;
            line-height: 1.6;
            font-style: italic;
          }
        }
      }

      .submission-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          border-radius: 4px;
          padding: 0.6rem 1rem;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s;

          i {
            font-size: 0.9rem;
          }

          &:hover {
            transform: translateY(-2px);
          }
        }

        .grade-btn {
          background-color: var(--color-forest-green);
          color: white;

          &:hover {
            background-color: darken(#007142, 5%);
          }
        }

        .feedback-btn {
          background-color: var(--color-purple);
          color: white;

          &:hover {
            background-color: darken(#34307b, 5%);
          }
        }
      }
    }
  }

  // Modal styles
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s ease;

    &.active {
      opacity: 1;
      visibility: visible;
    }
  }

  .modal {
    background-color: #171717;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    transform: translateY(20px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);

    &.active {
      transform: translateY(0);
      opacity: 1;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .modal-title {
        font-size: 1.8rem;
        font-weight: var(--font-weight-bold);
        color: var(--color-cashmere);
        margin: 0;
      }

      .modal-close {
        background: none;
        border: none;
        color: var(--color-cashmere);
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;

        &:hover {
          opacity: 1;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;

      .student-info {
        margin-bottom: 1.5rem;

        h3 {
          font-size: 1.2rem;
          font-weight: var(--font-weight-bold);
          color: var(--color-orange);
          margin-bottom: 0.5rem;
        }

        p {
          font-size: 0.9rem;
          opacity: 0.7;
        }
      }

      .grade-input, .feedback-input {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: var(--font-weight-medium);
          color: var(--color-cashmere);
        }

        .form-control {
          width: 100%;
          padding: 0.75rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--color-cashmere);
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: var(--color-orange);
          }
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;

        button {
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all 0.2s;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }

        .cancel-btn {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--color-cashmere);

          &:hover:not(:disabled) {
            border-color: rgba(255, 255, 255, 0.4);
          }
        }

        .submit-btn {
          background-color: var(--color-orange);
          border: none;
          color: white;

          &:hover:not(:disabled) {
            background-color: darken(#e6531d, 5%);
          }
        }
      }
    }
  }

  .assignment-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;

    button {
      padding: 0.7rem 1.2rem;
      border: none;
      border-radius: 4px;
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      &.edit-btn {
        background-color: var(--color-orange);
        color: white;

        &:hover {
          background-color: darken(#e6531d, 5%);
        }
      }

      &.toggle-btn {
        background-color: var(--color-purple);
        color: white;

        &:hover {
          background-color: darken(#34307b, 5%);
        }
      }

      &.delete-btn {
        background-color: #f44336;
        color: white;

        &:hover {
          background-color: darken(#f44336, 5%);
        }
      }
    }
  }
}
</style>
