<template>
  <div class="chat-interface">
    <!-- Chat messages container -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading conversation...</p>
      </div>

      <div v-else-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <p>Start a conversation with {{ tutorName }}!</p>
      </div>

      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="{
            'user-message': message.sender === 'usuario' || message.sender === 'estudiante',
            'tutor-message': message.sender === 'tutor',
            'teacher-comment': message.sender === 'profesor',
            'animate-in': true
          }"
        >
          <!-- Sender avatar -->
          <div class="message-avatar" v-if="message.sender !== 'usuario' && message.sender !== 'estudiante'">
            <img v-if="tutorAvatar && message.sender === 'tutor'" :src="tutorAvatar" :alt="tutorName">
            <div v-else class="default-avatar">
              <span>{{ getInitials(message.sender === 'tutor' ? tutorName : 'Teacher') }}</span>
            </div>
          </div>

          <!-- Message content -->
          <div class="message-bubble">
            <div class="message-header" v-if="message.sender !== 'usuario' && message.sender !== 'estudiante'">
              <span class="sender-name">{{ message.sender === 'tutor' ? tutorName : 'Teacher' }}</span>
            </div>
            <div class="message-header" v-else>
              <span class="sender-name">{{ userName }}</span>
            </div>

            <!-- Image attachment if present -->
            <div v-if="message.adjunto_url && message.tipo_mensaje === 'imagen'" class="message-image">
              <img :src="message.adjunto_url" :alt="'Image from ' + message.sender" @click="openImageModal(message.adjunto_url)" />
            </div>

            <div class="message-content">
              <p>{{ message.content }}</p>
            </div>
          </div>

          <!-- User avatar (only shown for user messages) -->
          <div class="message-avatar user-avatar" v-if="message.sender === 'usuario' || message.sender === 'estudiante'">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName">
            <div v-else class="default-avatar">
              <span>{{ getInitials(userName) }}</span>
            </div>
          </div>

          <!-- Message timestamp -->
          <div class="message-time" v-if="message.timestamp">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>

        <!-- Typing indicator when waiting for response -->
        <TypingIndicator v-if="isSending" />
      </template>
    </div>

    <!-- Chat input area -->
    <div class="chat-input-area">
      <!-- Image preview if selected -->
      <div v-if="selectedImage" class="image-preview">
        <img :src="selectedImage.preview" alt="Selected image" />
        <button @click="removeSelectedImage" class="remove-image-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="input-row">
        <!-- Attach button -->
        <button
          class="attach-button"
          @click="triggerFileInput"
          :disabled="isLoading || isSending"
          title="Attach image"
        >
          <i class="fas fa-paperclip"></i>
        </button>

        <!-- Hidden file input -->
        <input
          type="file"
          ref="fileInput"
          @change="handleFileSelect"
          accept="image/*"
          capture="environment"
          class="hidden-file-input"
        />

        <input
          type="text"
          class="chat-input"
          v-model="newMessage"
          placeholder="Type your message here..."
          @keyup.enter="sendMessage"
          :disabled="isLoading || isSending"
        />
        <button
          class="send-button"
          @click="sendMessage"
          :disabled="(!newMessage.trim() && !selectedImage) || isLoading || isSending"
        >
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>

    <!-- Image modal -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <img :src="modalImageUrl" alt="Full size image" />
        <button @click="closeImageModal" class="close-modal-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '@/stores/authStore';
import TypingIndicator from './TypingIndicator.vue';

