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
@import './TeacherDashboard.scss';
</style>
