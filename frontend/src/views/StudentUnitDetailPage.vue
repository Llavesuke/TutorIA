<template>
  <div class="student-unit-detail">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Main content -->
    <main class="unit-detail-main">
      <div class="container">
        <!-- Settings button -->
        <SettingsButton />

        <!-- Back button -->
        <div class="back-button">
          <button @click="goBack" class="back-link">
            <div class="back-icon">
              <i class="fas fa-arrow-left"></i>
            </div>
            <span>Back to Module</span>
          </button>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="bubble-loader">
            <div class="bubble bubble-1"></div>
            <div class="bubble bubble-2"></div>
            <div class="bubble bubble-3"></div>
          </div>
          <p class="loading-text">Loading unit details...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchUnitDetails" class="retry-button">
            <span>Try Again</span>
          </button>
        </div>

        <!-- Unit details -->
        <div v-else-if="unit" class="unit-details">
          <!-- Unit header -->
          <div class="unit-header">
            <div class="unit-title-container">
              <div class="unit-number">Unit {{ unit.orden }}</div>
              <h1>{{ unit.nombre }}</h1>
            </div>
            <p class="module-name" v-if="moduleName">{{ moduleName }}</p>
          </div>

          <!-- Tabs -->
          <div class="tabs-container">
            <div class="tabs">
              <button
                class="tab-button"
                :class="{ 'active': activeTab === 'tutors' }"
                @click="activeTab = 'tutors'"
              >
                <i class="fas fa-robot"></i> Tutors
              </button>
              <button
                class="tab-button"
                :class="{ 'active': activeTab === 'assignments' }"
                @click="activeTab = 'assignments'"
              >
                <i class="fas fa-tasks"></i> Assignments
              </button>
            </div>

            <!-- Tab content -->
            <div class="tab-content">
              <!-- Tutors tab -->
              <div v-if="activeTab === 'tutors'" class="tutors-tab">
                <!-- Tutors loading state -->
                <div v-if="isLoadingTutors" class="loading-container">
                  <div class="bubble-loader">
                    <div class="bubble bubble-1"></div>
                    <div class="bubble bubble-2"></div>
                    <div class="bubble bubble-3"></div>
                  </div>
                  <p class="loading-text">Loading tutors...</p>
                </div>

                <!-- Tutors error state -->
                <div v-else-if="tutorsError" class="error-message">
                  <p>{{ tutorsError }}</p>
                  <button @click="fetchTutors" class="retry-button">
                    <span>Try Again</span>
                  </button>
                </div>

                <!-- Empty tutors state -->
                <div v-else-if="tutors.length === 0" class="empty-state">
                  <p>No tutors available for this unit yet.</p>
                </div>

                <!-- Tutors grid -->
                <div v-else class="tutors-grid">
                  <div
                    v-for="tutor in tutors"
                    :key="tutor.id"
                    class="tutor-card"
                    :style="{ backgroundColor: getRandomColor(tutor.id) }"
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
                      <p v-if="tutor.objetivo" class="tutor-objective">{{ tutor.objetivo }}</p>
                    </div>
                    <div class="tutor-action">
                      <button class="chat-button">
                        <i class="fas fa-comments"></i> Chat
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Assignments tab -->
              <div v-else-if="activeTab === 'assignments'" class="assignments-tab">
                <!-- Assignments loading state -->
                <div v-if="isLoadingAssignments" class="loading-container">
                  <div class="bubble-loader">
                    <div class="bubble bubble-1"></div>
                    <div class="bubble bubble-2"></div>
                    <div class="bubble bubble-3"></div>
                  </div>
                  <p class="loading-text">Loading assignments...</p>
                </div>

                <!-- Assignments error state -->
                <div v-else-if="assignmentsError" class="error-message">
                  <p>{{ assignmentsError }}</p>
                  <button @click="fetchAssignments" class="retry-button">
                    <span>Try Again</span>
                  </button>
                </div>

                <!-- Empty assignments state -->
                <div v-else-if="assignments.length === 0" class="empty-state">
                  <p>No assignments available for this unit yet.</p>
                </div>

                <!-- Assignments list -->
                <div v-else class="assignments-list">
                  <div
                    v-for="assignment in assignments"
                    :key="assignment.id"
                    class="assignment-card"
                  >
                    <div class="assignment-header">
                      <h3 class="assignment-title">{{ assignment.titulo }}</h3>
                      <span class="assignment-status" :class="getAssignmentStatusClass(assignment)">
                        {{ getAssignmentStatusText(assignment) }}
                      </span>
                    </div>
                    <p class="assignment-description">{{ assignment.descripcion }}</p>
                    <div class="assignment-footer">
                      <span class="assignment-due-date" v-if="assignment.fecha_entrega">
                        <i class="fas fa-calendar-alt"></i> Due: {{ formatDate(assignment.fecha_entrega) }}
                      </span>
                      <button class="view-assignment-btn" @click="viewAssignment(assignment.id)">
                        <i class="fas fa-eye"></i> <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import gsap from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import UnitService from '@/services/unitService';
