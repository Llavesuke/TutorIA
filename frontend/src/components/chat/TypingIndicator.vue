<template>
  <div class="typing-indicator">
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
  </div>
</template>

<script setup>
// No additional script needed
</script>

<style lang="scss" scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(0, 113, 66, 0.6) 0%, rgba(0, 90, 53, 0.6) 100%);
  border-radius: 18px;
  width: fit-content;
  margin-left: 3rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 15px;
    height: 15px;
    background: linear-gradient(135deg, rgba(0, 113, 66, 0.6) 0%, rgba(0, 90, 53, 0.6) 100%);
    border-radius: 50%;
    z-index: -1;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #FEF0D1;
    margin: 0 3px;
    opacity: 0.7;
    animation: bounce 1.5s infinite;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}
</style>
