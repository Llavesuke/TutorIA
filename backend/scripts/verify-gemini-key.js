import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para leer la API key directamente del archivo .env
function readApiKeyFromFile() {
  try {
    const envPath = path.resolve(__dirname, '../.env');
    console.log('Reading .env file from:', envPath);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      console.log('Content of .env file:');
      console.log('-------------------');
      // Mostrar el contenido del archivo .env pero ocultar las claves sensibles
      const redactedContent = envContent.replace(/(API_KEY|PASSWORD|SECRET)=([^\r\n]+)/g, '$1=********');
      console.log(redactedContent);
      console.log('-------------------');
      
      const geminiKeyMatch = envContent.match(/GEMINI_API_KEY=([^\r\n]+)/);
      
      if (geminiKeyMatch && geminiKeyMatch[1]) {
        const apiKey = geminiKeyMatch[1].trim();
        console.log('Found GEMINI_API_KEY in .env file directly');
        console.log('Key starts with:', apiKey.substring(0, 10) + '...');
        console.log('Key length:', apiKey.length);
        return apiKey;
      } else {
        console.log('GEMINI_API_KEY not found in .env file content');
        return null;
      }
    } else {
      console.log('.env file not found at path:', envPath);
      return null;
    }
  } catch (error) {
    console.error('Error reading .env file directly:', error);
    return null;
  }
}

// Función para verificar si una API key es válida
async function verifyApiKey(apiKey, modelName = 'gemini-2.0-flash') {
  if (!apiKey) {
    console.error('No API key provided');
    return false;
  }
  
  try {
    console.log(`Verifying API key with model: ${modelName}`);
    console.log('API key starts with:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Enviar una solicitud simple para verificar que la API key funciona
    const prompt = 'Responde con una sola palabra: ¿Funciona?';
    console.log('Sending test request to Gemini API...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Response from Gemini API:', text);
    console.log('API key is valid!');
    return true;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}

// Función principal
async function main() {
  console.log('=== Gemini API Key Verification ===');
  
  // 1. Verificar la API key desde process.env
  console.log('\n1. Checking API key from process.env:');
  const envApiKey = process.env.GEMINI_API_KEY;
  
  if (envApiKey) {
    console.log('GEMINI_API_KEY found in process.env');
    console.log('Key starts with:', envApiKey.substring(0, 10) + '...');
    console.log('Key length:', envApiKey.length);
    
    const isEnvKeyValid = await verifyApiKey(envApiKey);
    console.log('API key from process.env is valid:', isEnvKeyValid);
  } else {
    console.log('GEMINI_API_KEY not found in process.env');
  }
  
  // 2. Leer la API key directamente del archivo .env
  console.log('\n2. Reading API key directly from .env file:');
  const fileApiKey = readApiKeyFromFile();
  
  if (fileApiKey) {
    const isFileKeyValid = await verifyApiKey(fileApiKey);
    console.log('API key from .env file is valid:', isFileKeyValid);
  }
  
  // 3. Probar con una API key hardcoded
  console.log('\n3. Testing with hardcoded API key:');
  const hardcodedApiKey = 'AIzaSyDJC5a882ruaJN2HQUAm9lwRnG6Vxxs8JQ';
  const isHardcodedKeyValid = await verifyApiKey(hardcodedApiKey);
  console.log('Hardcoded API key is valid:', isHardcodedKeyValid);
  
  console.log('\n=== Verification Complete ===');
}

// Ejecutar la función principal
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
