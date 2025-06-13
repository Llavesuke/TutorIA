/**
 * @fileoverview Rutas de chat para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con los chats entre estudiantes
 * y tutores virtuales, incluyendo inicio de conversaciones, continuación de chats, análisis de imágenes
 * y obtención de historial de conversaciones.
 *
 * Endpoints disponibles:
 * - POST /chats/start - Iniciar nueva conversación con tutor virtual
 * - POST /chats/continue - Continuar conversación existente
 * - POST /chats/image - Analizar imagen con tutor virtual
 * - POST /chats/generate - Generar texto simple con Gemini
 * - GET /chats/user/:userId/tutor/:tutorId - Obtener chats entre usuario y tutor específico
 * - GET /chats/user/:userId - Obtener todos los chats de un usuario
 * - GET /chats/:chatId/messages - Obtener mensajes de un chat específico
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
const router = Router();
import GeminiService from '../services/geminiService.js';
import { requireAuth } from '../middleware/auth.js';
import Chat from '../models/chat.js';
import MensajeChat from '../models/mensajeChat.js';

/**
 * POST /api/chats/start
 *
 * Inicia una nueva conversación con un tutor virtual
 *
 * @description Este endpoint permite a los estudiantes iniciar una nueva conversación
 * con un tutor virtual específico. Utiliza el servicio de Gemini AI para generar
 * respuestas inteligentes y contextualmente relevantes. La conversación se guarda
 * en la base de datos para mantener el historial.
 *
 * @param {Object} req.body - Datos para iniciar la conversación
 * @param {string} req.body.tutorId - ID del tutor virtual (requerido)
 * @param {string} req.body.message - Mensaje inicial del estudiante (requerido)
 * @param {string} [req.body.imageUrl] - URL de imagen adjunta (opcional)
 *
 * @returns {Object} 201 - Conversación iniciada exitosamente
 * @returns {Object} 400 - Parámetros faltantes o inválidos
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "tutorId": "1",
 *   "message": "Hola, necesito ayuda con ecuaciones lineales",
 *   "imageUrl": null
 * }
 *
 * // Response:
 * {
 *   "chat": {
 *     "id": "123",
 *     "tutor_virtual_id": "1",
 *     "usuario_id": "456",
 *     "fecha_inicio": "2024-01-15T10:30:00Z"
 *   },
 *   "response": "¡Hola! Soy tu tutor de matemáticas...",
 *   "message": "Conversación iniciada exitosamente"
 * }
 */
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

/**
 * POST /api/chats/continue
 *
 * Continúa una conversación existente con un tutor virtual
 *
 * @description Este endpoint permite a los estudiantes continuar una conversación
 * previamente iniciada con un tutor virtual. Verifica que el chat existe y que
 * el usuario tiene permisos para acceder a él antes de generar la respuesta.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {Object} req.body - Datos para continuar la conversación
 * @param {string} req.body.chatId - ID del chat existente (requerido)
 * @param {string} req.body.message - Nuevo mensaje del estudiante (requerido)
 * @param {string} [req.body.imageUrl] - URL de imagen adjunta (opcional)
 *
 * @returns {Object} 200 - Respuesta generada exitosamente
 * @returns {Object} 400 - Parámetros faltantes o inválidos
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 403 - Sin permisos para acceder al chat
 * @returns {Object} 404 - Chat no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "chatId": "123",
 *   "message": "¿Puedes explicarme más sobre las ecuaciones cuadráticas?",
 *   "imageUrl": null
 * }
 *
 * // Response:
 * {
 *   "response": "Por supuesto, las ecuaciones cuadráticas son..."
 * }
 */
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

