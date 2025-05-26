<template>
  <div class="student-assignment-detail">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Main content -->
    <main class="assignment-detail-main">
      <div class="container">
        <!-- Settings button -->
        <SettingsButton />

        <!-- Back button -->
        <div class="back-button">
          <button @click="goBack" class="back-link">
            <div class="back-icon">
              <i class="fas fa-arrow-left"></i>
            </div>
            <span>Back to Unit</span>
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="bubble-loader">
            <div class="bubble bubble-1"></div>
            <div class="bubble bubble-2"></div>
            <div class="bubble bubble-3"></div>
          </div>
          <p class="loading-text">Loading assignment details...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchAssignmentDetails" class="retry-button">
            <span>Try Again</span>
          </button>
        </div>

        <!-- Assignment details -->
        <div v-else-if="assignment" class="assignment-details">
          <!-- Assignment header -->
          <div class="assignment-header">
            <div class="assignment-title-container">
              <h1>{{ assignment.titulo }}</h1>
              <div class="assignment-status" :class="getAssignmentStatusClass(assignment)">
                {{ getAssignmentStatusText(assignment) }}
              </div>
            </div>
            <p class="unit-name" v-if="unitName">{{ unitName }}</p>
          </div>

          <!-- Assignment content -->
          <div class="assignment-content">
            <div class="assignment-info-card">
              <div class="assignment-description">
                <h3>Instructions</h3>
                <p>{{ assignment.descripcion }}</p>
              </div>

              <div class="assignment-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar-alt"></i>
                  <span>Due: {{ formatDate(assignment.fecha_entrega) }}</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-star"></i>
                  <span>{{ assignment.puntuacion_maxima || 100 }} points</span>
                </div>
                <div class="meta-item">
                  <i class="fas fa-file-alt"></i>
                  <span>
                    Submit:
                    <span v-if="assignment.permitirTexto || assignment.permitir_texto">Text</span>
                    <span v-if="(assignment.permitirTexto || assignment.permitir_texto) &&
                               (assignment.permitirArchivos || assignment.permitir_archivos)"> & </span>
                    <span v-if="assignment.permitirArchivos || assignment.permitir_archivos">Files</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Submission section -->
            <div class="submission-section">
              <h3>Your Submission</h3>

              <!-- Loading submissions state -->
              <div v-if="isLoadingSubmissions" class="loading-container">
                <div class="bubble-loader">
                  <div class="bubble bubble-1"></div>
                  <div class="bubble bubble-2"></div>
                  <div class="bubble bubble-3"></div>
                </div>
                <p class="loading-text">Loading your submissions...</p>
              </div>

              <!-- No submissions yet -->
              <div v-else-if="!hasSubmission" class="no-submission">
                <p>You haven't submitted this assignment yet.</p>
                <button @click="openSubmitModal" class="submit-btn">
                  <i class="fas fa-paper-plane"></i> Submit Assignment
                </button>
              </div>

              <!-- Submission details -->
              <div v-else class="submission-details">
                <div class="submission-info">
                  <div class="submission-header">
                    <h4>Submitted on {{ formatDate(submission.fecha_envio, true) }}</h4>
                    <div v-if="submission.calificacion !== null" class="grade">
                      <span>Grade: {{ submission.calificacion }} / {{ assignment.puntuacion_maxima || 100 }}</span>
                    </div>
                  </div>

                  <!-- Text response -->
                  <div v-if="submission.texto_respuesta" class="text-response">
                    <h5>Your Response:</h5>
                    <p>{{ submission.texto_respuesta }}</p>
                  </div>

                  <!-- Submitted files -->
                  <div v-if="submission.archivos_urls && submission.archivos_urls.length > 0" class="submitted-files">
                    <h5>Submitted Files:</h5>
                    <div class="files-list">
                      <a
                        v-for="(file, index) in submission.archivos_urls"
                        :key="index"
                        :href="file.url"
                        target="_blank"
                        class="file-link"
                      >
                        <i :class="getFileIconClass(file.name)"></i>
                        <span>{{ file.name }}</span>
                      </a>
                    </div>
                  </div>

                  <!-- Teacher feedback -->
                  <div v-if="submission.comentarios" class="feedback">
                    <h5>Teacher Feedback:</h5>
                    <p>{{ submission.comentarios }}</p>
                  </div>
                </div>

                <!-- Resubmit button -->
                <button
                  v-if="canResubmit"
                  @click="openSubmitModal"
                  class="resubmit-btn"
                >
                  <i class="fas fa-redo"></i> Resubmit Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Submit Assignment Modal -->
    <SubmitAssignmentModal
      v-if="assignment"
      :isOpen="isSubmitModalOpen"
      :assignment="assignment"
      @close="isSubmitModalOpen = false"
      @submission-created="handleSubmissionCreated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import gsap from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import SubmitAssignmentModal from '@/components/modals/SubmitAssignmentModal.vue';
