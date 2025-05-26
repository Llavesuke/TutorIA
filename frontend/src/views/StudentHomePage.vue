<template>
  <div class="student-home">
    <!-- Background with shapes -->
    <MinimalistDashboardBackground />

    <!-- Main content -->
    <main class="home-main">
      <div class="container">
        <!-- Settings button -->
        <SettingsButton />

        <!-- Welcome section -->
        <div class="welcome-section">
          <h1>Welcome, <span class="student-name">{{ studentName }}</span>!</h1>
          <p class="subtitle">Here's what's happening in your learning universe today</p>
        </div>

        <!-- Loading state -->
        <div v-if="isLoading" class="loading-container">
          <div class="bubble-loader">
            <div class="bubble bubble-1"></div>
            <div class="bubble bubble-2"></div>
            <div class="bubble bubble-3"></div>
          </div>
          <p class="loading-text">Loading your modules...</p>
        </div>

        <!-- Error state -->
        <div v-else-if="errorMessage" class="error-message">
          <p>{{ errorMessage }}</p>
          <button @click="fetchModules" class="retry-button">
            <span>Try Again</span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-else-if="modules.length === 0" class="empty-state">
          <p>You don't have any modules assigned to your class yet.</p>
        </div>

        <!-- Modules grid -->
        <div v-else class="modules-grid">
          <div
            v-for="(module, index) in modules"
            :key="module.id"
            class="module-card"
            :class="getModuleColorClass(module)"
            :style="{ '--i': index }"
            @click="navigateToModule(module.id)"
          >
            <div class="module-icon">
              <i :class="getModuleIcon(module)"></i>
            </div>
            <h3 class="module-name">{{ module.nombre }}</h3>
            <p class="units-count">{{ module.unitCount || 0 }} units</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import SettingsButton from '@/components/student/SettingsButton.vue';
import authStore from '@/stores/authStore';
import ModuleService from '@/services/moduleService';
import UnitService from '@/services/unitService';

// Router
const router = useRouter();

// State
const modules = ref([]);
const isLoading = ref(true);
const errorMessage = ref('');
const studentInfo = ref({
  grade: '',
  class: ''
});

// Computed
const studentName = computed(() => {
  const user = authStore.user.value;
  return user?.nombre_real || user?.user_metadata?.nombre_real || user?.nombre_usuario || 'Student';
});

