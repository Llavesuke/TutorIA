import ApiService from './apiService';
import supabase from '@/utils/supabaseClient';
import authStore from '@/stores/authStore';

/**
 * Service for handling chat and conversation related operations
 */
class ChatService {
  /**
   * Get student interactions with a specific tutor
   * @param {string} tutorId - The ID of the tutor
   * @returns {Promise<Array>} - Array of student interactions
   */
  static async getStudentInteractionsByTutor(tutorId) {
    try {
      console.log('Getting student interactions for tutor ID:', tutorId);

      // No need to filter by educational center, just get all chats for this tutor

      // Get all chats for this tutor
      console.log('Fetching chats for tutor ID:', tutorId);
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, usuario_id, tutor_virtual_id, fecha_inicio, fecha_ultimo_mensaje')
        .eq('tutor_virtual_id', tutorId)
        .order('fecha_ultimo_mensaje', { ascending: false });

      console.log('Chats query result:', { data: chats, error: chatsError });

      if (chatsError) {
        console.error('Error getting chats:', chatsError);
        throw chatsError;
      }

      console.log('Found chats:', chats?.length || 0);

      if (!chats || chats.length === 0) {
        return [];
      }

      // Get user details for each chat
      const userIds = chats.map(chat => chat.usuario_id);
      console.log('User IDs to fetch:', userIds);

      // Fetch users one by one to avoid potential issues with the IN operator
      const users = [];
      for (const userId of userIds) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('id, nombre_real, foto_perfil, curso, clase')
          .eq('id', userId)
          .single();

        if (data && !error) {
          users.push(data);
        } else {
          console.error(`Error fetching user ${userId}:`, error);
        }
      }

      console.log('Fetched users:', users);

      // No need to check for usersError as we're handling errors individually

      // Create a map of user ID to user data
      const userMap = {};
      users?.forEach(user => {
        userMap[user.id] = user;
      });

      // Get message counts for each chat
      const chatIds = chats.map(chat => chat.id);

      // Log the chat IDs to verify we have valid data
      console.log('Chat IDs for counting messages:', chatIds);

      // Use a different approach to count messages
      const messageCounts = [];

      // For each chat, count the messages
      for (const chatId of chatIds) {
        const { count, error } = await supabase
          .from('mensajes_chat')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chatId);

        if (!error) {
          messageCounts.push({ chat_id: chatId, count: count });
        } else {
          console.error(`Error counting messages for chat ${chatId}:`, error);
        }
      }

      // No need to check for countError as we're handling errors individually

      // Create a map of chat_id to message count
      const messageCountMap = {};
      messageCounts.forEach(item => {
        messageCountMap[item.chat_id] = parseInt(item.count);
      });

      // Format the response
      console.log('User map:', userMap);

      const interactions = chats.map(chat => {
        console.log('Processing chat:', chat);
        const student = userMap[chat.usuario_id];
        console.log('Student data for chat:', student);

        if (!student) {
          console.warn(`No student data found for user ID ${chat.usuario_id}`);
          return null;
        }

        return {
          id: chat.id,
          chatId: chat.id,
          student: {
            id: student.id,
            name: student.nombre_real || 'Unknown Student',
            avatar: student.foto_perfil,
            grade: student.curso || '',
            class: student.clase || ''
          },
          lastInteraction: chat.fecha_ultimo_mensaje,
          messageCount: messageCountMap[chat.id] || 0
        };
      }).filter(Boolean); // Remove null entries

      console.log('Formatted interactions:', interactions);

      // If no interactions were found, log a clear message
      if (interactions.length === 0) {
        console.warn('No student interactions found for tutor ID:', tutorId);
      }

      return interactions;
    } catch (error) {
      console.error('Error getting student interactions:', error);
      throw error;
    }
  }

  /**
   * Get a full conversation between a student and a tutor
   * @param {string} chatId - The ID of the chat
   * @returns {Promise<Object>} - The conversation with messages
   */
  static async getConversation(chatId) {
    try {
      console.log('Getting conversation for chat ID:', chatId);

      // Get the chat details
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id, usuario_id, tutor_virtual_id, fecha_inicio, fecha_ultimo_mensaje')
        .eq('id', chatId)
        .single();

      if (chatError) {
        console.error('Error getting chat:', chatError);
        throw chatError;
      }

      if (!chat) {
        console.warn('No chat found with ID:', chatId);
        return null;
      }

      // Get user details
      const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre_real')
        .eq('id', chat.usuario_id)
        .single();

      if (userError) {
        console.error('Error getting user:', userError);
      }

      // Get tutor details
      const { data: tutor, error: tutorError } = await supabase
        .from('tutores_virtuales')
        .select('id, nombre')
        .eq('id', chat.tutor_virtual_id)
        .single();

      if (tutorError) {
        console.error('Error getting tutor:', tutorError);
      }

      // Get all messages for this chat
      console.log('Fetching messages for chat ID:', chatId);
      const { data: messages, error: messagesError } = await supabase
        .from('mensajes_chat')
        .select('*')
        .eq('chat_id', chatId)
        .order('timestamp', { ascending: true });

      console.log('Messages query result:', { count: messages?.length || 0, error: messagesError });

      if (messagesError) throw messagesError;

      // Format the messages
      const formattedMessages = messages.map(message => {
        let sender;
        if (message.remitente === 'estudiante') {
          sender = 'student';
        } else if (message.remitente === 'tutor') {
          sender = 'tutor';
        } else if (message.remitente === 'profesor') {
          sender = 'teacher';
        } else {
          sender = message.remitente;
        }

        return {
          id: message.id,
          content: message.contenido,
          sender: sender,
          timestamp: message.timestamp
        };
      });

      // Return the formatted conversation
      return {
        id: chat.id,
        student: user ? {
          id: user.id,
          name: user.nombre_real || 'Unknown Student'
        } : { id: chat.usuario_id, name: 'Unknown Student' },
        tutor: tutor ? {
          id: tutor.id,
          name: tutor.nombre
        } : { id: chat.tutor_virtual_id, name: 'Unknown Tutor' },
        created: chat.fecha_inicio,
        updated: chat.fecha_ultimo_mensaje,
        messages: formattedMessages
      };
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  /**
   * Add a teacher comment to a conversation
   * @param {string} chatId - The ID of the chat
   * @param {string} comment - The comment text
   * @returns {Promise<Object>} - The created comment
   */
  static async addTeacherComment(chatId, comment) {
    try {
      // Get the current user's ID (teacher/admin)
      const userId = authStore.user?.value?.id;

      // Create the comment message
      console.log('Adding teacher comment to chat ID:', chatId);
      const { data, error } = await supabase
        .from('mensajes_chat')
        .insert({
          chat_id: chatId,
          contenido: comment,
          remitente: 'profesor',
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      console.log('Insert comment result:', { data, error });

      if (error) throw error;

      // Update the chat's fecha_ultimo_mensaje timestamp
      console.log('Updating chat last message timestamp for chat ID:', chatId);
      const updateTimestamp = new Date().toISOString();
      const { data: updateData, error: updateError } = await supabase
        .from('chats')
        .update({ fecha_ultimo_mensaje: updateTimestamp })
        .eq('id', chatId)
        .select();

      console.log('Update timestamp result:', { data: updateData, error: updateError, timestamp: updateTimestamp });

      return data;
    } catch (error) {
      console.error('Error adding teacher comment:', error);
      throw error;
    }
  }
}

export default ChatService;
