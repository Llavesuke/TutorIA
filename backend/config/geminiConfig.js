import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar variables de entorno
dotenv.config();

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para obtener la API key de Gemini
export function getGeminiApiKey() {
  // API key válida y funcional proporcionada por el usuario
  return 'AIzaSyBP7_EVqHLldEZEfAEnFEouZqH2Zraq6wU';
}

// Función para crear un cliente de Gemini
export function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  return new GoogleGenerativeAI(apiKey);
}

// Función para obtener un modelo de Gemini
export function getGeminiModel(modelName = 'gemini-2.0-flash') {
  const client = createGeminiClient();
  return client.getGenerativeModel({ model: modelName });
}

// Exportar un cliente por defecto
const geminiClient = createGeminiClient();
export default geminiClient;