import ModuleService from '@/services/moduleService';
import TutorService from '@/services/tutorService';
import AssignmentService from '@/services/assignmentService';
import authStore from '@/stores/authStore';

// Route and router
const route = useRoute();
const router = useRouter();

// State
const unit = ref(null);
const moduleName = ref('');
const tutors = ref([]);
const assignments = ref([]);
const activeTab = ref('tutors');
const isLoading = ref(true);
const isLoadingTutors = ref(true);
const isLoadingAssignments = ref(true);
const errorMessage = ref('');
const tutorsError = ref('');
const assignmentsError = ref('');

// Methods
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
      const moduleData = await ModuleService.getModuleById(unit.value.modulo_id);
      if (moduleData) {
        moduleName.value = moduleData.nombre;
      }
    }

    // After loading unit details, fetch tutors and assignments
    fetchTutors();
    fetchAssignments();
  } catch (error) {
    console.error('Error fetching unit details:', error);
    errorMessage.value = 'Failed to load unit details. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const fetchTutors = async () => {
  try {
    isLoadingTutors.value = true;
    tutorsError.value = '';

    if (!unit.value || !unit.value.id) {
      tutorsError.value = 'Unit information not available';
      return;
    }

    // Fetch tutors for this unit
    const tutorData = await TutorService.getTutorsByUnit(unit.value.id);
    console.log('Tutors data:', tutorData);

    tutors.value = tutorData || [];
  } catch (error) {
    console.error('Error fetching tutors:', error);
    tutorsError.value = 'Failed to load tutors. Please try again.';
  } finally {
    isLoadingTutors.value = false;
  }
};

