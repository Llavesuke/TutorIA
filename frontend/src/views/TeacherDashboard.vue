<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { gsap } from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import DashboardService from '@/services/dashboardService';
import authStore from '@/stores/authStore';

// State
const isLoading = ref(true);
const errorMessage = ref('');
const stats = ref({
  activeTutors: { count: 0, description: 'Loading...' },
  studentInteractions: { count: 0, description: 'Loading...' },
  totalStudents: { count: 0, description: 'Loading...' },
  pendingAssignments: { count: 0, description: 'Loading...' }
});
const weeklyActivity = ref([]);
const alerts = ref([]);

// Get teacher name from auth store
const teacherName = computed(() => {
  const user = authStore.user.value;
  if (!user) return 'Prof.';

  const nombreReal = user.user_metadata?.nombre_real || user.nombre_real;
  const nombreUsuario = user.user_metadata?.nombre_usuario || user.nombre_usuario;
  const fullName = nombreReal || nombreUsuario || '';

  if (fullName) {
    const firstName = fullName.split(' ')[0];
    return `Prof. ${firstName}`;
  }

  return 'Prof.';
});

// Load dashboard data
const loadDashboardData = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    console.log('Loading dashboard data...');
    const dashboardData = await DashboardService.getProfessorDashboardStats();

    console.log('Dashboard data received:', dashboardData);

    stats.value = {
      activeTutors: dashboardData.activeTutors,
      studentInteractions: dashboardData.studentInteractions,
      totalStudents: dashboardData.totalStudents,
      pendingAssignments: dashboardData.pendingAssignments
    };

    weeklyActivity.value = dashboardData.weeklyActivity || [];
    alerts.value = dashboardData.recentAlerts || [];

  } catch (error) {
    console.error('Error loading dashboard data:', error);
    errorMessage.value = 'Failed to load dashboard data. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Calculate metrics functions
const calculateEngagementRate = () => {
  if (stats.value.totalStudents.count === 0) return 0;
  const rate = Math.round((stats.value.studentInteractions.count / stats.value.totalStudents.count) * 100);
  return Math.min(rate, 100);
};

const calculateAvgResponseTime = () => {
  // Mock calculation - in real app this would come from actual data
  const times = ['2.3s', '1.8s', '3.1s', '2.7s', '1.9s'];
  return times[Math.floor(Math.random() * times.length)];
};

const calculateCompletionRate = () => {
  if (stats.value.pendingAssignments.count === 0) return 100;
  // Mock calculation based on pending vs total assignments
  const completionRate = Math.max(0, 100 - (stats.value.pendingAssignments.count * 10));
  return Math.min(completionRate, 100);
};

// Initialize GSAP animations with robust fallback
const initAnimations = () => {
  console.log('Starting dashboard animation initialization...');

  // Use a more reliable timing approach
  setTimeout(() => {
    const welcomeTitle = document.querySelector('.welcome-section h1');
    const welcomeSubtitle = document.querySelector('.welcome-section .subtitle');
    const statCards = document.querySelectorAll('.stat-card');
    const uploadCard = document.querySelector('.upload-card');
    const metricsSection = document.querySelector('.metrics-section');

    console.log('Dashboard animation elements found:', {
      welcomeTitle: !!welcomeTitle,
      welcomeSubtitle: !!welcomeSubtitle,
      statCardsCount: statCards.length,
      uploadCard: !!uploadCard,
      metricsSection: !!metricsSection
    });

    // Ensure elements are visible as fallback
    const allElements = [welcomeTitle, welcomeSubtitle, uploadCard, metricsSection, ...statCards].filter(Boolean);

    if (allElements.length === 0) {
      console.warn('No dashboard animation elements found, retrying...');
      // Retry after a short delay if no elements found
      setTimeout(initAnimations, 100);
      return;
    }

    // Set initial GSAP states without clearing existing transforms
    if (welcomeTitle) {
      gsap.set(welcomeTitle, { y: 30, opacity: 0 });
    }
    if (welcomeSubtitle) {
      gsap.set(welcomeSubtitle, { y: 20, opacity: 0 });
    }
    if (statCards.length > 0) {
      gsap.set(statCards, { y: 40, opacity: 0, scale: 0.95 });
    }
    if (uploadCard) {
      gsap.set(uploadCard, { y: 30, opacity: 0 });
    }
    if (metricsSection) {
      gsap.set(metricsSection, { y: 30, opacity: 0 });
    }

    // Create animation timeline with fallback
    const tl = gsap.timeline({
      delay: 0.1,
      onComplete: () => {
        console.log('Dashboard animations completed successfully');
        // Ensure all elements are visible after animation but preserve transforms for hover
        allElements.forEach(el => {
          if (el) {
            gsap.set(el, { opacity: 1 });
          }
        });
      }
    });

    if (welcomeTitle) {
      tl.to(welcomeTitle, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      });
    }

    if (welcomeSubtitle) {
      tl.to(welcomeSubtitle, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, welcomeTitle ? '-=0.4' : 0);
    }

    // Animate stat cards with stagger
    if (statCards.length > 0) {
      tl.to(statCards, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.2)'
      }, welcomeTitle || welcomeSubtitle ? '-=0.3' : 0);

      // Add hover animations for cards with improved handling
      statCards.forEach(card => {
        // Remove any existing event listeners to prevent duplicates
        card.removeEventListener('mouseenter', card._hoverIn);
        card.removeEventListener('mouseleave', card._hoverOut);

        // Create hover functions
        card._hoverIn = () => {
          gsap.killTweensOf(card); // Kill any existing animations
          gsap.to(card, {
            y: -5,
            scale: 1.02,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        };

        card._hoverOut = () => {
          gsap.killTweensOf(card); // Kill any existing animations
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        };

        // Add event listeners
        card.addEventListener('mouseenter', card._hoverIn);
        card.addEventListener('mouseleave', card._hoverOut);
      });
    }

    // Animate other sections
    if (uploadCard) {
      tl.to(uploadCard, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.2');
    }

    if (metricsSection) {
      tl.to(metricsSection, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, '-=0.4');
    }

    // Fallback: ensure elements are visible after 2 seconds regardless
    setTimeout(() => {
      allElements.forEach(el => {
        if (el && gsap.getProperty(el, 'opacity') < 1) {
          console.log('Applying fallback visibility for dashboard element:', el);
          gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        }
      });
    }, 2000);

  }, 100);
};

onMounted(async () => {
  console.log('Teacher Dashboard mounted');
  document.body.classList.add('minimalist-theme');

  // Load data first
  await loadDashboardData();

  // Then initialize animations
  await nextTick();
  initAnimations();
});
</script>

<template>
  <div class="minimalist-dashboard">
    <!-- Fondo minimalista para el dashboard -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="dashboard-main">
      <div class="container">
        <!-- Encabezado de bienvenida -->
        <div class="welcome-section">
          <h1>Welcome Back, <span class="teacher-name">{{ teacherName }}</span>!</h1>
          <p class="subtitle">Here's what's happening in your learning universe today</p>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-container">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>{{ errorMessage }}</p>
          <button @click="loadDashboardData" class="retry-btn">Try Again</button>
        </div>

        <!-- Dashboard content -->
        <div v-else>
          <!-- Tarjetas de estadísticas -->
          <div class="stats-cards">
            <!-- Tarjeta de tutores activos -->
            <div class="stat-card green-card" data-card="0">
              <div class="card-background"></div>
              <div class="card-content-wrapper">
                <div class="card-icon" aria-hidden="true">
                  <i class="fas fa-robot"></i>
                </div>
                <div class="card-content">
                  <h3>Active Tutors</h3>
                  <div class="card-value">{{ stats.activeTutors.count }}</div>
                  <p class="card-description">{{ stats.activeTutors.description }}</p>
                </div>
              </div>
            </div>

            <!-- Tarjeta de interacciones de estudiantes -->
            <div class="stat-card purple-card" data-card="1">
              <div class="card-background"></div>
              <div class="card-content-wrapper">
                <div class="card-icon" aria-hidden="true">
                  <i class="fas fa-comments"></i>
                </div>
                <div class="card-content">
                  <h3>Student Interactions</h3>
                  <div class="card-value">{{ stats.studentInteractions.count }}</div>
                  <p class="card-description">{{ stats.studentInteractions.description }}</p>
                </div>
              </div>
            </div>

            <!-- Tarjeta de estudiantes totales -->
            <div class="stat-card orange-card" data-card="2">
              <div class="card-background"></div>
              <div class="card-content-wrapper">
                <div class="card-icon" aria-hidden="true">
                  <i class="fas fa-users"></i>
                </div>
                <div class="card-content">
                  <h3>Total Students</h3>
                  <div class="card-value">{{ stats.totalStudents.count }}</div>
                  <p class="card-description">{{ stats.totalStudents.description }}</p>
                </div>
              </div>
            </div>

            <!-- Tarjeta de assignments pendientes -->
            <div class="stat-card teal-card" data-card="3">
              <div class="card-background"></div>
              <div class="card-content-wrapper">
                <div class="card-icon" aria-hidden="true">
                  <i class="fas fa-tasks"></i>
                </div>
                <div class="card-content">
                  <h3>Pending Assignments</h3>
                  <div class="card-value">{{ stats.pendingAssignments.count }}</div>
                  <p class="card-description">{{ stats.pendingAssignments.description }}</p>
                </div>
              </div>
            </div>
          </div>

        <!-- Sección de carga de documentos -->
        <div class="upload-section">
          <div class="upload-card">
            <div class="card-icon" aria-hidden="true">
              <i class="fas fa-file-upload"></i>
            </div>
            <h3>Drop your notes, guides or quizzes here to train your tutors</h3>
          </div>
        </div>

          <!-- Sección de métricas y alertas -->
          <div class="metrics-section">
            <!-- Métricas de rendimiento -->
            <div class="performance-metrics">
              <h3>Performance Metrics</h3>
              <div class="metrics-grid">
                <div class="metric-item green-metric">
                  <div class="metric-icon">
                    <i class="fas fa-chart-line"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Engagement Rate</span>
                    <span class="metric-value">{{ calculateEngagementRate() }}%</span>
                  </div>
                </div>

                <div class="metric-item orange-metric">
                  <div class="metric-icon">
                    <i class="fas fa-clock"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Avg. Response Time</span>
                    <span class="metric-value">{{ calculateAvgResponseTime() }}</span>
                  </div>
                </div>

                <div class="metric-item purple-metric">
                  <div class="metric-icon">
                    <i class="fas fa-trophy"></i>
                  </div>
                  <div class="metric-content">
                    <span class="metric-label">Completion Rate</span>
                    <span class="metric-value">{{ calculateCompletionRate() }}%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alertas y notificaciones -->
            <div class="alerts-section" v-if="alerts.length > 0">
              <h3>Recent Alerts</h3>
              <div class="alerts-list">
                <div
                  v-for="(alert, index) in alerts"
                  :key="index"
                  class="alert-item"
                  :class="'alert-' + alert.type"
                >
                  <div class="alert-icon">
                    <i class="fas" :class="alert.icon"></i>
                  </div>
                  <div class="alert-content">
                    <span class="alert-message">{{ alert.message }}</span>
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
  </div>
</template>

<style lang="scss" scoped>
.minimalist-dashboard {
  min-height: 100vh;
  background-color: #171717;
  position: relative;
  font-family: 'Poppins', sans-serif;

  // Prevent flash of unstyled content - elements start hidden but accessible
  .welcome-section h1,
  .welcome-section .subtitle,
  .stat-card,
  .metrics-section,
  .upload-card {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
    // Use opacity instead of visibility to ensure elements are always accessible
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }

  .dashboard-main {
    position: relative;
    z-index: 2;
    padding: 2rem 0;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
  }

  .welcome-section {
    text-align: center;
    margin-bottom: 3rem;

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #FEF0D1;
      margin-bottom: 0.5rem;

      .teacher-name {
        color: #e6531d;
      }
    }

    .subtitle {
      font-size: 1.2rem;
      color: rgba(254, 240, 209, 0.8);
      font-weight: 400;
    }
  }

  // Loading and error states
  .loading-container, .error-container {
    text-align: center;
    padding: 3rem 1rem;
    color: #FEF0D1;

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(254, 240, 209, 0.2);
      border-top: 4px solid #e6531d;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    .error-icon {
      font-size: 3rem;
      color: #ff4757;
      margin-bottom: 1rem;
    }

    .retry-btn {
      background-color: #e6531d;
      color: #FEF0D1;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      transition: all 0.3s ease;

      &:hover {
        background-color: darken(#e6531d, 10%);
        transform: translateY(-2px);
      }
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  // Stats cards
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    border-radius: 16px;
    padding: 0;
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    min-height: 180px;
    border: none;

    .card-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.95;
      transition: all 0.3s ease;
    }

    .card-content-wrapper {
      position: relative;
      z-index: 2;
      padding: 2rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    &.green-card {
      .card-background {
        background: linear-gradient(135deg, #007142 0%, #005a35 100%);
      }

      &:hover .card-background {
        background: linear-gradient(135deg, #008c52 0%, #007142 100%);
        transform: scale(1.02);
      }

      .card-icon {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    &.purple-card {
      .card-background {
        background: linear-gradient(135deg, #34307b 0%, #2a2560 100%);
      }

      &:hover .card-background {
        background: linear-gradient(135deg, #3d3689 0%, #34307b 100%);
        transform: scale(1.02);
      }

      .card-icon {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    &.orange-card {
      .card-background {
        background: linear-gradient(135deg, #e6531d 0%, #c4461a 100%);
      }

      &:hover .card-background {
        background: linear-gradient(135deg, #f05f29 0%, #e6531d 100%);
        transform: scale(1.02);
      }

      .card-icon {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    &.teal-card {
      .card-background {
        background: linear-gradient(135deg, #00897b 0%, #00695c 100%);
      }

      &:hover .card-background {
        background: linear-gradient(135deg, #00a693 0%, #00897b 100%);
        transform: scale(1.02);
      }

      .card-icon {
        color: rgba(255, 255, 255, 0.9);
      }
    }

    .card-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .card-content {
      flex: 1;

      h3 {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .card-value {
        color: #ffffff;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .card-description {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin: 0;
        line-height: 1.4;
      }
    }

    &:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);

      .card-background {
        transform: scale(1.05);
      }
    }
  }

  // Upload section
  .upload-section {
    margin-bottom: 3rem;
  }

  .upload-card {
    background: rgba(254, 240, 209, 0.05);
    border: 2px dashed rgba(254, 240, 209, 0.3);
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      border-color: #e6531d;
      background: rgba(230, 83, 29, 0.05);
    }

    .card-icon {
      font-size: 3rem;
      color: #e6531d;
      margin-bottom: 1rem;
    }

    h3 {
      color: #FEF0D1;
      font-size: 1.3rem;
      font-weight: 600;
      margin: 0;
    }
  }

  // Metrics section
  .metrics-section {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .performance-metrics {
    background: rgba(254, 240, 209, 0.05);
    border-radius: 16px;
    padding: 2rem;
    border: 2px solid rgba(254, 240, 209, 0.1);

    h3 {
      color: #FEF0D1;
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .metric-item {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      }

      .metric-icon {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: white;
      }

      .metric-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .metric-label {
          color: rgba(254, 240, 209, 0.8);
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .metric-value {
          color: #FEF0D1;
          font-size: 1.5rem;
          font-weight: 700;
        }
      }

      &.green-metric .metric-icon {
        background: linear-gradient(135deg, #007142, #005a35);
      }

      &.orange-metric .metric-icon {
        background: linear-gradient(135deg, #e6531d, #c4461a);
      }

      &.purple-metric .metric-icon {
        background: linear-gradient(135deg, #34307b, #2a2560);
      }
    }
  }

  .alerts-section {
    background: rgba(254, 240, 209, 0.05);
    border-radius: 16px;
    padding: 2rem;
    border: 2px solid rgba(254, 240, 209, 0.1);

    h3 {
      color: #FEF0D1;
      font-size: 1.4rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateX(5px);
      }

      .alert-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
      }

      .alert-content {
        flex: 1;

        .alert-message {
          color: #FEF0D1;
          font-size: 0.95rem;
          line-height: 1.4;
        }
      }

      &.alert-success {
        background: rgba(76, 175, 80, 0.1);
        border-left: 4px solid #4caf50;

        .alert-icon {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
        }
      }

      &.alert-warning {
        background: rgba(255, 152, 0, 0.1);
        border-left: 4px solid #ff9800;

        .alert-icon {
          background: rgba(255, 152, 0, 0.2);
          color: #ff9800;
        }
      }

      &.alert-info {
        background: rgba(33, 150, 243, 0.1);
        border-left: 4px solid #2196f3;

        .alert-icon {
          background: rgba(33, 150, 243, 0.2);
          color: #2196f3;
        }
      }
    }
  }

  .chart-container {
    margin-bottom: 2rem;
  }

  .activity-chart {
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    height: 200px;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
  }

  .chart-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
    position: relative;

    &::after {
      content: attr(data-label);
      position: absolute;
      bottom: -25px;
      font-size: 0.8rem;
      color: rgba(254, 240, 209, 0.6);
      font-weight: 500;
    }

    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 4px;

      .bar {
        width: 12px;
        border-radius: 6px 6px 0 0;
        transition: all 0.3s ease;
        min-height: 5px;

        &.interactions-bar {
          background: #e6531d;
        }

        &.usage-bar {
          background: #007142;
        }

        &:hover {
          transform: scaleY(1.1);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }
      }
    }
  }

  .no-data {
    text-align: center;
    padding: 3rem;
    color: rgba(254, 240, 209, 0.6);

    p {
      font-size: 1.1rem;
      margin: 0;
    }
  }

  .alerts-container {
    .alert-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;

      &.alert-success {
        background: rgba(76, 175, 80, 0.1);
        border-left: 4px solid #4caf50;
        color: #4caf50;
      }

      &.alert-warning {
        background: rgba(255, 152, 0, 0.1);
        border-left: 4px solid #ff9800;
        color: #ff9800;
      }

      &.alert-info {
        background: rgba(33, 150, 243, 0.1);
        border-left: 4px solid #2196f3;
        color: #2196f3;
      }

      i {
        font-size: 1.1rem;
      }

      span {
        flex: 1;
        color: #FEF0D1;
      }
    }
  }

  @media (max-width: 768px) {
    .welcome-section h1 {
      font-size: 2rem;
    }

    .stats-cards {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .stat-card {
      padding: 1.5rem;
    }

    .upload-card {
      padding: 2rem 1rem;
    }

    .activity-chart {
      height: 150px;
    }

    .chart-column .chart-bars .bar {
      width: 8px;
    }
  }
}
</style>