import AssignmentService from '@/services/assignmentService';
import UnitService from '@/services/unitService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const assignment = ref(null);
const unitName = ref('');
const submission = ref(null);
const isLoading = ref(true);
const isLoadingSubmissions = ref(true);
const errorMessage = ref('');
const isSubmitModalOpen = ref(false);

// Computed properties
const hasSubmission = computed(() => {
  return submission.value !== null;
});

const canResubmit = computed(() => {
  if (!assignment.value || !submission.value) return false;

  // Check if the assignment is still open for submission
  const dueDate = new Date(assignment.value.fecha_entrega);
  const now = new Date();

  return now <= dueDate;
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

    // Check if assignment is active
    if (assignment.value && assignment.value.active === false) {
      console.log('Assignment is inactive, redirecting to home');
      errorMessage.value = 'This assignment is not available';
      assignment.value = null;
      router.push('/student/home');
      return;
    }

    if (assignment.value && assignment.value.unidad_id) {
      // Fetch unit details to show the unit name
      const unitData = await UnitService.getUnitById(assignment.value.unidad_id);
      if (unitData) {
        unitName.value = unitData.nombre;
      }
    }

    // After loading assignment details, fetch submission if any
    fetchSubmission();
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    errorMessage.value = 'Failed to load assignment details. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const fetchSubmission = async () => {
  try {
    isLoadingSubmissions.value = true;

    if (!assignment.value || !assignment.value.id) {
      return;
    }

    // Fetch the user's submission for this assignment
    submission.value = await AssignmentService.getMySubmission(assignment.value.id);
    console.log('Submission data:', submission.value);
  } catch (error) {
    console.error('Error in fetchSubmission:', error);
    // Don't show error message for submissions, just set to null
    submission.value = null;
  } finally {
    isLoadingSubmissions.value = false;
  }
};

const getAssignmentStatusClass = (assignment) => {
  if (hasSubmission.value) {
    return 'submitted';
  }

  const dueDate = new Date(assignment.fecha_entrega);
  const now = new Date();

  if (dueDate < now) {
    return 'overdue';
  }

  return 'pending';
};

const getAssignmentStatusText = (assignment) => {
  if (hasSubmission.value) {
    if (submission.value.calificacion !== null) {
      return 'Graded';
    }
    return 'Submitted';
  }

  const dueDate = new Date(assignment.fecha_entrega);
  const now = new Date();

  if (dueDate < now) {
    return 'Overdue';
  }

  return 'Pending';
};

const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (includeTime) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getFileIconClass = (fileName) => {
  if (!fileName) return 'fas fa-file';

  const extension = fileName.split('.').pop().toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'fas fa-file-pdf';
    case 'doc':
    case 'docx':
      return 'fas fa-file-word';
    case 'ppt':
    case 'pptx':
      return 'fas fa-file-powerpoint';
    case 'txt':
      return 'fas fa-file-alt';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'fas fa-file-image';
    default:
      return 'fas fa-file';
  }
};

