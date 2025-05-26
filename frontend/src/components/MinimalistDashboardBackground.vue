<template>
  <div class="background-container">
    <!-- Gradiente de fondo -->
    <div class="gradient-background"></div>

    <!-- Formas minimalistas -->
    <div class="shapes-container">
      <!-- Formas vectoriales minimalistas -->
      <svg
        class="background-svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Forma abstracta 1 - superior izquierda -->
        <path
          class="shape shape-1"
          d="M-100,-100 Q50,-50 100,100 Q150,250 0,300 Q-150,350 -200,200 Q-250,50 -100,-100 Z"
          fill="rgba(230, 83, 29, 0.12)"
        />

        <!-- Forma abstracta 2 - superior derecha -->
        <path
          class="shape shape-2"
          d="M1340,-50 Q1490,0 1540,150 Q1590,300 1440,350 Q1290,400 1240,250 Q1190,100 1340,-50 Z"
          fill="rgba(0, 113, 66, 0.12)"
        />

        <!-- Forma abstracta 3 - inferior izquierda -->
        <path
          class="shape shape-3"
          d="M-100,600 Q50,550 100,700 Q150,850 0,900 Q-150,950 -200,800 Q-250,650 -100,600 Z"
          fill="rgba(52, 48, 123, 0.12)"
        />

        <!-- Forma abstracta 4 - inferior derecha -->
        <path
          class="shape shape-4"
          d="M1340,550 Q1490,500 1540,650 Q1590,800 1440,850 Q1290,900 1240,750 Q1190,600 1340,550 Z"
          fill="rgba(230, 83, 29, 0.12)"
        />

        <!-- Líneas minimalistas -->
        <line class="line line-1" x1="0" y1="100" x2="300" y2="100" stroke="rgba(230, 83, 29, 0.05)" stroke-width="1" />
        <line class="line line-2" x1="1140" y1="200" x2="1440" y2="200" stroke="rgba(0, 113, 66, 0.05)" stroke-width="1" />
        <line class="line line-3" x1="0" y1="700" x2="300" y2="700" stroke="rgba(52, 48, 123, 0.05)" stroke-width="1" />
        <line class="line line-4" x1="1140" y1="800" x2="1440" y2="800" stroke="rgba(230, 83, 29, 0.05)" stroke-width="1" />

        <!-- Círculos minimalistas -->
        <circle class="circle circle-1" cx="400" cy="150" r="5" fill="rgba(230, 83, 29, 0.1)" />
        <circle class="circle circle-2" cx="1040" cy="250" r="5" fill="rgba(0, 113, 66, 0.1)" />
        <circle class="circle circle-3" cx="400" cy="750" r="5" fill="rgba(52, 48, 123, 0.1)" />
        <circle class="circle circle-4" cx="1040" cy="650" r="5" fill="rgba(230, 83, 29, 0.1)" />

        <!-- Puntos de acento -->
        <circle class="dot dot-1" cx="500" cy="200" r="2" fill="rgba(230, 83, 29, 0.2)" />
        <circle class="dot dot-2" cx="940" cy="300" r="2" fill="rgba(0, 113, 66, 0.2)" />
        <circle class="dot dot-3" cx="500" cy="700" r="2" fill="rgba(52, 48, 123, 0.2)" />
        <circle class="dot dot-4" cx="940" cy="600" r="2" fill="rgba(230, 83, 29, 0.2)" />

        <!-- Líneas de cuadrícula sutiles -->
        <line class="grid-line horizontal-1" x1="0" y1="300" x2="1440" y2="300" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" />
        <line class="grid-line horizontal-2" x1="0" y1="600" x2="1440" y2="600" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" />
        <line class="grid-line vertical-1" x1="480" y1="0" x2="480" y2="900" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" />
        <line class="grid-line vertical-2" x1="960" y1="0" x2="960" y2="900" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1" />
      </svg>
    </div>

    <!-- Efecto de partículas sutiles -->
    <div class="particles-container"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { gsap } from 'gsap';

// Animaciones sutiles para las formas y elementos
onMounted(() => {
  // Animación para las formas abstractas
  gsap.to('.shape-1', {
    x: 10,
    y: 5,
    rotation: 1,
    duration: 60,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-2', {
    x: -10,
    y: 5,
    rotation: -1,
    duration: 70,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-3', {
    x: 10,
    y: -5,
    rotation: -1,
    duration: 65,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-4', {
    x: -10,
    y: -5,
    rotation: 1,
    duration: 75,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  // Animación para las líneas
  gsap.to('.line', {
    opacity: 0.3,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    stagger: 1
  });

  // Animación para los círculos
  gsap.to('.circle', {
    scale: 1.5,
    opacity: 0.2,
    duration: 5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    stagger: 1.5
  });

  // Animación para los puntos
  gsap.to('.dot', {
    scale: 2,
    opacity: 0.4,
    duration: 3,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    stagger: 0.8
  });

  // Crear partículas sutiles
  createParticles();
});

// Función para crear partículas sutiles
function createParticles() {
  const particlesContainer = document.querySelector('.particles-container');
  const particleCount = 30;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('particle');

    // Posición aleatoria
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;

    // Tamaño aleatorio
    const size = Math.random() * 3 + 1;

    // Opacidad aleatoria
    const opacity = Math.random() * 0.1;

    // Aplicar estilos
    particle.style.left = `${posX}%`;
    particle.style.top = `${posY}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.opacity = opacity;

    // Añadir al contenedor
    particlesContainer.appendChild(particle);

    // Animar con GSAP
    gsap.to(particle, {
      y: `${Math.random() * 100 - 50}`,
      x: `${Math.random() * 100 - 50}`,
      opacity: Math.random() * 0.2,
      duration: Math.random() * 60 + 30,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
}

// Limpiar animaciones al desmontar
onBeforeUnmount(() => {
  gsap.killTweensOf('.shape-1');
  gsap.killTweensOf('.shape-2');
  gsap.killTweensOf('.shape-3');
  gsap.killTweensOf('.shape-4');
  gsap.killTweensOf('.line');
  gsap.killTweensOf('.circle');
  gsap.killTweensOf('.dot');
  gsap.killTweensOf('.particle');
});
</script>

<style lang="scss" scoped>
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(18, 18, 18, 0.5) 0%, rgba(26, 26, 26, 0.5) 100%);
  opacity: 0.6;
}

.shapes-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.background-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shape {
  transform-origin: center;
  will-change: transform;
}

.line, .circle, .dot, .grid-line {
  will-change: opacity, transform;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  will-change: transform, opacity;
}
</style>
