<template>
  <div class="modal-backdrop" :class="{ 'active': isOpen }" @click.self="closeModal">
    <div class="modal" :class="{ 'active': isOpen }">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="closeModal" aria-label="Close modal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="warning-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        
        <p class="confirmation-message">{{ message }}</p>
        
        <div v-if="details" class="confirmation-details">
          <p>{{ details }}</p>
        </div>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn-secondary"
          @click="closeModal"
          :disabled="isLoading"
        >
          Cancel
        </button>
        <button
          class="btn btn-danger"
          @click="confirm"
          :disabled="isLoading"
        >
          <span v-if="isLoading">
            <i class="fas fa-spinner fa-spin"></i> Deleting...
          </span>
          <span v-else>
            <i class="fas fa-trash-alt"></i> Delete
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Confirm Deletion'
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item?'
  },
  details: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['close', 'confirm']);

// State
const isLoading = ref(false);

// Methods
const closeModal = () => {
  if (!isLoading.value) {
    emit('close');
  }
};

const confirm = async () => {
  try {
    isLoading.value = true;
    
    // Emit confirm event
    emit('confirm');
    
    // Close modal after a short delay to show loading state
    setTimeout(() => {
      isLoading.value = false;
      closeModal();
    }, 500);
  } catch (error) {
    console.error('Error in confirm action:', error);
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  
  &.active {
    opacity: 1;
    visibility: visible;
  }
}

.modal {
  background-color: var(--color-carbon);
  border-radius: var(--border-radius-md);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(20px);
  opacity: 0;
  transition: transform 0.3s ease, opacity 0.3s ease;
  
  &.active {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .modal-title {
    margin: 0;
    color: var(--color-cashmere);
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
  }
  
  .modal-close {
    background: none;
    border: none;
    color: var(--color-cashmere);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    transition: color 0.3s ease;
    
    &:hover {
      color: var(--color-vivid-orange);
    }
  }
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  .warning-icon {
    font-size: 3rem;
    color: var(--color-vivid-orange);
    margin-bottom: 1.5rem;
    
    i {
      animation: pulse 2s infinite;
    }
  }
  
  .confirmation-message {
    font-size: 1.2rem;
    color: var(--color-cashmere);
    margin-bottom: 1rem;
  }
  
  .confirmation-details {
    color: var(--color-text-light);
    font-size: 0.9rem;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: var(--border-radius-sm);
    width: 100%;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius-sm);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    border: none;
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .btn-secondary {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--color-cashmere);
    
    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }
  
  .btn-danger {
    background-color: var(--color-vivid-orange);
    color: white;
    
    &:hover:not(:disabled) {
      background-color: darken(#e6531d, 10%);
      transform: translateY(-2px);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
