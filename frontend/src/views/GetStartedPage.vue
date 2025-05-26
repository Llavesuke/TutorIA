<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import OriginalSvgBackground from '@/components/OriginalSvgBackground.vue';
import { gsap } from 'gsap';

const router = useRouter();

// Go back to home page
const goBack = () => {
  router.push('/');
};

// Initialize animations
onMounted(() => {
  // Animate cards entrance
  gsap.from('.option-card', {
    y: 50,
    opacity: 0,
    duration: 0.8,
    stagger: 0.2,
    ease: 'back.out(1.7)'
  });

  // Animate title
  gsap.from('.page-title', {
    y: -30,
    opacity: 0,
    duration: 0.8,
    delay: 0.2,
    ease: 'power3.out'
  });

  // Animate back button
  gsap.from('.back-button', {
    x: -20,
    opacity: 0,
    duration: 0.5,
    delay: 0.3,
    ease: 'power2.out'
  });
});
</script>

<template>
  <div class="get-started-page">
    <!-- Background component -->
    <OriginalSvgBackground />

    <!-- Dark overlay -->
    <div class="dark-overlay"></div>

    <!-- Back button -->
    <button @click="goBack" class="back-button">
      <i class="fas fa-arrow-left"></i>
    </button>

    <div class="container">
      <div class="get-started-content">
        <h1 class="page-title">Get Started with TutorIA</h1>

        <div class="options-container">
          <!-- Login Card -->
          <router-link to="/login" class="option-card">
            <div class="card-icon">
              <i class="fas fa-brain"></i>
            </div>
            <div class="card-content">
              <h2>Login</h2>
            </div>
          </router-link>

          <!-- Create Educational Center Card -->
          <router-link to="/create-centre" class="option-card">
            <div class="card-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="card-content">
              <h2>Create Educational Center</h2>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Importar fuente Poppins si no está disponible globalmente */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

/* Resetear estilos de enlaces visitados globalmente */
a:visited {
  color: inherit;
}

/* Asegurar que los enlaces de tarjetas mantienen su estilo */
.option-card:visited, .option-card:link, .option-card:active {
  position: relative;
  transform: translateY(0);
  background-color: #111111;
  opacity: 1 !important;
}

/* Forzar opacidad en todos los elementos de las tarjetas */
.option-card *, .option-card *:before, .option-card *:after {
  opacity: 1 !important;
}

.get-started-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background-color: #000;
}

.dark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1;
}

.container {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.get-started-content {
  text-align: center;
}

.page-title {
  font-size: 3.5rem;
  margin-bottom: 4.5rem;
  color: #fff;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
  letter-spacing: -0.02em;
  position: relative;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  &:after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, #e6531d, #007142);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

.options-container {
  display: flex;
  justify-content: center;
  gap: 4rem;
  flex-wrap: nowrap;
  margin: 0 auto;
  max-width: 750px;
  padding: 0 1.5rem;
}

.back-button {
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(-3px);
  }

  i {
    font-size: 1rem;
  }
}

.option-card {
  flex: 1;
  background-color: #1e1e1e !important; /* Fondo mate oscuro */
  border-radius: 20px;
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  text-decoration: none !important;
  display: block;
  text-align: center;
  max-width: 320px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
  overflow: hidden;
  transform: translateY(0) !important; /* Posición inicial fija */
  opacity: 1 !important; /* Forzar opacidad completa */

  /* Resetear estilos de enlaces visitados */
  &:visited {
    color: inherit;
    background-color: #1e1e1e !important;
    transform: translateY(0) !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25) !important;
  }

  /* Esquina decorativa */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 40px;
    height: 40px;
    background-color: #2a2a2a;
    clip-path: polygon(100% 0, 0 0, 100% 100%);
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35) !important;

    &::before {
      width: 50px;
      height: 50px;
    }

    .card-icon {
      transform: scale(1.1);
    }
  }

  /* Tarjeta naranja (login) */
  &:nth-child(1) {
    background-color: #2a1a14 !important; /* Fondo mate naranja oscuro */
    border-left: 5px solid #e6531d !important;

    &::before {
      background-color: #e6531d;
    }

    &:visited {
      background-color: #2a1a14 !important;
      border-left: 5px solid #e6531d !important;
    }
  }

  /* Tarjeta verde (create center) */
  &:nth-child(2) {
    background-color: #142a1a !important; /* Fondo mate verde oscuro */
    border-left: 5px solid #007142 !important;

    &::before {
      background-color: #007142;
    }

    &:visited {
      background-color: #142a1a !important;
      border-left: 5px solid #007142 !important;
    }
  }

  .card-icon {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    font-size: 1.8rem;
    border-radius: 12px;
    position: relative;
    z-index: 1;
    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  &:nth-child(1) .card-icon {
    background-color: #331f18 !important;
    border-bottom: 3px solid #e6531d !important;

    i {
      color: #e6531d !important; /* Naranja para el icono de login */
    }
  }

  &:nth-child(2) .card-icon {
    background-color: #18331f !important;
    border-bottom: 3px solid #007142 !important;

    i {
      color: #007142 !important; /* Verde para el icono de centro educativo */
    }
  }

  /* Asegurar que los estilos se mantienen incluso después de visitar */
  &:visited, &:link, &:active {
    opacity: 1 !important;

    &:nth-child(1) {
      background-color: #2a1a14 !important;
      border-left: 5px solid #e6531d !important;
    }

    &:nth-child(2) {
      background-color: #142a1a !important;
      border-left: 5px solid #007142 !important;
    }

    .card-content h2 {
      color: #fff !important;
      opacity: 1 !important;
    }

    .card-icon {
      transform: scale(1) !important;
      opacity: 1 !important;

      i {
        opacity: 1 !important;
      }
    }
  }

  .card-content {
    position: relative;
    z-index: 1;

    h2 {
      font-size: 1.5rem;
      color: #fff;
      font-weight: 600;
      font-family: 'Poppins', sans-serif;
      margin: 0;
      line-height: 1.3;
      letter-spacing: 0.01em;
      position: relative;
      display: inline-block;

      &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 2px;
        background-color: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
      }
    }
  }

  /* Estilos específicos para cada tarjeta */
  &:nth-child(1) .card-content h2::after {
    background-color: rgba(230, 83, 29, 0.5);
  }

  &:nth-child(2) .card-content h2::after {
    background-color: rgba(0, 113, 66, 0.5);
  }
}

@media (max-width: 768px) {
  .options-container {
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
  }

  .option-card {
    width: 100%;
    max-width: 320px;
  }

  .page-title {
    font-size: 2.8rem;
    margin-bottom: 3.5rem;
  }

  .back-button {
    top: 1.5rem;
    left: 1.5rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 2.2rem;
    margin-bottom: 3rem;
  }

  .option-card {
    padding: 2rem;
    max-width: 280px;
  }

  .card-icon {
    width: 60px !important;
    height: 60px !important;
    margin-bottom: 1.2rem !important;
  }

  .back-button {
    top: 1rem;
    left: 1rem;
    width: 36px;
    height: 36px;
  }

  .container {
    padding: 1.5rem;
  }
}
</style>
