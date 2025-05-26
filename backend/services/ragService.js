import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import db from '../config/db.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración del servicio RAG
const RAG_CONFIG = {
  // Tamaño máximo de chunk en caracteres
  MAX_CHUNK_SIZE: parseInt(process.env.RAG_MAX_CHUNK_SIZE) || 800,
  // Solapamiento entre chunks
  CHUNK_OVERLAP: parseInt(process.env.RAG_CHUNK_OVERLAP) || 150,
  // Configuración de similitud
  DEFAULT_SIMILARITY_THRESHOLD: parseFloat(process.env.RAG_SIMILARITY_THRESHOLD) || 0.6,
  MAX_CHUNKS_PER_QUERY: parseInt(process.env.RAG_MAX_CHUNKS) || 4,
  // Configuración de preprocesamiento
  MIN_CHUNK_LENGTH: 100,
  MAX_CHUNK_LENGTH: 1200,
  // Configuración de embeddings
  EMBEDDING_BATCH_SIZE: 3
};

// Lazy loading de pdf-parse para evitar problemas de inicialización
let pdfParseModule = null;
const getPdfParse = () => {
  if (!pdfParseModule) {
    const require = createRequire(import.meta.url);
    pdfParseModule = require('pdf-parse');
  }
  return pdfParseModule;
};

class RAGService {
  /**
   * Obtener la API key de Google para embeddings
   */
  static getEmbeddingApiKey() {
    return process.env.GOOGLE_EMBEDDING_API_KEY || process.env.GEMINI_API_KEY;
  }

