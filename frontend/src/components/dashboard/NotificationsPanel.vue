<template>
  <div class="notifications-panel" :class="{ 'open': isOpen }">
    <div class="panel-header">
      <h3>Notifications</h3>
      <button class="close-btn" @click="$emit('close')" aria-label="Close notifications panel">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="panel-content">
      <div v-if="notifications.length === 0" class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <p>No new notifications</p>
      </div>
      
      <div v-else class="notifications-list">
        <div 
          v-for="(notification, index) in notifications" 
          :key="index" 
          class="notification-item"
          :class="notification.read ? 'read' : ''"
        >
          <div class="notification-icon" :class="notification.type">
            <i class="fas" :class="getIconClass(notification.type)"></i>
          </div>
          <div class="notification-content">
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
          <button 
            class="mark-read-btn" 
            @click="markAsRead(index)" 
            :aria-label="notification.read ? 'Mark as unread' : 'Mark as read'"
          >
            <i class="fas" :class="notification.read ? 'fa-envelope-open' : 'fa-envelope'"></i>
          </button>
        </div>
      </div>
    </div>
    
    <div class="panel-footer">
      <button class="mark-all-btn" @click="markAllAsRead" :disabled="allRead">
        Mark all as read
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

// Datos de notificaciones simulados
const notifications = ref([
  {
    type: 'info',
    message: 'New student joined your class',
    time: '2 hours ago',
    read: false
  },
  {
    type: 'warning',
    message: 'Student progress report is due tomorrow',
    time: '5 hours ago',
    read: false
  },
  {
    type: 'success',
    message: 'Your tutor was successfully deployed',
    time: 'Yesterday',
    read: true
  }
]);

// Función para obtener la clase de icono según el tipo
const getIconClass = (type) => {
  switch (type) {
    case 'info':
      return 'fa-info-circle';
    case 'warning':
      return 'fa-exclamation-triangle';
    case 'success':
      return 'fa-check-circle';
    case 'error':
      return 'fa-times-circle';
    default:
      return 'fa-bell';
  }
};

// Marcar notificación como leída
const markAsRead = (index) => {
  notifications.value[index].read = !notifications.value[index].read;
};

// Marcar todas las notificaciones como leídas
const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true;
  });
};

// Verificar si todas las notificaciones están leídas
const allRead = computed(() => {
  return notifications.value.every(notification => notification.read);
});
</script>

<style lang="scss" scoped>
.notifications-panel {
  position: fixed;
  top: 0;
  right: -350px;
  width: 350px;
  height: 100vh;
  background-color: #1e1e1e;
  box-shadow: -5px 0 25px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
  
  &.open {
    right: 0;
  }
  
  .panel-header {
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    
    h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: #fef0d1;
    }
    
    .close-btn {
      background: transparent;
      border: none;
      color: #fef0d1;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.5rem;
      transition: color 0.2s ease;
      
      &:hover {
        color: #e6531d;
      }
    }
  }
  
  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: rgba(254, 240, 209, 0.5);
      
      i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      p {
        font-size: 1rem;
      }
    }
    
    .notifications-list {
      .notification-item {
        display: flex;
        align-items: flex-start;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 0.75rem;
        background-color: rgba(255, 255, 255, 0.03);
        transition: all 0.2s ease;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        &.read {
          opacity: 0.6;
        }
        
        .notification-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          flex-shrink: 0;
          
          &.info {
            background-color: rgba(33, 150, 243, 0.1);
            color: #2196f3;
          }
          
          &.warning {
            background-color: rgba(255, 152, 0, 0.1);
            color: #ff9800;
          }
          
          &.success {
            background-color: rgba(76, 175, 80, 0.1);
            color: #4caf50;
          }
          
          &.error {
            background-color: rgba(244, 67, 54, 0.1);
            color: #f44336;
          }
        }
        
        .notification-content {
          flex: 1;
          
          .notification-message {
            margin: 0 0 0.25rem 0;
            font-size: 0.9rem;
            color: #fef0d1;
          }
          
          .notification-time {
            font-size: 0.75rem;
            color: rgba(254, 240, 209, 0.5);
          }
        }
        
        .mark-read-btn {
          background: transparent;
          border: none;
          color: rgba(254, 240, 209, 0.5);
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.2s ease;
          
          &:hover {
            color: #e6531d;
          }
        }
      }
    }
  }
  
  .panel-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    
    .mark-all-btn {
      width: 100%;
      background-color: transparent;
      border: 1px solid rgba(230, 83, 29, 0.5);
      color: #e6531d;
      border-radius: 8px;
      padding: 0.75rem;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background-color: rgba(230, 83, 29, 0.1);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
