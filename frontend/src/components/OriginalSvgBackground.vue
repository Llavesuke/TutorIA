<template>
  <div class="background-container">
    <!-- Capa de difuminado para las formas (con lazy loading) -->
    <div class="blur-layer"></div>

    <!-- Contenedor SVG con animación (con lazy loading) -->
    <div class="svg-container">
      <img
        src="@/assets/exact-background-shapes.svg"
        class="background-svg"
        alt="Background shapes"
        loading="lazy"
        decoding="async"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { gsap } from 'gsap';

// Variable para controlar si las animaciones están activas
const animationsEnabled = ref(true);

/**
 * Hero Section Text:
 * Título: "Revolutionize Learning with AI Tutors"
 * Descripción: "TutorIA is revolutionizing education with AI-powered personalized learning.
 * Our platform empowers students and teachers with ethical AI guidance,
 * creating a more effective, engaging, and accessible educational experience for everyone."
 */

// Función para crear animaciones de fluido con efecto de onda
const createFluidAnimation = (element, index, isGroup = false) => {
  // Parámetros base para animación fluida más visible
  const baseParams = {
    duration: isGroup ? 25 : 15 + (index % 6), // Duración reducida para movimiento más rápido
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
    delay: isGroup ? 0 : index * 0.2 // Menor retraso para más actividad
  };

  // Calcular dirección de movimiento para crear efecto de onda
  // Cada forma se mueve en dirección ligeramente diferente para simular fluido
  const waveDirection = index % 4;
  let xMove = 0, yMove = 0;

  switch(waveDirection) {
    case 0: // Movimiento diagonal superior-derecha
      xMove = 1; yMove = -1;
      break;
    case 1: // Movimiento diagonal inferior-derecha
      xMove = 1; yMove = 1;
      break;
    case 2: // Movimiento diagonal inferior-izquierda
      xMove = -1; yMove = 1;
      break;
    case 3: // Movimiento diagonal superior-izquierda
      xMove = -1; yMove = -1;
      break;
  }

  // Parámetros específicos según el tipo de elemento
  const specificParams = isGroup
    ? {
        // Para grupos/contenedores - movimiento más pronunciado
        x: 8, // Mayor movimiento horizontal
        y: 8, // Mayor movimiento vertical
        scale: 1.03, // Mayor cambio de escala
        rotation: 0.8, // Mayor rotación
        skewX: 0.6, // Mayor deformación en X
        skewY: 0.6 // Mayor deformación en Y
      }
    : {
        // Para formas individuales - efecto ondulante más pronunciado
        rotation: 0.5 + (index % 4) * 0.3, // Mayor rotación
        scale: 1 + (index % 5) * 0.015, // Mayor cambio de escala
        x: xMove * (3 + (index % 4) * 1.5), // Movimiento X más amplio
        y: yMove * (3 + (index % 4) * 1.5), // Movimiento Y más amplio
        transformOrigin: `${50 + (index % 5) * 10}% ${50 + (index % 3) * 10}%`
      };

  // Combinar parámetros y aplicar animación
  return gsap.to(element, { ...baseParams, ...specificParams });
};

// Comprobación de rendimiento del dispositivo
const checkPerformance = () => {
  // Desactivar animaciones en dispositivos de bajo rendimiento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return false;
  }

  // Comprobar si es un dispositivo móvil (generalmente menor rendimiento)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) {
    return false;
  }

  return true;
};