  /**
   * Inicializar el cliente de Google Generative AI para embeddings
   */
  static getEmbeddingModel() {
    try {
      const apiKey = this.getEmbeddingApiKey();
      if (!apiKey) {
        throw new Error('Google Embedding API key not found');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      return genAI.getGenerativeModel({ model: 'text-embedding-004' });
    } catch (error) {
      console.error('Error initializing embedding model:', error);
      throw error;
    }
  }

  /**
   * Extraer texto de un archivo PDF
   * @param {Buffer} fileBuffer - Buffer del archivo PDF
   * @returns {Promise<string>} Texto extraído
   */
  static async extractTextFromPDF(fileBuffer) {
    try {
      console.log('Extracting text from PDF...');
      console.log(`PDF buffer size: ${fileBuffer.length} bytes`);

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('PDF buffer is empty or invalid');
      }

      // Usar lazy loading para pdf-parse
      const pdfParse = getPdfParse();

      const data = await pdfParse(fileBuffer);
      console.log(`Extracted ${data.text.length} characters from PDF`);

      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extraer texto de un archivo DOCX
   * @param {Buffer} fileBuffer - Buffer del archivo DOCX
   * @returns {Promise<string>} Texto extraído
   */
  static async extractTextFromDOCX(fileBuffer) {
    try {
      console.log('Extracting text from DOCX...');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      console.log(`Extracted ${result.value.length} characters from DOCX`);
      return result.value;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Preprocesar texto para mejorar la calidad del RAG
   * @param {string} text - Texto crudo extraído
   * @returns {string} Texto preprocesado
   */
  static preprocessText(text) {
    try {
      console.log('Preprocessing text for optimal RAG performance...');

      // 1. Normalizar espacios en blanco pero preservar estructura
      let processedText = text
        .replace(/\r\n/g, '\n')  // Normalizar saltos de línea
        .replace(/\r/g, '\n')    // Convertir \r a \n
        .replace(/\n{3,}/g, '\n\n')  // Máximo 2 saltos de línea consecutivos
        .replace(/[ \t]+/g, ' ')  // Múltiples espacios/tabs a un espacio
        .replace(/[ ]+\n/g, '\n') // Espacios antes de salto de línea
        .replace(/\n[ ]+/g, '\n'); // Espacios después de salto de línea

      // 2. Limpiar caracteres problemáticos pero preservar puntuación importante
      processedText = processedText
        .replace(/[^\w\s\.\,\;\:\!\?\(\)\[\]\{\}\-\+\=\@\#\$\%\&\*\/\\\|\<\>\"\'\`\~\n]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // 3. Mejorar la estructura de párrafos
      processedText = processedText
        .split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 10) // Filtrar párrafos muy cortos
        .join('\n\n');

      // 4. Normalizar puntuación para mejor segmentación
      processedText = processedText
        .replace(/([.!?])\s*\n/g, '$1\n\n')  // Asegurar párrafo después de punto final
        .replace(/([.!?])\s+([A-Z])/g, '$1 $2'); // Espacio después de punto

      console.log(`Text preprocessing completed. Length: ${processedText.length} characters`);
      return processedText;
    } catch (error) {
      console.error('Error preprocessing text:', error);
      return text; // Devolver texto original si falla el preprocesamiento
    }
  }

  /**
   * Dividir texto en chunks semánticamente coherentes
   * @param {string} text - Texto a dividir
   * @param {number} maxChunkSize - Tamaño máximo de cada chunk en caracteres
   * @param {number} overlap - Solapamiento entre chunks en caracteres
   * @returns {Array} Array de chunks con metadatos
   */
  static splitTextIntoChunks(text, maxChunkSize = 800, overlap = 150) {
    try {
      console.log(`Splitting text into semantic chunks (max size: ${maxChunkSize}, overlap: ${overlap})`);

      // Preprocesar el texto
      const processedText = this.preprocessText(text);

      if (processedText.length === 0) {
        console.log('No text to chunk after preprocessing');
        return [];
      }

      // Dividir en párrafos primero
      const paragraphs = processedText.split('\n\n').filter(p => p.trim().length > 0);
      console.log(`Found ${paragraphs.length} paragraphs`);

      const chunks = [];
      let currentChunk = '';
      let chunkNumber = 0;
      let globalStartPos = 0;

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();

        // Si el párrafo actual más el chunk actual exceden el tamaño máximo
        if (currentChunk.length + paragraph.length + 2 > maxChunkSize && currentChunk.length > 0) {
          // Guardar el chunk actual
          const chunk = this.createChunk(currentChunk, chunkNumber, globalStartPos, chunks);
          if (chunk) {
            chunks.push(chunk);
            chunkNumber++;
          }

          // Comenzar nuevo chunk con overlap si es necesario
          currentChunk = this.getOverlapText(currentChunk, overlap) + paragraph;
          globalStartPos = this.calculateGlobalPosition(processedText, currentChunk, globalStartPos);
        } else {
          // Agregar párrafo al chunk actual
          if (currentChunk.length > 0) {
            currentChunk += '\n\n' + paragraph;
          } else {
            currentChunk = paragraph;
          }
        }

        // Si un párrafo individual es muy largo, dividirlo
        if (paragraph.length > maxChunkSize) {
          const subChunks = this.splitLongParagraph(paragraph, maxChunkSize, overlap);
          for (const subChunk of subChunks) {
            const chunk = this.createChunk(subChunk, chunkNumber, globalStartPos, chunks);
            if (chunk) {
              chunks.push(chunk);
              chunkNumber++;
            }
            globalStartPos += subChunk.length;
          }
          currentChunk = '';
        }
      }

      // Agregar el último chunk si tiene contenido
      if (currentChunk.trim().length > 0) {
        const chunk = this.createChunk(currentChunk, chunkNumber, globalStartPos, chunks);
        if (chunk) {
          chunks.push(chunk);
        }
      }

      console.log(`Created ${chunks.length} semantic chunks from text`);
      return chunks;
    } catch (error) {
      console.error('Error splitting text into chunks:', error);
      throw error;
    }
  }

  /**
   * Crear un chunk con metadatos enriquecidos
   * @param {string} text - Texto del chunk
   * @param {number} chunkNumber - Número del chunk
   * @param {number} startPos - Posición de inicio
   * @param {Array} existingChunks - Chunks existentes para contexto
   * @returns {Object|null} Chunk con metadatos o null si no es válido
   */
  static createChunk(text, chunkNumber, startPos, existingChunks) {
    const trimmedText = text.trim();

    if (trimmedText.length < RAG_CONFIG.MIN_CHUNK_LENGTH) {
      return null;
    }

    const words = trimmedText.split(/\s+/).filter(word => word.length > 0);
    const sentences = trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      contenido_texto: trimmedText,
      numero_chunk: chunkNumber,
      posicion_inicio: startPos,
      posicion_fin: startPos + trimmedText.length,
      metadatos_chunk: {
        longitud: trimmedText.length,
        palabras: words.length,
        oraciones: sentences.length,
        densidad_informacion: this.calculateInformationDensity(trimmedText),
        tiene_numeros: /\d/.test(trimmedText),
        tiene_formulas: /[=+\-*/()^]/.test(trimmedText),
        es_lista: /^[\s]*[-*•]\s/.test(trimmedText) || /^\d+\.\s/.test(trimmedText),
        contexto_previo: existingChunks.length > 0 ? existingChunks[existingChunks.length - 1]?.contenido_texto?.substring(0, 100) : null
      }
    };
  }

  /**
   * Obtener texto de overlap del chunk anterior
   * @param {string} text - Texto del chunk anterior
   * @param {number} overlapSize - Tamaño del overlap
   * @returns {string} Texto de overlap
   */
  static getOverlapText(text, overlapSize) {
    if (text.length <= overlapSize) return text;

    // Buscar un punto de corte natural para el overlap
    const overlapText = text.slice(-overlapSize);
    const sentenceEnd = overlapText.lastIndexOf('. ');

    if (sentenceEnd > overlapSize * 0.5) {
      return overlapText.slice(sentenceEnd + 2);
    }

    return overlapText;
  }

  /**
   * Calcular posición global en el texto
   * @param {string} fullText - Texto completo
   * @param {string} chunkText - Texto del chunk
   * @param {number} lastPos - Última posición conocida
   * @returns {number} Posición global
   */
  static calculateGlobalPosition(fullText, chunkText, lastPos) {
    const searchStart = Math.max(0, lastPos - 100);
    const position = fullText.indexOf(chunkText.substring(0, 50), searchStart);
    return position >= 0 ? position : lastPos;
  }

  /**
   * Dividir párrafo largo en sub-chunks
   * @param {string} paragraph - Párrafo largo
   * @param {number} maxSize - Tamaño máximo
   * @param {number} overlap - Overlap
   * @returns {Array} Array de sub-chunks
   */
  static splitLongParagraph(paragraph, maxSize, overlap) {
    const sentences = paragraph.split(/(?<=[.!?])\s+/);
    const subChunks = [];
    let currentSubChunk = '';

    for (const sentence of sentences) {
      if (currentSubChunk.length + sentence.length > maxSize && currentSubChunk.length > 0) {
        subChunks.push(currentSubChunk.trim());
        currentSubChunk = this.getOverlapText(currentSubChunk, overlap) + sentence;
      } else {
        currentSubChunk += (currentSubChunk.length > 0 ? ' ' : '') + sentence;
      }
    }

    if (currentSubChunk.trim().length > 0) {
      subChunks.push(currentSubChunk.trim());
    }

    return subChunks;
  }

  /**
   * Calcular densidad de información del texto (case insensitive)
   * @param {string} text - Texto a analizar
   * @returns {number} Puntuación de densidad (0-1)
   */
  static calculateInformationDensity(text) {
    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w\sáéíóúñü]/g, '')));
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Factores que indican alta densidad de información
    const uniquenessRatio = uniqueWords.size / words.length;
    const lengthFactor = Math.min(avgWordLength / 6, 1); // Palabras más largas = más específicas
    const numberFactor = (text.match(/\d/g) || []).length / text.length;
    const punctuationFactor = (text.match(/[.!?:;]/g) || []).length / text.length;

