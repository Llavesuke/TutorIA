# Documentación de la API de TutorIA

## 📋 Índice

1. [Introducción](#introducción)
2. [Autenticación](#autenticación)
3. [Códigos de Estado](#códigos-de-estado)
4. [Endpoints por Categoría](#endpoints-por-categoría)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Manejo de Errores](#manejo-de-errores)

---

## 🚀 Introducción

La API de TutorIA es una interfaz RESTful que permite la gestión completa de la plataforma educativa con inteligencia artificial. Esta documentación describe todos los endpoints disponibles, sus parámetros, respuestas y ejemplos de uso.

### URL Base
```
http://localhost:3000/api
```

### Formato de Datos
- **Entrada**: JSON (Content-Type: application/json)
- **Salida**: JSON
- **Codificación**: UTF-8

---

## 🔐 Autenticación

La API utiliza autenticación JWT (JSON Web Tokens) para proteger los endpoints que requieren autorización.

### Obtener Token de Autenticación

**Endpoint:** `POST /auth/login`

**Parámetros:**
```json
{
  "identifier": "usuario@email.com",
  "password": "contraseña123"
}
```

**Respuesta Exitosa:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "usuario@email.com",
    "rol": "estudiante",
    "nombre_usuario": "usuario123",
    "nombre_real": "Juan Pérez"
  },
  "isEmailVerified": true
}
```

### Usar Token en Requests

Incluye el token en el header `Authorization`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Roles de Usuario

- **estudiante**: Acceso a módulos, tutores y chats
- **profesor**: Gestión de contenido y estudiantes
- **admin**: Acceso completo al sistema

---

## 📊 Códigos de Estado

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Parámetros inválidos o faltantes |
| 401 | Unauthorized | Token de autenticación requerido o inválido |
| 403 | Forbidden | Sin permisos para acceder al recurso |
| 404 | Not Found | Recurso no encontrado |
| 500 | Internal Server Error | Error interno del servidor |

---

## 🎯 Endpoints por Categoría

### 🔐 Autenticación

#### Registrar Usuario
```http
POST /auth/register
```

**Descripción:** Registra un nuevo usuario en el sistema.

**Parámetros Requeridos:**
- `email` (string): Correo electrónico único
- `password` (string): Contraseña (mínimo 6 caracteres)
- `nombreUsuario` (string): Nombre de usuario único
- `nombreReal` (string): Nombre real del usuario
- `rol` (string): Rol del usuario (estudiante, profesor, admin)
- `centroId` (string): ID del centro educativo

**Parámetros Opcionales:**
- `curso` (string): Curso del estudiante
- `clase` (string): Clase del estudiante
- `fotoPerfil` (string): URL de la foto de perfil

**Ejemplo de Request:**
```json
{
  "email": "estudiante@colegio.com",
  "password": "password123",
  "nombreUsuario": "juan_perez",
  "nombreReal": "Juan Pérez García",
  "rol": "estudiante",
  "centroId": "1",
  "curso": "1º ESO",
  "clase": "A"
}
```

**Respuesta Exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "456",
    "email": "estudiante@colegio.com",
    "nombreUsuario": "juan_perez",
    "rol": "estudiante"
  }
}
```

#### Iniciar Sesión
```http
POST /auth/login
```

**Descripción:** Autentica un usuario y devuelve un token JWT.

**Parámetros:**
- `identifier` (string): Email o nombre de usuario
- `password` (string): Contraseña del usuario

#### Cerrar Sesión
```http
POST /auth/logout
```
**Autenticación:** Requerida

**Descripción:** Cierra la sesión del usuario actual.

#### Obtener Usuario Actual
```http
GET /auth/me
```
**Autenticación:** Requerida

**Descripción:** Obtiene la información del usuario autenticado.

#### Solicitar Restablecimiento de Contraseña
```http
POST /auth/reset-password
```

**Parámetros:**
- `email` (string): Email del usuario

#### Actualizar Contraseña
```http
POST /auth/update-password
```
**Autenticación:** Requerida

**Parámetros:**
- `currentPassword` (string): Contraseña actual
- `newPassword` (string): Nueva contraseña

---

### 🏫 Centros Educativos

#### Obtener Todos los Centros
```http
GET /centros-educativos
```

**Descripción:** Obtiene la lista completa de centros educativos.

**Respuesta:**
```json
[
  {
    "id": "1",
    "nombre": "Colegio San José",
    "fecha_creacion": "2024-01-15T10:30:00Z"
  }
]
```

#### Obtener Centro por ID
```http
GET /centros-educativos/{id}
```

**Parámetros de URL:**
- `id` (string): ID del centro educativo

#### Crear Centro Educativo
```http
POST /centros-educativos
```

**Parámetros:**
- `nombre` (string): Nombre del centro educativo

#### Actualizar Centro Educativo
```http
PUT /centros-educativos/{id}
```

**Parámetros de URL:**
- `id` (string): ID del centro educativo

**Parámetros del cuerpo:**
- `nombre` (string): Nuevo nombre del centro

#### Eliminar Centro Educativo
```http
DELETE /centros-educativos/{id}
```

**Parámetros de URL:**
- `id` (string): ID del centro educativo

---

### 👥 Usuarios

#### Obtener Todos los Usuarios
```http
GET /usuarios
```

**Descripción:** Obtiene la lista completa de usuarios.

#### Obtener Usuario por ID
```http
GET /usuarios/{id}
```

#### Obtener Usuario por Email
```http
GET /usuarios/by-email/{email}
```

#### Obtener Usuarios por Centro
```http
GET /usuarios/centro/{centroId}
```

#### Obtener Usuarios por Rol
```http
GET /usuarios/rol/{rol}
```

**Parámetros de URL:**
- `rol` (string): Rol del usuario (estudiante, profesor, admin)

#### Actualizar Usuario
```http
PUT /usuarios/{id}
```

**Parámetros:**
- `nombreUsuario` (string): Nuevo nombre de usuario
- `email` (string): Nuevo email
- `fotoPerfil` (string): Nueva URL de foto de perfil
- `curso` (string): Nuevo curso
- `clase` (string): Nueva clase

#### Eliminar Usuario
```http
DELETE /usuarios/{id}
```

---

### 📚 Módulos

#### Obtener Todos los Módulos
```http
GET /modulos
```
**Autenticación:** Requerida

**Descripción:** Obtiene la lista completa de módulos educativos.

#### Obtener Módulo por ID
```http
GET /modulos/{id}
```
**Autenticación:** Requerida

#### Obtener Módulos por Centro
```http
GET /modulos/centro/{centroId}
```
**Autenticación:** Requerida

#### Crear Módulo
```http
POST /modulos
```
**Autenticación:** Requerida (Admin/Profesor)

**Parámetros:**
- `nombre` (string): Nombre del módulo
- `descripcion` (string): Descripción del módulo
- `centroId` (string): ID del centro educativo
- `curso` (string): Curso al que pertenece
- `color` (string): Color identificativo (opcional)

#### Actualizar Módulo
```http
PUT /modulos/{id}
```
**Autenticación:** Requerida (Admin/Profesor)

#### Eliminar Módulo
```http
DELETE /modulos/{id}
```
**Autenticación:** Requerida (Admin)

---

### 📖 Unidades

#### Obtener Todas las Unidades
```http
GET /unidades
```
**Autenticación:** Requerida

#### Obtener Unidad por ID
```http
GET /unidades/{id}
```
**Autenticación:** Requerida

#### Obtener Unidades por Módulo
```http
GET /unidades/modulo/{moduloId}
```
**Autenticación:** Requerida

---

### 🤖 Tutores Virtuales

#### Obtener Todos los Tutores
```http
GET /tutores-virtuales
```
**Autenticación:** Requerida

**Descripción:** Obtiene la lista completa de tutores virtuales disponibles.

#### Obtener Tutor por ID
```http
GET /tutores-virtuales/{id}
```
**Autenticación:** Requerida

#### Obtener Tutores por Unidad
```http
GET /tutores-virtuales/unidad/{unidadId}
```
**Autenticación:** Requerida

#### Crear Tutor Virtual
```http
POST /tutores-virtuales
```
**Autenticación:** Requerida (Admin/Profesor)

**Parámetros:**
- `nombre` (string): Nombre del tutor virtual
- `descripcion` (string): Descripción del tutor
- `tipo` (string): Tipo de tutor (teorico, practico, evaluador, general)
- `unidadId` (string): ID de la unidad asignada
- `personalidad` (string): Personalidad del tutor (opcional)
- `objetivos` (string): Objetivos del tutor (opcional)
- `instrucciones_especificas` (string): Instrucciones específicas (opcional)
- `avatar` (string): URL del avatar (opcional)

**Ejemplo:**
```json
{
  "nombre": "Tutor de Matemáticas",
  "descripcion": "Especialista en álgebra y geometría",
  "tipo": "teorico",
  "unidadId": "1",
  "personalidad": "Paciente y didáctico",
  "objetivos": "Ayudar a comprender conceptos matemáticos",
  "instrucciones_especificas": "Usar ejemplos visuales"
}
```

---

### 💬 Chats

#### Iniciar Conversación
```http
POST /chats/start
```
**Autenticación:** Requerida

**Descripción:** Inicia una nueva conversación con un tutor virtual.

**Parámetros:**
- `tutorId` (string): ID del tutor virtual
- `message` (string): Mensaje inicial del estudiante
- `imageUrl` (string): URL de imagen adjunta (opcional)

**Respuesta:**
```json
{
  "chat": {
    "id": "123",
    "tutor_virtual_id": "1",
    "usuario_id": "456",
    "fecha_inicio": "2024-01-15T10:30:00Z"
  },
  "response": "¡Hola! Soy tu tutor de matemáticas. ¿En qué puedo ayudarte hoy?",
  "message": "Conversación iniciada exitosamente"
}
```

#### Continuar Conversación
```http
POST /chats/continue
```
**Autenticación:** Requerida

**Parámetros:**
- `chatId` (string): ID del chat existente
- `message` (string): Nuevo mensaje del estudiante
- `imageUrl` (string): URL de imagen adjunta (opcional)

#### Enviar Imagen al Chat
```http
POST /chats/image
```
**Autenticación:** Requerida

**Parámetros:**
- `tutorId` (string): ID del tutor virtual
- `imageUrl` (string): URL de la imagen a analizar
- `message` (string): Mensaje adicional sobre la imagen (opcional)

#### Generar Texto Simple
```http
POST /chats/generate
```
**Autenticación:** Requerida

**Parámetros:**
- `prompt` (string): Texto para generar respuesta

#### Obtener Chats de Usuario con Tutor
```http
GET /chats/user/{userId}/tutor/{tutorId}
```
**Autenticación:** Requerida

#### Obtener Todos los Chats de Usuario
```http
GET /chats/user/{userId}
```
**Autenticación:** Requerida

---

### 📁 Documentos

#### Obtener Todos los Documentos
```http
GET /documentos
```

**Descripción:** Obtiene la lista completa de documentos en el sistema.

#### Obtener Documento por ID
```http
GET /documentos/{id}
```

#### Obtener Documentos por Módulo
```http
GET /documentos/modulo/{moduloId}
```

#### Obtener Documentos por Unidad
```http
GET /documentos/unidad/{unidadId}
```

#### Obtener Documentos por Usuario
```http
GET /documentos/usuario/{usuarioId}
```

#### Obtener Documentos por Tipo
```http
GET /documentos/tipo/{tipo}
```

**Parámetros de URL:**
- `tipo` (string): Tipo de documento (pdf, doc, docx, ppt, pptx, txt)

#### Eliminar Documento
```http
DELETE /documentos/{id}
```
**Autenticación:** Requerida

**Nota:** Solo el propietario del documento o un administrador puede eliminarlo.

---

### 🖼️ Imágenes de Actividad

#### Obtener Todas las Imágenes
```http
GET /imagenes-actividad
```

#### Obtener Imagen por ID
```http
GET /imagenes-actividad/{id}
```

#### Obtener Imágenes por Usuario
```http
GET /imagenes-actividad/usuario/{usuarioId}
```

#### Obtener Imágenes por Unidad
```http
GET /imagenes-actividad/unidad/{unidadId}
```

#### Eliminar Imagen de Actividad
```http
DELETE /imagenes-actividad/{id}
```
**Autenticación:** Requerida

---

### 📤 Uploads (Subida de Archivos)

#### Subir Archivo Genérico
```http
POST /uploads
```
**Autenticación:** Requerida

**Tipo de Contenido:** multipart/form-data

**Parámetros:**
- `image` (file): Archivo de imagen (para imágenes)
- `document` (file): Archivo de documento (para documentos)
- `file` (file): Archivo genérico
- `unidadId` (string): ID de unidad (para imágenes de actividad)
- `moduloId` (string): ID de módulo (para documentos)

#### Subir Imagen de Perfil
```http
POST /uploads/profile
```
**Autenticación:** Requerida

**Parámetros:**
- `image` (file): Archivo de imagen

#### Subir Imagen de Actividad
```http
POST /uploads/activity
```
**Autenticación:** Requerida

**Parámetros:**
- `image` (file): Archivo de imagen
- `unidadId` (string): ID de la unidad

#### Subir Imagen para Chat
```http
POST /uploads/chat-image
```
**Autenticación:** Requerida

**Parámetros:**
- `image` (file): Archivo de imagen

#### Subir Documento
```http
POST /uploads/document
```
**Autenticación:** Requerida

**Parámetros:**
- `document` (file): Archivo de documento
- `moduloId` (string): ID del módulo (opcional)
- `unidadId` (string): ID de la unidad (opcional)

**Tipos de archivo permitidos:** pdf, doc, docx, ppt, pptx, txt

#### Subir Archivo para Assignment
```http
POST /uploads/assignment
```
**Autenticación:** Requerida

**Parámetros:**
- `file` (file): Archivo para la tarea

#### Eliminar Imagen
```http
DELETE /uploads/image/{publicId}
```
**Autenticación:** Requerida

**Parámetros de URL:**
- `publicId` (string): ID público de la imagen en Cloudinary

---

### 📧 Invitaciones

#### Obtener Invitaciones por Centro
```http
GET /invitaciones/centro/{centroId}
```

**Descripción:** Obtiene todas las invitaciones activas para un centro educativo.

#### Crear Invitación
```http
POST /invitaciones
```

**Parámetros:**
- `centroId` (string): ID del centro educativo
- `tipoRol` (string): Tipo de rol (profesor, admin)
- `email` (string): Email del invitado
- `diasValidez` (number): Días de validez (opcional, por defecto 7)

#### Validar Invitación
```http
GET /invitaciones/validate/{token}
```

**Parámetros de URL:**
- `token` (string): Token de la invitación

#### Marcar Invitación como Usada
```http
PUT /invitaciones/use/{token}
```

#### Eliminar Invitación
```http
DELETE /invitaciones/{token}
```

#### Reenviar Invitación
```http
POST /invitaciones/resend/{token}
```

---

### 👨‍🏫 Usuarios-Módulos

#### Obtener Profesores por Módulo
```http
GET /usuarios-modulos/modulo/{moduloId}
```

**Descripción:** Obtiene todos los profesores asignados a un módulo.

#### Obtener Módulos por Profesor
```http
GET /usuarios-modulos/usuario/{usuarioId}
```

#### Asignar Profesor a Módulo
```http
POST /usuarios-modulos
```

**Parámetros:**
- `usuarioId` (string): ID del profesor
- `moduloId` (string): ID del módulo

#### Eliminar Asignación
```http
DELETE /usuarios-modulos/{usuarioId}/{moduloId}
```

---

### 📝 Assignments (Tareas)

#### Obtener Todas las Tareas
```http
GET /assignments
```
**Autenticación:** Requerida

#### Obtener Tarea por ID
```http
GET /assignments/{id}
```
**Autenticación:** Requerida

#### Obtener Tareas por Unidad
```http
GET /assignments/unidad/{unidadId}
```
**Autenticación:** Requerida

#### Crear Tarea
```http
POST /assignments
```
**Autenticación:** Requerida (Admin/Profesor)

**Parámetros:**
- `unidadId` (string): ID de la unidad
- `titulo` (string): Título de la tarea
- `descripcion` (string): Descripción de la tarea
- `fechaEntrega` (string): Fecha de entrega (ISO 8601)
- `puntuacionMaxima` (number): Puntuación máxima (opcional, por defecto 100)
- `permitirTexto` (boolean): Permitir respuestas de texto (opcional, por defecto true)
- `permitirArchivos` (boolean): Permitir subida de archivos (opcional, por defecto true)

#### Actualizar Tarea
```http
PUT /assignments/{id}
```
**Autenticación:** Requerida (Admin/Profesor)

#### Eliminar Tarea
```http
DELETE /assignments/{id}
```
**Autenticación:** Requerida (Admin/Profesor)

---

### 🧠 RAG (Retrieval-Augmented Generation)

#### Obtener Documentos RAG
```http
GET /rag/documentos
```
**Autenticación:** Requerida

**Parámetros de consulta:**
- `tutorId` (string): Filtrar por tutor virtual (opcional)
- `estado` (string): Filtrar por estado (pendiente, procesando, completado, error) (opcional)

#### Obtener Documento RAG por ID
```http
GET /rag/documentos/{id}
```
**Autenticación:** Requerida

#### Subir Documento para RAG
```http
POST /rag/upload
```
**Autenticación:** Requerida

**Tipo de Contenido:** multipart/form-data

**Parámetros:**
- `document` (file): Archivo PDF o DOCX
- `tutorVirtualId` (string): ID del tutor virtual

**Tipos de archivo permitidos:** pdf, docx
**Tamaño máximo:** 10MB

#### Eliminar Documento RAG
```http
DELETE /rag/documentos/{id}
```
**Autenticación:** Requerida

#### Obtener Chunks de Documento
```http
GET /rag/chunks/{documentoId}
```
**Autenticación:** Requerida

#### Búsqueda Semántica
```http
POST /rag/search
```
**Autenticación:** Requerida

**Parámetros:**
- `query` (string): Consulta de búsqueda
- `tutorVirtualId` (string): ID del tutor virtual
- `limit` (number): Límite de resultados (opcional, por defecto 5)
- `threshold` (number): Umbral de similitud (opcional, por defecto 0.4)

#### Obtener Estadísticas RAG
```http
GET /rag/estadisticas/{tutorId}
```
**Autenticación:** Requerida

#### Obtener Estado del Sistema RAG
```http
GET /rag/status
```
**Autenticación:** Requerida

---

### 🔒 Ejemplos Protegidos

#### Ruta Protegida Básica
```http
GET /examples/protected
```
**Autenticación:** Requerida

#### Ruta Solo para Administradores
```http
GET /examples/admin-only
```
**Autenticación:** Requerida (Admin)

#### Ruta para Personal (Admin/Profesor)
```http
GET /examples/staff-only
```
**Autenticación:** Requerida (Admin/Profesor)

---

## 💡 Ejemplos de Uso

### Flujo Completo de Autenticación

1. **Registrar Usuario:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudiante@test.com",
    "password": "password123",
    "nombreUsuario": "estudiante_test",
    "nombreReal": "Estudiante Test",
    "rol": "estudiante",
    "centroId": "1"
  }'
```

2. **Iniciar Sesión:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "estudiante@test.com",
    "password": "password123"
  }'
```

3. **Usar Token para Acceder a Recursos Protegidos:**
```bash
curl -X GET http://localhost:3000/api/tutores-virtuales \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Iniciar Conversación con Tutor

```bash
curl -X POST http://localhost:3000/api/chats/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "tutorId": "1",
    "message": "Hola, necesito ayuda con ecuaciones lineales"
  }'
