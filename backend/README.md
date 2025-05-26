# TutorIA Backend

Backend server for the TutorIA application, connecting to a Supabase PostgreSQL database and using Supabase Auth for authentication.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the backend directory with the following content:
   ```
   DB_CONNECTION_STRING=postgresql://postgres:tutorIA12@db.xxxceuscnfcxpfgnmdfe.supabase.co:5432/postgres
   PORT=3000
   SUPABASE_URL=https://xxxceuscnfcxpfgnmdfe.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   FRONTEND_URL=http://localhost:5173

   # Cloudinary configuration
   CLOUDINARY_CLOUD_NAME=drhxjofkq
   CLOUDINARY_API_KEY=982762731681915
   CLOUDINARY_API_SECRET=g2XbZZ2VT3JKp1PzNr4Jbtq0uVk

   # Google Gemini API configuration
   GEMINI_API_KEY=AIzaSyCcZR1lFwkYq2kRDLk2CkPWoc4elXcyqdo
   ```

3. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Test Endpoints
- `GET /` - Welcome message
- `GET /api/test-db` - Test database connection

### Autenticación (Supabase Auth)
- `POST /api/auth/register` - Registrar un nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/reset-password` - Solicitar restablecimiento de contraseña
- `POST /api/auth/update-password` - Actualizar contraseña

### Invitaciones
- `GET /api/invitaciones/centro/:centroId` - Obtener invitaciones activas para un centro
- `POST /api/invitaciones` - Crear una nueva invitación
- `GET /api/invitaciones/validate/:token` - Validar una invitación
- `PUT /api/invitaciones/use/:token` - Marcar una invitación como usada
- `DELETE /api/invitaciones/:token` - Eliminar una invitación

### Centros Educativos
- `GET /api/centros-educativos` - Obtener todos los centros educativos
- `GET /api/centros-educativos/:id` - Obtener centro educativo por ID
- `POST /api/centros-educativos` - Crear nuevo centro educativo
- `PUT /api/centros-educativos/:id` - Actualizar centro educativo
- `DELETE /api/centros-educativos/:id` - Eliminar centro educativo

### Módulos
- `GET /api/modulos` - Obtener todos los módulos
- `GET /api/modulos/:id` - Obtener módulo por ID
- `GET /api/modulos/centro/:centroId` - Obtener módulos por centro educativo
- `POST /api/modulos` - Crear nuevo módulo
- `PUT /api/modulos/:id` - Actualizar módulo
- `DELETE /api/modulos/:id` - Eliminar módulo

### Unidades
- `GET /api/unidades` - Obtener todas las unidades
- `GET /api/unidades/:id` - Obtener unidad por ID
- `GET /api/unidades/modulo/:moduloId` - Obtener unidades por módulo
- `POST /api/unidades` - Crear nueva unidad
- `PUT /api/unidades/:id` - Actualizar unidad
- `DELETE /api/unidades/:id` - Eliminar unidad

### Tutores Virtuales
- `GET /api/tutores-virtuales` - Obtener todos los tutores virtuales
- `GET /api/tutores-virtuales/:id` - Obtener tutor virtual por ID
- `GET /api/tutores-virtuales/unidad/:unidadId` - Obtener tutores virtuales por unidad
- `POST /api/tutores-virtuales` - Crear nuevo tutor virtual
- `PUT /api/tutores-virtuales/:id` - Actualizar tutor virtual
- `DELETE /api/tutores-virtuales/:id` - Eliminar tutor virtual

### Usuarios
- `GET /api/usuarios` - Obtener todos los usuarios
- `GET /api/usuarios/:id` - Obtener usuario por ID
- `GET /api/usuarios/centro/:centroId` - Obtener usuarios por centro educativo
- `GET /api/usuarios/rol/:rol` - Obtener usuarios por rol
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Subida de archivos (Cloudinary)
- `POST /api/uploads/profile` - Subir imagen de perfil
- `POST /api/uploads/activity` - Subir imagen de actividad
- `POST /api/uploads/document` - Subir documento
- `DELETE /api/uploads/image/:publicId` - Eliminar imagen de Cloudinary

### Documentos
- `GET /api/documentos` - Obtener todos los documentos
- `GET /api/documentos/:id` - Obtener documento por ID
- `GET /api/documentos/modulo/:moduloId` - Obtener documentos por módulo
- `GET /api/documentos/unidad/:unidadId` - Obtener documentos por unidad
- `GET /api/documentos/usuario/:usuarioId` - Obtener documentos por usuario
- `GET /api/documentos/tipo/:tipo` - Obtener documentos por tipo
- `DELETE /api/documentos/:id` - Eliminar documento

### Imágenes de actividad
- `GET /api/imagenes-actividad` - Obtener todas las imágenes de actividad
- `GET /api/imagenes-actividad/:id` - Obtener imagen de actividad por ID
- `GET /api/imagenes-actividad/usuario/:usuarioId` - Obtener imágenes por usuario
- `GET /api/imagenes-actividad/unidad/:unidadId` - Obtener imágenes por unidad
- `DELETE /api/imagenes-actividad/:id` - Eliminar imagen de actividad

### Chats con tutores virtuales (Google Gemini)
- `POST /api/chats/start` - Iniciar una conversación con un tutor virtual
- `POST /api/chats/continue` - Continuar una conversación existente
- `POST /api/chats/image` - Generar respuesta a partir de una imagen
- `POST /api/chats/generate` - Generar texto simple con Gemini

## Database Schema

The backend connects to a Supabase PostgreSQL database with the following tables:

- centros_educativos
- modulos
- unidades
- tutores_virtuales
- usuarios
- tabla_invitaciones
- tabla_reseteo_contrasena
- chats
- mensajes_chat
- documentos
- imagenes_actividad
- notificaciones
- usuarios_modulos
- usuarios_unidades
