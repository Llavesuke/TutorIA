import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Carga una variable de entorno directamente del archivo .env
 * @param {string} varName - Nombre de la variable de entorno
 * @returns {string|null} - Valor de la variable o null si no se encuentra
 */
export function loadEnvVar(varName) {
  try {
    // Ruta al archivo .env
    const envPath = path.resolve(__dirname, '../.env');
    console.log(`Trying to read ${varName} from .env file at: ${envPath}`);
    
    if (!fs.existsSync(envPath)) {
      console.error(`.env file not found at ${envPath}`);
      return null;
    }
    
    // Leer el contenido del archivo .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Buscar la variable en el contenido
    const regex = new RegExp(`${varName}=([^\\r\\n]+)`);
    const match = envContent.match(regex);
    
    if (match && match[1]) {
      console.log(`Found ${varName} in .env file`);
      return match[1].trim();
    } else {
      console.error(`${varName} not found in .env file`);
      return null;
    }
  } catch (error) {
    console.error(`Error loading ${varName} from .env file:`, error);
    return null;
  }
}

/**
 * Obtiene la API key de Gemini
 * @returns {string} - API key de Gemini
 */
export function getGeminiApiKey() {
  // Intentar obtener la API key de las variables de entorno
  let apiKey = process.env.GEMINI_API_KEY;
  
  // Si no se encuentra en las variables de entorno, intentar cargarla directamente del archivo .env
  if (!apiKey) {
    console.log('GEMINI_API_KEY not found in process.env, trying to load from .env file directly');
    apiKey = loadEnvVar('GEMINI_API_KEY');
  }
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not found in environment variables or .env file');
  }
  
  return apiKey;
}
