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
@import './ChatInterface.scss';
</style>
