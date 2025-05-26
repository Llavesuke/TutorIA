<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isMenuOpen = ref(false);

// Función para alternar el menú móvil
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

// Función para cerrar sesión (simulada)
const logout = () => {
  // Aquí iría la lógica de cierre de sesión
  router.push('/');
};
</script>

<template>
  <nav class="teacher-navbar">
    <div class="container">
      <!-- Logo y nombre -->
      <div class="navbar-brand">
        <div class="logo">
          <img src="@/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" class="logo-image" />
        </div>
        <div class="nav-links">
          <router-link to="/teacher/dashboard" class="nav-link active">Dashboard</router-link>
          <router-link to="/teacher/students" class="nav-link">Students</router-link>
          <router-link to="/teacher/tutors" class="nav-link">Tutors</router-link>
          <router-link to="/teacher/modules" class="nav-link">Modules</router-link>
          <router-link to="/teacher/settings" class="nav-link">Settings</router-link>
        </div>
      </div>

      <!-- Botón de crear -->
      <div class="navbar-actions">
        <button class="create-btn">
          <span>+ Create</span>
        </button>
      </div>

      <!-- Menú móvil -->
      <button class="mobile-menu-toggle" @click="toggleMenu" :class="{ 'active': isMenuOpen }">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <!-- Menú móvil desplegable -->
      <div class="mobile-menu" :class="{ 'active': isMenuOpen }">
        <div class="mobile-menu-header">
          <div class="logo">TutorIA</div>
          <button class="close-menu" @click="toggleMenu">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="mobile-menu-links">
          <router-link to="/teacher/dashboard" class="mobile-link" @click="toggleMenu">Dashboard</router-link>
          <router-link to="/teacher/students" class="mobile-link" @click="toggleMenu">Students</router-link>
          <router-link to="/teacher/tutors" class="mobile-link" @click="toggleMenu">Tutors</router-link>
          <router-link to="/teacher/modules" class="mobile-link" @click="toggleMenu">Modules</router-link>
          <router-link to="/teacher/settings" class="mobile-link" @click="toggleMenu">Settings</router-link>
        </div>
        <div class="mobile-menu-footer">
          <button class="logout-btn" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.teacher-navbar {
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  font-family: 'Poppins', sans-serif;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .navbar-brand {
    display: flex;
    align-items: center;

    .logo {
      display: flex;
      align-items: center;
      margin-right: 2rem;

      .logo-image {
        height: 40px;
        width: auto;
      }
    }

    .nav-links {
      display: none;

      @media (min-width: 768px) {
        display: flex;
        align-items: center;
      }

      .nav-link {
        color: #FEF0D1;
        text-decoration: none;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: color 0.3s ease;

        &:hover {
          color: #e6531d;
        }

        &.active {
          color: #e6531d;
          font-weight: 600;
        }
      }
    }
  }

  .navbar-actions {
    .create-btn {
      background-color: #007142;
      color: #FEF0D1;
      border: none;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: #004d2d; /* Manually darkened by 10% instead of using darken() */
      }
    }
  }

  .mobile-menu-toggle {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 30px;
    height: 20px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;

    @media (min-width: 768px) {
      display: none;
    }

    .bar {
      width: 100%;
      height: 2px;
      background-color: #FEF0D1;
      transition: all 0.3s ease;
    }

    &.active {
      .bar:nth-child(1) {
        transform: translateY(9px) rotate(45deg);
      }

      .bar:nth-child(2) {
        opacity: 0;
      }

      .bar:nth-child(3) {
        transform: translateY(-9px) rotate(-45deg);
      }
    }
  }

  .mobile-menu {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #000;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.active {
      transform: translateX(0);
    }

    .mobile-menu-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .logo {
        font-size: 1.5rem;
        font-weight: 700;
        color: #FEF0D1;
      }

      .close-menu {
        background: transparent;
        border: none;
        color: #FEF0D1;
        font-size: 1.5rem;
        cursor: pointer;
      }
    }

    .mobile-menu-links {
      flex: 1;
      padding: 1rem;
      display: flex;
      flex-direction: column;

      .mobile-link {
        color: #FEF0D1;
        text-decoration: none;
        padding: 1rem;
        font-size: 1.2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);

        &:last-child {
          border-bottom: none;
        }
      }
    }

    .mobile-menu-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);

      .logout-btn {
        width: 100%;
        background-color: transparent;
        border: 1px solid #e6531d;
        color: #e6531d;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: #e6531d;
          color: #FEF0D1;
        }
      }
    }
  }
}
</style>
