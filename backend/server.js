import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env file found, loading environment variables');
  dotenv.config({ path: envPath });

  // Verificar que se cargó la API key de Gemini
  if (process.env.GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY loaded successfully');
    console.log('Key starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  } else {
    console.warn('GEMINI_API_KEY not found in environment variables');
  }
} else {
  console.warn('.env file not found at path:', envPath);
  dotenv.config(); // Intentar cargar desde la ubicación predeterminada
}

import db from './config/db.js';
import apiRoutes from './routes/index.js';
import './config/cloudinary.js'; // Inicializar Cloudinary

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser middleware

// Configurar express-fileupload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  abortOnLimit: true,
  createParentPath: true
}));

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TutorIA API' });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      message: 'Database connection successful',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
