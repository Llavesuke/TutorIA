<template>
  <div class="background-container">
    <div class="shape shape-purple top-left"></div>
    <div class="shape shape-green top-right"></div>
    <div class="shape shape-orange bottom-left"></div>
    <div class="shape shape-purple-alt bottom-center"></div>
    <div class="shape shape-green-alt bottom-right"></div>
    <div class="shape shape-orange-alt right-edge"></div>
  </div>
</template>

<script setup>
// Componente de fondo simplificado con formas CSS
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
  background-color: #fff;
}

.shape {
  position: absolute;
  border-radius: 50%;
  /* filter: blur(30px); */ /* ELIMINADO: Efecto blur extremo que causaba lag */
  opacity: 0.9;
}

// Forma morada (esquina superior izquierda)
.top-left {
  top: -100px;
  left: -100px;
  width: 300px;
  height: 300px;
  background-color: #34307b;
  animation: float 30s infinite ease-in-out;
}

// Forma verde (esquina superior derecha)
.top-right {
  top: -100px;
  right: -100px;
  width: 350px;
  height: 350px;
  background-color: #007142;
  animation: float 35s infinite ease-in-out reverse;
}

// Forma naranja (esquina inferior izquierda)
.bottom-left {
  bottom: -100px;
  left: -100px;
  width: 320px;
  height: 320px;
  background-color: #e6531d;
  animation: float 32s infinite ease-in-out;
}

// Forma morada (parte inferior)
.bottom-center {
  bottom: -100px;
  left: 40%;
  width: 280px;
  height: 280px;
  background-color: #34307b;
  animation: float 34s infinite ease-in-out;
}

// Forma verde (esquina inferior derecha)
.bottom-right {
  bottom: -100px;
  right: -100px;
  width: 330px;
  height: 330px;
  background-color: #007142;
  animation: float 38s infinite ease-in-out reverse;
}

// Forma naranja (borde derecho)
.right-edge {
  top: 40%;
  right: -100px;
  width: 250px;
  height: 250px;
  background-color: #e6531d;
  animation: float 36s infinite ease-in-out;
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, -20px);
  }
  100% {
    transform: translate(0, 0);
  }
}
</style>
