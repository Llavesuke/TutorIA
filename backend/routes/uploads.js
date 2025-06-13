/**
 * @fileoverview Rutas de subida de archivos para TutorIA
 * @description Este archivo contiene todas las rutas relacionadas con la subida de archivos
 * al sistema, incluyendo imágenes de perfil, imágenes de actividad, documentos y archivos
 * para assignments. Utiliza Cloudinary como servicio de almacenamiento en la nube.
 *
 * Endpoints disponibles:
 * - POST /uploads - Subida genérica de archivos (detecta automáticamente el tipo)
 * - POST /uploads/profile - Subir imagen de perfil de usuario
 * - POST /uploads/activity - Subir imagen de actividad educativa
 * - POST /uploads/chat-image - Subir imagen para usar en chats
 * - POST /uploads/document - Subir documento educativo
 * - POST /uploads/assignment - Subir archivo para assignment/tarea
 * - DELETE /uploads/image/:publicId - Eliminar imagen de Cloudinary
 *
 * @author TutorIA Team
 * @version 1.0.0
 */

import { Router } from 'express';
const router = Router();
import UploadService from '../services/uploadService.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Middleware para verificar que se ha subido un archivo
 *
 * @description Valida que la request contenga al menos un archivo en req.files.
 * Este middleware es esencial para todos los endpoints de upload ya que
 * previene errores cuando no se proporciona ningún archivo.
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 *
 * @returns {Object} 400 - Si no se ha subido ningún archivo
 * @returns {void} - Continúa al siguiente middleware si hay archivos
 */
const validateFileUpload = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo' });
  }
  next();
};

/**
 * POST /api/uploads
 *
 * Ruta genérica para subir archivos (detecta automáticamente el tipo)
 *
 * @description Este endpoint permite subir archivos de diferentes tipos y los procesa
 * automáticamente según su contenido y parámetros. Puede manejar imágenes de perfil,
 * imágenes de actividad, documentos y archivos genéricos.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Al menos un archivo debe ser subido
 *
 * @param {File} req.files.image - Archivo de imagen (para imágenes)
 * @param {File} req.files.document - Archivo de documento (para documentos)
 * @param {File} req.files.file - Archivo genérico
 * @param {string} [req.body.unidadId] - ID de unidad (para imágenes de actividad)
 * @param {string} [req.body.moduloId] - ID de módulo (para documentos)
 *
 * @returns {Object} 201 - Archivo subido exitosamente
 * @returns {Object} 400 - No se ha subido ningún archivo o tipo inválido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // image: [archivo de imagen]
 * // unidadId: "123" (opcional)
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/...",
 *   "public_id": "tutoria/uploads/abc123",
 *   "format": "jpg",
 *   "width": 800,
 *   "height": 600
 * }
 */
router.post('/', requireAuth, validateFileUpload, async (req, res) => {
  try {
    console.log('Recibida solicitud de carga de archivo en /api/uploads');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const userId = req.user.id;
    const { unidadId, moduloId } = req.body;

    // Determinar qué tipo de archivo se está subiendo
    let file;
    let result;

    if (req.files.image) {
      file = req.files.image;
      console.log('Procesando carga de imagen');

      // Validar que el archivo es una imagen
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: 'El archivo debe ser una imagen' });
      }

      if (unidadId) {
        // Si hay unidadId, es una imagen de actividad
        result = await UploadService.uploadActivityImage(file, userId, unidadId);
      } else {
        // Si no hay unidadId, es una imagen de perfil
        result = await UploadService.uploadProfileImage(file, userId);
      }
    } else if (req.files.file) {
      file = req.files.file;
      console.log('Procesando carga de archivo genérico');

      // Subir como documento
      result = await UploadService.uploadDocument(file, userId, moduloId, unidadId);
    } else if (req.files.document) {
      file = req.files.document;
      console.log('Procesando carga de documento');

      // Validar tipos de archivo permitidos para documentos
      const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
          message: 'Tipo de archivo no permitido. Los tipos permitidos son: pdf, doc, docx, ppt, pptx, txt'
        });
      }

      result = await UploadService.uploadDocument(file, userId, moduloId, unidadId);
    } else {
      // Si no se puede determinar el tipo de archivo
      const fileKey = Object.keys(req.files)[0];
      file = req.files[fileKey];
      console.log(`Procesando carga de archivo con clave: ${fileKey}`);

      // Intentar subir como imagen si parece una imagen
      if (file.mimetype.startsWith('image/')) {
        result = await UploadService.uploadImage(file, 'tutoria/uploads');
      } else {
        // De lo contrario, subir como documento
        result = await UploadService.uploadDocument(file, userId, moduloId, unidadId);
      }
    }

    // Asegurarse de que la respuesta tenga un formato consistente con la URL
    const response = {
      ...result,
      url: result.url ||
           (result.image && result.image.url) ||
           (result.document && result.document.url)
    };

    console.log('Respuesta de carga de archivo:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error en POST /uploads:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/uploads/profile
 *
 * Subir imagen de perfil de usuario
 *
 * @description Este endpoint permite a los usuarios subir una imagen de perfil.
 * La imagen se almacena en Cloudinary y se actualiza la información del usuario
 * en la base de datos con la nueva URL de la imagen.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Archivo de imagen requerido
 *
 * @param {File} req.files.image - Archivo de imagen de perfil
 *
 * @returns {Object} 201 - Imagen de perfil subida exitosamente
 * @returns {Object} 400 - No se ha subido imagen o formato inválido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // image: [archivo de imagen JPG/PNG]
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/tutoria/image/upload/v123/profiles/user_456.jpg",
 *   "public_id": "tutoria/profiles/user_456",
 *   "message": "Imagen de perfil actualizada exitosamente"
 * }
 */
