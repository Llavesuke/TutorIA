import { Router } from 'express';
const router = Router();
import { requireAuth } from '../middleware/auth.js';
import DocumentoRag from '../models/documentoRag.js';
import ChunkTexto from '../models/chunkTexto.js';
import RAGService from '../services/ragService.js';
import UploadService from '../services/uploadService.js';

// GET /api/rag/documentos - Obtener todos los documentos RAG
router.get('/documentos', requireAuth, async (req, res) => {
  try {
    const { tutorId, estado } = req.query;

    let documentos;
    if (tutorId) {
      documentos = await DocumentoRag.getByTutorId(tutorId);
    } else if (estado) {
      documentos = await DocumentoRag.getByEstado(estado);
    } else {
      documentos = await DocumentoRag.getWithTutorInfo();
    }

    res.json(documentos);
  } catch (error) {
    console.error('Error en GET /rag/documentos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/rag/documentos/:id - Obtener documento RAG por ID
router.get('/documentos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const documento = await DocumentoRag.getById(id);

    if (!documento) {
      return res.status(404).json({ message: `Documento RAG con ID ${id} no encontrado` });
    }

    res.json(documento);
  } catch (error) {
    console.error('Error en GET /rag/documentos/:id:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/rag/upload - Subir documento para RAG
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { tutorVirtualId } = req.body;
    const userId = req.user.id;

    if (!tutorVirtualId) {
      return res.status(400).json({ message: 'El ID del tutor virtual es requerido' });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No se ha subido ningún documento' });
    }

    const file = req.files.document;

    // Validar tipo de archivo
    const allowedExtensions = ['pdf', 'docx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        message: 'Tipo de archivo no permitido. Solo se permiten archivos PDF y DOCX'
      });
    }

    // Validar tamaño del archivo (máximo 10MB para evitar problemas de almacenamiento)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({
        message: 'El archivo es demasiado grande. El tamaño máximo permitido es 10MB'
      });
    }

    console.log('Processing RAG document:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.mimetype,
      tutorVirtualId: tutorVirtualId
    });

    // Crear registro en la base de datos
    const documentoRag = await DocumentoRag.create(
      tutorVirtualId,
      file.name,
      fileExtension,
      file.size,
      userId,
      {
        original_filename: file.name,
        upload_timestamp: new Date().toISOString(),
        processed_directly: true
      }
    );

    console.log('RAG document created:', documentoRag);

    // Procesar documento directamente desde el archivo temporal
    console.log(`Starting direct processing for document ${documentoRag.id}`);
    RAGService.processDocumentFromFile(documentoRag.id, file)
      .then(() => {
        console.log(`✅ Document ${documentoRag.id} processed successfully`);
      })
      .catch((error) => {
        console.error(`❌ Error processing document ${documentoRag.id}:`, error);
        console.error('Error stack:', error.stack);
        // Update document status to error in database
        DocumentoRag.updateEstadoProcesamiento(documentoRag.id, 'error', error.message)
          .catch(dbError => console.error('Failed to update error status:', dbError));
      });

    res.status(201).json({
      message: 'Documento subido exitosamente. El procesamiento comenzará en breve.',
      documento: documentoRag
    });

  } catch (error) {
    console.error('Error en POST /rag/upload:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/rag/process/:id - Procesar documento manualmente (DEPRECATED - solo para documentos legacy)
router.post('/process/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await DocumentoRag.getById(id);
    if (!documento) {
      return res.status(404).json({ message: `Documento RAG con ID ${id} no encontrado` });
    }

    // Los nuevos documentos se procesan automáticamente al subirse
    return res.status(400).json({
      message: 'Los documentos se procesan automáticamente al subirse. Este endpoint es solo para documentos legacy.'
    });

  } catch (error) {
    console.error('Error en POST /rag/process/:id:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/rag/documentos/:id - Eliminar documento RAG
router.delete('/documentos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const documento = await DocumentoRag.getById(id);
    if (!documento) {
      return res.status(404).json({ message: `Documento RAG con ID ${id} no encontrado` });
    }

    // Eliminar chunks asociados primero
    await ChunkTexto.deleteByDocumentoRagId(id);

    // Eliminar documento
    await DocumentoRag.delete(id);

    res.json({ message: 'Documento RAG eliminado exitosamente' });

  } catch (error) {
    console.error('Error en DELETE /rag/documentos/:id:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/rag/chunks/:documentoId - Obtener chunks de un documento
router.get('/chunks/:documentoId', requireAuth, async (req, res) => {
  try {
    const { documentoId } = req.params;
    const chunks = await ChunkTexto.getByDocumentoRagId(documentoId);
    res.json(chunks);
  } catch (error) {
    console.error('Error en GET /rag/chunks/:documentoId:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/rag/search - Búsqueda de similitud semántica mejorada
router.post('/search', requireAuth, async (req, res) => {
  try {
    const { query, tutorVirtualId, limit = 5, threshold = 0.4 } = req.body;

    if (!query || !tutorVirtualId) {
      return res.status(400).json({
        message: 'Se requieren los campos query y tutorVirtualId'
      });
    }

    // Generar embedding para la consulta
    const queryEmbedding = await RAGService.generateEmbedding(query);

    // Buscar chunks similares
    const similarChunks = await ChunkTexto.searchSimilarWithContext(
      queryEmbedding,
      tutorVirtualId,
      limit,
      threshold
    );

    res.json({
      query: query,
      results: similarChunks,
      count: similarChunks.length
    });

  } catch (error) {
    console.error('Error en POST /rag/search:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/rag/estadisticas/:tutorId - Obtener estadísticas RAG de un tutor
router.get('/estadisticas/:tutorId', requireAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;

    const estadisticasDocumentos = await DocumentoRag.getEstadisticasByTutor(tutorId);
    const tieneChunks = await ChunkTexto.tutorHasChunks(tutorId);
    const muestraChunks = await ChunkTexto.getSampleChunks(tutorId, 3);

    res.json({
      tutor_id: tutorId,
      documentos: estadisticasDocumentos,
      tiene_chunks: tieneChunks,
      muestra_chunks: muestraChunks
    });

  } catch (error) {
    console.error('Error en GET /rag/estadisticas/:tutorId:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/rag/status - Obtener estado general del sistema RAG
router.get('/status', requireAuth, async (req, res) => {
  try {
    const pendientes = await DocumentoRag.getByEstado('pendiente');
    const procesando = await DocumentoRag.getByEstado('procesando');
    const completados = await DocumentoRag.getByEstado('completado');
    const errores = await DocumentoRag.getByEstado('error');

    res.json({
      pendientes: pendientes.length,
      procesando: procesando.length,
      completados: completados.length,
      errores: errores.length,
      total: pendientes.length + procesando.length + completados.length + errores.length
    });

  } catch (error) {
    console.error('Error en GET /rag/status:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/rag/debug/test-processing - Endpoint de debug para probar el procesamiento
router.post('/debug/test-processing', requireAuth, async (req, res) => {
  try {
    console.log('🔧 DEBUG: Testing RAG processing pipeline...');

    // Test 1: Check embedding generation
    console.log('Test 1: Embedding generation...');
    const testText = 'This is a test sentence for RAG processing.';
    const embedding = await RAGService.generateEmbedding(testText);
    console.log(`✅ Embedding generated: ${embedding.length} dimensions`);

    // Test 2: Check text chunking
    console.log('Test 2: Text chunking...');
    const longText = 'This is a longer text that will be split into chunks. It contains multiple sentences. The RAG system should process this correctly.';
    const chunks = RAGService.splitTextIntoChunks(longText, 50, 10);
    console.log(`✅ Created ${chunks.length} chunks`);

    // Test 3: Check if there are any pending documents
    console.log('Test 3: Checking pending documents...');
    const pendingDocs = await DocumentoRag.getByEstado('pendiente');
    console.log(`📄 Found ${pendingDocs.length} pending documents`);

    // Test 4: Check database connection
    console.log('Test 4: Database connection...');
    const allDocs = await DocumentoRag.getAll();
    console.log(`📊 Total documents in database: ${allDocs.length}`);

    res.json({
      message: 'RAG processing test completed',
      results: {
        embedding_dimensions: embedding.length,
        chunks_created: chunks.length,
        pending_documents: pendingDocs.length,
        total_documents: allDocs.length,
        test_passed: true
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: RAG processing test failed:', error);
    res.status(500).json({
      message: 'RAG processing test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// GET /api/rag/debug/enhanced - Endpoint para probar el sistema RAG mejorado
router.get('/debug/enhanced', requireAuth, async (req, res) => {
  try {
    console.log('🚀 DEBUG: Testing enhanced RAG system...');

    // Test 1: Text preprocessing
    console.log('Test 1: Enhanced text preprocessing...');
    const rawText = 'This   is    a   test\n\n\nwith   multiple    spaces\r\nand   line   breaks.';
    const processedText = RAGService.preprocessText(rawText);
    console.log(`✅ Preprocessed: "${processedText}"`);

    // Test 2: Semantic chunking
    console.log('Test 2: Semantic chunking...');
    const longText = `
      Introduction to Machine Learning

      Machine learning is a subset of artificial intelligence that focuses on algorithms.
      These algorithms can learn from data without being explicitly programmed.

      Types of Machine Learning

      There are three main types: supervised, unsupervised, and reinforcement learning.
      Each type has different applications and use cases.
    `;
    const chunks = RAGService.splitTextIntoChunks(longText, 200, 50);
    console.log(`✅ Created ${chunks.length} semantic chunks`);

    // Test 3: Information density
    console.log('Test 3: Information density calculation...');
    const densityScore = RAGService.calculateInformationDensity('Machine learning algorithms process data efficiently.');
    console.log(`✅ Density score: ${densityScore.toFixed(3)}`);

    // Test 4: Enhanced embedding
    console.log('Test 4: Enhanced embedding generation...');
    const embedding = await RAGService.generateEmbedding('Enhanced RAG system test');
    console.log(`✅ Generated embedding: ${embedding.length} dimensions`);

    res.json({
      message: 'Enhanced RAG system test completed successfully',
      results: {
        preprocessing: {
          original_length: rawText.length,
          processed_length: processedText.length,
          improvement: 'Normalized whitespace and structure'
        },
        chunking: {
          chunks_created: chunks.length,
          type: 'semantic-aware',
          features: ['paragraph-based', 'overlap-optimized', 'metadata-enriched']
        },
        information_analysis: {
          density_score: densityScore,
          factors: ['uniqueness', 'word_length', 'numbers', 'punctuation']
        },
        embedding: {
          dimensions: embedding.length,
          model: 'text-embedding-004'
        },
        enhancements: [
          'Improved text preprocessing',
          'Semantic-aware chunking',
          'Information density analysis',
          'Query expansion capability',
          'Natural knowledge synthesis',
          'Enhanced AI integration'
        ]
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Enhanced RAG test failed:', error);
    res.status(500).json({
      message: 'Enhanced RAG test failed',
      error: error.message
    });
  }
});

// POST /api/rag/debug/test-rag-integration - Test RAG integration with tutor
router.post('/debug/test-rag-integration', requireAuth, async (req, res) => {
  try {
    const { tutorId, query } = req.body;

    if (!tutorId || !query) {
      return res.status(400).json({
        message: 'Se requieren tutorId y query para la prueba'
      });
    }

    console.log(`🧪 Testing RAG integration for tutor ${tutorId} with query: "${query}"`);

    // 1. Verificar si el tutor tiene chunks
    const hasChunks = await ChunkTexto.tutorHasChunks(tutorId);
    console.log(`✅ Tutor has chunks: ${hasChunks}`);

    if (!hasChunks) {
      return res.json({
        success: false,
        message: 'Tutor no tiene documentos RAG procesados',
        hasChunks: false
      });
    }

    // 2. Obtener muestra de chunks
    const sampleChunks = await ChunkTexto.getSampleChunks(tutorId, 3);
    console.log(`✅ Sample chunks: ${sampleChunks.length}`);

    // 3. Probar búsqueda RAG
    const queryEmbedding = await RAGService.generateEmbedding(query);
    const similarChunks = await ChunkTexto.searchSimilarWithContext(
      queryEmbedding,
      tutorId,
      5,
      0.4
    );
    console.log(`✅ Similar chunks found: ${similarChunks.length}`);

    // 4. Probar síntesis de conocimiento (case insensitive)
    const GeminiService = (await import('../services/geminiService.js')).default;
    const expandedQueries = GeminiService.expandQuery(query);
    const synthesizedKnowledge = GeminiService.synthesizeKnowledge(similarChunks, query);
    console.log(`✅ Synthesized knowledge length: ${synthesizedKnowledge.length}`);

    // 5. Probar normalización de texto
    const normalizedQuery = RAGService.normalizeTextForSearch(query);
    console.log(`✅ Normalized query: "${normalizedQuery}"`);

    // 5. Probar contexto RAG completo
    const ragContext = await GeminiService.retrieveRAGContext(tutorId, query);
    console.log(`✅ RAG context has content: ${ragContext.hasContext}`);

    res.json({
      success: true,
      message: 'RAG integration test completed (with case insensitive search)',
      results: {
        tutorId,
        query,
        normalizedQuery,
        hasChunks,
        sampleChunksCount: sampleChunks.length,
        sampleChunks: sampleChunks.map(chunk => ({
          file: chunk.nombre_archivo,
          preview: chunk.contenido_texto.substring(0, 100) + '...'
        })),
        similarChunksFound: similarChunks.length,
        similarChunks: similarChunks.map(chunk => ({
          file: chunk.nombre_archivo,
          similarity: chunk.similarity,
          distance: chunk.distance,
          preview: chunk.contenido_texto.substring(0, 100) + '...'
        })),
        expandedQueries,
        caseInsensitiveFeatures: {
          queryNormalization: 'Enabled',
          accentVariations: 'Enabled',
          capitalizedWordsBonus: 'Enabled',
          wordBoundaryMatching: 'Enabled'
        },
        synthesizedKnowledgeLength: synthesizedKnowledge.length,
        synthesizedKnowledgePreview: synthesizedKnowledge.substring(0, 200) + '...',
        ragContextHasContent: ragContext.hasContext,
        ragContextChunksCount: ragContext.chunks.length
      }
    });

  } catch (error) {
    console.error('❌ RAG integration test failed:', error);
    res.status(500).json({
      success: false,
      message: 'RAG integration test failed',
      error: error.message
    });
  }
});

export default router;
