<template>
  <div class="background-container">
    <svg
      class="background-svg"
      viewBox="0 0 1024 768"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Forma morada (esquina superior izquierda) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-purple"
        d="M-50,-50 L300,0 Q350,50 300,200 Q200,300 100,250 Q0,200 -50,150 Z"
        fill="#34307b"
      />

      <!-- Forma verde (esquina superior derecha) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-green"
        d="M700,-50 L1074,0 L1074,250 Q950,300 850,250 Q700,150 700,100 Z"
        fill="#007142"
      />

      <!-- Forma naranja (esquina inferior izquierda) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-orange"
        d="M-50,450 Q100,400 250,550 Q300,650 200,750 Q50,800 -50,818 L-50,450 Z"
        fill="#e6531d"
      />

      <!-- Forma morada (parte inferior) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-purple-alt"
        d="M350,550 Q500,500 650,600 Q700,650 600,800 Q450,818 350,818 Z"
        fill="#34307b"
      />

      <!-- Forma verde (esquina inferior derecha) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-green-alt"
        d="M700,500 Q850,400 1000,550 Q1074,650 1000,750 Q900,800 750,818 L700,818 Z"
        fill="#007142"
      />

      <!-- Forma naranja (borde derecho) - Exactamente como en la imagen de referencia -->
      <path
        class="shape shape-orange-alt"
        d="M950,300 Q1050,250 1074,300 L1074,500 Q975,550 950,500 Q925,450 950,300 Z"
        fill="#e6531d"
      />
    </svg>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';

// Simple GSAP animation for subtle movement
onMounted(() => {
  // Apply subtle animations to each shape
  gsap.to('.shape-purple', {
    x: 5,
    y: -3,
    scale: 1.01,
    duration: 30,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-green', {
    x: -4,
    y: 3,
    scale: 1.01,
    duration: 35,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-orange', {
    x: 6,
    y: 4,
    scale: 1.01,
    duration: 32,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-purple-alt', {
    x: -5,
    y: -4,
    scale: 1.01,
    duration: 34,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-green-alt', {
    x: -3,
    y: 5,
    scale: 1.01,
    duration: 38,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });

  gsap.to('.shape-orange-alt', {
    x: 4,
    y: -6,
    scale: 1.01,
    duration: 36,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  });
});
</script>

<style lang="scss" scoped>
.background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* Cambiado de -1 a 0 para asegurar visibilidad */
  overflow: hidden;
  pointer-events: none;
  background-color: #fff; /* Fondo blanco como en la imagen de referencia */
}

.background-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.shape {
  transform-origin: center;
  /* filter: blur(10px); */ /* ELIMINADO: Efecto blur que causaba lag */
  opacity: 1; /* Opacidad completa para asegurar visibilidad */
  mix-blend-mode: normal; /* Cambiado de screen a normal para asegurar visibilidad */
}

/* Animaciones CSS de respaldo si GSAP no se inicializa */
@keyframes floatShape {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(3px, -3px) scale(1.01);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

/* Aplicar animaciones de respaldo */
.shape-purple {
  animation: floatShape 30s infinite ease-in-out;
}

.shape-green {
  animation: floatShape 35s infinite ease-in-out reverse;
}

.shape-orange {
  animation: floatShape 32s infinite ease-in-out;
}

.shape-purple-alt {
  animation: floatShape 34s infinite ease-in-out;
}

.shape-green-alt {
  animation: floatShape 38s infinite ease-in-out reverse;
}

.shape-orange-alt {
  animation: floatShape 36s infinite ease-in-out;
}
</style>