const props = defineProps({
  tutorId: {
    type: String,
    required: true
  },
  tutorName: {
    type: String,
    default: 'Tutor'
  },
  tutorAvatar: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['message-sent']);

// State
const messages = ref([]);
const newMessage = ref('');
const isLoading = ref(false);
const isSending = ref(false);
const errorMessage = ref('');
const chatId = ref(null);
const messagesContainer = ref(null);
const selectedImage = ref(null);
const fileInput = ref(null);
const showImageModal = ref(false);
const modalImageUrl = ref('');

// User info from auth store
const userName = computed(() => {
  const user = authStore.user.value;
  return user?.nombre_real || user?.user_metadata?.nombre_real || user?.nombre_usuario || 'Me';
});

const userAvatar = computed(() => {
  const user = authStore.user.value;
  return user?.foto_perfil || null;
});

// Methods
const loadMessages = async () => {
  try {
    isLoading.value = true;
    errorMessage.value = '';

    // Get user ID from auth store
    const user = authStore.user.value;

    if (!user || !user.id) {
      errorMessage.value = 'User not authenticated';
      return;
    }

    const userId = user.id;

    try {
      // Use API service instead of direct Supabase calls
      const ApiService = (await import('@/services/apiService')).default;

      // Get existing chats for this user and tutor
      console.log(`Fetching chats for user ${userId} and tutor ${props.tutorId}`);
      const existingChats = await ApiService.get(`/api/chats/user/${userId}/tutor/${props.tutorId}`);

      if (existingChats && existingChats.length > 0) {
        chatId.value = existingChats[0].id;
        console.log(`Found existing chat with ID: ${chatId.value}`);

        // Get messages for this chat
        const chatMessages = await ApiService.get(`/api/chats/${chatId.value}/messages`);

        if (chatMessages && chatMessages.length > 0) {
          console.log(`Loaded ${chatMessages.length} messages for chat ${chatId.value}`);

          // Format messages for display
          messages.value = chatMessages.map(msg => ({
            sender: msg.remitente,
            content: msg.contenido,
            timestamp: msg.timestamp,
            adjunto_url: msg.adjunto_url,
            tipo_mensaje: msg.tipo_mensaje || 'texto'
          }));
        } else {
          console.log('No messages found for this chat');
        }
      } else {
        console.log('No existing chats found, will create a new one when sending first message');
      }
    } catch (apiError) {
      console.error('Error fetching chat data from API:', apiError);

      // Fallback to direct database access if API fails
      try {
        console.log('Falling back to direct database access');
        // Import API service
        const ApiService = (await import('@/services/apiService')).default;

        // Get existing chats from database
        const chatsResponse = await ApiService.get(`/api/chats/user/${userId}`);

        if (chatsResponse && chatsResponse.length > 0) {
          // Find chat with this tutor
          const tutorChat = chatsResponse.find(chat => chat.tutor_virtual_id === props.tutorId);

          if (tutorChat) {
            chatId.value = tutorChat.id;
            console.log(`Found existing chat with ID: ${chatId.value}`);

            // Get messages for this chat
            const messagesResponse = await ApiService.get(`/api/chats/${chatId.value}/messages`);

            if (messagesResponse && messagesResponse.length > 0) {
              // Format messages for display
              messages.value = messagesResponse.map(msg => ({
                sender: msg.remitente,
                content: msg.contenido,
                timestamp: msg.timestamp,
                adjunto_url: msg.adjunto_url,
                tipo_mensaje: msg.tipo_mensaje || 'texto'
              }));
            }
          }
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        errorMessage.value = 'Failed to load conversation';
      }
    }
  } catch (error) {
    console.error('Error in loadMessages:', error);
    errorMessage.value = 'An error occurred while loading the conversation';
  } finally {
    isLoading.value = false;
    // Scroll to bottom after messages are loaded
    await nextTick();
    scrollToBottom();
  }
};

const sendMessage = async () => {
  if ((!newMessage.value.trim() && !selectedImage.value) || isSending.value) return;

  try {
    isSending.value = true;

    let imageUrl = null;

    // Upload image if selected
    if (selectedImage.value) {
      const ApiService = (await import('@/services/apiService')).default;
      const formData = new FormData();
      formData.append('image', selectedImage.value.file);

      try {
        const uploadResult = await ApiService.post('/api/uploads/chat-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authStore.token.value}`
          }
        });
        imageUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Error uploading image:', uploadError);
        errorMessage.value = 'Error uploading image. Please try again.';
        return;
      }
    }

    // Add user message to the UI immediately
    const userMessage = {
      sender: 'usuario',
      content: newMessage.value.trim() || (imageUrl ? 'Sent an image' : ''),
      timestamp: new Date().toISOString(),
      adjunto_url: imageUrl,
      tipo_mensaje: imageUrl ? 'imagen' : 'texto'
    };

    messages.value.push(userMessage);

    // Clear input field and selected image
    const messageText = newMessage.value.trim() || (imageUrl ? 'Sent an image' : '');
    newMessage.value = '';
    selectedImage.value = null;

    // Scroll to bottom
    await nextTick();
    scrollToBottom();

    // Import API service
    const ApiService = (await import('@/services/apiService')).default;

    // Get user ID from auth store
    const user = authStore.user.value;

    if (!user || !user.id) {
      console.error('User not authenticated');
      errorMessage.value = 'User not authenticated';
      return;
    }

    let response;

    // If we have a chat ID, continue the conversation
    if (chatId.value) {
      console.log('Continuing chat with ID:', chatId.value);
      response = await ApiService.post('/api/chats/continue', {
        chatId: chatId.value,
        message: messageText,
        imageUrl: imageUrl
      });
    } else {
      // Start a new conversation
      console.log('Starting new chat with tutor ID:', props.tutorId);
      response = await ApiService.post('/api/chats/start', {
        tutorId: props.tutorId,
        message: messageText,
        imageUrl: imageUrl
      });

      // Save the chat ID for future messages
      if (response && response.chat && response.chat.id) {
        chatId.value = response.chat.id;
        console.log('New chat created with ID:', chatId.value);
      }
    }

    // Add tutor response to the UI
    if (response) {
      const tutorResponse = {
        sender: 'tutor',
        content: response.response || response.tutorResponse,
        timestamp: new Date().toISOString()
      };

      messages.value.push(tutorResponse);

      // Emit event that message was sent successfully
      emit('message-sent', {
        userMessage: messageText,
        tutorResponse: tutorResponse.content
      });
    }

    // Scroll to bottom after adding the response
    await nextTick();
    scrollToBottom();

  } catch (error) {
    console.error('Error sending message:', error);

    // Mostrar un mensaje de error más descriptivo
    if (error.response && error.response.data && error.response.data.message) {
      // Si el servidor devuelve un mensaje de error específico
      errorMessage.value = `Error: ${error.response.data.message}`;
    } else if (error.message.includes('network') || error.message.includes('Network Error')) {
      // Error de red
      errorMessage.value = 'Error de conexión. Por favor, verifica tu conexión a internet.';
    } else if (error.message.includes('timeout')) {
      // Timeout
      errorMessage.value = 'La solicitud ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.';
    } else if (error.message.includes('401') || error.message.includes('403')) {
      // Error de autenticación
      errorMessage.value = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
    } else if (error.message.includes('404')) {
      // Recurso no encontrado
      errorMessage.value = 'El recurso solicitado no existe.';
    } else if (error.message.includes('500')) {
      // Error del servidor
      errorMessage.value = 'Error del servidor. Por favor, inténtalo más tarde.';
    } else {
      // Mensaje genérico
      errorMessage.value = 'No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.';
    }

    // Mostrar el error por 5 segundos y luego ocultarlo
    setTimeout(() => {
      if (errorMessage.value) {
        errorMessage.value = '';
      }
    }, 5000);
  } finally {
    isSending.value = false;
  }
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Watch for changes in tutorId to reload messages
watch(() => props.tutorId, () => {
  if (props.tutorId) {
    chatId.value = null;
    messages.value = [];
    loadMessages();
  }
});

// File handling functions
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errorMessage.value = 'Please select an image file';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      errorMessage.value = 'Image size must be less than 10MB';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImage.value = {
        file: file,
        preview: e.target.result
      };
    };
    reader.readAsDataURL(file);
  }

  // Clear the input
  event.target.value = '';
};

