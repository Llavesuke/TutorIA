import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '@/views/LandingPage.vue';
import GetStartedPage from '@/views/GetStartedPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: LandingPage,
    meta: {
      title: 'TutorIA - Revoluciona el Aprendizaje con IA',
      requiresAuth: false,
      redirectIfAuth: true
    }
  },
  {
    path: '/get-started',
    name: 'get-started',
    component: GetStartedPage,
    meta: {
      title: 'TutorIA - Get Started',
      requiresAuth: false,
      redirectIfAuth: true
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginPage.vue'),
    meta: {
      title: 'TutorIA - Login',
      requiresAuth: false,
      redirectIfAuth: true
    }
  },
  {
    path: '/create-centre',
    name: 'create-centre',
    component: () => import('@/views/CreateCentrePage.vue'),
    meta: {
      title: 'TutorIA - Create Educational Center',
      requiresAuth: false,
      redirectIfAuth: true
    }
  },
  {
    path: '/email-verification',
    name: 'email-verification',
    component: () => import('@/views/EmailVerificationPage.vue'),
    meta: {
      title: 'TutorIA - Verify Your Email',
      requiresAuth: false,
      redirectIfAuth: false
    }
  },
  {
    path: '/verify-email/:token',
    name: 'verify-email-token',
    component: () => import('@/views/EmailVerificationTokenPage.vue'),
    meta: {
      title: 'TutorIA - Email Verification',
      requiresAuth: false,
      redirectIfAuth: false
    }
  },
  {
    path: '/verify-email-direct',
    name: 'verify-email-direct',
    component: () => import('@/views/EmailVerificationDirectPage.vue'),
    meta: {
      title: 'TutorIA - Email Verification',
      requiresAuth: false,
      redirectIfAuth: false
    }
  },
  {
    path: '/register-professor/:token',
    name: 'register-professor',
    component: () => import('@/views/RegisterProfessorPage.vue'),
    meta: {
      title: 'TutorIA - Professor Registration',
      requiresAuth: false,
      redirectIfAuth: false
    }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPasswordPage.vue'),
    meta: {
      title: 'TutorIA - Reset Password',
      requiresAuth: false,
      redirectIfAuth: false
    }
  },
  // Teacher Dashboard Routes
  {
    path: '/teacher/dashboard',
    name: 'teacher-dashboard',
    component: () => import('@/views/TeacherDashboard.vue'),
    meta: {
      title: 'TutorIA - Teacher Dashboard',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  // Manage Users Routes
  {
    path: '/manage-users',
    name: 'manage-users',
    component: () => import('@/views/ManageUsersPage.vue'),
    meta: {
      title: 'TutorIA - Manage Users',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/manage-professors',
    name: 'manage-professors',
    component: () => import('@/views/ManageProfessorsPage.vue'),
    meta: {
      title: 'TutorIA - Manage Professors',
      requiresAuth: true,
      roles: ['admin']
    }
  },
  {
    path: '/manage-students',
    name: 'manage-students',
    component: () => import('@/views/ManageStudentsPage.vue'),
    meta: {
      title: 'TutorIA - Manage Students',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  // Teacher Module Routes
  {
    path: '/teacher/modules',
    name: 'teacher-modules',
    component: () => import('@/views/ModulesPage.vue'),
    meta: {
      title: 'TutorIA - Modules Management',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  {
    path: '/module/:id',
    name: 'module-detail',
    component: () => import('@/views/ModuleDetailPage.vue'),
    meta: {
      title: 'TutorIA - Module Detail',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  {
    path: '/unit/:id',
    name: 'unit-detail',
    component: () => import('@/views/UnitDetailPage.vue'),
    meta: {
      title: 'TutorIA - Unit Detail',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  {
    path: '/tutor/:id',
    name: 'tutor-detail',
    component: () => import('@/views/TutorDetailPage.vue'),
    meta: {
      title: 'TutorIA - Tutor Detail',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  {
    path: '/assignment/:id',
    name: 'assignment-detail',
    component: () => import('@/views/AssignmentDetailPage.vue'),
    meta: {
      title: 'TutorIA - Assignment Detail',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  // Unauthorized access route
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/UnauthorizedPage.vue'),
    meta: {
      title: 'TutorIA - Unauthorized Access',
      requiresAuth: false
    }
  },
  // Student Routes
  {
    path: '/student/dashboard',
    name: 'student-dashboard',
    component: () => import('@/views/StudentDashboard.vue'),
    meta: {
      title: 'TutorIA - Student Dashboard',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/student/home',
    name: 'student-home',
    component: () => import('@/views/StudentHomePage.vue'),
    meta: {
      title: 'TutorIA - Student Home',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/student/module/:id',
    name: 'student-module-detail',
    component: () => import('@/views/StudentModuleDetailPage.vue'),
    meta: {
      title: 'TutorIA - Module Detail',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/student/unit/:id',
    name: 'student-unit-detail',
    component: () => import('@/views/StudentUnitDetailPage.vue'),
    meta: {
      title: 'TutorIA - Unit Detail',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/student/chat/:id',
    name: 'student-chat',
    component: () => import('@/views/StudentChatView.vue'),
    meta: {
      title: 'TutorIA - Chat with Tutor',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/student/assignment/:id',
    name: 'student-assignment-detail',
    component: () => import('@/views/StudentAssignmentDetailPage.vue'),
    meta: {
      title: 'TutorIA - Assignment Detail',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  // Settings routes
  {
    path: '/student/settings',
    name: 'student-settings',
    component: () => import('@/views/UserSettingsPage.vue'),
    meta: {
      title: 'TutorIA - User Settings',
      requiresAuth: true,
      roles: ['estudiante']
    }
  },
  {
    path: '/teacher/settings',
    name: 'teacher-settings',
    component: () => import('@/views/UserSettingsPage.vue'),
    meta: {
      title: 'TutorIA - User Settings',
      requiresAuth: true,
      roles: ['admin', 'profesor']
    }
  },
  // Add more routes as needed
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    }

    return { top: 0 };
  }
});

// Import auth store
import authStore from '@/stores/authStore';

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  // Update page title
  document.title = to.meta.title || 'TutorIA';

  // Wait for auth store to initialize if it's loading
  if (authStore.loading.value) {
    await new Promise(resolve => {
      const checkLoading = () => {
        if (!authStore.loading.value) {
          resolve();
        } else {
          setTimeout(checkLoading, 50);
        }
      };
      checkLoading();
    });
  }

  const isAuthenticated = authStore.isAuthenticated.value;

  // Check if token is expired
  if (isAuthenticated && authStore.tokenExpiry.value) {
    const now = Date.now();
    if (now >= authStore.tokenExpiry.value) {
      console.log('Token expired, attempting to refresh');

      // Try to refresh the token
      const refreshSuccess = await authStore.refreshAuthToken();

      if (!refreshSuccess) {
        console.log('Token refresh failed, redirecting to login');
        // Clear auth state and redirect to login
        await authStore.logout();
        next('/login');
        return;
      }
    }
  }

  // Get user role for role-based access control
  const userRole = authStore.userRole.value;

  // Route requires authentication
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Authentication required, redirecting to login');
    next('/login');
    return;
  }

  // Route requires specific role
  if (to.meta.roles && isAuthenticated) {
    if (!to.meta.roles.includes(userRole)) {
      console.log(`Role ${userRole} not authorized for this route, requires one of:`, to.meta.roles);
      next('/unauthorized');
      return;
    }
  }

  // Route should redirect if already authenticated
  if (to.meta.redirectIfAuth && isAuthenticated) {
    console.log('Already authenticated, redirecting to dashboard');
    // Redirect based on user role
    if (userRole === 'estudiante') {
      next('/student/home');
    } else {
      next('/teacher/dashboard');
    }
    return;
  }

  next();
});

export default router;