const fetchAssignments = async () => {
  try {
    isLoadingAssignments.value = true;
    assignmentsError.value = '';

    if (!unit.value || !unit.value.id) {
      assignmentsError.value = 'Unit information not available';
      return;
    }

    // Fetch assignments for this unit
    const assignmentData = await AssignmentService.getAssignmentsByUnit(unit.value.id);
    console.log('Assignments data:', assignmentData);

    assignments.value = assignmentData || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    assignmentsError.value = 'Failed to load assignments. Please try again.';
  } finally {
    isLoadingAssignments.value = false;
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

// Colores vibrantes de la paleta de la página
const brandColors = [
  '#e6531d', // naranja principal
  '#ff7043', // naranja más brillante
  '#007142', // verde principal
  '#00c853', // verde más brillante
  '#34307b', // morado principal
  '#673ab7', // morado más brillante
  '#d81b60', // rosa intenso
  '#2196f3', // azul brillante
  '#00bcd4', // cian
  '#ff5722', // naranja intenso
  '#8e24aa'  // púrpura intenso
];

// Función para obtener un color aleatorio basado en el ID del tutor
const getRandomColor = (tutorId) => {
  // Usamos el ID del tutor para asegurar que siempre tenga el mismo color
  const hash = tutorId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Obtenemos un índice basado en el hash
  const index = Math.abs(hash) % brandColors.length;

  // Devolvemos el color correspondiente
  return brandColors[index];
};

// Mantenemos esta función por si se necesita en otro lugar
const getTutorTypeClass = (type) => {
  switch (type) {
    case 'teorico':
      return 'theory-tutor';
    case 'practico':
      return 'practical-tutor';
    case 'evaluador':
      return 'evaluator-tutor';
    default:
      return 'general-tutor';
  }
};

const formatTutorType = (type) => {
  switch (type) {
    case 'teorico':
      return 'Theoretical';
    case 'practico':
      return 'Practical';
    case 'evaluador':
      return 'Evaluator';
    default:
      return 'General';
  }
};

const getAssignmentStatusClass = (assignment) => {
  if (assignment.completado) {
    return 'completed';
  }

  const dueDate = new Date(assignment.fecha_entrega);
  const now = new Date();

  if (dueDate < now && !assignment.completado) {
    return 'overdue';
  }

  return 'pending';
};

const getAssignmentStatusText = (assignment) => {
  if (assignment.completado) {
    return 'Completed';
  }

  const dueDate = new Date(assignment.fecha_entrega);
  const now = new Date();

  if (dueDate < now && !assignment.completado) {
    return 'Overdue';
  }

  return 'Pending';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const openChat = (tutorId) => {
  router.push(`/student/chat/${tutorId}`);
};

const viewAssignment = (assignmentId) => {
  // Navigate to the assignment detail page
  router.push({
    name: 'student-assignment-detail',
    params: { id: assignmentId }
  });
};

const goBack = () => {
  router.push(`/student/module/${unit.value?.modulo_id || ''}`);
};

// Configuramos los elementos inicialmente ocultos
const setupInitialState = () => {
  // Configuramos el estado inicial de los elementos antes de que se muestren
  gsap.set('.unit-header h1', { y: -80, opacity: 0, rotationX: -90, scale: 0.5 });
  gsap.set('.unit-number', { x: -100, opacity: 0, rotation: -180 });
  gsap.set('.module-name', { y: 50, opacity: 0, scale: 0.3 });
  gsap.set('.tabs-container', { y: 60, opacity: 0, scale: 0.7, rotationY: 45 });
  gsap.set('.tutor-card', {
    y: 150,
    opacity: 0,
    scale: 0.3,
    rotation: gsap.utils.wrap([-45, 45]),
    transformOrigin: 'center bottom'
  });
  gsap.set('.assignment-card', {
    y: 120,
    opacity: 0,
    scale: 0.5,
    rotationY: -45,
    rotationX: 30
  });
};

// Animamos los elementos a su posición final
const animateElements = () => {
  // Timeline principal
  const mainTimeline = gsap.timeline();

  // Animate unit number con rotación espectacular
  mainTimeline.to('.unit-number', {
    x: 0,
    opacity: 1,
    rotation: 0,
    duration: 1.5,
    ease: 'elastic.out(1, 0.8)'
  });

  // Animate the page title con efecto 3D más dramático
  mainTimeline.to('.unit-header h1', {
    y: 0,
    opacity: 1,
    rotationX: 0,
    scale: 1,
    duration: 1.8,
    ease: 'elastic.out(1, 0.6)'
  }, "-=1");

  // Animate the unit description con rebote más pronunciado
  mainTimeline.to('.module-name', {
    y: 0,
    opacity: 1,
    scale: 1,
    duration: 1.2,
    ease: 'back.out(3)'
  }, "-=0.8");

  // Animate the tabs con efecto 3D
  mainTimeline.to('.tabs-container', {
    y: 0,
    opacity: 1,
    scale: 1,
    rotationY: 0,
    duration: 1,
    ease: 'power4.out'
  }, "-=0.6");

  // Animate the tutor cards con efecto de cascada más espectacular
  mainTimeline.to('.tutor-card', {
    y: 0,
    opacity: 1,
    scale: 1,
    rotation: 0,
    duration: 2,
    stagger: {
      amount: 1.2,
      from: "random",
      ease: "power2.inOut"
    },
    ease: 'elastic.out(1, 0.4)'
  }, "-=0.5");

  // Animate the assignment cards con efecto 3D más dramático
  mainTimeline.to('.assignment-card', {
    y: 0,
    opacity: 1,
    scale: 1,
    rotationY: 0,
    rotationX: 0,
    duration: 1.5,
    stagger: {
      amount: 0.8,
      from: "start",
      ease: "power2.out"
    },
    ease: 'back.out(2)'
  }, "-=1");

  // Añadir efectos de brillo más espectaculares
  mainTimeline.add(() => {
    gsap.to('.tutor-card', {
      boxShadow: '0 0 30px rgba(255, 255, 255, 0.6), 0 15px 30px rgba(0, 0, 0, 0.4)',
      duration: 0.8,
      stagger: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    gsap.to('.assignment-card', {
      boxShadow: '0 0 25px rgba(230, 83, 29, 0.5), 0 12px 25px rgba(0, 0, 0, 0.3)',
      duration: 0.6,
      stagger: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  });
};

// Función para manejar el efecto 3D en las tarjetas
const handleCardTilt = (event, card) => {
  const cardRect = card.getBoundingClientRect();
  const cardCenterX = cardRect.left + cardRect.width / 2;
  const cardCenterY = cardRect.top + cardRect.height / 2;

  // Calcular la posición relativa del cursor respecto al centro de la tarjeta
  const mouseX = event.clientX - cardCenterX;
  const mouseY = event.clientY - cardCenterY;

  // Calcular el ángulo de rotación (limitado a ±10 grados)
  const rotateY = mouseX * 10 / (cardRect.width / 2);
  const rotateX = -mouseY * 10 / (cardRect.height / 2);

  // Aplicar la transformación
  card.style.transform = `translateY(-10px) scale(1.03) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
};

// Función para restablecer la transformación cuando el cursor sale de la tarjeta
const resetCardTilt = (card) => {
  card.style.transform = '';
};

// Lifecycle hooks
onMounted(() => {
  // Configuramos el estado inicial de los elementos (ocultos)
  setupInitialState();

  // Cargamos los datos
  fetchUnitDetails();
  fetchTutors();
  fetchAssignments();

  // Cuando los datos estén cargados, animamos los elementos
  const checkDataLoaded = setInterval(() => {
    if (!isLoading.value && !isLoadingTutors.value && !isLoadingAssignments.value) {
      clearInterval(checkDataLoaded);
      // Pequeño retraso para asegurar que el DOM se ha actualizado
      setTimeout(() => {
        animateElements();

        // Añadir efecto 3D a las tarjetas
        nextTick(() => {
          const tutorCards = document.querySelectorAll('.tutor-card');

          tutorCards.forEach(card => {
            card.addEventListener('mousemove', (e) => handleCardTilt(e, card));
            card.addEventListener('mouseleave', () => resetCardTilt(card));
          });
        });
      }, 50);
    }
  }, 100);
});
</script>

<style lang="scss" scoped>
.student-unit-detail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .unit-detail-main {
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

  .unit-header {
    margin-bottom: 3rem;
    text-align: center;

    .unit-title-container {
      margin-bottom: 1rem;
    }

    .unit-number {
      color: #e6531d;
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    h1 {
      color: #FEF0D1;
      font-family: 'Poppins', sans-serif;
      font-size: 2.4rem;
      font-weight: 700;
      margin: 0.5rem 0;
      letter-spacing: -0.02em;
    }

    .module-name {
      color: rgba(254, 240, 209, 0.7);
      font-family: 'Poppins', sans-serif;
      font-size: 1.1rem;
      font-weight: 400;
    }
  }

  .tabs-container {
    margin-top: 2rem;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 3rem;

    .tab-button {
      padding: 1rem 2rem;
      background-color: rgba(23, 23, 23, 0.6);
      border: 1px solid rgba(254, 240, 209, 0.1);
      border-radius: 12px;
      color: #FEF0D1;
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      i {
        font-size: 1.1rem;
      }

      &:hover {
        background-color: rgba(254, 240, 209, 0.05);
        border-color: rgba(254, 240, 209, 0.2);
        transform: translateY(-1px);
      }

      &.active {
        background-color: #e6531d;
        color: #FEF0D1;
        border-color: #e6531d;
        box-shadow: 0 4px 15px rgba(230, 83, 29, 0.3);
      }
    }
  }

  .tutors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .tutor-card {
    border-radius: 20px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    min-height: 320px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    /* backdrop-filter: blur(10px); */ /* ELIMINADO: Efecto blur que causaba lag */
    border: 2px solid rgba(255, 255, 255, 0.1);

    // Efecto de gradiente de fondo dinámico basado en el color del tutor
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.1;
      background: inherit;
      z-index: 0;
      transition: opacity 0.5s ease;
    }

    &:hover {
      transform: translateY(-12px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      border-color: rgba(255, 255, 255, 0.3);

      &::before {
        opacity: 0.2;
      }

      .tutor-avatar {
        transform: scale(1.1);
        box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
      }

      .tutor-info .tutor-name {
        transform: translateY(-3px);
        text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
      }

      .chat-button {
        background-color: rgba(255, 255, 255, 0.9);
        color: #171717;
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 10px 25px rgba(255, 255, 255, 0.3);
      }
    }

    .tutor-avatar {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      overflow: hidden;
      margin-bottom: 1.5rem;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 2;
      border: 3px solid rgba(255, 255, 255, 0.2);

      &::after {
        content: '';
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border-radius: 50%;
        background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        z-index: -1;
        opacity: 0;
        transition: opacity 0.5s ease;
        animation: rotate 3s linear infinite;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
        transition: all 0.5s ease;
      }

      .default-avatar {
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FEF0D1;
        font-family: 'Poppins', sans-serif;
        font-size: 1.8rem;
        font-weight: 800;
        border-radius: 50%;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }
    }

    .tutor-info {
      text-align: center;
      margin-bottom: 1.5rem;
      width: 100%;
      position: relative;
      z-index: 2;

      .tutor-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #FEF0D1;
        margin-bottom: 0.8rem;
        letter-spacing: -0.02em;
        transition: all 0.3s ease;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .tutor-type {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        color: #FEF0D1;
        margin-bottom: 1rem;
        background-color: rgba(255, 255, 255, 0.15);
        padding: 0.5rem 1.2rem;
        border-radius: 25px;
        display: inline-block;
        font-weight: 600;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }

      .tutor-objective {
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        color: rgba(254, 240, 209, 0.9);
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.5;
        max-width: 95%;
        margin: 0.5rem auto 0;
        font-weight: 400;
        text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
      }
    }

    .tutor-action {
      margin-top: auto;
      position: relative;
      z-index: 2;

      .chat-button {
        padding: 1rem 2rem;
        background-color: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 30px;
        color: #FEF0D1;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        gap: 0.8rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(15px);
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 1px;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.2);
          transition: left 0.8s ease;
        }

        &:hover::before {
          left: 100%;
        }

        i {
          font-size: 1.2rem;
          transition: all 0.3s ease;
        }

        span {
          position: relative;
          z-index: 1;
        }
      }
    }
  }

  .assignments-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  .assignment-card {
    background-color: rgba(23, 23, 23, 0.9);
    border: 2px solid rgba(254, 240, 209, 0.1);
    border-radius: 20px;
    padding: 2rem;
    color: #FEF0D1;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background-color: #e6531d;
      border-radius: 20px 20px 0 0;
    }

    &:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      border-color: rgba(230, 83, 29, 0.3);

      .assignment-title {
        color: #e6531d;
        text-shadow: 0 0 15px rgba(230, 83, 29, 0.5);
      }

      .view-assignment-btn {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 10px 25px rgba(52, 48, 123, 0.5);
      }
    }

    .assignment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .assignment-title {
        font-family: 'Poppins', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        margin: 0;
        color: #FEF0D1;
        transition: all 0.3s ease;
        letter-spacing: -0.02em;
      }

      .assignment-status {
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

        &.completed {
          background-color: #007142;
          color: #FEF0D1;
        }

        &.pending {
          background-color: #34307b;
          color: #FEF0D1;
        }

        &.overdue {
          background-color: #e6531d;
          color: #FEF0D1;
        }
      }
    }

    .assignment-description {
      font-family: 'Poppins', sans-serif;
      font-size: 1rem;
      margin-bottom: 2rem;
      color: rgba(254, 240, 209, 0.9);
      line-height: 1.6;
      font-weight: 400;
    }

    .assignment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;

      .assignment-due-date {
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        color: rgba(254, 240, 209, 0.8);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.5rem 1rem;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);

        i {
          color: #e6531d;
          font-size: 1rem;
        }
      }

      .view-assignment-btn {
        padding: 0.8rem 1.5rem;
        background-color: #34307b;
        border: none;
        border-radius: 25px;
        color: #FEF0D1;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: inline-flex;
        align-items: center;
        gap: 0.8rem;
        box-shadow: 0 8px 25px rgba(52, 48, 123, 0.4);
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.5px;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background-color: #e6531d;
          transition: left 0.5s ease;
        }

        &:hover::before {
          left: 0;
        }

        i {
          font-size: 1.1rem;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        span {
          position: relative;
          z-index: 1;
          transition: all 0.3s ease;
        }
      }
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

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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
  .student-unit-detail {
    .tutors-grid, .assignments-list {
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    }
  }
}

@media (max-width: 480px) {
  .student-unit-detail {
    .unit-header {
      h1 {
        font-size: 2rem;
      }
    }

    .tabs {
      flex-direction: column;
      gap: 0.5rem;
    }

    .tutors-grid, .assignments-list {
      grid-template-columns: 1fr;
    }
  }
}
</style>
