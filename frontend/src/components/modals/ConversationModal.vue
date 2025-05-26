<template>
  <div v-if="isOpen" class="conversation-modal-overlay" @click="closeModal">
    <div class="conversation-modal" @click.stop>
      <div class="modal-header">
        <h2>Conversation between {{ studentName }} and {{ tutorName }}</h2>
        <button class="close-btn" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="conversation-container">
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading conversation...</p>
          </div>

          <div v-else-if="errorMessage" class="error-message">
            <p>{{ errorMessage }}</p>
          </div>

          <div v-else-if="!conversation || conversation.messages.length === 0" class="empty-state">
            <i class="fas fa-comment-slash empty-icon"></i>
            <p>No messages in this conversation yet.</p>
          </div>

          <div v-else class="messages-container">
            <div
              v-for="(message, index) in conversation.messages"
              :key="index"
              class="message-item"
              :class="{
                'student-message': message.sender === 'student' || message.sender === 'estudiante' || message.sender === 'usuario',
                'tutor-message': message.sender === 'tutor',
                'teacher-comment': message.sender === 'teacher' || message.sender === 'profesor'
              }"
            >
              <div class="message-header">
                <span class="sender-name">
                  {{ getSenderName(message.sender) }}
                </span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              <div class="message-content">
                <p>{{ message.content }}</p>
              </div>
            </div>
            <!-- Elemento espaciador para asegurar que se pueda hacer scroll hasta el final -->
            <div class="scroll-spacer"></div>
          </div>
        </div>

        <div v-if="canAddComments" class="teacher-comment-section">
          <h3>Add Teacher Comment</h3>
          <div class="comment-form">
            <textarea
              v-model="newComment"
              placeholder="Add a comment or guidance for the student..."
              rows="3"
            ></textarea>
            <button
              class="submit-comment-btn"
              @click="submitComment"
              :disabled="!newComment.trim()"
            >
              <i class="fas fa-paper-plane"></i> Send Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import authStore from '@/stores/authStore';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  conversation: {
    type: Object,
    default: null
  },
  tutorName: {
    type: String,
    default: 'Tutor'
  },
  studentName: {
    type: String,
    default: 'Student'
  }
});

const emit = defineEmits(['close', 'add-comment']);

// State
const isLoading = ref(false);
const errorMessage = ref('');
const newComment = ref('');

// User role from auth store
const userRole = computed(() => authStore.userRole.value);

// Check if user can add comments (admin or professor)
const canAddComments = computed(() => {
  return userRole.value === 'admin' || userRole.value === 'profesor';
});

// Methods
const closeModal = () => {
  emit('close');
};

const submitComment = () => {
  if (!newComment.value.trim()) return;

  const commentData = {
    chatId: props.conversation.id,
    comment: newComment.value.trim()
  };

  emit('add-comment', commentData);
  newComment.value = '';
};

const getSenderName = (sender) => {
  switch (sender) {
    case 'student':
    case 'estudiante':
    case 'usuario':
      // Asegurarse de mostrar el nombre completo del estudiante
      return props.studentName || 'Student';
    case 'tutor':
      return props.tutorName || 'Tutor';
    case 'teacher':
    case 'profesor':
      return 'Teacher';
    default:
      // Si no coincide con ninguno de los anteriores, mostrar el nombre del estudiante
      return props.studentName || sender;
  }
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return date.toLocaleString();
};

// Reset form when modal closes and scroll to bottom when opens
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    newComment.value = '';
    errorMessage.value = '';
  } else {
    // Cuando se abre el modal, hacer scroll al final después de un breve retraso
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        // Asegurar que se haga scroll hasta el final, incluyendo el espaciador
        messagesContainer.scrollTop = messagesContainer.scrollHeight + 100;
        console.log('Modal opened, scrolled to bottom:', messagesContainer.scrollHeight);
      }
    }, 500); // Aumentar el tiempo de espera para asegurar que todo se haya renderizado
  }
});

// Watch for changes in the conversation
watch(() => props.conversation, (newConversation) => {
  if (newConversation) {
    // Log para depurar
    console.log('Conversation loaded:', newConversation);
    console.log('Student name:', props.studentName);

    // Log de los mensajes para depurar
    if (newConversation.messages && newConversation.messages.length > 0) {
      console.log('Messages:', newConversation.messages);
      newConversation.messages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, msg.sender, msg.content);
      });

      // Hacer scroll al final del contenedor de mensajes después de que se carguen
      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          // Asegurar que se haga scroll hasta el final, incluyendo el espaciador
          messagesContainer.scrollTop = messagesContainer.scrollHeight + 100;
          console.log('Scrolled to bottom:', messagesContainer.scrollHeight);
        }
      }, 300); // Aumentar el tiempo de espera para asegurar que todo se haya renderizado
    }
  }
});
</script>

