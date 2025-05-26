<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="[toast.type, 'toast-' + position]"
      >
        <div class="toast-header">
          <div class="toast-icon">
            <i class="fas" :class="getIconClass(toast.type)"></i>
          </div>
          <div class="toast-title">{{ toast.title || getDefaultTitle(toast.type) }}</div>
          <button class="close" @click="removeToast(toast.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="toast-body">
          {{ toast.message }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Props
const props = defineProps({
  position: {
    type: String,
    default: 'top-right',
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
});

// State
const toasts = ref([]);
let toastCounter = 0;

// Methods
const getIconClass = (type) => {
  switch (type) {
    case 'success':
      return 'fa-check-circle';
    case 'error':
      return 'fa-times-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'info':
      return 'fa-info-circle';
    default:
      return 'fa-bell';
  }
};

const getDefaultTitle = (type) => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      return 'Notification';
  }
};

const addToast = (message, type = 'info', title = null) => {
  const id = toastCounter++;
  
  toasts.value.push({
    id,
    message,
    type,
    title
  });
  
  // Auto-remove toast after duration
  setTimeout(() => {
    removeToast(id);
  }, props.duration);
  
  return id;
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

// Create global event bus for toast notifications
const handleToastEvent = (event) => {
  const { message, type, title } = event.detail;
  addToast(message, type, title);
};

onMounted(() => {
  // Listen for toast events
  window.addEventListener('show-toast', handleToastEvent);
});

onUnmounted(() => {
  // Clean up event listener
  window.removeEventListener('show-toast', handleToastEvent);
});

// Expose methods
defineExpose({
  addToast,
  removeToast
});
</script>

<style lang="scss" scoped>
.toast-container {
  position: fixed;
  z-index: var(--z-index-toast, 9999);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 350px;
  
  &:has(.toast-top-right) {
    top: 1rem;
    right: 1rem;
  }
  
  &:has(.toast-top-left) {
    top: 1rem;
    left: 1rem;
  }
  
  &:has(.toast-bottom-right) {
    bottom: 1rem;
    right: 1rem;
  }
  
  &:has(.toast-bottom-left) {
    bottom: 1rem;
    left: 1rem;
  }
}

.toast {
  background-color: #171717;
  color: #FEF0D1;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  width: 100%;
  
  &.success {
    border-left: 4px solid #007142;
    .toast-icon {
      color: #007142;
    }
  }
  
  &.error {
    border-left: 4px solid #f44336;
    .toast-icon {
      color: #f44336;
    }
  }
  
  &.warning {
    border-left: 4px solid #ff9800;
    .toast-icon {
      color: #ff9800;
    }
  }
  
  &.info {
    border-left: 4px solid #34307b;
    .toast-icon {
      color: #34307b;
    }
  }
  
  .toast-header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: rgba(0, 0, 0, 0.1);
    
    .toast-icon {
      margin-right: 0.5rem;
      font-size: 1.1rem;
    }
    
    .toast-title {
      flex: 1;
      font-weight: 600;
    }
    
    .close {
      background: transparent;
      border: none;
      color: #FEF0D1;
      opacity: 0.7;
      cursor: pointer;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 1;
      }
    }
  }
  
  .toast-body {
    padding: 0.75rem 1rem;
    line-height: 1.5;
  }
}

// Animations
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