/**
 * POST /api/chats/image
 *
 * Genera respuesta a partir de análisis de imagen
 *
 * @description Este endpoint permite analizar una imagen utilizando Gemini AI
 * y generar una respuesta basada en el contenido visual y un prompt proporcionado.
 * Útil para resolver problemas matemáticos, analizar diagramas, etc.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {Object} req.body - Datos para análisis de imagen
 * @param {string} req.body.prompt - Pregunta o instrucción sobre la imagen (requerido)
 * @param {string} req.body.imageUrl - URL de la imagen a analizar (requerido)
 *
 * @returns {Object} 200 - Análisis generado exitosamente
 * @returns {Object} 400 - Prompt e imageUrl requeridos
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "prompt": "¿Puedes resolver esta ecuación matemática?",
 *   "imageUrl": "https://example.com/math-problem.jpg"
 * }
 *
 * // Response:
 * {
 *   "response": "Veo una ecuación cuadrática. La solución es..."
 * }
 */
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

/**
 * POST /api/chats/generate
 *
 * Genera texto simple utilizando Gemini AI
 *
 * @description Este endpoint permite generar texto utilizando Gemini AI
 * sin necesidad de un contexto de chat específico. Útil para generar
 * contenido educativo, explicaciones rápidas, etc.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {Object} req.body - Datos para generación de texto
 * @param {string} req.body.prompt - Prompt para generar texto (requerido)
 *
 * @returns {Object} 200 - Texto generado exitosamente
 * @returns {Object} 400 - Prompt requerido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Request body:
 * {
 *   "prompt": "Explica qué son los números primos"
 * }
 *
 * // Response:
 * {
 *   "response": "Los números primos son números naturales mayores que 1..."
 * }
 */
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

/**
 * GET /api/chats/user/:userId/tutor/:tutorId
 *
 * Obtiene chats entre un usuario específico y un tutor virtual
 *
 * @description Este endpoint devuelve todos los chats entre un usuario específico
 * y un tutor virtual determinado. Solo el propio usuario, profesores y administradores
 * pueden acceder a esta información.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {string} req.params.userId - ID del usuario
 * @param {string} req.params.tutorId - ID del tutor virtual
 *
 * @returns {Object[]} 200 - Lista de chats entre el usuario y tutor
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 403 - Sin permisos para acceder a estos chats
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/chats/user/123/tutor/456
 *
 * // Response:
 * [
 *   {
 *     "id": "789",
 *     "usuario_id": "123",
 *     "tutor_virtual_id": "456",
 *     "fecha_inicio": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
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

/**
 * GET /api/chats/user/:userId
 *
 * Obtiene todos los chats de un usuario específico
 *
 * @description Este endpoint devuelve todos los chats de un usuario determinado,
 * independientemente del tutor virtual. Solo el propio usuario, profesores
 * y administradores pueden acceder a esta información.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {string} req.params.userId - ID del usuario
 *
 * @returns {Object[]} 200 - Lista de todos los chats del usuario
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 403 - Sin permisos para acceder a estos chats
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/chats/user/123
 *
 * // Response:
 * [
 *   {
 *     "id": "789",
 *     "usuario_id": "123",
 *     "tutor_virtual_id": "456",
 *     "fecha_inicio": "2024-01-15T10:30:00Z"
 *   }
 * ]
 */
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

/**
 * GET /api/chats/:chatId/messages
 *
 * Obtiene todos los mensajes de un chat específico
 *
 * @description Este endpoint devuelve todos los mensajes de una conversación específica.
 * Verifica que el chat existe y que el usuario tiene permisos para acceder a él.
 * Solo el propietario del chat, profesores y administradores pueden ver los mensajes.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {string} req.params.chatId - ID del chat
 *
 * @returns {Object[]} 200 - Lista de mensajes del chat
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 403 - Sin permisos para acceder a estos mensajes
 * @returns {Object} 404 - Chat no encontrado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: GET /api/chats/123/messages
 *
 * // Response:
 * [
 *   {
 *     "id": "1",
 *     "chat_id": "123",
 *     "remitente": "usuario",
 *     "contenido": "Hola, necesito ayuda",
 *     "fecha_envio": "2024-01-15T10:30:00Z"
 *   },
 *   {
 *     "id": "2",
 *     "chat_id": "123",
 *     "remitente": "tutor",
 *     "contenido": "¡Hola! ¿En qué puedo ayudarte?",
 *     "fecha_envio": "2024-01-15T10:31:00Z"
 *   }
 * ]
 */
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
