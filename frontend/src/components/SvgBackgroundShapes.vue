<template>
  <div class="background-container">
    <!-- Forma morada (esquina superior izquierda) -->
    <div class="shape shape-purple"></div>

    <!-- Forma verde (esquina superior derecha) -->
    <div class="shape shape-green"></div>

    <!-- Forma naranja (esquina inferior izquierda) -->
    <div class="shape shape-orange"></div>

    <!-- Forma morada (parte inferior) -->
    <div class="shape shape-purple-alt"></div>

    <!-- Forma verde (esquina inferior derecha) -->
    <div class="shape shape-green-alt"></div>

    <!-- Forma naranja (borde derecho) -->
    <div class="shape shape-orange-alt"></div>
  </div>
</template>

<script setup>
// Componente de fondo con formas CSS para máxima compatibilidad
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
  background-color: #000; /* Cambiado a negro como solicitado */
}

.shape {
  position: absolute;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; /* Forma más orgánica y menos circular */
  /* filter: blur(8px); */ /* ELIMINADO: Efecto blur que causaba lag */
  opacity: 0.75; /* Ajustado para mejor visibilidad con menos difuminado */
}

// Forma morada (esquina superior izquierda) - Exactamente como en la imagen
.shape-purple {
  top: -20px;
  left: -20px;
  width: 350px;
  height: 300px;
  background-color: #34307b;
  border-radius: 0% 60% 30% 70% / 0% 40% 70% 50%; /* Forma más similar a la imagen */
  animation: float1 30s infinite ease-in-out;
  clip-path: polygon(0% 0%, 100% 0%, 70% 100%, 0% 70%); /* Forma más angular como en la imagen */
}

// Forma verde (esquina superior derecha) - Exactamente como en la imagen
.shape-green {
  top: -20px;
  right: -20px;
  width: 400px;
  height: 300px;
  background-color: #007142;
  border-radius: 70% 0% 50% 30% / 60% 0% 70% 40%; /* Forma más similar a la imagen */
  animation: float2 35s infinite ease-in-out reverse;
  clip-path: polygon(30% 0%, 100% 0%, 100% 70%, 0% 100%); /* Forma más angular como en la imagen */
}

// Forma naranja (esquina inferior izquierda) - Exactamente como en la imagen
.shape-orange {
  bottom: -20px;
  left: -20px;
  width: 350px;
  height: 300px;
  background-color: #e6531d;
  border-radius: 50% 30% 0% 20% / 40% 60% 0% 70%; /* Forma más similar a la imagen */
  animation: float1 32s infinite ease-in-out;
  clip-path: polygon(0% 30%, 100% 0%, 70% 100%, 0% 100%); /* Forma más angular como en la imagen */
}

// Forma morada (parte inferior) - Exactamente como en la imagen
.shape-purple-alt {
  bottom: -20px;
  left: 35%;
  width: 350px;
  height: 300px;
  background-color: #34307b;
  border-radius: 40% 60% 0% 0% / 60% 30% 0% 0%; /* Forma más similar a la imagen */
  animation: float2 34s infinite ease-in-out;
  clip-path: polygon(0% 0%, 100% 0%, 70% 100%, 30% 100%); /* Forma más angular como en la imagen */
}

// Forma verde (esquina inferior derecha) - Exactamente como en la imagen
.shape-green-alt {
  bottom: -20px;
  right: -20px;
  width: 400px;
  height: 300px;
  background-color: #007142;
  border-radius: 70% 30% 0% 40% / 50% 60% 0% 50%; /* Forma más similar a la imagen */
  animation: float1 38s infinite ease-in-out reverse;
  clip-path: polygon(0% 0%, 70% 30%, 100% 100%, 0% 100%); /* Forma más angular como en la imagen */
}

// Forma naranja (borde derecho) - Exactamente como en la imagen
.shape-orange-alt {
  top: 40%;
  right: -20px;
  width: 300px;
  height: 250px;
  background-color: #e6531d;
  border-radius: 60% 0% 0% 70% / 40% 0% 0% 50%; /* Forma más similar a la imagen */
  animation: float2 36s infinite ease-in-out;
  clip-path: polygon(0% 0%, 100% 30%, 100% 70%, 30% 100%); /* Forma más angular como en la imagen */
}

@keyframes float1 {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(10px, -10px); /* Movimiento más sutil */
  }
  100% {
    transform: translate(0, 0);
  }
}

@keyframes float2 {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-10px, 10px); /* Movimiento más sutil */
  }
  100% {
    transform: translate(0, 0);
  }
}
</style>
