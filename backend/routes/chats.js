import { Router } from 'express';
const router = Router();
import GeminiService from '../services/geminiService.js';
import { requireAuth } from '../middleware/auth.js';
import Chat from '../models/chat.js';
import MensajeChat from '../models/mensajeChat.js';

// Iniciar una conversación con un tutor virtual
router.post('/start', requireAuth, async (req, res) => {
  try {
    const { tutorId, message, imageUrl } = req.body;
    const userId = req.user.id;

    console.log('POST /chats/start - Request body:', { tutorId, message, imageUrl });
    console.log('User ID from auth:', userId);

    if (!tutorId || !message) {
      console.log('Missing required fields:', { tutorId, message });
      return res.status(400).json({ message: 'Se requiere el ID del tutor y un mensaje inicial' });
    }

    try {
      const result = await GeminiService.startConversation(tutorId, userId, message, imageUrl);
      console.log('Chat started successfully:', { chatId: result.chat.id });
      res.status(201).json(result);
    } catch (serviceError) {
      console.error('Error in GeminiService.startConversation:', serviceError);
      console.error('Error stack:', serviceError.stack);
      res.status(500).json({
        message: 'Error al iniciar la conversación con el tutor virtual',
        error: serviceError.message,
        details: serviceError.stack
      });
    }
  } catch (error) {
    console.error('Error en POST /chats/start:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error del servidor',
      error: error.message,
      details: error.stack
    });
  }
});

// Continuar una conversación existente
router.post('/continue', requireAuth, async (req, res) => {
  try {
    const { chatId, message, imageUrl } = req.body;
    const userId = req.user.id;

    console.log('POST /chats/continue - Request body:', { chatId, message, imageUrl });
    console.log('User ID from auth:', userId);

    if (!chatId || !message) {
      console.log('Missing required fields:', { chatId, message });
      return res.status(400).json({ message: 'Se requiere el ID del chat y un mensaje' });
    }

    try {
      // Verificar que el chat existe
      const chat = await Chat.getById(chatId);

      if (!chat) {
        console.error(`Chat with ID ${chatId} not found`);
        return res.status(404).json({ message: `Chat con ID ${chatId} no encontrado` });
      }

      // Verificar que el usuario es el propietario del chat
      if (chat.usuario_id !== userId && req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
        console.error(`User ${userId} is not authorized to access chat ${chatId}`);
        return res.status(403).json({ message: 'No tienes permiso para acceder a este chat' });
      }

      console.log(`Continuing conversation for chat ${chatId}`);
      const response = await GeminiService.continueConversation(chatId, message, imageUrl);
      console.log('Response generated successfully');

      res.json({ response });
    } catch (serviceError) {
      console.error('Error in GeminiService.continueConversation:', serviceError);
      console.error('Error stack:', serviceError.stack);
      res.status(500).json({
        message: 'Error al continuar la conversación con el tutor virtual',
        error: serviceError.message,
        details: serviceError.stack
      });
    }
  } catch (error) {
    console.error('Error en POST /chats/continue:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Error del servidor',
      error: error.message,
      details: error.stack
    });
  }
});

// Generar respuesta a partir de una imagen
router.post('/image', requireAuth, async (req, res) => {
  try {
    const { prompt, imageUrl } = req.body;

    if (!prompt || !imageUrl) {
      return res.status(400).json({ message: 'Se requiere un prompt y la URL de una imagen' });
    }

    const response = await GeminiService.generateFromImage(prompt, imageUrl);
    res.json({ response });
  } catch (error) {
    console.error('Error en POST /chats/image:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Generar texto simple con Gemini
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Se requiere un prompt' });
    }

    const response = await GeminiService.generateText(prompt);
    res.json({ response });
  } catch (error) {
    console.error('Error en POST /chats/generate:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener chats de un usuario con un tutor específico
router.get('/user/:userId/tutor/:tutorId', requireAuth, async (req, res) => {
  try {
    const { userId, tutorId } = req.params;

    // Verificar que el usuario autenticado coincide con el solicitado o es un profesor
    if (req.user.id !== userId && req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para acceder a estos chats' });
    }

    console.log(`Fetching chats for user ${userId} with tutor ${tutorId}`);

    // Obtener chats específicos entre este usuario y tutor
    const chats = await Chat.query(
      'SELECT * FROM chats WHERE usuario_id = $1 AND tutor_virtual_id = $2 ORDER BY fecha_inicio DESC',
      [userId, tutorId]
    );

    res.json(chats.rows);
  } catch (error) {
    console.error('Error en GET /chats/user/:userId/tutor/:tutorId:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener todos los chats de un usuario
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario autenticado coincide con el solicitado o es un profesor
    if (req.user.id !== userId && req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para acceder a estos chats' });
    }

    const chats = await Chat.getByUsuarioId(userId);
    res.json(chats);
  } catch (error) {
    console.error('Error en GET /chats/user/:userId:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// Obtener mensajes de un chat específico
router.get('/:chatId/messages', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Primero verificar que el chat existe y pertenece al usuario
    const chat = await Chat.getById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat no encontrado' });
    }

    // Verificar que el usuario autenticado es el dueño del chat o es un profesor
    if (req.user.id !== chat.usuario_id && req.user.rol !== 'profesor' && req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para acceder a estos mensajes' });
    }

    const messages = await MensajeChat.getByChatId(chatId);
    res.json(messages);
  } catch (error) {
    console.error('Error en GET /chats/:chatId/messages:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