const removeSelectedImage = () => {
  selectedImage.value = null;
};

const openImageModal = (imageUrl) => {
  modalImageUrl.value = imageUrl;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImageUrl.value = '';
};

// Load messages when component is mounted
onMounted(() => {
  if (props.tutorId) {
    loadMessages();
  }
});
</script>

<style lang="scss" scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #171717;
  border-radius: 8px;
  overflow: hidden;

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    /* Custom scrollbar styles */
    &::-webkit-scrollbar {
      width: 12px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(23, 23, 23, 0.8);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    &::-webkit-scrollbar-thumb {
      background: #34307b;
      border-radius: 10px;
      border: 2px solid rgba(23, 23, 23, 0.8);
      transition: all 0.3s ease;

      &:hover {
        background: #e6531d;
        transform: scale(1.1);
      }

      &:active {
        background: #007142;
      }
    }

    &::-webkit-scrollbar-corner {
      background: rgba(23, 23, 23, 0.8);
    }

    /* Firefox scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #34307b rgba(23, 23, 23, 0.8);

    .loading-container, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #FEF0D1;
      text-align: center;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(230, 83, 29, 0.3);
        border-radius: 50%;
        border-top-color: #e6531d;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }

    .error-message {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(230, 83, 29, 0.9) 0%, rgba(209, 71, 24, 0.9) 100%);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      z-index: 100;
      max-width: 90%;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.1);

      p {
        margin: 0;
        font-weight: 500;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    }

    .message {
      display: flex;
      align-items: flex-start;
      margin-bottom: 1rem;
      max-width: 80%;

      &.animate-in {
        animation: messageAppear 0.5s ease-out forwards;
      }

      @keyframes messageAppear {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      &.user-message {
        margin-left: auto;
        flex-direction: row-reverse;
        animation: userMessageAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

        @keyframes userMessageAppear {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .message-bubble {
          background-color: #e6531d;
          color: white;
          border-radius: 18px 18px 0 18px;
          margin-right: 0.5rem;
          box-shadow: 0 4px 15px rgba(230, 83, 29, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            pointer-events: none;
          }
        }
      }

      &.tutor-message {
        margin-right: auto;
        animation: tutorMessageAppear 0.5s ease-out forwards;

        @keyframes tutorMessageAppear {
          0% {
            opacity: 0;
            transform: translateX(-30px) scale(0.9);
          }
          70% {
            opacity: 1;
            transform: translateX(5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .message-bubble {
          background-color: #007142;
          color: white;
          border-radius: 18px 18px 18px 0;
          margin-left: 0.5rem;
          box-shadow: 0 4px 15px rgba(0, 113, 66, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            pointer-events: none;
          }
        }
      }

      &.teacher-comment {
        margin-right: auto;
        margin-left: auto;

        .message-bubble {
          background-color: #34307b;
          color: white;
          border-radius: 18px;
          margin-left: 0.5rem;
          box-shadow: 0 4px 15px rgba(52, 48, 123, 0.3);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            pointer-events: none;
          }
        }
      }

      .message-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .default-avatar {
          width: 100%;
          height: 100%;
          background-color: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FEF0D1;
          font-weight: bold;
        }
      }

      .message-bubble {
        padding: 0.75rem 1rem;

        .message-header {
          margin-bottom: 0.25rem;
          font-weight: bold;
        }

        .message-image {
          margin-bottom: 0.5rem;

          img {
            max-width: 250px;
            max-height: 200px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

            &:hover {
              transform: scale(1.02);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }
          }
        }

        .message-content {
          p {
            margin: 0;
            line-height: 1.4;
          }
        }
      }

      .message-time {
        font-size: 0.75rem;
        color: rgba(254, 240, 209, 0.6);
        margin-top: 0.25rem;
        align-self: flex-end;
      }
    }
  }

  .chat-input-area {
    display: flex;
    flex-direction: column;
    padding: 1.2rem;
    background-color: #1a1a1a;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background-color: #34307b;
      opacity: 0.3;
    }

    .image-preview {
      margin-bottom: 1rem;
      position: relative;
      display: inline-block;
      max-width: 200px;

      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      }

      .remove-image-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        background-color: #e6531d;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.3s ease;

        &:hover {
          background-color: #d14718;
          transform: scale(1.1);
        }
      }
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .hidden-file-input {
      display: none;
    }

    .attach-button {
      width: 48px;
      height: 48px;
      background-color: #34307b;
      color: #FEF0D1;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 10px rgba(52, 48, 123, 0.4);

      &:hover:not(:disabled) {
        background-color: #007142;
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0, 113, 66, 0.5);
      }

      &:disabled {
        background-color: rgba(52, 48, 123, 0.5);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      i {
        font-size: 1.2rem;
      }
    }

    .chat-input {
      flex: 1;
      padding: 0.9rem 1.2rem;
      background-color: rgba(42, 42, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px;
      color: #FEF0D1;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(230, 83, 29, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: rgba(42, 42, 42, 0.95);
      }

      &::placeholder {
        color: rgba(254, 240, 209, 0.5);
      }
    }

    .send-button {
      width: 48px;
      height: 48px;
      margin-left: 0.8rem;
      background-color: #e6531d;
      color: white;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 4px 10px rgba(230, 83, 29, 0.4);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
        pointer-events: none;
      }

      i {
        font-size: 1.2rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
      }

      &:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 15px rgba(230, 83, 29, 0.5);
      }

      &:active:not(:disabled) {
        transform: translateY(0) scale(0.95);
        box-shadow: 0 2px 8px rgba(230, 83, 29, 0.4);
      }

      &:disabled {
        background-color: rgba(230, 83, 29, 0.5);
        cursor: not-allowed;
        box-shadow: none;
      }
    }
  }

  // Image modal styles
  .image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .image-modal-content {
      position: relative;
      max-width: 90%;
      max-height: 90%;
      animation: scaleIn 0.3s ease-out;

      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }

      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
      }

      .close-modal-btn {
        position: absolute;
        top: -15px;
        right: -15px;
        width: 40px;
        height: 40px;
        background-color: #e6531d;
        color: white;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1.2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(230, 83, 29, 0.4);

        &:hover {
          background-color: #d14718;
          transform: scale(1.1);
        }
      }
    }
  }
}
</style>
