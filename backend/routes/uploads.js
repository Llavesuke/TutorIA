import { Router } from 'express';
const router = Router();
import UploadService from '../services/uploadService.js';
import { requireAuth } from '../middleware/auth.js';

// Middleware para verificar que se ha subido un archivo
const validateFileUpload = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo' });
  }
  next();
};

// Ruta genérica para subir archivos
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

// Subir imagen de perfil
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

// Subir imagen de actividad
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

// Subir imagen para chat
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

// Subir documento
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

// Subir archivo para assignment
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

// Eliminar imagen
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
