<template>
  <div class="modules-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="modules-main">
      <div class="container">
        <!-- Encabezado de bienvenida -->
        <div class="welcome-section" ref="welcomeSection">
          <h1 class="page-title">Academic Modules</h1>
          <p class="subtitle">Organize your modules by academic years and classes</p>
        </div>

        <!-- Loading indicator -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading modules...</p>
        </div>

        <!-- Error message -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchModules" class="retry-button">Retry</button>
        </div>

        <!-- Modules content -->
        <div v-else class="modules-container">
          <!-- No modules state -->
          <div v-if="modules.length === 0" class="no-modules">
            <div class="no-modules-icon">
              <i class="fas fa-book-open"></i>
            </div>
            <h3>No modules found</h3>
            <p>Start by creating your first module to organize your academic content</p>
          </div>

          <!-- Academic years view -->
          <div v-else-if="!selectedGrade" class="academic-years-view">
            <div class="years-grid">
              <!-- Create new course card -->
              <div class="year-card create-card" @click="openAddModuleModal">
                <div class="card-background"></div>
                <div class="card-content-wrapper">
                  <div class="year-icon">
                    <i class="fas fa-plus"></i>
                  </div>
                  <h3 class="year-title">Create New Course</h3>
                  <p class="year-description">Add a new academic course</p>
                  <div class="year-arrow">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>

              <!-- Existing grades -->
              <div
                v-for="grade in availableGrades"
                :key="grade"
                class="year-card"
                @click="selectGrade(grade)"
                :class="getGradeColorClass(grade)"
              >
                <div class="card-background"></div>
                <div class="card-content-wrapper">
                  <div class="year-icon">
                    <i class="fas fa-graduation-cap"></i>
                  </div>
                  <h3 class="year-title">{{ grade }}</h3>
                  <p class="year-description">{{ getGradeModulesCount(grade) }} modules available</p>
                  <div class="year-arrow">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Classes view for selected grade -->
          <div v-else-if="selectedGrade && !selectedClass" class="classes-view">
            <div class="breadcrumb">
              <button @click="goBack" class="back-btn">
                <i class="fas fa-arrow-left"></i>
              </button>
              <span class="breadcrumb-text">{{ selectedGrade }}</span>
            </div>

            <div class="classes-grid">
              <div
                v-for="classItem in getClassesForGrade(selectedGrade)"
                :key="classItem"
                class="class-card"
                @click="selectClass(classItem)"
                :class="getClassColorClass(classItem)"
              >
                <div class="card-background"></div>
                <div class="card-content-wrapper">
                  <div class="class-icon">
                    <i class="fas fa-users"></i>
                  </div>
                  <h3 class="class-title">Class {{ classItem }}</h3>
                  <p class="class-description">{{ getClassModulesCount(selectedGrade, classItem) }} modules</p>
                  <div class="class-arrow">
                    <i class="fas fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modules view for selected grade and class -->
          <div v-else class="modules-view">
            <div class="breadcrumb">
              <button @click="goBack" class="back-btn">
                <i class="fas fa-arrow-left"></i>
              </button>
              <span class="breadcrumb-text">{{ selectedGrade }} > Class {{ selectedClass }}</span>
            </div>

            <div class="modules-grid">
              <div
                v-for="(module, index) in getModulesForGradeAndClass(selectedGrade, selectedClass)"
                :key="module.id"
                class="module-card"
                :class="getModuleColorClass(index)"
                @click="viewModuleDetail(module.id)"
              >
                <div class="module-header">
                  <h3 class="module-title">{{ module.nombre }}</h3>
                  <div class="module-badges">
                    <span class="grade-badge">{{ module.curso }}</span>
                    <span class="class-badge">Class {{ module.clase }}</span>
                  </div>
                </div>

                <p class="module-description">{{ module.descripcion || 'No description available' }}</p>

                <div class="module-stats">
                  <div class="stat-item">
                    <i class="fas fa-book"></i>
                    <span>{{ module.unitsCount || 0 }} units</span>
                  </div>
                  <div class="stat-item">
                    <i class="fas fa-robot"></i>
                    <span>{{ module.tutorsCount || 0 }} tutors</span>
                  </div>
                  <div class="stat-item">
                    <i class="fas fa-users"></i>
                    <span>{{ module.studentsCount || 0 }} students</span>
                  </div>
                </div>

                <div class="module-actions">
                  <button class="action-btn primary" @click.stop="viewModuleDetail(module.id)">
                    <i class="fas fa-eye"></i>
                    View
                  </button>
                  <button class="action-btn secondary" @click.stop="editModule(module)">
                    <i class="fas fa-edit"></i>
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />

    <!-- Modal para añadir módulo -->
    <AddModuleModal
      :isOpen="isAddModuleModalOpen"
      :centerId="centerId"
      :existingClasses="existingClasses"
      @close="isAddModuleModalOpen = false"
      @module-created="handleModuleCreated"
    />

    <!-- Modal para asignar profesor -->
    <AssignProfessorModal
      v-if="isAssignProfessorModalOpen"
      :isOpen="isAssignProfessorModalOpen"
      :centerId="centerId"
      :moduleId="selectedModuleId"
      @close="isAssignProfessorModalOpen = false"
      @professor-assigned="handleProfessorAssigned"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { gsap } from 'gsap';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';
