<template>
  <div class="background-container">
    <div class="svg-container">
      <svg
        class="background-svg"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Forma morada (esquina superior izquierda) -->
        <path
          class="shape shape-purple"
          d="M0,0 L250,0 Q300,50 250,150 Q150,250 50,200 Q0,150 0,50 Z"
          fill="#34307b"
        />

        <!-- Forma verde (esquina superior derecha) -->
        <path
          class="shape shape-green"
          d="M750,0 L1024,0 L1024,200 Q950,250 850,150 Q750,100 750,50 Z"
          fill="#007142"
        />

        <!-- Forma naranja (esquina inferior izquierda) -->
        <path
          class="shape shape-orange"
          d="M0,450 Q100,400 200,550 Q250,650 150,750 Q50,768 0,768 L0,450 Z"
          fill="#e6531d"
        />

        <!-- Forma morada (parte inferior) -->
        <path
          class="shape shape-purple-alt"
          d="M400,600 Q500,550 600,600 Q700,650 550,768 Q450,768 400,700 Z"
          fill="#34307b"
        />

        <!-- Forma verde (esquina inferior derecha) -->
        <path
          class="shape shape-green-alt"
          d="M750,500 Q850,450 950,550 Q1024,650 950,768 Q850,768 750,700 Z"
          fill="#007142"
        />

        <!-- Forma naranja (borde derecho) -->
        <path
          class="shape shape-orange-alt"
          d="M950,350 Q1024,300 1024,350 L1024,450 Q950,500 900,450 Q900,400 950,350 Z"
          fill="#e6531d"
        />
      </svg>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';

// Animación tipo wave muy sutil y lenta
onMounted(() => {
  // Animaciones extremadamente sutiles para cada forma
  gsap.to('.shape-purple', {
    duration: 180, // Extremadamente lento (3 minutos por ciclo)
    ease: "sine.inOut",
    y: -2, // Movimiento vertical mínimo
    x: 2, // Movimiento horizontal mínimo
    repeat: -1,
    yoyo: true
  });

  gsap.to('.shape-green', {
    duration: 200, // Aún más lento
    ease: "sine.inOut",
    y: 2, // Dirección opuesta
    x: -2, // Dirección opuesta
    repeat: -1,
    yoyo: true
  });

  gsap.to('.shape-orange', {
    duration: 190, // Tiempo diferente para que no se sincronicen
    ease: "sine.inOut",
    y: 3, // Movimiento vertical mínimo
    x: 3, // Movimiento horizontal mínimo
    repeat: -1,
    yoyo: true
  });

  gsap.to('.shape-purple-alt', {
    duration: 210, // Tiempo diferente
    ease: "sine.inOut",
    y: -3, // Dirección opuesta
    x: -3, // Dirección opuesta
    repeat: -1,
    yoyo: true
  });

  gsap.to('.shape-green-alt', {
    duration: 220, // El más lento
    ease: "sine.inOut",
    y: 2, // Movimiento vertical mínimo
    x: -2, // Movimiento horizontal mínimo
    repeat: -1,
    yoyo: true
  });

  gsap.to('.shape-orange-alt', {
    duration: 195, // Tiempo diferente
    ease: "sine.inOut",
    y: -2, // Dirección opuesta
    x: 2, // Dirección opuesta
    repeat: -1,
    yoyo: true
  });

  // Animación global extremadamente sutil para el efecto wave
  gsap.to('.svg-container', {
    duration: 240, // Extremadamente lento (4 minutos por ciclo)
    ease: "sine.inOut",
    skewX: 0.1, // Skew mínimo en X
    skewY: 0.1, // Skew mínimo en Y
    scale: 1.005, // Escala mínima
    repeat: -1,
    yoyo: true
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
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background-color: #000; /* Fondo negro como solicitado */
}

.svg-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center center;
}

.background-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shape {
  transform-origin: center;
  filter: blur(0); /* Sin desenfoque para que se vean exactamente como en la imagen */
}
</style>