router.post('/profile', requireAuth, validateFileUpload, async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.files.image;

    // Validar que el archivo es una imagen
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen' });
    }

    const result = await UploadService.uploadProfileImage(file, userId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /uploads/profile:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/uploads/activity
 *
 * Subir imagen de actividad educativa
 *
 * @description Este endpoint permite a los usuarios subir imágenes relacionadas
 * con actividades educativas específicas de una unidad. Las imágenes se almacenan
 * en Cloudinary y se registran en la base de datos asociadas a la unidad correspondiente.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Archivo de imagen requerido
 *
 * @param {File} req.files.image - Archivo de imagen de actividad
 * @param {string} req.body.unidadId - ID de la unidad educativa (requerido)
 *
 * @returns {Object} 201 - Imagen de actividad subida exitosamente
 * @returns {Object} 400 - Parámetros faltantes o formato inválido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // image: [archivo de imagen]
 * // unidadId: "123"
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/tutoria/image/upload/v123/activities/abc123.jpg",
 *   "public_id": "tutoria/activities/abc123",
 *   "imagen_actividad": {
 *     "id": "456",
 *     "unidad_id": "123",
 *     "usuario_id": "789"
 *   }
 * }
 */
router.post('/activity', requireAuth, validateFileUpload, async (req, res) => {
  try {
    const { unidadId } = req.body;
    const userId = req.user.id;
    const file = req.files.image;

    if (!unidadId) {
      return res.status(400).json({ message: 'El ID de la unidad es requerido' });
    }

    // Validar que el archivo es una imagen
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen' });
    }

    const result = await UploadService.uploadActivityImage(file, userId, unidadId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /uploads/activity:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/uploads/chat-image
 *
 * Subir imagen para usar en chats con tutores virtuales
 *
 * @description Este endpoint permite subir imágenes que serán utilizadas en
 * conversaciones con tutores virtuales. Las imágenes se almacenan en Cloudinary
 * y pueden ser analizadas por Gemini AI para generar respuestas contextuales.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Archivo de imagen requerido
 *
 * @param {File} req.files.image - Archivo de imagen para chat
 *
 * @returns {Object} 201 - Imagen subida exitosamente
 * @returns {Object} 400 - No se ha subido imagen o formato inválido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // image: [archivo de imagen JPG/PNG]
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/tutoria/image/upload/v123/chat-images/abc123.jpg",
 *   "public_id": "tutoria/chat-images/abc123",
 *   "format": "jpg",
 *   "width": 800,
 *   "height": 600,
 *   "bytes": 245760
 * }
 */
router.post('/chat-image', requireAuth, validateFileUpload, async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.files.image;

    // Validar que el archivo es una imagen
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'El archivo debe ser una imagen' });
    }

    // Subir imagen a Cloudinary
    const result = await UploadService.uploadImage(file, 'tutoria/chat-images');

    res.status(201).json({
      url: result.url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    });
  } catch (error) {
    console.error('Error en POST /uploads/chat-image:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/uploads/document
 *
 * Subir documento educativo
 *
 * @description Este endpoint permite subir documentos educativos (PDF, DOC, DOCX, PPT, PPTX, TXT)
 * que se asocian a módulos o unidades específicas. Los documentos se almacenan en Cloudinary
 * y se registran en la base de datos para su posterior consulta y gestión.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Archivo de documento requerido
 *
 * @param {File} req.files.document - Archivo de documento
 * @param {string} [req.body.moduloId] - ID del módulo (opcional)
 * @param {string} [req.body.unidadId] - ID de la unidad (opcional)
 *
 * @returns {Object} 201 - Documento subido exitosamente
 * @returns {Object} 400 - Parámetros faltantes o tipo de archivo no permitido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // document: [archivo PDF/DOC/DOCX/PPT/PPTX/TXT]
 * // moduloId: "123" (opcional)
 * // unidadId: "456" (opcional)
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/tutoria/raw/upload/v123/documents/abc123.pdf",
 *   "public_id": "tutoria/documents/abc123",
 *   "format": "pdf",
 *   "bytes": 1048576,
 *   "documento": {
 *     "id": "789",
 *     "modulo_id": "123",
 *     "unidad_id": "456"
 *   }
 * }
 */
router.post('/document', requireAuth, validateFileUpload, async (req, res) => {
  try {
    const { moduloId, unidadId } = req.body;
    const userId = req.user.id;
    const file = req.files.document;

    if (!moduloId && !unidadId) {
      return res.status(400).json({ message: 'Se requiere el ID del módulo o de la unidad' });
    }

    // Validar tipos de archivo permitidos
    const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        message: 'Tipo de archivo no permitido. Los tipos permitidos son: pdf, doc, docx, ppt, pptx, txt'
      });
    }

    const result = await UploadService.uploadDocument(file, userId, moduloId, unidadId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /uploads/document:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * POST /api/uploads/assignment
 *
 * Subir archivo para assignment/tarea
 *
 * @description Este endpoint permite a los estudiantes subir archivos como parte
 * de la entrega de assignments/tareas. Los archivos se almacenan en Cloudinary
 * sin registrarse en la base de datos, ya que se asocian directamente al envío de la tarea.
 *
 * @requires Authentication - Token JWT válido requerido
 * @requires File - Archivo requerido
 *
 * @param {File} req.files.file - Archivo para la tarea (cualquier tipo)
 *
 * @returns {Object} 201 - Archivo subido exitosamente
 * @returns {Object} 400 - No se ha subido ningún archivo
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // Form data:
 * // file: [cualquier tipo de archivo]
 *
 * // Response:
 * {
 *   "url": "https://res.cloudinary.com/tutoria/raw/upload/v123/assignments/abc123.pdf",
 *   "public_id": "tutoria/assignments/abc123",
 *   "format": "pdf",
 *   "bytes": 2097152
 * }
 */
router.post('/assignment', requireAuth, validateFileUpload, async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.files.file || Object.values(req.files)[0];

    if (!file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    console.log('Procesando carga de archivo para assignment:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.mimetype,
      userId: userId
    });

    try {
      // Subir archivo a Cloudinary sin guardarlo en la base de datos
      const result = await UploadService.uploadFileToCloudinary(file, 'tutoria/assignments');

      console.log('Archivo subido exitosamente a Cloudinary:', {
        publicId: result.public_id,
        url: result.url || result.secure_url,
        format: result.format,
        bytes: result.bytes
      });

      res.status(201).json({
        url: result.url || result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    } catch (uploadError) {
      console.error('Error específico al subir archivo a Cloudinary:', uploadError);
      res.status(500).json({
        message: 'Error al subir archivo a Cloudinary',
        error: uploadError.message,
        details: uploadError.stack
      });
    }
  } catch (error) {
    console.error('Error en POST /uploads/assignment:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

/**
 * DELETE /api/uploads/image/:publicId
 *
 * Eliminar imagen de Cloudinary
 *
 * @description Este endpoint permite eliminar una imagen específica de Cloudinary
 * utilizando su ID público. Solo usuarios autenticados pueden eliminar imágenes.
 *
 * @requires Authentication - Token JWT válido requerido
 *
 * @param {string} req.params.publicId - ID público de la imagen en Cloudinary
 *
 * @returns {Object} 200 - Imagen eliminada correctamente
 * @returns {Object} 400 - ID público requerido
 * @returns {Object} 401 - Usuario no autenticado
 * @returns {Object} 404 - Imagen no encontrada o ya eliminada
 * @returns {Object} 500 - Error interno del servidor
 *
 * @example
 * // URL: DELETE /api/uploads/image/tutoria%2Fuploads%2Fabc123
 *
 * // Response:
 * {
 *   "message": "Imagen eliminada correctamente",
 *   "result": {
 *     "result": "ok"
 *   }
 * }
 */
router.delete('/image/:publicId', requireAuth, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ message: 'El ID público de la imagen es requerido' });
    }

    const result = await UploadService.deleteImage(publicId);

    if (result.result !== 'ok') {
      return res.status(404).json({ message: 'Imagen no encontrada o ya eliminada' });
    }

    res.json({ message: 'Imagen eliminada correctamente', result });
  } catch (error) {
    console.error(`Error en DELETE /uploads/image/${req.params.publicId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
