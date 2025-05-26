import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer directamente el archivo .env para depuración
try {
  const envPath = path.resolve(__dirname, '../.env');
  console.log('Trying to read .env file from:', envPath);

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const geminiKeyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);

    if (geminiKeyMatch && geminiKeyMatch[1]) {
      console.log('Found GEMINI_API_KEY in .env file directly');
      console.log('Key starts with:', geminiKeyMatch[1].substring(0, 10) + '...');
    } else {
      console.log('GEMINI_API_KEY not found in .env file content');
    }
  } else {
    console.log('.env file not found at path:', envPath);
  }
} catch (error) {
  console.error('Error reading .env file directly:', error);
}

// Obtener la API key de Gemini del archivo .env
const apiKey = process.env.GEMINI_API_KEY;
console.log('GEMINI_API_KEY from process.env:', apiKey ? (apiKey.substring(0, 10) + '...') : 'undefined');

// Mostrar información sobre la API key
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY debe estar definida en el archivo .env');
  // Don't exit the process, just log the error
  console.warn('La aplicación continuará sin funcionalidad de IA');
} else {
  console.log('Gemini API key loaded from .env file');
  console.log('API key starts with:', apiKey.substring(0, 10) + '...');
  console.log('API key length:', apiKey.length);

  // Verificar formato básico de la API key
  if (!apiKey.startsWith('AIza')) {
    console.warn('Warning: Gemini API key does not start with "AIza", which is unusual');
  }
}

// Inicializar el cliente de Google Generative AI
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

// Lista de modelos a probar, priorizando los más avanzados
const modelNames = [
  // Primero intentamos con posibles nombres de Gemini 2.0
  'gemini-2.0-pro',
  'gemini-2.0-flash',
  'gemini-2.0',
  // Luego con los modelos 1.5 más avanzados
  'gemini-1.5-pro',
  // Modelos estándar
  'gemini-pro',
  // Modelos de visión (por si acaso)
  'gemini-pro-vision',
  'gemini-1.5-pro-vision',
  // Último recurso (sabemos que funciona)
  'gemini-1.5-flash'
];

// Modelo predeterminado (usando el modelo 2.0-flash que parece funcionar)
let DEFAULT_MODEL = 'gemini-2.0-flash';
console.log('Using default model:', DEFAULT_MODEL);

// Verificar que la API key es válida con el modelo predeterminado
const checkApiKey = async () => {
  if (!apiKey) {
    console.warn('No se verificará la conexión con Google Gemini API (clave no proporcionada)');
    return;
  }

  try {
    console.log(`Verificando conexión con el modelo: ${DEFAULT_MODEL}`);
    // Solo inicializamos el modelo sin enviar ningún mensaje
    const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });
    console.log(`Conexión exitosa con el modelo: ${DEFAULT_MODEL}`);
  } catch (error) {
    console.error(`Error al conectar con el modelo ${DEFAULT_MODEL}:`, error);
    console.warn('La aplicación continuará sin funcionalidad de IA');
  }
};

// Ejecutar la verificación
checkApiKey().catch(err => {
  console.error('Error inesperado al verificar la API key:', err);
});

// Función para obtener un modelo de Gemini
export const getGeminiModel = (modelName = null) => {
  return genAI.getGenerativeModel({ model: modelName || DEFAULT_MODEL });
};

export default genAI;