// Methods
const fetchModules = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Get user ID and center ID from auth store
    const user = authStore.user.value;
    if (!user) {
      errorMessage.value = 'User not authenticated';
      return;
    }

    const userId = user.id;
    const centerId = user.centro_id ||
                    user.user_metadata?.centro_id ||
                    user.app_metadata?.centro_id;

    if (!userId || !centerId) {
      errorMessage.value = 'User information incomplete';
      return;
    }

    // Import supabase client
    const supabase = (await import('@/utils/supabaseClient')).default;

    // Get student's grade and class
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('curso, clase')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      errorMessage.value = 'Failed to load user data';
      return;
    }

    // Store student info
    studentInfo.value = {
      grade: userData.curso,
      class: userData.clase
    };

    // Get modules for the student's grade and class
    let moduleData;
    if (userData.curso && userData.clase) {
      moduleData = await ModuleService.getModulesByGradeAndClass(
        centerId,
        userData.curso,
        userData.clase
      );
    } else {
      // Fallback if grade or class is missing
      moduleData = [];
    }

    // Get unit counts for each module
    const modulesWithUnitCount = await Promise.all(
      moduleData.map(async (module) => {
        const units = await UnitService.getUnitsByModule(module.id);
        return {
          ...module,
          unitCount: units.length
        };
      })
    );

    modules.value = modulesWithUnitCount;
  } catch (error) {
    console.error('Error fetching modules:', error);
    errorMessage.value = 'Failed to load modules. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const getModuleColorClass = (module) => {
  // Assign a color based on module name or some other property
  const colors = ['green-module', 'purple-module', 'orange-module', 'blue-module'];
  const hash = module.nombre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getModuleIcon = (module) => {
  // Map module names to appropriate Font Awesome icons
  const moduleName = module.nombre.toLowerCase();

  if (moduleName.includes('math') || moduleName.includes('matemática')) {
    return 'fas fa-calculator';
  } else if (moduleName.includes('science') || moduleName.includes('ciencia')) {
    return 'fas fa-flask';
  } else if (moduleName.includes('history') || moduleName.includes('historia')) {
    return 'fas fa-book';
  } else if (moduleName.includes('language') || moduleName.includes('lengua')) {
    return 'fas fa-language';
  } else if (moduleName.includes('music') || moduleName.includes('música')) {
    return 'fas fa-music';
  } else if (moduleName.includes('art') || moduleName.includes('arte')) {
    return 'fas fa-palette';
  } else if (moduleName.includes('tech') || moduleName.includes('tecnología')) {
    return 'fas fa-laptop-code';
  } else if (moduleName.includes('physical') || moduleName.includes('física')) {
    return 'fas fa-running';
  } else {
    return 'fas fa-book';
  }
};

const navigateToModule = (moduleId) => {
  router.push(`/student/module/${moduleId}`);
};

// Update email verification status in user data
const updateEmailVerificationStatus = () => {
  const currentUser = authStore.user.value;
  if (currentUser && !currentUser.email_verificado) {
    authStore.setUser({
      ...currentUser,
      email_verificado: true
    });
    console.log('Email verification status updated in user store');
  }
};

// Show verification success message
const showVerificationSuccess = () => {
  // Create success message element
  const successMessage = document.createElement('div');
  successMessage.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #007142;
      color: #FEF0D1;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    ">
      <i class="fas fa-check-circle"></i>
      Email verified successfully!
    </div>
  `;

  document.body.appendChild(successMessage);

  // Remove the message after a delay
  setTimeout(() => {
    if (document.body.contains(successMessage)) {
      document.body.removeChild(successMessage);
    }
  }, 5000);
};

// Lifecycle hooks
onMounted(async () => {
  // Check if user was redirected after email verification
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('verified') === 'true') {
    // Update email verification status without breaking other user data
    updateEmailVerificationStatus();

    // Remove the query parameter from URL
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);

    // Show success message
    showVerificationSuccess();
  }

  await fetchModules();
});
</script>

<style lang="scss" scoped>
.student-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #171717;

  .home-main {
    flex: 1;
    padding: 2rem 1rem;
    z-index: 1;

    .container {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }
  }



  .welcome-section {
    margin-bottom: 4rem;
    text-align: center;
    padding-top: 3rem;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -1.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 150px;
      height: 4px;
      background: linear-gradient(90deg, var(--color-orange), var(--color-purple));
      border-radius: 2px;
    }

    h1 {
      font-family: 'Poppins', sans-serif;
      color: #FEF0D1;
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 1.2rem;
      text-shadow: 0 4px 20px rgba(230, 83, 29, 0.4);
      letter-spacing: -0.02em;
      line-height: 1.1;
      animation: fadeInDown 0.8s ease-out;

      .student-name {
        color: #e6531d;
        font-weight: 900;
        position: relative;
        display: inline-block;

        &::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: #e6531d;
          border-radius: 2px;
          animation: underlineGlow 2s ease-in-out infinite alternate;
        }
      }
    }

    .subtitle {
      font-family: 'Poppins', sans-serif;
      color: rgba(254, 240, 209, 0.85);
      font-size: 1.5rem;
      font-weight: 400;
      max-width: 700px;
      margin: 0 auto;
      line-height: 1.6;
      letter-spacing: 0.3px;
      animation: fadeInUp 0.8s ease-out 0.2s both;
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }



  @keyframes underlineGlow {
    0% {
      box-shadow: 0 0 5px rgba(230, 83, 29, 0.5);
      transform: scaleX(1);
    }
    100% {
      box-shadow: 0 0 15px rgba(230, 83, 29, 0.8);
      transform: scaleX(1.05);
    }
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
    perspective: 1000px;
  }

  .module-card {
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 16px;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
    min-height: 320px;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
    transform-style: preserve-3d;
    animation: fadeIn 0.8s ease-out forwards;
    animation-delay: calc(var(--i, 0) * 0.1s);
    opacity: 0;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      z-index: 1;
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    &:hover {
      transform: translateY(-15px) rotateX(5deg);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);

      &::before {
        opacity: 1;
      }

      .module-icon {
        transform: translateY(-10px) scale(1.1);
        filter: drop-shadow(0 10px 15px rgba(0, 0, 0, 0.4));
      }

      .module-name {
        transform: translateZ(10px);
      }

      .units-count {
        opacity: 1;
        transform: translateY(0);
      }
    }

    &.green-module {
      background: linear-gradient(135deg, #007142 0%, #005a35 100%);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    &.purple-module {
      background: linear-gradient(135deg, #34307b 0%, #282461 100%);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    &.orange-module {
      background: linear-gradient(135deg, #e6531d 0%, #c94718 100%);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    &.blue-module {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .module-icon {
      font-size: 4rem;
      margin-bottom: 2rem;
      color: #FEF0D1;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
      position: relative;
      z-index: 2;
      background: rgba(255, 255, 255, 0.1);
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      margin-top: 1rem;
    }

    .module-name {
      font-size: 1.8rem;
      font-weight: 800;
      color: #FEF0D1;
      margin-bottom: 1rem;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 2;
      letter-spacing: -0.5px;
    }

    .units-count {
      font-size: 1.1rem;
      font-weight: 500;
      color: rgba(254, 240, 209, 0.9);
      background: rgba(0, 0, 0, 0.2);
      padding: 0.5rem 1.2rem;
      border-radius: 20px;
      transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
      position: relative;
      z-index: 2;
      opacity: 0.8;
      transform: translateY(5px);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .loading-container, .error-message, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    color: var(--color-cashmere);
    text-align: center;
    background: rgba(0, 0, 0, 0.4); /* Aumentada opacidad para compensar la eliminación del blur */
    border-radius: 16px;
    padding: 3rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    /* backdrop-filter: blur(10px); */ /* ELIMINADO: Efecto blur que causaba lag */
    border: 1px solid rgba(255, 255, 255, 0.05);
    max-width: 600px;
    margin: 0 auto;
    animation: fadeIn 0.8s ease-out forwards;

    p {
      font-size: 1.4rem;
      font-weight: 500;
      margin: 1.5rem 0;
      line-height: 1.5;
    }
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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

  .empty-state {
    background: linear-gradient(135deg, rgba(52, 48, 123, 0.3) 0%, rgba(0, 113, 66, 0.3) 100%);

    p {
      font-size: 1.5rem;
      color: #FEF0D1;
      max-width: 400px;
      margin: 0 auto 1.5rem;
    }
  }
}

@media (max-width: 768px) {
  .student-home {
    .modules-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
  }
}

@media (max-width: 480px) {
  .student-home {
    .welcome-section {
      h1 {
        font-size: 2rem;
      }
    }

    .modules-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
