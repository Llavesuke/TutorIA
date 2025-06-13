# TutorIA - Plataforma Educativa con IA

<div align="center">
  <img src="frontend/src/assets/images/logo_sin_fondo.png" alt="TutorIA Logo" width="200"/>

  **Revoluciona el aprendizaje con tutores virtuales impulsados por Inteligencia Artificial**

  [![Vue.js](https://img.shields.io/badge/Vue.js-3.5.13-4FC08D?style=flat&logo=vue.js)](https://vuejs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)](https://nodejs.org/)
  [![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express)](https://expressjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat&logo=postgresql)](https://supabase.com/)
  [![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com/)
</div>

---

## 📖 Introducción

### Origen de la Idea

TutorIA nació de la necesidad de democratizar el acceso a una educación personalizada y de calidad. En un mundo donde cada estudiante tiene un ritmo y estilo de aprendizaje único, los métodos tradicionales de enseñanza a menudo no logran adaptarse a estas diferencias individuales.

La idea surgió al observar tres problemas fundamentales en la educación actual:
- **Falta de personalización**: Los métodos tradicionales aplican un enfoque único para todos los estudiantes
- **Limitaciones de recursos**: No todos los centros educativos tienen acceso a tutores especializados
- **Escalabilidad**: Es difícil proporcionar atención individualizada a gran escala

### Expectativas y Objetivos del Proyecto

**Objetivo Principal**: Crear una plataforma educativa que utilice Inteligencia Artificial para proporcionar tutorías personalizadas, adaptándose al ritmo y estilo de aprendizaje de cada estudiante.

**Objetivos Específicos**:
- 🎯 **Personalización Avanzada**: Adaptar el contenido y metodología según el perfil de cada estudiante
- 🚀 **Escalabilidad Global**: Permitir que cualquier centro educativo implemente tutores virtuales
- 📊 **Seguimiento Inteligente**: Proporcionar análisis detallados del progreso estudiantil
- 🔒 **IA Ética**: Garantizar un uso responsable y transparente de la inteligencia artificial
- 🌐 **Accesibilidad Universal**: Hacer la educación personalizada accesible independientemente de la ubicación geográfica

### Análisis Comparativo

| Característica | TutorIA | Khan Academy | Coursera | Duolingo |
|----------------|---------|--------------|----------|----------|
| **Tutores IA Personalizados** | ✅ Sí | ❌ No | ❌ No | ⚠️ Limitado |
| **Gestión de Centros Educativos** | ✅ Completa | ❌ No | ❌ No | ❌ No |
| **RAG con Documentos Propios** | ✅ Sí | ❌ No | ❌ No | ❌ No |
| **Múltiples Tipos de Tutores** | ✅ Sí (Teórico, Práctico, Evaluador) | ❌ No | ❌ No | ❌ No |
| **Interfaz Conversacional** | ✅ Chat Natural | ⚠️ Limitado | ❌ No | ⚠️ Básico |
| **Análisis de Progreso** | ✅ Detallado | ✅ Básico | ✅ Básico | ✅ Gamificado |

**Ventaja Competitiva**: TutorIA es la única plataforma que combina tutores virtuales completamente personalizables con gestión integral de centros educativos y procesamiento de documentos propios mediante RAG (Retrieval-Augmented Generation).

---

## 🚀 Descripción del Proyecto

### Funcionalidades Principales

#### 🏫 **Gestión de Centros Educativos**
- **Registro de Centros**: Proceso completo de registro con verificación por email
- **Gestión de Profesores**: Invitación y administración de profesores por centro
- **Organización Jerárquica**: Estructura de módulos y unidades educativas
- **Panel de Administración**: Dashboard completo para administradores de centro

#### 👨‍🏫 **Tutores Virtuales Inteligentes**
- **Tipos Especializados**:
  - 📚 **Teórico**: Explicaciones conceptuales y fundamentos
  - 🛠️ **Práctico**: Ejercicios y aplicaciones prácticas
  - 📝 **Evaluador**: Evaluaciones y retroalimentación
  - 🌟 **General**: Soporte integral y orientación
- **Personalización Completa**: Configuración de personalidad, objetivos e instrucciones específicas
- **Integración RAG**: Procesamiento de documentos PDF y Word para conocimiento especializado
- **IA Multimodal**: Soporte para texto e imágenes en las conversaciones

#### 💬 **Sistema de Chat Avanzado**
- **Conversaciones Naturales**: Interfaz de chat intuitiva y fluida
- **Contexto Persistente**: Los tutores mantienen el contexto de conversaciones anteriores
- **Búsqueda Semántica**: Recuperación inteligente de información relevante
- **Soporte Multimedia**: Envío de imágenes y documentos en el chat

#### 📚 **Gestión de Documentos y RAG**
- **Procesamiento Automático**: Extracción y chunking inteligente de contenido
- **Embeddings Semánticos**: Búsqueda por similitud semántica
- **Múltiples Formatos**: Soporte para PDF, DOCX y otros formatos
- **Optimización de Chunks**: División inteligente del contenido para mejor recuperación

#### 🔐 **Autenticación y Autorización**
- **Múltiples Métodos**: JWT y Supabase Auth
- **Roles Diferenciados**: Estudiante, Profesor, Administrador
- **Verificación de Email**: Proceso completo de verificación
- **Seguridad Avanzada**: Tokens de refresh y protección de rutas

### Interfaz de Usuario y Experiencia (UI/UX)

#### 🎨 **Diseño Visual**
- **Identidad de Marca**: Colores corporativos (Naranja #e6531d, Verde #007142, Púrpura #34307b)
- **Diseño Responsivo**: Optimizado para dispositivos móviles, tablets y desktop
- **Animaciones Fluidas**: Transiciones suaves y efectos visuales atractivos
- **Componentes Reutilizables**: Sistema de diseño consistente en toda la aplicación

#### 📱 **Experiencia Móvil**
- **Mobile-First**: Diseño prioritario para dispositivos móviles
- **Carruseles Táctiles**: Navegación por deslizamiento en secciones de tarjetas
- **Menús Adaptativos**: Navegación optimizada para pantallas pequeñas
- **Rendimiento Optimizado**: Carga rápida y animaciones eficientes

#### 🖥️ **Dashboard Profesional**
- **Paneles Informativos**: Métricas y estadísticas en tiempo real
- **Gestión Intuitiva**: Interfaces claras para administración de contenido
- **Visualización de Datos**: Gráficos y tablas para seguimiento de progreso
- **Flujos de Trabajo Optimizados**: Procesos simplificados para tareas comunes

#### 🎯 **Landing Page Atractiva**
- **Hero Section Impactante**: Presentación clara del valor de la plataforma
- **Secciones Informativas**: Características, testimonios y proceso de uso
- **Call-to-Actions Efectivos**: Botones estratégicamente ubicados
- **Optimización SEO**: Estructura optimizada para motores de búsqueda

---

## 🛠️ Instalación y Preparación

### Prerrequisitos del Sistema

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js) o **yarn**
- **Git** - [Descargar aquí](https://git-scm.com/)
- **Docker** y **Docker Compose** (opcional, recomendado) - [Descargar aquí](https://www.docker.com/get-started)

### Opción 1: Instalación con Docker (Recomendada)

Esta es la forma más rápida y confiable de ejecutar TutorIA:

#### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/TutorIA.git
cd TutorIA
```

#### 2. Configurar Variables de Entorno
```bash
# El archivo docker-compose.yml ya incluye las variables necesarias
# Para producción, modifica las variables en docker-compose.yml
```

#### 3. Ejecutar con Docker Compose
```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# Para ejecutar en segundo plano
docker-compose up -d --build
```

#### 4. Acceder a la Aplicación
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

#### 5. Detener la Aplicación
```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Opción 2: Instalación Manual

#### 1. Clonar y Configurar el Proyecto
```bash
git clone https://github.com/tu-usuario/TutorIA.git
cd TutorIA

# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias de frontend y backend
npm run install:all
```

#### 2. Configurar Variables de Entorno

**Backend** (`backend/.env`):
```env
# Base de datos
DB_CONNECTION_STRING=postgresql://postgres:password@localhost:5432/tutoria

# Servidor
PORT=3000
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=tu-clave-secreta-jwt
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima-supabase

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Google Gemini
GEMINI_API_KEY=tu-clave-gemini

# Email
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-app
```

**Frontend** (`frontend/.env`):
```env
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-supabase

# Backend API
VITE_API_BASE_URL=http://localhost:3000
```

#### 3. Ejecutar en Modo Desarrollo
```bash
# Opción 1: Ejecutar ambos servicios simultáneamente
npm run dev

# Opción 2: Ejecutar por separado
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Scripts de Instalación Automatizada

#### Para Windows (PowerShell)
```powershell
# Ejecutar el script de desarrollo
.\start-dev.ps1
```

#### Para Linux/macOS (Bash)
```bash
#!/bin/bash
# Crear script setup.sh

# Instalar dependencias
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Crear archivos .env si no existen
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Configura las variables en backend/.env"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "⚠️  Configura las variables en frontend/.env"
fi

echo "✅ Instalación completada"
echo "🚀 Ejecuta 'npm run dev' para iniciar el desarrollo"
```

### Verificación de la Instalación

#### 1. Verificar Backend
```bash
curl http://localhost:3000/api/health
# Respuesta esperada: {"status": "OK", "timestamp": "..."}
```

#### 2. Verificar Frontend
- Navega a http://localhost:5173
- Deberías ver la landing page de TutorIA

#### 3. Verificar Base de Datos
```bash
# Desde el backend, ejecutar:
npm run test:db
```

### Solución de Problemas Comunes

#### Error de Puerto en Uso
```bash
# Verificar qué proceso usa el puerto
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# Terminar proceso si es necesario
kill -9 <PID>
```

#### Error de Dependencias
```bash
# Limpiar cache de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Error de Variables de Entorno
```bash
# Verificar que los archivos .env existen
ls -la backend/.env
ls -la frontend/.env

# Verificar contenido
cat backend/.env
```

---

## 📋 Próximos Pasos

Una vez completada la instalación:

1. **Configurar Supabase**: Crear proyecto y configurar tablas
2. **Configurar Cloudinary**: Para gestión de imágenes
3. **Obtener API Key de Gemini**: Para funcionalidades de IA
4. **Configurar Email**: Para notificaciones del sistema
5. **Ejecutar Tests**: Verificar que todo funciona correctamente

¿Necesitas ayuda con algún paso específico? Consulta nuestra [documentación detallada](docs/) o abre un [issue](https://github.com/tu-usuario/TutorIA/issues) en GitHub.

---

## 📚 Documentación de la API

### Colección de Postman

Hemos creado una colección completa de Postman que incluye todos los endpoints de la API con ejemplos y documentación detallada:

- **Archivo de Colección**: `postman-collection.json`
- **Variables de Entorno**: `postman-environment.json`
- **Documentación Completa**: `docs/API-Documentation-ES.md`

### Importar en Postman

1. Abre Postman
2. Haz clic en "Import"
3. Selecciona `postman-collection.json`
4. Importa también `postman-environment.json`
5. Configura las variables de entorno según tu instalación

### Endpoints Principales

- **🔐 Autenticación**: Registro, login, logout
- **🏫 Centros Educativos**: CRUD de centros
- **👥 Usuarios**: Gestión de usuarios
- **📚 Módulos**: Gestión de módulos educativos
- **🤖 Tutores Virtuales**: Configuración de tutores IA
- **💬 Chats**: Sistema de conversación
- **📁 Documentos**: Gestión de archivos
- **🧠 RAG**: Sistema de recuperación aumentada

---

*Última actualización: Enero 2024*