<style lang="scss" scoped>
.conversation-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.98); /* Aumentada opacidad para compensar la eliminación del blur */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999; /* Valor muy alto para asegurar que esté por encima de todo */
  padding: 1rem;
  /* backdrop-filter: blur(5px); */ /* ELIMINADO: Efecto blur que causaba lag */

  /* Mejoras para móviles */
  @media (max-width: 768px) {
    padding: 0;
  }
}

.conversation-modal {
  background-color: #171717; /* Color sólido en lugar de variable para garantizar opacidad */
  border-radius: 16px;
  width: 95%;
  max-width: 800px;
  max-height: 95vh; /* Mayor altura en móviles */
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  z-index: 1001; /* Asegurar que esté por encima de todo */

  /* Mejoras para móviles */
  @media (max-width: 768px) {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Evitar scroll en el modal completo */
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--color-vivid-orange), var(--color-deep-koamaru));
    z-index: 1;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: #121212; /* Color sólido en lugar de transparente */
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
    z-index: 2;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); /* Sombra para dar profundidad */

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      padding: 1.2rem;
      position: sticky;
      top: 0;
    }

    h2 {
      color: var(--color-cashmere);
      font-size: 1.6rem;
      font-weight: var(--font-weight-bold);
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;

      /* Mejoras para móviles */
      @media (max-width: 768px) {
        font-size: 1.2rem;
      }

      &::before {
        content: '\f075';
        font-family: 'Font Awesome 5 Free';
        margin-right: 0.8rem;
        color: var(--color-vivid-orange);
        font-size: 1.4rem;
      }
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: var(--color-cashmere);
      font-size: 1.2rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
    }
  }

  .modal-body {
    padding: 2rem;
    padding-bottom: 3rem; /* Más espacio en la parte inferior */
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: #171717; /* Color sólido en lugar de gradiente */
    position: relative; /* Para posicionar elementos internos */
    height: 100%; /* Asegurar que ocupe todo el espacio disponible */

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      padding: 1rem;
      padding-bottom: 2rem; /* Más espacio en la parte inferior */
      gap: 1rem;
      overflow-y: auto !important; /* Asegurar que se pueda hacer scroll */
    }

    /* Custom scrollbar styling for TutorIA design */
    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(23, 23, 23, 0.8);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, var(--color-deep-koamaru), var(--color-vivid-orange));
      border-radius: 8px;
      border: 1px solid rgba(23, 23, 23, 0.3);
      transition: all 0.3s ease;
    }

    &::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(135deg, var(--color-vivid-orange), var(--color-forest-green));
      transform: scaleX(1.2);
    }
  }
}

.conversation-container {
  background-color: #171717;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: 100%;
}

.loading-container, .error-message, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-cashmere);
  background-color: #1a1a1a;
  padding: 2rem;
  border-radius: 12px;
}

.empty-state {
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.2);
  }

  p {
    font-size: 1.1rem;
    opacity: 0.7;
  }
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(230, 83, 29, 0.2);
  border-radius: 50%;
  border-top-color: var(--color-vivid-orange);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1.5rem;
  box-shadow: 0 0 15px rgba(230, 83, 29, 0.3);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  p {
    color: #f44336;
    font-size: 1.1rem;
    font-weight: var(--font-weight-medium);
    text-align: center;
    margin: 0;
    padding: 1rem;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(244, 67, 54, 0.3);
  }
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  max-height: 450px;
  height: 450px; /* Altura fija para asegurar que se pueda hacer scroll */
  overflow-y: auto;
  padding: 1.2rem;
  padding-bottom: 2rem; /* Más espacio en la parte inferior */
  background-color: #1a1a1a; /* Color sólido en lugar de transparente */
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

  /* Elemento espaciador para asegurar que se pueda hacer scroll hasta el final */
  .scroll-spacer {
    height: 60px; /* Altura del espaciador */
    width: 100%;
    flex-shrink: 0; /* Evitar que se comprima */
  }

  /* Mejoras para móviles */
  @media (max-width: 768px) {
    height: calc(100vh - 300px); /* Reducir la altura para asegurar que se vea todo el contenido */
    max-height: none;
    padding: 1rem;
    padding-bottom: 3rem; /* Más espacio en la parte inferior */
    gap: 1rem;
    border-radius: 8px;
    overflow-y: auto !important; /* Asegurar que se pueda hacer scroll */
    -webkit-overflow-scrolling: touch; /* Mejorar el scroll en iOS */

    /* Aumentar la altura del espaciador en móviles */
    .scroll-spacer {
      height: 100px;
    }
  }

  /* Custom scrollbar styling for TutorIA design */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(23, 23, 23, 0.8);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, var(--color-deep-koamaru), var(--color-vivid-orange));
    border-radius: 8px;
    border: 1px solid rgba(23, 23, 23, 0.3);
    transition: all 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, var(--color-vivid-orange), var(--color-forest-green));
    transform: scaleX(1.2);
  }
}