// Animación minimalista extremadamente optimizada para rendimiento
onMounted(() => {
  // Retrasar la inicialización para mejorar la carga inicial
  setTimeout(() => {
    // Comprobar si debemos activar las animaciones
    animationsEnabled.value = checkPerformance();

    // Si las animaciones están desactivadas, no hacer nada
    if (!animationsEnabled.value) return;

    // Usar un único timeline para mejor rendimiento
    const tl = gsap.timeline({
      defaults: {
        ease: "sine.inOut",
        force3D: true,
        lazy: true,
        overwrite: "auto"
      }
    });

    // Aplicar animación fluida al contenedor SVG
    createFluidAnimation('.svg-container', 0, true);

    // Aplicar animación fluida a la imagen SVG principal
    createFluidAnimation('.background-svg', 1, true);

    // Animación más visible para la capa de difuminado
    tl.to('.blur-layer', {
      duration: 30, // Ciclo más corto para movimiento más visible
      opacity: [0.5, 0.65, 0.5], // Variación de opacidad para efecto pulsante
      scale: 1.03, // Mayor cambio de escala
      x: 5, // Movimiento horizontal
      y: 5, // Movimiento vertical
      rotation: 0.5, // Ligera rotación
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    }, 0);

    // Reducir la velocidad del timeline para ahorrar recursos
    tl.timeScale(0.5);

    // Seleccionar y animar las formas individuales dentro del SVG
    setTimeout(() => {
      // Usar SVG DOM para acceder a las formas individuales
      const svgElement = document.querySelector('.background-svg');
      if (svgElement && svgElement.contentDocument) {
        const svgDoc = svgElement.contentDocument;
        const shapes = svgDoc.querySelectorAll('path, circle, ellipse, rect, polygon');

        // Animar cada forma individualmente con efecto fluido
        shapes.forEach((shape, index) => {
          // Aplicar animación fluida a cada forma
          createFluidAnimation(shape, index);
        });
      }
    }, 1500); // Tiempo reducido para que las animaciones comiencen antes
  }, 1000); // Tiempo de retraso inicial reducido
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
  transform: translateZ(0); /* Forzar aceleración hardware */
  -webkit-transform: translateZ(0); /* Para Safari */

  /* Optimizaciones para rendimiento */
  contain: strict; /* Aislamiento para mejor rendimiento */
  content-visibility: auto; /* Mejora rendimiento de renderizado */

  /* Reducir la frecuencia de actualización para animaciones */
  @media (prefers-reduced-motion: reduce) {
    .blur-layer, .svg-container, .background-svg {
      animation: none !important;
      transition: none !important;
      transform: none !important;
    }
  }
}

.blur-layer {
  position: absolute;
  top: -10%; /* Reducido de -20% a -10% */
  left: -10%; /* Reducido de -20% a -10% */
  width: 120%; /* Reducido de 140% a 120% */
  height: 120%; /* Reducido de 140% a 120% */
  background: radial-gradient(
    circle at center,
    rgba(230, 83, 29, 0.15) 0%, /* Reducida opacidad */
    rgba(0, 113, 66, 0.15) 50%, /* Reducida opacidad */
    rgba(52, 48, 123, 0.15) 100% /* Reducida opacidad */
  );
  /* filter: blur(15px); */ /* ELIMINADO: Efecto blur que causaba lag */
  opacity: 0.6; /* Reducida de 0.7 a 0.6 */
  mix-blend-mode: screen;
  transform-origin: center center;
  will-change: transform; /* Reducido para minimizar impacto */
  backface-visibility: hidden;
  perspective: 1000;
}

.svg-container {
  position: absolute;
  top: -2%; /* Reducido de -5% a -2% */
  left: -2%; /* Reducido de -5% a -2% */
  width: 104%; /* Reducido de 110% a 104% */
  height: 104%; /* Reducido de 110% a 104% */
  transform-origin: center center;
  /* filter: blur(1px); */ /* ELIMINADO: Último efecto blur que causaba lag */
  will-change: transform; /* Reducido para minimizar impacto */
  backface-visibility: hidden;
  perspective: 1000;
}

.background-svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center center;
  will-change: transform; /* Reducido para minimizar impacto */
  /* filter: contrast(1.1) brightness(1.1) saturate(1.1); */ /* ELIMINADO: Filtros que pueden causar lag */
  backface-visibility: hidden;
  perspective: 1000;
  image-rendering: optimizeSpeed; /* Optimización para rendimiento */
}
</style>
