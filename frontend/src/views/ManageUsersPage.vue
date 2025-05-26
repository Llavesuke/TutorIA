<template>
  <div class="manage-users-page">
    <!-- Background component -->
    <MinimalistDashboardBackground />

    <!-- Overlay para mejorar la legibilidad -->
    <div class="overlay"></div>

    <!-- Header de profesor -->
    <ProfessorHeader />

    <!-- Contenido principal -->
    <main class="manage-main">
      <div class="container">
        <!-- Encabezado de bienvenida -->
        <div class="welcome-section">
          <h1>User Management</h1>
          <p class="subtitle">Manage professors and students in your educational center</p>
        </div>

        <!-- Tarjetas de gestión -->
        <div class="management-cards">
          <!-- Tarjeta de profesores -->
          <router-link to="/manage-professors" class="management-card">
            <div class="card-icon">
              <i class="fas fa-chalkboard-teacher"></i>
            </div>
            <div class="card-content">
              <h3>Professors</h3>
              <p>Manage professor accounts, permissions and access</p>
            </div>
          </router-link>

          <!-- Tarjeta de estudiantes -->
          <router-link to="/manage-students" class="management-card">
            <div class="card-icon">
              <i class="fas fa-user-graduate"></i>
            </div>
            <div class="card-content">
              <h3>Students</h3>
              <p>Manage student accounts, progress and assignments</p>
            </div>
          </router-link>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <ProfessorFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import MinimalistDashboardBackground from '@/components/MinimalistDashboardBackground.vue';
import ProfessorHeader from '@/components/dashboard/ProfessorHeader.vue';
import ProfessorFooter from '@/components/dashboard/ProfessorFooter.vue';

onMounted(() => {
  // Añadir clase al body para estilos globales
  document.body.classList.add('minimalist-theme');
});
</script>

<style lang="scss" scoped>
@use '@/assets/sass/pages/_manage_users.scss';
</style>