import AddModuleModal from '@/components/modals/AddModuleModal.vue';
import AssignProfessorModal from '@/components/modals/AssignProfessorModal.vue';
import authStore from '@/stores/authStore';
import ModuleService from '@/services/moduleService';
import UserService from '@/services/userService';
import ClassService from '@/services/classService';

// Router
const router = useRouter();

// State
const modules = ref([]);
const isLoading = ref(false);
const errorMessage = ref('');
const selectedGrade = ref(null);
const selectedClass = ref(null);
const existingClasses = ref([]);
const fetchingClasses = ref(false);

// Modal states
const isAddModuleModalOpen = ref(false);
const isAssignProfessorModalOpen = ref(false);
const selectedModuleId = ref(null);

// Get center ID from authenticated user
const centerId = computed(() => {
  // Try different paths to find centro_id
  const user = authStore.user.value;
  console.log('Current user data:', user);

  if (!user) {
    console.warn('No user data available');
    return null;
  }

  // Check different possible locations for centro_id
  const id = user.centro_id ||
             user.user_metadata?.centro_id ||
             user.app_metadata?.centro_id;

  console.log('Found centro_id in user data:', id);

  // If we can't find a valid centro_id, use a fallback UUID for testing
  if (!id) {
    console.warn('Using fallback UUID for testing. In production, you should get the actual centro_id.');
    return '00000000-0000-0000-0000-000000000000'; // Fallback UUID for testing
  }

  return id;
});

// Get user role
const userRole = computed(() => {
  const user = authStore.user.value;
  if (!user) return null;

  return user.rol || user.user_metadata?.rol || user.app_metadata?.rol;
});

// Computed properties for hierarchical navigation
const availableGrades = computed(() => {
  const grades = new Set();
  modules.value.forEach(module => {
    if (module.curso) {
      grades.add(module.curso);
    }
  });
  return Array.from(grades).sort();
});

// Navigation methods
const selectGrade = (grade) => {
  selectedGrade.value = grade;
  selectedClass.value = null;
};

const selectClass = (classItem) => {
  selectedClass.value = classItem;
};

const goBack = () => {
  if (selectedClass.value) {
    selectedClass.value = null;
  } else if (selectedGrade.value) {
    selectedGrade.value = null;
  }
};

// Helper methods for data organization
const getClassesForGrade = (grade) => {
  const classes = new Set();
  modules.value.forEach(module => {
    if (module.curso === grade && module.clase) {
      classes.add(module.clase);
    }
  });
  return Array.from(classes).sort();
};

const getModulesForGradeAndClass = (grade, classItem) => {
  return modules.value.filter(module =>
    module.curso === grade && module.clase === classItem
  );
};

const getGradeModulesCount = (grade) => {
  return modules.value.filter(module => module.curso === grade).length;
};

const getClassModulesCount = (grade, classItem) => {
  return modules.value.filter(module =>
    module.curso === grade && module.clase === classItem
  ).length;
};