```

---

## ⚠️ Manejo de Errores

### Formato de Respuesta de Error

```json
{
  "message": "Descripción del error",
  "error": "Detalles técnicos del error",
  "code": 400
}
```

### Errores Comunes

#### 401 - No Autorizado
```json
{
  "message": "No autorizado: Token no proporcionado"
}
```

#### 403 - Prohibido
```json
{
  "message": "Prohibido: No tienes permiso para acceder a este recurso",
  "requiredRoles": ["admin", "profesor"],
  "userRole": "estudiante"
}
```

#### 404 - No Encontrado
```json
{
  "message": "Usuario no encontrado"
}
```

#### 400 - Solicitud Incorrecta
```json
{
  "message": "Se requieren los campos email y password"
}
```

### Mejores Prácticas para Manejo de Errores

1. **Siempre verificar el código de estado HTTP**
2. **Leer el mensaje de error para información específica**
3. **Implementar reintentos para errores 5xx**
4. **Validar datos antes de enviar requests**
5. **Manejar tokens expirados renovando la autenticación**

---

## 📞 Soporte

Para soporte técnico o preguntas sobre la API:

- **Email**: soporte@tutoria.com
- **Documentación**: [docs.tutoria.com](https://docs.tutoria.com)
- **GitHub Issues**: [github.com/tutoria/issues](https://github.com/tutoria/issues)

---

*Última actualización: Enero 2024*