const openSubmitModal = () => {
  isSubmitModalOpen.value = true;
};

const handleSubmissionCreated = (newSubmission) => {
  console.log('New submission created:', newSubmission);
  submission.value = newSubmission;

  // Show a success message using GSAP animation
  const successMessage = document.createElement('div');
  successMessage.className = 'floating-success-message';
  successMessage.innerHTML = '<i class="fas fa-check-circle"></i> Assignment submitted successfully!';
  document.body.appendChild(successMessage);

  // Animate the success message
  gsap.fromTo(successMessage,
    { y: 50, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
  );

  // Remove the message after a delay
  setTimeout(() => {
    gsap.to(successMessage, {
      y: -50, opacity: 0, duration: 0.5, ease: 'power2.in',
      onComplete: () => {
        document.body.removeChild(successMessage);
      }
    });
  }, 3000);
};

const goBack = () => {
  if (assignment.value && assignment.value.unidad_id) {
    router.push(`/student/unit/${assignment.value.unidad_id}`);
  } else {
    router.push('/student/home');
  }
};

// Lifecycle hooks
onMounted(() => {
  fetchAssignmentDetails();

  // Add GSAP animations
  gsap.from('.back-button', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  gsap.from('.assignment-header', {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: 'power2.out',
    delay: 0.3
  });

  gsap.from('.assignment-content', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    delay: 0.6
  });
});
</script>

<style lang="scss" scoped>
.student-assignment-detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .assignment-detail-main {
    flex: 1;
    padding: 2rem 1rem;
    z-index: 1;
    position: relative;

    .container {
      max-width: 1000px;
      margin: 0 auto;
      position: relative;
    }
  }

  .back-button {
    margin-bottom: 3rem;

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

  .assignment-header {
    margin-bottom: 2.5rem;
    text-align: center;
    position: relative;
    padding: 2rem 0;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 1px;
      background: linear-gradient(90deg,
        rgba(230, 83, 29, 0),
        rgba(230, 83, 29, 0.5) 20%,
        rgba(230, 83, 29, 0.8) 50%,
        rgba(230, 83, 29, 0.5) 80%,
        rgba(230, 83, 29, 0));
    }

    .assignment-title-container {
      margin-bottom: 0.8rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    h1 {
      color: #FEF0D1;
      font-size: 2.8rem;
      font-weight: bold;
      margin: 0.5rem 0;
      text-shadow: 0 0 15px rgba(230, 83, 29, 0.3);
      background: linear-gradient(90deg, #FEF0D1 0%, #e6531d 50%, #FEF0D1 100%);
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shine 8s linear infinite;
    }

    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }

    .assignment-status {
      display: inline-block;
      padding: 0.5rem 1.5rem;
      border-radius: 30px;
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 0.8rem;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      &.submitted {
        background: linear-gradient(135deg, #007142 0%, #00a167 100%);
        color: white;
      }

      &.pending {
        background: linear-gradient(135deg, #34307b 0%, #4a45a8 100%);
        color: white;
      }

      &.overdue {
        background: linear-gradient(135deg, #e6531d 0%, #ff7043 100%);
        color: white;
      }
    }

    .unit-name {
      color: rgba(254, 240, 209, 0.8);
      font-size: 1.3rem;
      margin-top: 0.8rem;
      font-weight: 500;
    }
  }

  .assignment-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .assignment-info-card {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 1.8rem;
    color: var(--color-cashmere);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(230, 83, 29, 0.2);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, #e6531d, #007142, #34307b);
    }

    .assignment-description {
      margin-bottom: 1.8rem;

      h3 {
        color: var(--color-orange);
        margin-top: 0;
        margin-bottom: 1.2rem;
        font-size: 1.4rem;
        font-weight: 600;
        position: relative;
        display: inline-block;

        &::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 0;
          width: 40px;
          height: 3px;
          background-color: var(--color-orange);
          border-radius: 3px;
        }
      }

      p {
        color: rgba(254, 240, 209, 0.9);
        line-height: 1.7;
        font-size: 1.05rem;
      }
    }

    .assignment-meta {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 1.2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        color: rgba(254, 240, 209, 0.9);
        font-size: 1.05rem;
        padding: 0.5rem 0;
        transition: transform 0.3s ease;

        &:hover {
          transform: translateX(5px);
        }

        i {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FEF0D1;
          background-color: var(--color-orange);
          border-radius: 50%;
          font-size: 0.9rem;
        }
      }
    }
  }

  .submission-section {
    background-color: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    padding: 1.8rem;
    color: var(--color-cashmere);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(52, 48, 123, 0.2);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, #34307b, #e6531d, #007142);
    }

    h3 {
      color: var(--color-purple);
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.4rem;
      font-weight: 600;
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 40px;
        height: 3px;
        background-color: var(--color-purple);
        border-radius: 3px;
      }
    }

    .no-submission {
      text-align: center;
      padding: 3rem 0;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60%;
        height: 1px;
        background: linear-gradient(90deg,
          rgba(52, 48, 123, 0),
          rgba(52, 48, 123, 0.5) 20%,
          rgba(52, 48, 123, 0.8) 50%,
          rgba(52, 48, 123, 0.5) 80%,
          rgba(52, 48, 123, 0));
      }

      p {
        margin-bottom: 2rem;
        color: rgba(254, 240, 209, 0.8);
        font-size: 1.1rem;
        font-weight: 500;
      }

      .submit-btn {
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #e6531d 0%, #ff7043 100%);
        border: none;
        border-radius: 30px;
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        display: inline-flex;
        align-items: center;
        gap: 0.8rem;
        box-shadow: 0 6px 15px rgba(230, 83, 29, 0.4);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ff7043 0%, #e6531d 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(230, 83, 29, 0.5);

          &::before {
            opacity: 1;
          }
        }

        i {
          font-size: 1.2rem;
          position: relative;
          z-index: 1;
        }

        span {
          position: relative;
          z-index: 1;
        }
      }
    }

    .submission-details {
      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;

        h4 {
          margin: 0;
          color: rgba(254, 240, 209, 0.9);
          font-size: 1.1rem;
        }

        .grade {
          padding: 0.4rem 0.8rem;
          background-color: var(--color-forest-green);
          border-radius: 4px;
          color: white;
          font-weight: 500;
        }
      }

      .text-response, .submitted-files, .feedback {
        margin-bottom: 1.5rem;

        h5 {
          color: var(--color-orange);
          margin-bottom: 0.8rem;
          font-size: 1rem;
        }

        p {
          color: rgba(254, 240, 209, 0.9);
          line-height: 1.6;
          white-space: pre-line;
        }
      }

      .files-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;

        .file-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background-color: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          color: #FEF0D1;
          text-decoration: none;
          transition: all 0.3s;

          &:hover {
            background-color: rgba(52, 48, 123, 0.5);
            transform: translateY(-2px);
          }

          i {
            color: var(--color-orange);
          }
        }
      }

      .resubmit-btn {
        padding: 0.8rem 1.5rem;
        background-color: var(--color-purple);
        border: none;
        border-radius: 6px;
        color: white;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 1rem;

        &:hover {
          background-color: darken(#34307b, 10%);
          transform: translateY(-2px);
        }

        i {
          font-size: 1.1rem;
        }
      }
    }
  }

  .loading-container, .error-message {
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
  .student-assignment-detail {
    .assignment-header {
      h1 {
        font-size: 2rem;
      }
    }
  }
}

@media (max-width: 480px) {
  .student-assignment-detail {
    .assignment-header {
      h1 {
        font-size: 1.8rem;
      }
    }
  }
}

// Floating success message
.floating-success-message {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--color-forest-green);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 113, 66, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: 500;

  i {
    font-size: 1.5rem;
  }
}
</style>