// Color class helpers
const getGradeColorClass = (grade) => {
  const colors = ['orange-card', 'green-card', 'purple-card', 'blue-card'];
  const hash = grade.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getClassColorClass = (classItem) => {
  const colors = ['green-card', 'purple-card', 'orange-card', 'blue-card'];
  const hash = classItem.charCodeAt(0);
  return colors[hash % colors.length];
};

// Methods
const openAddModuleModal = () => {
  isAddModuleModalOpen.value = true;
};

const openAssignProfessorModal = (moduleId) => {
  selectedModuleId.value = moduleId;
  isAssignProfessorModalOpen.value = true;
};

const fetchModules = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    if (!centerId.value) {
      console.error('No center ID available');
      errorMessage.value = 'No educational center ID found. Please contact support.';
      return;
    }

    console.log('Fetching modules for center ID:', centerId.value);
    console.log('User role:', userRole.value);

    try {
      // Fetch modules from the API based on user role
      let data = [];

      // The backend endpoint now handles the filtering based on user role
      // Admin users will see all modules, professors will only see their assigned modules
      data = await ModuleService.getModulesByCenter(centerId.value);
      console.log('Raw modules data from API:', data);

      if (data && data.length > 0) {
        // Fetch professors for each module
        const modulesWithProfessors = await Promise.all(data.map(async (module) => {
          console.log('Processing module:', module);

          // Fetch professors assigned to this module
          let professors = [];
          try {
            professors = await ModuleService.getProfessorsByModule(module.id);
            console.log(`Fetched ${professors.length} professors for module ${module.id}:`, professors);
          } catch (error) {
            console.error(`Error fetching professors for module ${module.id}:`, error);
            professors = []; // Use empty array if there's an error
          }

          return {
            ...module,
            professors: professors
          };
        }));

        console.log('Modules with professors:', modulesWithProfessors);
        modules.value = modulesWithProfessors;
      } else {
        console.log('No modules found for this user');
        modules.value = [];
      }
    } catch (apiError) {
      console.error('API error when fetching modules:', apiError);
      errorMessage.value = 'Error loading modules. Please try again later.';
      modules.value = [];
    }

    // Fetch existing classes
    await fetchExistingClasses();

    console.log('Final modules state:', modules.value);

    // Log the computed properties
    console.log('Available grades:', availableGrades.value);
  } catch (error) {
    console.error('Error fetching modules:', error);
    errorMessage.value = 'Failed to load modules. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

const fetchExistingClasses = async () => {
  try {
    fetchingClasses.value = true;

    // Get classes from the API using ClassService
    const classes = await ClassService.getClassesFromAPI(centerId.value);

    existingClasses.value = classes;
    console.log('Existing classes:', existingClasses.value);
  } catch (error) {
    console.error('Error fetching existing classes:', error);
  } finally {
    fetchingClasses.value = false;
  }
};

const handleModuleCreated = async (data) => {
  console.log('Module created:', data);

  // If a new class was created with the module, add it to our local list
  if (data.grade && data.class) {
    const isExistingClass = existingClasses.value.some(c =>
      c.grade === data.grade && c.class === data.class
    );

    if (!isExistingClass) {
      existingClasses.value.push({ grade: data.grade, class: data.class });
      console.log(`Added new class ${data.grade} ${data.class} to local list`);
    }
  }

  // Refresh the modules list and classes
  await fetchModules();
  await fetchExistingClasses();
};

const handleProfessorAssigned = (data) => {
  console.log('Professor assigned:', data);
  // Refresh the modules list
  fetchModules();
};

const viewModuleDetail = (moduleId) => {
  // Navigate to module detail page
  router.push(`/module/${moduleId}`);
};

const editModule = (module) => {
  // This would open a modal to edit the module
  console.log('Edit module:', module);
  // Implementation pending
};

const confirmDeleteModule = async (id) => {
  if (confirm('Are you sure you want to delete this module?')) {
    try {
      isLoading.value = true;
      await ModuleService.deleteModule(id);
      await fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      errorMessage.value = 'Failed to delete module. Please try again.';
    } finally {
      isLoading.value = false;
    }
  }
};

const removeProfessor = async (moduleId, professorId) => {
  if (confirm('Are you sure you want to remove this professor from the module?')) {
    try {
      console.log('Removing professor:', professorId, 'from module:', moduleId);

      // Call the API to remove the professor from the module
      await ModuleService.removeProfessorFromModule(professorId, moduleId);

      console.log('Professor removed successfully');

      // Refresh the modules list
      await fetchModules();
    } catch (error) {
      console.error('Error removing professor:', error);
      alert('Failed to remove professor. Please try again.');
    }
  }
};

const getInitials = (name) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

// Function to get color class for module cards
const getModuleColorClass = (index) => {
  const colorClasses = ['orange-card', 'green-card', 'purple-card'];
  return colorClasses[index % colorClasses.length];
};

// Initialize GSAP animations with robust fallback
const initAnimations = () => {
  console.log('Starting animation initialization...');

  // Use a more reliable timing approach
  setTimeout(() => {
    const pageTitle = document.querySelector('.welcome-section .page-title');
    const subtitle = document.querySelector('.welcome-section .subtitle');
    const cards = document.querySelectorAll('.year-card, .class-card, .module-card');

    console.log('Animation elements found:', {
      pageTitle: !!pageTitle,
      subtitle: !!subtitle,
      cardsCount: cards.length
    });

    // Ensure elements are visible as fallback
    const allElements = [pageTitle, subtitle, ...cards].filter(Boolean);

    if (allElements.length === 0) {
      console.warn('No animation elements found, retrying...');
      // Retry after a short delay if no elements found
      setTimeout(initAnimations, 100);
      return;
    }

    // Set initial GSAP states without clearing existing transforms
    if (pageTitle) {
      gsap.set(pageTitle, { y: 30, opacity: 0 });
    }
    if (subtitle) {
      gsap.set(subtitle, { y: 20, opacity: 0 });
    }
    if (cards.length > 0) {
      gsap.set(cards, { y: 40, opacity: 0, scale: 0.95 });
    }

    // Create animation timeline with fallback
    const tl = gsap.timeline({
      delay: 0.1,
      onComplete: () => {
        console.log('Animations completed successfully');
        // Ensure all elements are visible after animation but preserve transforms for hover
        allElements.forEach(el => {
          if (el) {
            gsap.set(el, { opacity: 1 });
          }
        });
      }
    });

    if (pageTitle) {
      tl.to(pageTitle, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      });
    }

    if (subtitle) {
      tl.to(subtitle, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out'
      }, pageTitle ? '-=0.4' : 0);
    }

    // Animate cards with stagger if they exist
    if (cards.length > 0) {
      tl.to(cards, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.2)'
      }, pageTitle || subtitle ? '-=0.3' : 0);

      // Add GSAP hover animations for cards to override CSS and prevent positioning issues
      cards.forEach(card => {
        // Remove any existing event listeners to prevent duplicates
        card.removeEventListener('mouseenter', card._hoverIn);
        card.removeEventListener('mouseleave', card._hoverOut);

        // Create hover functions
        card._hoverIn = () => {
          gsap.killTweensOf(card); // Kill any existing animations
          gsap.to(card, {
            y: -8,
            scale: 1.03,
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

    // Fallback: ensure elements are visible after 2 seconds regardless
    setTimeout(() => {
      allElements.forEach(el => {
        if (el && gsap.getProperty(el, 'opacity') < 1) {
          console.log('Applying fallback visibility for element:', el);
          gsap.set(el, { opacity: 1, y: 0, scale: 1 });
        }
      });
    }, 2000);

  }, 100);
};

// Watch for navigation changes to re-trigger animations
watch([selectedGrade, selectedClass], () => {
  nextTick(() => {
    initAnimations();
  });
});

// Watch for modules data changes to re-trigger animations
watch(modules, () => {
  nextTick(() => {
    initAnimations();
  });
}, { deep: true });

onMounted(() => {
  // Add class to body for global styles
  document.body.classList.add('minimalist-theme');

  // Fetch modules
  fetchModules().then(() => {
    // Initialize GSAP animations after loading modules
    nextTick(() => {
      initAnimations();
    });
  });
});

// No es necesario limpiar animaciones ya que las hemos simplificado
onBeforeUnmount(() => {
  console.log('Componente desmontado');
});
</script>

<style lang="scss" scoped>
@import './ModulesPage.scss';
</style>
