import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

// Configurar Cloudinary con las credenciales del archivo .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Verificar la configuración
cloudinary.api.ping()
  .then(result => {
    console.log('Conexión con Cloudinary establecida correctamente:', result.status);
  })
  .catch(error => {
    console.error('Error al conectar con Cloudinary:', error);
  });

export default cloudinary;
