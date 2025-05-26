<template>
  <div class="background-container">
    <img src="@/assets/exact-background-shapes.svg" class="background-svg" alt="Background shapes" />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { gsap } from 'gsap';

// Animación tipo wave muy sutil y lenta
onMounted(() => {
  // Animación para la imagen SVG completa
  gsap.to('.background-svg', {
    duration: 120, // Muy lento (2 minutos por ciclo)
    ease: "sine.inOut",
    scale: 1.03, // Escala muy sutil
    rotation: 0.5, // Rotación casi imperceptible
    repeat: -1,
    yoyo: true
  });

  // Animación adicional para crear efecto wave
  const tl = gsap.timeline({
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut"
  });

  tl.to('.background-svg', {
    duration: 60, // Muy lento (1 minuto)
    skewX: 0.3, // Skew muy sutil en X
    skewY: 0.3, // Skew muy sutil en Y
  })
  .to('.background-svg', {
    duration: 60, // Muy lento (1 minuto)
    skewX: -0.3, // Skew muy sutil en X (dirección opuesta)
    skewY: -0.3, // Skew muy sutil en Y (dirección opuesta)
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

.background-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* Para asegurar que el SVG cubra toda la pantalla */
  transform-origin: center center; /* Punto de origen para las transformaciones */
  will-change: transform; /* Optimización para animaciones */
  animation: subtle-float 120s infinite alternate ease-in-out; /* Animación CSS de respaldo */
}

/* Animación CSS de respaldo por si GSAP no se inicializa */
@keyframes subtle-float {
  0% {
    transform: scale(1) skew(0deg, 0deg);
  }
  25% {
    transform: scale(1.01) skew(0.2deg, 0.2deg);
  }
  50% {
    transform: scale(1.02) skew(0.3deg, 0.3deg);
  }
  75% {
    transform: scale(1.01) skew(0.1deg, 0.1deg);
  }
  100% {
    transform: scale(1) skew(0deg, 0deg);
  }
}
</style>
