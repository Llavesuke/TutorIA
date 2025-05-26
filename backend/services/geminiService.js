import TutorVirtual from '../models/tutorVirtual.js';
import Chat from '../models/chat.js';
import MensajeChat from '../models/mensajeChat.js';
import ChunkTexto from '../models/chunkTexto.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import RAGService from './ragService.js';
import dotenv from 'dotenv';

// Asegurarse de que las variables de entorno estén cargadas
dotenv.config();

class GeminiService {
  /**
   * Obtener un modelo de Gemini
   * @param {string} modelName - Nombre del modelo (opcional, usará el modelo predeterminado si no se especifica)
   * @param {Object} options - Opciones adicionales para el modelo
   * @returns {Object} Modelo de Gemini
   */
  static getModel(modelName = null) {
    try {
      // Obtener la API key del archivo .env
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.error('GEMINI_API_KEY not found in environment variables');
        throw new Error('API key for Gemini not configured');
      }

      console.log('Using Gemini API key starting with:', apiKey.substring(0, 10) + '...');

      // Usar el modelo predeterminado si no se especifica
      const modelToUse = modelName || 'gemini-2.0-flash';
      console.log('Using Gemini model:', modelToUse);

      // Inicializar el cliente de Google Generative AI con la API key
      const genAI = new GoogleGenerativeAI(apiKey);

      // Obtener el modelo
      return genAI.getGenerativeModel({ model: modelToUse });
    } catch (error) {
      console.error('Error initializing Gemini model:', error);
      throw error;
    }
  }

  /**
   * Generar una respuesta de texto con Gemini
   * @param {string} prompt - Texto de entrada para el modelo
   * @param {Object} options - Opciones adicionales para la generación
   * @returns {string} Respuesta generada
   */
  static async generateText(prompt, options = {}) {
    try {
      console.log(`Generating text with prompt length: ${prompt.length} characters`);

      // Obtener el modelo gemini-2.0-flash
      const model = this.getModel('gemini-2.0-flash');

      // Generar contenido
      console.log('Sending request to Gemini API...');
      const result = await model.generateContent(prompt);
      console.log('Received response from Gemini API');

      const response = await result.response;
      const responseText = response.text();

      console.log(`Generated text with length: ${responseText.length} characters`);
      return responseText;
    } catch (error) {
      console.error('Error al generar texto con Gemini:', error);
      console.error('Error details:', error.stack);

      // Proporcionar un mensaje de error más descriptivo
      if (error.message.includes('API key')) {
        throw new Error('Error de configuración: API key de Gemini no válida o no configurada');
      } else if (error.message.includes('network')) {
        throw new Error('Error de red al comunicarse con la API de Gemini');
      } else {
        throw new Error(`Error al generar texto con Gemini: ${error.message}`);
      }
    }
  }

  /**
   * Generar una respuesta basada en una imagen con Gemini
   * @param {string} prompt - Texto de entrada para el modelo
   * @param {string} imageUrl - URL de la imagen
   * @param {Object} options - Opciones adicionales para la generación
   * @returns {string} Respuesta generada
   */
  static async generateFromImage(prompt, imageUrl, options = {}) {
    try {
      // Obtener la imagen desde la URL
      const imageResponse = await fetch(imageUrl);
      const imageData = await imageResponse.arrayBuffer();

      // Convertir a formato base64
      const base64Image = Buffer.from(imageData).toString('base64');

      // Crear parte de imagen para el modelo
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: this._getMimeType(imageUrl)
        }
      };

      // Crear parte de texto
      const textPart = { text: prompt };

      // Crear el modelo vision (usando gemini-2.0-flash)
      const model = this.getModel('gemini-2.0-flash');

      // Generar contenido con partes múltiples
      const result = await model.generateContent([textPart, imagePart]);
      const response = await result.response;

      return response.text();
    } catch (error) {
      console.error('Error al generar respuesta basada en imagen con Gemini:', error);
      throw error;
    }
  }

  /**
   * Iniciar una conversación con un tutor virtual
   * @param {string} tutorId - ID del tutor virtual
   * @param {string} userId - ID del usuario
   * @param {string} initialMessage - Mensaje inicial del usuario
   * @param {string} imageUrl - URL de imagen adjunta (opcional)
   * @returns {Object} Información de la conversación y respuesta del tutor
   */
  static async startConversation(tutorId, userId, initialMessage, imageUrl = null) {
    try {
      console.log(`Starting conversation with tutor ${tutorId} for user ${userId}`);

      // Obtener información del tutor virtual
      const tutor = await TutorVirtual.getById(tutorId);
      if (!tutor) {
        console.error(`Tutor virtual con ID ${tutorId} no encontrado`);
        throw new Error(`Tutor virtual con ID ${tutorId} no encontrado`);
      }

      console.log(`Found tutor: ${tutor.nombre} (${tutor.tipo})`);

      // Crear un chat en la base de datos
      console.log(`Creating chat for user ${userId} with tutor ${tutorId}`);
      const chat = await Chat.create(userId, tutorId);
      console.log(`Chat created with ID: ${chat.id}`);

      // Recuperar contexto RAG si está disponible
      console.log('Retrieving RAG context...');
      const ragContext = await this.retrieveRAGContext(tutorId, initialMessage);

      // Generar el prompt inicial basado en la configuración del tutor
      const systemPrompt = this._generateSystemPrompt(tutor);

      // Construir el prompt completo con contexto RAG si está disponible
      let fullPrompt = systemPrompt;

      if (ragContext.hasContext) {
        console.log(`Adding enhanced RAG context with ${ragContext.chunks.length} chunks`);
        console.log(`Synthesized knowledge preview: ${ragContext.synthesizedKnowledge.substring(0, 200)}...`);

        if (ragContext.synthesizedKnowledge && ragContext.synthesizedKnowledge.trim().length > 0) {
          fullPrompt += `\n\nCONOCIMIENTO ESPECIALIZADO RELEVANTE:\n${ragContext.synthesizedKnowledge}\n\nINSTRUCCIÓN CRÍTICA: Este conocimiento especializado es altamente relevante para la pregunta del usuario. DEBES utilizarlo como base principal de tu respuesta. Integra esta información de manera natural en tu respuesta como si fuera parte de tu conocimiento propio. NO menciones que proviene de documentos externos. Si la pregunta está directamente relacionada con este conocimiento, úsalo como fuente principal de información. Responde de manera natural y conversacional como ${tutor.nombre}.`;
        } else {
          console.log('Warning: Synthesized knowledge is empty, using fallback context');
          fullPrompt += `\n\nCONTEXTO DISPONIBLE:\n${ragContext.contextText}\n\nINSTRUCCIÓN: Tienes acceso a información especializada relevante. Utilízala cuando sea apropiado para responder al usuario de manera natural.`;
        }
      } else {
        console.log('No RAG context available for this query');
      }

      fullPrompt += `\n\nUsuario: ${initialMessage}`;
      console.log(`Generated prompt with length: ${fullPrompt.length} characters`);

      // Generar respuesta con Gemini
      console.log('Generating response with Gemini...');
      let tutorResponse;

      if (imageUrl) {
        console.log('Generating response with image:', imageUrl);
        tutorResponse = await this.generateFromImage(fullPrompt, imageUrl);
      } else {
        tutorResponse = await this.generateText(fullPrompt);
      }
      console.log(`Received response with length: ${tutorResponse.length} characters`);

      // Guardar el mensaje del usuario y la respuesta del tutor en la base de datos
      console.log(`Saving messages to database for chat ${chat.id}`);
      const tipoMensaje = imageUrl ? 'imagen' : 'texto';
      await MensajeChat.create(chat.id, 'usuario', initialMessage, imageUrl, tipoMensaje);
      await MensajeChat.create(chat.id, 'tutor', tutorResponse);
      console.log('Messages saved successfully');

      return {
        chat,
        tutorResponse,
        tutor
      };
    } catch (error) {
      console.error('Error al iniciar conversación con tutor virtual:', error);
      console.error('Error details:', error.stack);
      throw error;
    }
  }

  /**
   * Continuar una conversación con un tutor virtual
   * @param {string} chatId - ID del chat
   * @param {string} message - Mensaje del usuario
   * @param {string} imageUrl - URL de imagen adjunta (opcional)
   * @returns {string} Respuesta del tutor
   */
  static async continueConversation(chatId, message, imageUrl = null) {
    try {
      console.log(`Continuing conversation for chat ID: ${chatId}`);

      // Obtener el historial de mensajes del chat
      console.log(`Fetching message history for chat ${chatId}`);
      const messages = await MensajeChat.getByChatId(chatId);
      console.log(`Found ${messages.length} messages in chat history`);

      // Obtener información del chat y del tutor
      console.log(`Fetching chat details for ID: ${chatId}`);
      const chat = await Chat.getById(chatId);
      if (!chat) {
        console.error(`Chat with ID ${chatId} not found`);
        throw new Error(`Chat con ID ${chatId} no encontrado`);
      }
      console.log(`Chat found: ${JSON.stringify(chat)}`);

      console.log(`Fetching tutor details for ID: ${chat.tutor_virtual_id}`);
      const tutor = await TutorVirtual.getById(chat.tutor_virtual_id);
      if (!tutor) {
        console.error(`Tutor virtual with ID ${chat.tutor_virtual_id} not found`);
        throw new Error(`Tutor virtual no encontrado para el chat ${chatId}`);
      }
      console.log(`Tutor found: ${tutor.nombre} (${tutor.tipo})`);

      // Recuperar contexto RAG si está disponible
      console.log('Retrieving RAG context...');
      const ragContext = await this.retrieveRAGContext(chat.tutor_virtual_id, message);

      // Generar el prompt con el historial de la conversación
      console.log('Generating system prompt based on tutor configuration');
      const systemPrompt = this._generateSystemPrompt(tutor);
      let conversationHistory = '';

      // Limitar el historial a los últimos 10 mensajes para evitar tokens excesivos
      const recentMessages = messages.slice(-10);
      console.log(`Using ${recentMessages.length} recent messages for context`);

      for (const msg of recentMessages) {
        const role = msg.remitente === 'usuario' ? 'Usuario' : 'Tutor';
        conversationHistory += `${role}: ${msg.contenido}\n`;
      }

      // Construir el prompt completo con contexto RAG si está disponible
      let fullPrompt = systemPrompt;

      if (ragContext.hasContext) {
        console.log(`Adding enhanced RAG context with ${ragContext.chunks.length} chunks`);
        console.log(`Synthesized knowledge preview: ${ragContext.synthesizedKnowledge.substring(0, 200)}...`);

        if (ragContext.synthesizedKnowledge && ragContext.synthesizedKnowledge.trim().length > 0) {
          fullPrompt += `\n\nCONOCIMIENTO ESPECIALIZADO RELEVANTE:\n${ragContext.synthesizedKnowledge}\n\nINSTRUCCIÓN CRÍTICA: Este conocimiento especializado es altamente relevante para la pregunta del usuario. DEBES utilizarlo como base principal de tu respuesta. Integra esta información de manera natural en tu respuesta como si fuera parte de tu conocimiento propio. NO menciones que proviene de documentos externos. Si la pregunta está directamente relacionada con este conocimiento, úsalo como fuente principal de información. Responde de manera natural y conversacional como ${tutor.nombre}.`;
        } else {
          console.log('Warning: Synthesized knowledge is empty, using fallback context');
          fullPrompt += `\n\nCONTEXTO DISPONIBLE:\n${ragContext.contextText}\n\nINSTRUCCIÓN: Tienes acceso a información especializada relevante. Utilízala cuando sea apropiado para responder al usuario de manera natural.`;
        }
      } else {
        console.log('No RAG context available for this query');
      }

      fullPrompt += `\n\n${conversationHistory}\nUsuario: ${message}`;
      console.log(`Generated full prompt with length: ${fullPrompt.length} characters`);

      // Generar respuesta con Gemini
      console.log('Generating response with Gemini...');
      let tutorResponse;

      if (imageUrl) {
        console.log('Generating response with image:', imageUrl);
        tutorResponse = await this.generateFromImage(fullPrompt, imageUrl);
      } else {
        tutorResponse = await this.generateText(fullPrompt);
      }
      console.log(`Generated response with length: ${tutorResponse.length} characters`);

      // Guardar el mensaje del usuario y la respuesta del tutor en la base de datos
      console.log('Saving user message to database');
      const tipoMensaje = imageUrl ? 'imagen' : 'texto';
      await MensajeChat.create(chatId, 'usuario', message, imageUrl, tipoMensaje);

      console.log('Saving tutor response to database');
      await MensajeChat.create(chatId, 'tutor', tutorResponse);
      console.log('Messages saved successfully');

      return tutorResponse;
    } catch (error) {
      console.error('Error al continuar conversación con tutor virtual:', error);
      console.error('Error details:', error.stack);

      // Proporcionar mensajes de error más descriptivos
      if (error.message.includes('API key')) {
        throw new Error('Error de configuración: API key de Gemini no válida o no configurada');
      } else if (error.message.includes('network')) {
        throw new Error('Error de red al comunicarse con la API de Gemini');
      } else if (error.message.includes('no encontrado')) {
        throw error; // Mantener el mensaje original para errores de "no encontrado"
      } else {
        throw new Error(`Error al generar respuesta del tutor: ${error.message}`);
      }
    }
  }

  /**
   * Recuperar contexto RAG para un tutor virtual con búsqueda inteligente
   * @param {string} tutorVirtualId - ID del tutor virtual
   * @param {string} userMessage - Mensaje del usuario
   * @param {number} maxChunks - Número máximo de chunks a recuperar
   * @param {number} threshold - Umbral de similitud (0-1)
   * @returns {Promise<Object>} Contexto RAG con chunks relevantes
   */
  static async retrieveRAGContext(tutorVirtualId, userMessage, maxChunks = 5, threshold = 0.4) {
    try {
      console.log(`Retrieving enhanced RAG context for tutor ${tutorVirtualId} with query: "${userMessage}"`);

      // Verificar si el tutor tiene chunks disponibles
      const hasChunks = await ChunkTexto.tutorHasChunks(tutorVirtualId);
      if (!hasChunks) {
        console.log(`No RAG chunks found for tutor ${tutorVirtualId}`);
        return {
          hasContext: false,
          chunks: [],
          contextText: '',
          synthesizedKnowledge: '',
          message: 'No hay documentos de contexto disponibles para este tutor'
        };
      }

      // Expandir la consulta para mejorar la búsqueda
      const expandedQueries = this.expandQuery(userMessage);
      console.log(`Expanded query into ${expandedQueries.length} variations:`, expandedQueries);

      let allRelevantChunks = [];

      // Buscar con cada variación de la consulta
      for (const query of expandedQueries) {
        console.log(`Searching with query variation: "${query}"`);
        const queryEmbedding = await RAGService.generateEmbedding(query);

        const similarChunks = await ChunkTexto.searchSimilarWithContext(
          queryEmbedding,
          tutorVirtualId,
          Math.ceil(maxChunks / expandedQueries.length) + 2,
          threshold
        );

        console.log(`Found ${similarChunks.length} chunks for query: "${query}"`);

        // Agregar chunks únicos
        for (const chunk of similarChunks) {
          if (!allRelevantChunks.find(existing => existing.id === chunk.id)) {
            allRelevantChunks.push({
              ...chunk,
              query_used: query,
              relevance_score: parseFloat(chunk.similarity) || (1 - parseFloat(chunk.distance))
            });
          }
        }
      }

      if (allRelevantChunks.length === 0) {
        console.log(`No similar chunks found for tutor ${tutorVirtualId} with threshold ${threshold}`);
        return {
          hasContext: false,
          chunks: [],
          contextText: '',
          synthesizedKnowledge: '',
          message: 'No se encontró contexto relevante en los documentos'
        };
      }

      // Ordenar por relevancia y tomar los mejores
      allRelevantChunks.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
      const topChunks = allRelevantChunks.slice(0, maxChunks);

      // Sintetizar el conocimiento de manera natural
      const synthesizedKnowledge = this.synthesizeKnowledge(topChunks, userMessage);

      console.log(`Retrieved ${topChunks.length} relevant chunks for enhanced RAG context`);

      return {
        hasContext: true,
        chunks: topChunks,
        contextText: this.formatContextForAI(topChunks),
        synthesizedKnowledge: synthesizedKnowledge,
        message: `Se encontraron ${topChunks.length} fragmentos relevantes de contexto`
      };

    } catch (error) {
      console.error('Error retrieving RAG context:', error);
      return {
        hasContext: false,
        chunks: [],
        contextText: '',
        synthesizedKnowledge: '',
        message: 'Error al recuperar contexto de documentos',
        error: error.message
      };
    }
  }

  /**
   * Expandir consulta para mejorar la búsqueda semántica (case insensitive)
   * @param {string} query - Consulta original
   * @returns {Array<string>} Array de consultas expandidas
   */
  static expandQuery(query) {
    const originalQuery = query.trim();
    const queries = [
      originalQuery, // Consulta original
      originalQuery.toLowerCase(), // Versión en minúsculas
      this.capitalizeWords(originalQuery.toLowerCase()) // Versión con capitalización apropiada
    ];

    // Extraer palabras clave importantes (case insensitive)
    const keywords = originalQuery.toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ') // Incluir caracteres especiales del español
      .split(/\s+/)
      .filter(word => word.length > 2) // Reducido para capturar más nombres
      .filter(word => !['como', 'que', 'cual', 'donde', 'cuando', 'porque', 'para', 'con', 'sin', 'sobre', 'bajo', 'entre', 'del', 'las', 'los', 'una', 'uno', 'por', 'son', 'está', 'este', 'esta'].includes(word));

    console.log(`Extracted keywords (case insensitive):`, keywords);

    // Crear variaciones de la consulta
    if (keywords.length > 0) {
      // Consulta solo con palabras clave principales (diferentes capitalizaciones)
      const keywordQuery = keywords.slice(0, 3).join(' ');
      queries.push(keywordQuery);
      queries.push(this.capitalizeWords(keywordQuery));

      // Consulta con sinónimos conceptuales
      const conceptualQuery = this.generateConceptualQuery(originalQuery);
      if (conceptualQuery && conceptualQuery !== originalQuery.toLowerCase()) {
        queries.push(conceptualQuery);
        queries.push(this.capitalizeWords(conceptualQuery));
      }
    }

    // Remover duplicados y limitar
    const uniqueQueries = [...new Set(queries)].slice(0, 5);
    console.log(`Generated case-insensitive query variations:`, uniqueQueries);

    return uniqueQueries;
  }

  /**
   * Capitalizar palabras apropiadamente
   * @param {string} text - Texto a capitalizar
   * @returns {string} Texto con capitalización apropiada
   */
  static capitalizeWords(text) {
    return text.replace(/\b\w+/g, word => {
      // No capitalizar palabras muy cortas (artículos, preposiciones)
      if (word.length <= 2 && !['el', 'la', 'lo', 'al', 'de', 'en', 'un', 'es'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  }

  /**
   * Generar consulta conceptual con sinónimos
   * @param {string} query - Consulta original
   * @returns {string} Consulta conceptual
   */
  static generateConceptualQuery(query) {
    const synonymMap = {
      'explicar': 'definir describir aclarar',
      'como': 'manera forma método proceso',
      'que': 'cual qué',
      'funciona': 'opera trabaja actúa',
      'diferencia': 'distinción contraste comparación',
      'ejemplo': 'caso muestra ilustración',
      'ventaja': 'beneficio provecho utilidad',
      'problema': 'dificultad inconveniente obstáculo',
      'solución': 'respuesta resolución alternativa',
      'importante': 'relevante significativo crucial',
      'básico': 'fundamental elemental esencial'
    };

    let conceptualQuery = query.toLowerCase();

    for (const [word, synonyms] of Object.entries(synonymMap)) {
      if (conceptualQuery.includes(word)) {
        const synonymList = synonyms.split(' ');
        const randomSynonym = synonymList[Math.floor(Math.random() * synonymList.length)];
        conceptualQuery = conceptualQuery.replace(word, randomSynonym);
        break; // Solo reemplazar una palabra para mantener coherencia
      }
    }

    return conceptualQuery !== query.toLowerCase() ? conceptualQuery : null;
  }

  /**
   * Sintetizar conocimiento de chunks relevantes
   * @param {Array} chunks - Chunks relevantes
   * @param {string} userQuery - Consulta del usuario
   * @returns {string} Conocimiento sintetizado
   */
  static synthesizeKnowledge(chunks, userQuery) {
    if (chunks.length === 0) {
      console.log('No chunks to synthesize');
      return '';
    }

    console.log(`Synthesizing knowledge from ${chunks.length} chunks for query: "${userQuery}"`);

    // Combinar contenido de chunks de manera inteligente
    const combinedContent = chunks
      .map((chunk, index) => {
        console.log(`Chunk ${index + 1}: ${chunk.contenido_texto.substring(0, 100)}...`);
        return chunk.contenido_texto;
      })
      .join('\n\n')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`Combined content length: ${combinedContent.length} characters`);

    // Si el contenido combinado es muy corto, devolverlo directamente
    if (combinedContent.length < 200) {
      console.log('Content too short, returning directly');
      return combinedContent;
    }

    // Extraer información clave basada en la consulta
    const keyInfo = this.extractKeyInformation(combinedContent, userQuery);

    console.log(`Synthesized knowledge length: ${keyInfo.length} characters`);

    // Si no se extrajo información clave, usar el contenido combinado
    if (keyInfo.length < 50) {
      console.log('Key info extraction failed, using combined content');
      return combinedContent.substring(0, 1000); // Limitar a 1000 caracteres
    }

    return keyInfo;
  }

  /**
   * Extraer información clave del contenido (case insensitive)
   * @param {string} content - Contenido combinado
   * @param {string} query - Consulta del usuario
   * @returns {string} Información clave extraída
   */
  static extractKeyInformation(content, query) {
    console.log(`Extracting key information (case insensitive) from ${content.length} characters for query: "${query}"`);

    // Dividir en oraciones
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    console.log(`Found ${sentences.length} sentences`);

    // Extraer palabras clave de la consulta (case insensitive y más permisivo)
    const queryKeywords = query.toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ') // Incluir caracteres especiales del español
      .split(/\s+/)
      .filter(word => word.length > 2) // Reducido para capturar nombres cortos
      .filter(word => !['que', 'como', 'cual', 'donde', 'cuando', 'porque', 'para', 'con', 'sin', 'sobre', 'bajo', 'entre', 'por', 'una', 'uno', 'del', 'las', 'los', 'son', 'está', 'este', 'esta', 'muy', 'más', 'pero', 'también', 'solo', 'cada', 'todo', 'toda'].includes(word));

    console.log(`Query keywords (case insensitive):`, queryKeywords);

    // Puntuar oraciones por relevancia (algoritmo mejorado case insensitive)
    const scoredSentences = sentences.map(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const normalizedSentence = lowerSentence
        .replace(/[^\w\sáéíóúñü]/g, ' ')
        .replace(/\s+/g, ' ');

      let score = 0;

      queryKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();

        // Coincidencia exacta de palabra completa (case insensitive)
        const wordBoundaryRegex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        if (wordBoundaryRegex.test(normalizedSentence)) {
          score += 3; // Mayor puntuación para coincidencias exactas
        }

        // Coincidencia exacta como substring (case insensitive)
        else if (normalizedSentence.includes(keywordLower)) {
          score += 2;
        }

        // Coincidencia parcial (para palabras relacionadas, case insensitive)
        else if (keywordLower.length > 3) {
          const partialKeyword = keywordLower.substring(0, Math.max(3, keywordLower.length - 2));
          if (normalizedSentence.includes(partialKeyword)) {
            score += 1;
          }
        }

        // Búsqueda de variaciones con acentos
        const keywordVariations = this.generateAccentVariations(keywordLower);
        keywordVariations.forEach(variation => {
          if (variation !== keywordLower && normalizedSentence.includes(variation)) {
            score += 2;
          }
        });
      });

      // Bonus por longitud de oración (oraciones más largas suelen tener más información)
      if (sentence.length > 50) {
        score += 0.5;
      }

      // Bonus por presencia de nombres propios (palabras capitalizadas)
      const capitalizedWords = sentence.match(/\b[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+/g);
      if (capitalizedWords && capitalizedWords.length > 0) {
        score += 0.3 * capitalizedWords.length;
      }

      return { sentence: sentence.trim(), score };
    });

    console.log(`Scored sentences (case insensitive):`, scoredSentences.slice(0, 3).map(s => ({ score: s.score, preview: s.sentence.substring(0, 50) })));

    // Tomar las oraciones más relevantes (más permisivo)
    let topSentences = scoredSentences
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8) // Aumentado para capturar más información relevante
      .map(item => item.sentence);

    // Si no hay oraciones con score > 0, tomar las primeras oraciones
    if (topSentences.length === 0) {
      console.log('No scored sentences found, taking first sentences');
      topSentences = sentences.slice(0, 4);
    }

    const result = topSentences.join('. ') + (topSentences.length > 0 ? '.' : '');
    console.log(`Extracted key information length: ${result.length}`);

    return result;
  }

  /**
   * Generar variaciones de una palabra con y sin acentos
   * @param {string} word - Palabra original
   * @returns {Array<string>} Array de variaciones
   */
  static generateAccentVariations(word) {
    const variations = [word];

    // Mapeo de caracteres con y sin acentos
    const accentMap = {
      'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
      'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
      'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
      'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
      'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
      'ñ': 'n'
    };

    // Generar versión sin acentos
    let withoutAccents = word;
    for (const [accented, plain] of Object.entries(accentMap)) {
      withoutAccents = withoutAccents.replace(new RegExp(accented, 'g'), plain);
    }

    if (withoutAccents !== word) {
      variations.push(withoutAccents);
    }

    // Generar versión con acentos (si la palabra original no los tiene)
    const reverseAccentMap = {
      'a': ['á', 'à', 'ä', 'â'],
      'e': ['é', 'è', 'ë', 'ê'],
      'i': ['í', 'ì', 'ï', 'î'],
      'o': ['ó', 'ò', 'ö', 'ô'],
      'u': ['ú', 'ù', 'ü', 'û'],
      'n': ['ñ']
    };

    // Solo generar algunas variaciones comunes para evitar demasiadas combinaciones
    if (word.includes('a') && !word.includes('á')) {
      variations.push(word.replace('a', 'á'));
    }
    if (word.includes('e') && !word.includes('é')) {
      variations.push(word.replace('e', 'é'));
    }
    if (word.includes('i') && !word.includes('í')) {
      variations.push(word.replace('i', 'í'));
    }
    if (word.includes('o') && !word.includes('ó')) {
      variations.push(word.replace('o', 'ó'));
    }
    if (word.includes('u') && !word.includes('ú')) {
      variations.push(word.replace('u', 'ú'));
    }
    if (word.includes('n') && !word.includes('ñ')) {
      variations.push(word.replace('n', 'ñ'));
    }

    return [...new Set(variations)]; // Remover duplicados
  }

  /**
   * Formatear contexto para la IA de manera natural
   * @param {Array} chunks - Chunks relevantes
   * @returns {string} Contexto formateado
   */
  static formatContextForAI(chunks) {
    if (chunks.length === 0) return '';

    // Agrupar chunks por documento
    const chunksByDocument = {};
    chunks.forEach(chunk => {
      const docName = chunk.nombre_archivo;
      if (!chunksByDocument[docName]) {
        chunksByDocument[docName] = [];
      }
      chunksByDocument[docName].push(chunk);
    });

    // Formatear de manera natural sin mencionar documentos explícitamente
    let formattedContext = '';

    Object.values(chunksByDocument).forEach(docChunks => {
      const combinedText = docChunks
        .map(chunk => chunk.contenido_texto)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (combinedText.length > 0) {
        formattedContext += combinedText + ' ';
      }
    });

    return formattedContext.trim();
  }

  /**
   * Generar un prompt de sistema basado en la configuración del tutor
   * @param {Object} tutor - Información del tutor virtual
   * @returns {string} Prompt de sistema
   * @private
   */
  static _generateSystemPrompt(tutor) {
    // Prompt predefinido que siempre debe estar presente en todos los tutores
    const predefinedPrompt = `Objetivo:
La IA debe actuar como guía educativa, ayudando a los estudiantes a aprender por sí mismos y fomentando el desarrollo de habilidades de pensamiento crítico y autonomía. No debe proporcionar respuestas completas de inmediato, sino orientar, motivar y acompañar en el proceso de descubrimiento.

Directrices:

Fomenta el Aprendizaje Activo:

No des las respuestas directamente.

Haz preguntas, da pistas y ejemplos que ayuden al alumno a reflexionar y buscar la solución por sí mismo.

Apoya, No Resuelvas:

Solo proporciona la solución completa si el estudiante ha demostrado esfuerzo real y sigue atascado tras varios intentos guiados.

Lenguaje Claro y Adecuado:

Usa un lenguaje sencillo, correcto y apropiado para niños y jóvenes.

Evita temas adultos o fuera del ámbito educativo.

Motiva e Incentiva:

Anima al alumno a seguir intentándolo.

Refuerza sus logros y su progreso, aunque sean pequeños.

Respuestas Breves y Claras:

Evita textos largos o complicados.

Sé conciso y directo, adaptando la explicación al nivel del estudiante.

Formato de Mensajes:

NUNCA uses markdown, código HTML, o símbolos especiales de formato como *, **, _, \`, etc.

Usa texto plano únicamente con formato natural y legible.

Para listas, usa guiones simples (-) o números seguidos de punto (1., 2., 3.).

Para énfasis, usa MAYÚSCULAS ocasionalmente o repite la palabra importante.

Separa ideas con saltos de línea simples para mejorar la legibilidad.

Usa espacios y puntuación natural para estructurar el contenido.

Contexto Educativo:

Mantén siempre el enfoque en el aprendizaje y el conocimiento.`;

    // Obtener la configuración del tutor
    const config = tutor.configuracion || {};

    // Construir el prompt base según el tipo de tutor
    let basePrompt = '';

    // Definir el objetivo específico del tutor
    const tutorObjective = tutor.objetivo && tutor.objetivo.trim() !== ''
      ? tutor.objetivo
      : 'ayudar al estudiante en su proceso de aprendizaje general';

    switch (tutor.tipo) {
      case 'teorico':
        basePrompt = `Eres un tutor virtual llamado ${tutor.nombre} especializado en explicar conceptos teóricos. Tu objetivo específico es: ${tutorObjective}.`;
        break;
      case 'practico':
        basePrompt = `Eres un tutor virtual llamado ${tutor.nombre} especializado en ejercicios prácticos. Tu objetivo específico es: ${tutorObjective}.`;
        break;
      case 'evaluador':
        basePrompt = `Eres un tutor virtual llamado ${tutor.nombre} especializado en evaluar el conocimiento. Tu objetivo específico es: ${tutorObjective}.`;
        break;
      default:
        basePrompt = `Eres un tutor virtual llamado ${tutor.nombre}. Tu objetivo específico es: ${tutorObjective}.`;
    }

    // Añadir instrucciones críticas para el formato de respuesta
    basePrompt += `\n\nINSTRUCCIONES CRÍTICAS DE FORMATO:
- Eres ${tutor.nombre} y SIEMPRE debes responder en primera persona como si fueras el tutor
- NUNCA uses prefijos como "Tutor:", "${tutor.nombre}:", "Asistente:" o similares antes de tus respuestas
- Responde directamente y de manera natural, como si estuvieras hablando cara a cara con el estudiante
- Usa tu nombre (${tutor.nombre}) naturalmente en la conversación cuando sea apropiado, pero no como prefijo
- Mantén un tono conversacional y natural en todo momento
- No actúes como ningún personaje existente a menos que se te indique específicamente en las instrucciones

FORMATO DE TEXTO OBLIGATORIO:
- PROHIBIDO usar markdown: nada de *, **, _, \\\`, ##, etc.
- PROHIBIDO usar código HTML o símbolos especiales de formato
- USA SOLO texto plano con formato natural
- Para listas: usa guiones simples (-) o números (1., 2., 3.)
- Para énfasis: usa MAYÚSCULAS ocasionalmente o repite palabras importantes
- Separa ideas con saltos de línea para claridad
- Estructura el contenido con espacios y puntuación natural`;

    // Añadir información específica de la configuración
    if (config.personalidad) {
      basePrompt += `\n\nTu personalidad es ${config.personalidad}.`;
    }

    if (config.conocimientos) {
      basePrompt += `\n\nTienes conocimientos especializados en: ${config.conocimientos.join(', ')}.`;
    }

    // Añadir instrucciones específicas del profesor si existen
    if (tutor.instrucciones && tutor.instrucciones.trim() !== '') {
      basePrompt += `\n\nInstrucciones específicas: ${tutor.instrucciones}`;
    } else if (config.instrucciones) {
      basePrompt += `\n\n${config.instrucciones}`;
    }

    // Añadir instrucciones finales para asegurar formato natural
    const finalInstructions = `\n\nRECORDATORIO FINAL:
- Responde SIEMPRE de manera directa y natural, sin prefijos
- Eres ${tutor.nombre} hablando directamente con el estudiante
- Ejemplo CORRECTO: "¡Hola! Me alegra que me hagas esa pregunta..."
- Ejemplo INCORRECTO: "Tutor: ¡Hola! Me alegra que me hagas esa pregunta..."
- Mantén la conversación fluida y natural en todo momento

EJEMPLOS DE FORMATO CORRECTO:
✓ "Para resolver este problema, necesitas seguir estos pasos:

1. Primero identifica los datos
2. Luego aplica la fórmula
3. Finalmente verifica el resultado

¿Te queda claro hasta aquí?"

✗ INCORRECTO: "Para resolver este problema, necesitas seguir estos pasos:
**1. Primero identifica los datos**
**2. Luego aplica la fórmula**
**3. Finalmente verifica el resultado**
¿Te queda claro hasta aquí?"

RECUERDA: Solo texto plano, sin markdown ni símbolos especiales.`;

    // Combinar el prompt predefinido con el prompt específico del tutor
    return `${predefinedPrompt}\n\n${basePrompt}${finalInstructions}`;
  }

  /**
   * Obtener el tipo MIME de una imagen basado en su URL
   * @param {string} url - URL de la imagen
   * @returns {string} Tipo MIME
   * @private
   */
  static _getMimeType(url) {
    const extension = url.split('.').pop().toLowerCase();

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/jpeg'; // Valor predeterminado
    }
  }
}

export default GeminiService;