.message-item {
  padding: 1.2rem;
  border-radius: 12px;
  max-width: 80%;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
  }

  &.student-message {
    align-self: flex-end !important; /* Alineado a la derecha (lado contrario del tutor) */
    background: linear-gradient(135deg, #e6531d 0%, #d14718 100%) !important; /* Naranja TutorIA */
    color: white !important;
    border-radius: 12px 12px 0 12px !important;
    margin-left: 2rem !important;
    margin-right: 0 !important;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: -10px;
      width: 20px;
      height: 20px;
      background: linear-gradient(135deg, transparent 50%, #d14718 50%);
      transform: rotate(45deg);
      border-radius: 0 0 4px 0;
    }

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      max-width: 85%;
      margin-left: 1rem;
    }
  }

  &.tutor-message {
    align-self: flex-start !important;
    background: linear-gradient(135deg, var(--color-forest-green) 0%, #005a35 100%) !important;
    color: white !important;
    border-radius: 12px 12px 12px 0 !important;
    margin-right: 2rem !important;
    margin-left: 0 !important;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: -10px;
      width: 20px;
      height: 20px;
      background: linear-gradient(225deg, transparent 50%, #005a35 50%);
      transform: rotate(45deg);
      border-radius: 0 0 0 4px;
    }

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      max-width: 85%;
      margin-right: 1rem;
    }
  }

  &.teacher-comment {
    align-self: center;
    background: linear-gradient(135deg, var(--color-deep-koamaru) 0%, #252259 100%);
    color: white;
    width: 90%;
    border: 1px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;

    &::before {
      content: '\f075';
      font-family: 'Font Awesome 5 Free';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      color: var(--color-deep-koamaru);
      font-size: 1.2rem;
    }

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      width: 95%;
    }
  }

  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.8rem;
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 0.5rem;

    .sender-name {
      font-weight: var(--font-weight-bold);
      letter-spacing: 0.5px;
    }

    .message-time {
      opacity: 0.8;
      font-size: 0.8rem;
    }

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      padding-bottom: 0.3rem;

      .message-time {
        font-size: 0.7rem;
      }
    }
  }

  .message-content {
    p {
      margin: 0;
      line-height: 1.5;
      font-size: 1rem;

      /* Mejoras para móviles */
      @media (max-width: 768px) {
        font-size: 0.95rem;
        line-height: 1.4;
      }
    }
  }
}

.teacher-comment-section {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #1a1a1a; /* Color sólido en lugar de transparente */
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

  /* Mejoras para móviles */
  @media (max-width: 768px) {
    margin-top: 1rem;
    padding: 1rem;
    border-radius: 8px;
  }

  h3 {
    color: var(--color-cashmere);
    font-size: 1.4rem;
    margin-bottom: 1.2rem;
    font-weight: var(--font-weight-bold);
    display: flex;
    align-items: center;

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      font-size: 1.2rem;
      margin-bottom: 0.8rem;
    }

    &::before {
      content: '\f4ad';
      font-family: 'Font Awesome 5 Free';
      margin-right: 0.8rem;
      color: var(--color-forest-green);
      font-size: 1.2rem;
    }
  }

  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;

    /* Mejoras para móviles */
    @media (max-width: 768px) {
      gap: 0.8rem;
    }

    textarea {
      padding: 1rem;
      border-radius: 10px;
      background-color: #212121; /* Color sólido en lugar de transparente */
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: var(--color-cashmere);
      resize: vertical;
      font-family: inherit;
      font-size: 1rem;
      min-height: 100px;
      box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--color-forest-green);
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(0, 113, 66, 0.2);
      }

      // Custom scrollbar for textarea
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(23, 23, 23, 0.6);
        border-radius: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--color-deep-koamaru);
        border-radius: 6px;
        transition: all 0.3s ease;

        &:hover {
          background: var(--color-vivid-orange);
        }
      }

      // Firefox scrollbar
      scrollbar-width: thin;
      scrollbar-color: var(--color-deep-koamaru) rgba(23, 23, 23, 0.6);
    }

    .submit-comment-btn {
      align-self: flex-end;
      padding: 0.8rem 1.5rem;
      background: linear-gradient(135deg, var(--color-forest-green) 0%, #005a35 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(0, 113, 66, 0.3);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #005a35 0%, var(--color-forest-green) 100%);
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 113, 66, 0.4);
      }

      &:active:not(:disabled) {
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      i {
        font-size: 1.1rem;
      }
    }
  }
}
</style>
