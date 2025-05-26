<template>
  <div class="background-container">
    <div class="svg-container">
      <svg
        class="background-svg"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Forma morada elegante (esquina superior izquierda) -->
        <path
          class="shape shape-purple"
          d="M-100,-50 C0,0 150,0 200,100 C250,200 150,300 50,250 C-50,200 -150,100 -100,-50 Z"
          fill="#34307b"
        />

        <!-- Forma verde elegante (esquina superior derecha) -->
        <path
          class="shape shape-green"
          d="M824,-50 C924,0 1074,0 1124,100 C1174,200 1074,300 974,250 C874,200 774,100 824,-50 Z"
          fill="#007142"
        />

        <!-- Forma naranja elegante (esquina inferior izquierda) -->
        <path
          class="shape shape-orange"
          d="M-100,618 C0,568 150,618 200,718 C250,818 150,868 50,818 C-50,768 -150,718 -100,618 Z"
          fill="#e6531d"
        />

        <!-- Forma verde elegante (esquina inferior derecha) -->
        <path
          class="shape shape-green-alt"
          d="M824,618 C924,568 1074,618 1124,718 C1174,818 1074,868 974,818 C874,768 774,718 824,618 Z"
          fill="#007142"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { gsap } from 'gsap';

// Animaciones elegantes y profesionales para las formas
onMounted(() => {
  // Crear timeline principal para coordinar todas las animaciones
  const mainTimeline = gsap.timeline({
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });

  // Animación para la forma morada (superior izquierda)
  const purpleAnimation = gsap.timeline({ repeat: -1, yoyo: true })
    .to('.shape-purple', {
      x: 10,
      y: 5,
      scale: 1.03,
      rotation: 1,
      transformOrigin: "center center",
      duration: 40,
      ease: 'sine.inOut'
    });

  // Animación para la forma verde (superior derecha)
  const greenAnimation = gsap.timeline({ repeat: -1, yoyo: true })
    .to('.shape-green', {
      x: -10,
      y: 5,
      scale: 1.02,
      rotation: -1,
      transformOrigin: "center center",
      duration: 45,
      ease: 'sine.inOut'
    });

  // Animación para la forma naranja (inferior izquierda)
  const orangeAnimation = gsap.timeline({ repeat: -1, yoyo: true })
    .to('.shape-orange', {
      x: 8,
      y: -5,
      scale: 1.03,
      rotation: -0.8,
      transformOrigin: "center center",
      duration: 42,
      ease: 'sine.inOut'
    });

  // Animación para la forma verde alternativa (inferior derecha)
  const greenAltAnimation = gsap.timeline({ repeat: -1, yoyo: true })
    .to('.shape-green-alt', {
      x: -8,
      y: -5,
      scale: 1.02,
      rotation: 0.8,
      transformOrigin: "center center",
      duration: 48,
      ease: 'sine.inOut'
    });

  // Animación global muy sutil para el contenedor SVG
  const containerAnimation = gsap.timeline({ repeat: -1, yoyo: true })
    .to('.svg-container', {
      scale: 1.01,
      rotation: 0.3,
      duration: 60,
      ease: "power1.inOut"
    });

  // Ajustar la velocidad de las animaciones para que sean más sutiles
  purpleAnimation.timeScale(0.7);
  greenAnimation.timeScale(0.6);
  orangeAnimation.timeScale(0.65);
  greenAltAnimation.timeScale(0.55);
  containerAnimation.timeScale(0.5);
});

// Limpiar animaciones al desmontar
onBeforeUnmount(() => {
  gsap.killTweensOf('.shape-purple');
  gsap.killTweensOf('.shape-green');
  gsap.killTweensOf('.shape-orange');
  gsap.killTweensOf('.shape-green-alt');
  gsap.killTweensOf('.svg-container');
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
  background-color: #171717; // Fondo negro para el dashboard
}

.svg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  will-change: transform; // Optimización para animaciones
}

.background-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shape {
  transform-origin: center;
  filter: blur(0); // Sin desenfoque para que se vean nítidas
  opacity: 0.85; // Ligera transparencia para un efecto más elegante
  will-change: transform; // Optimización para animaciones
}

/* Animaciones CSS de respaldo si GSAP no se inicializa */
@keyframes floatPurple {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(10px, 5px) scale(1.03) rotate(1deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes floatGreen {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-10px, 5px) scale(1.02) rotate(-1deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes floatOrange {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(8px, -5px) scale(1.03) rotate(-0.8deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

@keyframes floatGreenAlt {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  50% {
    transform: translate(-8px, -5px) scale(1.02) rotate(0.8deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}

/* Aplicar animaciones de respaldo */
.shape-purple {
  animation: floatPurple 40s infinite ease-in-out;
}

.shape-green {
  animation: floatGreen 45s infinite ease-in-out;
}

.shape-orange {
  animation: floatOrange 42s infinite ease-in-out;
}

.shape-green-alt {
  animation: floatGreenAlt 48s infinite ease-in-out;
}
</style>
