import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Función para probar la API key de Gemini
async function testGeminiApiKey() {
  console.log('Testing Gemini API key...');

  // Obtener la API key del archivo .env
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY no está definida en el archivo .env');
    return false;
  }

  console.log('API key encontrada en .env');
  console.log('API key comienza con:', apiKey.substring(0, 10) + '...');
  console.log('Longitud de la API key:', apiKey.length);

  try {
    // Inicializar el cliente de Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Obtener el modelo
    console.log('Inicializando modelo gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generar una respuesta simple para probar la API
    console.log('Enviando solicitud de prueba a la API...');
    const prompt = 'Responde con una sola palabra: ¿Funciona?';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Respuesta recibida de la API:', text);
    console.log('¡La API key funciona correctamente!');
    return true;
  } catch (error) {
    console.error('Error al probar la API key de Gemini:', error);
    console.error('Detalles del error:', error.message);

    if (error.message.includes('API key expired')) {
      console.error('La API key ha expirado. Por favor, renueva la API key.');
    } else if (error.message.includes('API_KEY_INVALID')) {
      console.error('La API key es inválida. Por favor, verifica que la API key sea correcta.');
    }

    return false;
  }
}

// Ejecutar la prueba
testGeminiApiKey()
  .then(success => {
    if (success) {
      console.log('Test completado con éxito.');
    } else {
      console.log('Test fallido.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error inesperado:', error);
    process.exit(1);
  });
