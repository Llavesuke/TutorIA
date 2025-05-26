import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { promisify } from 'util';
import db from '../config/db.js';

const unlinkAsync = promisify(fs.unlink);

class UploadService {
  /**
   * Subir una imagen a Cloudinary
   * @param {Object} file - Archivo a subir
   * @param {string} folder - Carpeta en Cloudinary donde se guardará la imagen
   * @returns {Object} Información de la imagen subida
   */
  static async uploadImage(file, folder = 'tutoria') {
    try {
      // Subir la imagen a Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true
      });

      // Eliminar el archivo temporal
      if (file.tempFilePath) {
        await unlinkAsync(file.tempFilePath);
      }

      return {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Eliminar una imagen de Cloudinary
   * @param {string} publicId - ID público de la imagen en Cloudinary
   * @returns {Object} Resultado de la eliminación
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error(`Error al eliminar imagen con ID ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Subir una imagen de perfil de usuario y actualizar la base de datos
   * @param {Object} file - Archivo a subir
   * @param {string} userId - ID del usuario
   * @returns {Object} Información de la imagen subida y usuario actualizado
   */
  static async uploadProfileImage(file, userId) {
    try {
      // Subir la imagen a Cloudinary
      const imageInfo = await this.uploadImage(file, 'tutoria/profiles');

      // Actualizar la URL de la foto de perfil en la base de datos
      const result = await db.query(
        'UPDATE usuarios SET foto_perfil = $1 WHERE id = $2 RETURNING id, nombre_usuario, email, foto_perfil',
        [imageInfo.url, userId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Usuario con ID ${userId} no encontrado`);
      }

      return {
        image: imageInfo,
        user: result.rows[0]
      };
    } catch (error) {
      console.error(`Error al subir imagen de perfil para usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Subir una imagen de actividad y guardarla en la base de datos
   * @param {Object} file - Archivo a subir
   * @param {string} userId - ID del usuario
   * @param {string} unidadId - ID de la unidad
   * @returns {Object} Información de la imagen subida y registro en la base de datos
   */
  static async uploadActivityImage(file, userId, unidadId) {
    try {
      // Subir la imagen a Cloudinary
      const imageInfo = await this.uploadImage(file, 'tutoria/activities');

      // Guardar la información en la base de datos
      const result = await db.query(
        'INSERT INTO imagenes_actividad (usuario_id, unidad_id, url) VALUES ($1, $2, $3) RETURNING *',
        [userId, unidadId, imageInfo.url]
      );

      return {
        image: imageInfo,
        record: result.rows[0]
      };
    } catch (error) {
      console.error(`Error al subir imagen de actividad:`, error);
      throw error;
    }
  }

  /**
   * Subir un documento y guardarlo en la base de datos
   * @param {Object} file - Archivo a subir
   * @param {string} userId - ID del usuario que sube el documento
   * @param {string} moduloId - ID del módulo (opcional)
   * @param {string} unidadId - ID de la unidad (opcional)
   * @returns {Object} Información del documento subido y registro en la base de datos
   */
  static async uploadDocument(file, userId, moduloId = null, unidadId = null) {
    try {
      // Determinar el tipo de documento
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let tipo;

      switch (fileExtension) {
        case 'pdf':
          tipo = 'pdf';
          break;
        case 'doc':
        case 'docx':
          tipo = 'docx';
          break;
        case 'ppt':
        case 'pptx':
          tipo = 'pptx';
          break;
        case 'txt':
          tipo = 'txt';
          break;
        default:
          // Si no es un tipo permitido, no intentamos guardarlo en la base de datos
          return this.uploadFileToCloudinary(file, 'tutoria/documents');
      }

      // Subir el documento a Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: 'tutoria/documents',
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true
      });

      // Eliminar el archivo temporal
      if (file.tempFilePath) {
        await unlinkAsync(file.tempFilePath);
      }

      // Guardar la información en la base de datos
      const dbResult = await db.query(
        'INSERT INTO documentos (modulo_id, unidad_id, url, tipo, subido_por) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [moduloId, unidadId, result.secure_url, tipo, userId]
      );

      return {
        document: {
          public_id: result.public_id,
          url: result.secure_url,
          format: result.format,
          bytes: result.bytes
        },
        record: dbResult.rows[0]
      };
    } catch (error) {
      console.error('Error al subir documento:', error);
      throw error;
    }
  }

  /**
   * Subir un archivo a Cloudinary sin guardarlo en la base de datos
   * @param {Object} file - Archivo a subir
   * @param {string} folder - Carpeta en Cloudinary donde se guardará el archivo
   * @returns {Object} Información del archivo subido
   */
  static async uploadFileToCloudinary(file, folder = 'tutoria/assignments') {
    try {
      console.log('Iniciando subida a Cloudinary:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.mimetype,
        folder: folder
      });

      if (!file.tempFilePath) {
        console.error('Error: No se encontró tempFilePath en el archivo');
        throw new Error('Archivo inválido: no se encontró tempFilePath');
      }

      // Subir el archivo a Cloudinary con opciones específicas para asignaciones
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        resource_type: 'auto',
        use_filename: true,
        unique_filename: true,
        overwrite: true,
        timeout: 120000, // 2 minutos de timeout para archivos grandes
      });

      console.log('Resultado de Cloudinary:', {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      });

      // Eliminar el archivo temporal
      try {
        if (file.tempFilePath) {
          await unlinkAsync(file.tempFilePath);
          console.log('Archivo temporal eliminado:', file.tempFilePath);
        }
      } catch (unlinkError) {
        console.error('Error al eliminar archivo temporal:', unlinkError);
        // No lanzamos el error para no interrumpir el flujo
      }

      return {
        public_id: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Error al subir archivo a Cloudinary:', error);
      console.error('Detalles del error:', error.stack);
      throw error;
    }
  }
}

export default UploadService;
