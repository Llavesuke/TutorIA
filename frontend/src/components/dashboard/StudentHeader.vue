<template>
  <header class="student-header" role="banner">
    <div class="container">
      <!-- Logo -->
      <div class="logo">
        <router-link to="/student/dashboard">
          <img src="@/assets/images/text_logo.png" alt="TutorIA Logo" class="logo-image" />
        </router-link>
      </div>

      <!-- Navigation links -->
      <nav class="nav-links">
        <router-link to="/student/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/student/home" class="nav-link">Home</router-link>
        <router-link to="/student/modules" class="nav-link">My Modules</router-link>
        <router-link to="/student/assignments" class="nav-link">Assignments</router-link>
      </nav>

      <!-- User menu -->
      <div class="user-menu">
        <div class="user-info" @click="toggleUserMenu">
          <div class="user-avatar">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName">
            <div v-else class="default-avatar">
              <span>{{ userInitials }}</span>
            </div>
          </div>
          <span class="user-name">{{ userName }}</span>
          <i class="fas fa-chevron-down"></i>
        </div>

        <!-- Dropdown menu -->
        <div v-if="isUserMenuOpen" class="dropdown-menu">
          <router-link to="/student/profile" class="menu-item">
            <i class="fas fa-user"></i> Profile
          </router-link>
          <router-link to="/student/settings" class="menu-item">
            <i class="fas fa-cog"></i> Settings
          </router-link>
          <div class="menu-divider"></div>
          <button @click="logout" class="menu-item logout-item">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <!-- Mobile menu button -->
      <button class="mobile-menu-btn" @click="toggleMobileMenu" aria-label="Toggle mobile menu">
        <i class="fas fa-bars"></i>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="isMobileMenuOpen" class="mobile-menu">
      <div class="mobile-menu-header">
        <img src="@/assets/images/text_logo.png" alt="TutorIA Logo" class="logo-image" />
        <button class="close-menu-btn" @click="toggleMobileMenu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="mobile-menu-content">
        <router-link to="/student/dashboard" class="mobile-link" @click="closeMobileMenu">Dashboard</router-link>
        <router-link to="/student/home" class="mobile-link" @click="closeMobileMenu">Home</router-link>
        <router-link to="/student/modules" class="mobile-link" @click="closeMobileMenu">My Modules</router-link>
        <router-link to="/student/assignments" class="mobile-link" @click="closeMobileMenu">Assignments</router-link>
        <div class="mobile-menu-divider"></div>
        <router-link to="/student/profile" class="mobile-link" @click="closeMobileMenu">Profile</router-link>
        <router-link to="/student/settings" class="mobile-link" @click="closeMobileMenu">Settings</router-link>
        <button @click="logout" class="mobile-link logout-link">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import authStore from '@/stores/authStore';

// Router
const router = useRouter();

// State
const isUserMenuOpen = ref(false);
const isMobileMenuOpen = ref(false);

// Computed properties
const userName = computed(() => {
  const user = authStore.user.value;
  return user?.nombre_real || user?.user_metadata?.nombre_real || user?.nombre_usuario || 'Student';
});

const userAvatar = computed(() => {
  const user = authStore.user.value;
  return user?.foto_perfil || null;
});

const userInitials = computed(() => {
  if (!userName.value) return '?';
  return userName.value
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

// Methods
const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const logout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

// Close menus when clicking outside
const handleClickOutside = (event) => {
  const userMenu = document.querySelector('.user-menu');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (userMenu && !userMenu.contains(event.target)) {
    isUserMenuOpen.value = false;
  }

  if (mobileMenu && !mobileMenu.contains(event.target) &&
      !event.target.classList.contains('mobile-menu-btn')) {
    isMobileMenuOpen.value = false;
  }
};

// Add event listener when component is mounted
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// Remove event listener when component is unmounted
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.student-header {
  background-color: #171717;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo {
      .logo-image {
        height: 40px;
      }
    }

    .nav-links {
      display: flex;
      gap: 1.5rem;

      @media (max-width: 768px) {
        display: none;
      }

      .nav-link {
        color: #FEF0D1;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s;

        &:hover, &.router-link-active {
          color: #e6531d;
        }
      }
    }

    .user-menu {
      position: relative;

      @media (max-width: 768px) {
        display: none;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;

        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .default-avatar {
            width: 100%;
            height: 100%;
            background-color: #e6531d;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
          }
        }

        .user-name {
          color: #FEF0D1;
          font-weight: 500;
        }

        i {
          color: #FEF0D1;
          font-size: 0.8rem;
        }
      }

      .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: #1a1a1a;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        min-width: 200px;
        margin-top: 0.5rem;
        overflow: hidden;

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          color: #FEF0D1;
          text-decoration: none;
          transition: background-color 0.2s;

          &:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }

          i {
            width: 20px;
            text-align: center;
          }

          &.logout-item {
            color: #e6531d;
            width: 100%;
            text-align: left;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
          }
        }

        .menu-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }
      }
    }

    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: #FEF0D1;
      font-size: 1.2rem;
      cursor: pointer;

      @media (max-width: 768px) {
        display: block;
      }
    }
  }

  .mobile-menu {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #171717;
    z-index: 200;
    display: flex;
    flex-direction: column;

    .mobile-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .logo-image {
        height: 40px;
      }

      .close-menu-btn {
        background: none;
        border: none;
        color: #FEF0D1;
        font-size: 1.2rem;
        cursor: pointer;
      }
    }

    .mobile-menu-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;

      .mobile-link {
        padding: 1rem;
        color: #FEF0D1;
        text-decoration: none;
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);

        &.logout-link {
          color: #e6531d;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        }
      }

      .mobile-menu-divider {
        height: 1px;
        background-color: rgba(255, 255, 255, 0.1);
        margin: 1rem 0;
      }
    }
  }
}
</style>