    // Bonus por nombres propios (palabras capitalizadas)
    const capitalizedWords = (text.match(/\b[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+/g) || []).length;
    const capitalizedFactor = Math.min(capitalizedWords / words.length, 0.3);

    return Math.min((uniquenessRatio * 0.35 + lengthFactor * 0.25 + numberFactor * 0.15 + punctuationFactor * 0.1 + capitalizedFactor * 0.15), 1);
  }

  /**
   * Normalizar texto para búsquedas case insensitive
   * @param {string} text - Texto a normalizar
   * @returns {string} Texto normalizado
   */
  static normalizeTextForSearch(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ') // Mantener caracteres especiales del español
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Generar embedding para un texto (con normalización case insensitive)
   * @param {string} text - Texto para generar embedding
   * @returns {Promise<Array>} Vector embedding
   */
  static async generateEmbedding(text) {
    try {
      const model = this.getEmbeddingModel();
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generar embeddings para múltiples textos en lotes
   * @param {Array<string>} texts - Array de textos
   * @param {number} batchSize - Tamaño del lote
   * @returns {Promise<Array>} Array de embeddings
   */
  static async generateEmbeddingsBatch(texts, batchSize = 5) {
    try {
      console.log(`Generating embeddings for ${texts.length} texts in batches of ${batchSize}`);
      const embeddings = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);

        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );

        embeddings.push(...batchEmbeddings);

        // Pequeña pausa entre lotes para evitar rate limiting
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Generated ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error('Error generating embeddings batch:', error);
      throw error;
    }
  }



  /**
   * Procesar documento directamente desde archivo temporal
   * @param {string} documentoRagId - ID del documento RAG
   * @param {Object} file - Objeto de archivo temporal de express-fileupload
   * @returns {Promise<void>}
   */
  static async processDocumentFromFile(documentoRagId, file) {
    try {
      console.log(`Starting direct document processing for ID: ${documentoRagId}`);

      // Actualizar estado a 'procesando'
      await db.query(
        'UPDATE documentos_rag SET estado_procesamiento = $1, fecha_procesamiento = NOW() WHERE id = $2',
        ['procesando', documentoRagId]
      );

      // Obtener información del documento
      const docResult = await db.query(
        'SELECT * FROM documentos_rag WHERE id = $1',
        [documentoRagId]
      );

      if (docResult.rows.length === 0) {
        throw new Error(`Document with ID ${documentoRagId} not found`);
      }

      const documento = docResult.rows[0];
      console.log(`Processing document: ${documento.nombre_archivo} (${documento.tipo_archivo})`);

      // Verificar que el archivo temporal existe
      console.log(`Checking temporary file: ${file.tempFilePath}`);
      if (!fs.existsSync(file.tempFilePath)) {
        throw new Error(`Temporary file not found: ${file.tempFilePath}`);
      }

      // Leer archivo directamente desde el archivo temporal
      const fileBuffer = fs.readFileSync(file.tempFilePath);
      console.log(`Read file buffer: ${fileBuffer.length} bytes`);

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      // Extraer texto según el tipo de archivo
      let extractedText;
      if (documento.tipo_archivo === 'pdf') {
        extractedText = await this.extractTextFromPDF(fileBuffer);
      } else if (documento.tipo_archivo === 'docx') {
        extractedText = await this.extractTextFromDOCX(fileBuffer);
      } else {
        throw new Error(`Unsupported file type: ${documento.tipo_archivo}`);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }

      console.log(`Extracted text length: ${extractedText.length} characters`);

      // Dividir en chunks usando la configuración mejorada
      const chunks = this.splitTextIntoChunks(extractedText, RAG_CONFIG.MAX_CHUNK_SIZE, RAG_CONFIG.CHUNK_OVERLAP);

      if (chunks.length === 0) {
        throw new Error('No chunks could be created from the extracted text');
      }

      // Generar embeddings para todos los chunks con batch size optimizado
      const texts = chunks.map(chunk => chunk.contenido_texto);
      const embeddings = await this.generateEmbeddingsBatch(texts, RAG_CONFIG.EMBEDDING_BATCH_SIZE);

      // Guardar chunks en la base de datos
      console.log(`Saving ${chunks.length} chunks to database...`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        await db.query(
          `INSERT INTO chunks_texto
           (documento_rag_id, contenido_texto, embedding, numero_chunk, posicion_inicio, posicion_fin, metadatos_chunk)
           VALUES ($1, $2, $3::vector, $4, $5, $6, $7)`,
          [
            documentoRagId,
            chunk.contenido_texto,
            `[${embedding.join(',')}]`, // Format as PostgreSQL vector literal
            chunk.numero_chunk,
            chunk.posicion_inicio,
            chunk.posicion_fin,
            JSON.stringify(chunk.metadatos_chunk)
          ]
        );
      }

      // Actualizar estado a 'completado'
      await db.query(
        'UPDATE documentos_rag SET estado_procesamiento = $1, total_chunks = $2, fecha_procesamiento = NOW() WHERE id = $3',
        ['completado', chunks.length, documentoRagId]
      );

      console.log(`Document processing completed successfully for ID: ${documentoRagId}`);

      // Limpiar archivo temporal
      try {
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          fs.unlinkSync(file.tempFilePath);
          console.log(`Temporary file cleaned up: ${file.tempFilePath}`);
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary file:', cleanupError);
        // No lanzamos el error para no interrumpir el flujo
      }

    } catch (error) {
      console.error(`Error processing document ${documentoRagId}:`, error);

      // Limpiar archivo temporal en caso de error
      try {
        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          fs.unlinkSync(file.tempFilePath);
          console.log(`Temporary file cleaned up after error: ${file.tempFilePath}`);
        }
      } catch (cleanupError) {
        console.warn('Error cleaning up temporary file after error:', cleanupError);
      }

      // Actualizar estado a 'error'
      await db.query(
        'UPDATE documentos_rag SET estado_procesamiento = $1, error_mensaje = $2, fecha_procesamiento = NOW() WHERE id = $3',
        ['error', error.message, documentoRagId]
      );

      throw error;
    }
  }


}

export default RAGService;
