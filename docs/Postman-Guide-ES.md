# Guía de Uso de la Colección Postman de TutorIA

## 📋 Índice

1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Estructura de la Colección](#estructura-de-la-colección)
4. [Variables de Entorno](#variables-de-entorno)
5. [Flujos de Trabajo Comunes](#flujos-de-trabajo-comunes)
6. [Scripts Automáticos](#scripts-automáticos)
7. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Introducción

La colección Postman de TutorIA es una herramienta completa para probar y documentar todos los endpoints de la API. Incluye:

- **150+ requests** organizados por funcionalidad
- **Variables de entorno** preconfiguradas
- **Scripts automáticos** para gestión de tokens
- **Documentación detallada** en español
- **Ejemplos de uso** para cada endpoint

### Beneficios

- ✅ **Pruebas Rápidas**: Testa la API sin escribir código
- ✅ **Documentación Viva**: Ejemplos actualizados y funcionales
- ✅ **Automatización**: Scripts que manejan autenticación automáticamente
- ✅ **Colaboración**: Comparte con tu equipo fácilmente

---

## 🛠️ Instalación y Configuración

### Paso 1: Descargar Postman

Si no tienes Postman instalado:
1. Ve a [postman.com](https://www.postman.com/downloads/)
2. Descarga e instala la aplicación
3. Crea una cuenta gratuita

### Paso 2: Importar la Colección

1. **Abrir Postman**
2. **Hacer clic en "Import"** (botón en la esquina superior izquierda)
3. **Seleccionar "Upload Files"**
4. **Importar los archivos**:
   - `postman-collection.json` (la colección principal)
   - `postman-environment.json` (variables de entorno)

### Paso 3: Configurar el Entorno

1. **Seleccionar el entorno** "TutorIA - Entorno de Desarrollo" en el dropdown superior derecho
2. **Hacer clic en el ícono del ojo** junto al dropdown del entorno
3. **Editar las variables** según tu configuración:

```
base_url: http://localhost:3000 (o tu URL de servidor)
test_email: tu-email-de-prueba@test.com
test_password: tu-contraseña-de-prueba
test_centro_id: 1 (ID de un centro existente)
```

### Paso 4: Verificar la Conexión

1. **Expandir la carpeta "🔐 Autenticación"**
2. **Ejecutar "Diagnóstico del Sistema"**
3. **Verificar que obtienes una respuesta 200 OK**

---

## 📁 Estructura de la Colección

### 🔐 Autenticación
- **Registrar Usuario**: Crear nuevos usuarios
- **Iniciar Sesión**: Obtener token JWT (se guarda automáticamente)
- **Obtener Usuario Actual**: Verificar autenticación
- **Cerrar Sesión**: Terminar sesión
- **Gestión de Contraseñas**: Restablecer y actualizar

### 🏫 Centros Educativos
- **CRUD Completo**: Crear, leer, actualizar, eliminar centros
- **Sin Autenticación**: Endpoints públicos para registro

### 👥 Usuarios
- **Gestión de Usuarios**: CRUD con diferentes filtros
- **Búsquedas**: Por email, centro, rol
- **Actualización de Perfiles**: Información personal

### 📚 Módulos
- **Gestión de Módulos**: CRUD con autenticación
- **Organización**: Por centro educativo
- **Permisos**: Solo admin/profesor pueden crear/modificar

### 📖 Unidades
- **Gestión de Unidades**: Dentro de módulos
- **Jerarquía**: Estructura modular del contenido

### 🤖 Tutores Virtuales
- **Configuración de IA**: Crear tutores personalizados
- **Tipos Especializados**: Teórico, práctico, evaluador, general
- **Personalización**: Personalidad, objetivos, instrucciones

### 💬 Chats
- **Conversaciones**: Iniciar y continuar chats
- **Multimodal**: Texto e imágenes
- **Contexto**: Historial persistente

### 📁 Documentos
- **Gestión de Archivos**: CRUD de documentos
- **Organización**: Por módulo, unidad, usuario, tipo
- **Permisos**: Control de acceso

### 🖼️ Imágenes de Actividad
- **Gestión de Imágenes**: CRUD específico para actividades
- **Organización**: Por usuario y unidad

### 📤 Uploads
- **Subida de Archivos**: Múltiples tipos y propósitos
- **Cloudinary**: Integración con servicio de almacenamiento
- **Validaciones**: Tipos y tamaños permitidos

---

## 🔧 Variables de Entorno

### Variables Principales

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `base_url` | URL base de la API | `http://localhost:3000` |
| `auth_token` | Token JWT (se configura automáticamente) | `eyJhbGciOiJIUzI1NiIs...` |
| `current_user_id` | ID del usuario autenticado | `123` |
| `current_user_role` | Rol del usuario | `estudiante` |

### Variables de Prueba

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `test_email` | Email para pruebas | `estudiante.prueba@tutoria.com` |
| `test_password` | Contraseña para pruebas | `password123` |
| `test_username` | Nombre de usuario | `estudiante_prueba` |
| `test_centro_id` | ID de centro | `1` |
| `test_modulo_id` | ID de módulo | `1` |
| `test_unidad_id` | ID de unidad | `1` |
| `test_tutor_id` | ID de tutor virtual | `1` |

### Configuración Personalizada

Para adaptar a tu entorno:

1. **Hacer clic en el entorno** en el dropdown
2. **Seleccionar "Edit"**
3. **Modificar los valores** según tu configuración
4. **Guardar cambios**

---

## 🔄 Flujos de Trabajo Comunes

### Flujo 1: Configuración Inicial

```
1. Diagnóstico del Sistema
2. Obtener Todos los Centros
3. Registrar Usuario (si es necesario)
4. Iniciar Sesión
5. Obtener Usuario Actual (verificar)
```

### Flujo 2: Gestión de Contenido

```
1. Iniciar Sesión (como profesor/admin)
2. Crear/Obtener Módulo
3. Crear/Obtener Unidad
4. Crear Tutor Virtual
5. Subir Documentos
```

### Flujo 3: Experiencia de Estudiante

```
1. Iniciar Sesión (como estudiante)
2. Obtener Módulos del Centro
3. Obtener Unidades del Módulo
4. Obtener Tutores de la Unidad
5. Iniciar Conversación
6. Continuar Conversación
```

### Flujo 4: Gestión de Archivos

```
1. Subir Imagen de Perfil
2. Subir Documento
3. Subir Imagen de Actividad
4. Obtener Documentos por Usuario
5. Eliminar Archivo (si es necesario)
```

---

## 🤖 Scripts Automáticos

### Script de Login Automático

El endpoint "Iniciar Sesión" incluye un script que:

```javascript
// Guardar token de autenticación automáticamente
if (pm.response.code === 200) {
    const responseJson = pm.response.json();
    if (responseJson.token) {
        pm.environment.set('auth_token', responseJson.token);
        console.log('Token de autenticación guardado');
    }
    if (responseJson.user) {
        pm.environment.set('current_user_id', responseJson.user.id);
        pm.environment.set('current_user_role', responseJson.user.rol);
        console.log('Información de usuario guardada');
    }
}
```

### Script de Chat

El endpoint "Iniciar Conversación" guarda automáticamente el ID del chat:

```javascript
// Guardar ID del chat creado
if (pm.response.code === 201) {
    const responseJson = pm.response.json();
    if (responseJson.chat && responseJson.chat.id) {
        pm.environment.set('current_chat_id', responseJson.chat.id);
        console.log('Chat ID guardado:', responseJson.chat.id);
    }
}
```

### Beneficios de los Scripts

- **Automatización**: No necesitas copiar/pegar tokens manualmente
- **Flujo Continuo**: Los requests siguientes usan automáticamente los valores guardados
- **Menos Errores**: Reduce errores de configuración manual

---

## 🔍 Consejos de Uso

### 1. Orden de Ejecución

**Siempre ejecuta primero:**
1. Diagnóstico del Sistema
2. Iniciar Sesión

**Antes de probar endpoints protegidos**

### 2. Verificación de Respuestas

- **200/201**: Éxito ✅
- **400**: Error de parámetros ❌
- **401**: No autenticado ❌
- **403**: Sin permisos ❌
- **404**: No encontrado ❌
- **500**: Error del servidor ❌

### 3. Uso de Variables

Utiliza las variables en lugar de valores hardcodeados:
- ✅ `{{base_url}}/api/usuarios/{{current_user_id}}`
- ❌ `http://localhost:3000/api/usuarios/123`

### 4. Organización

- **Usa carpetas** para organizar requests relacionados
- **Nombra descriptivamente** tus requests personalizados
- **Documenta** cualquier configuración especial

---

## ⚠️ Solución de Problemas

### Error: "Could not get response"

**Causa**: El servidor no está ejecutándose
**Solución**:
```bash
cd backend
npm run dev
```

### Error: 401 Unauthorized

**Causa**: Token expirado o no configurado
**Solución**:
1. Ejecutar "Iniciar Sesión" nuevamente
2. Verificar que `auth_token` se guardó en las variables

### Error: 404 Not Found

**Causa**: Endpoint incorrecto o recurso no existe
**Solución**:
1. Verificar la URL del endpoint
2. Verificar que el recurso existe (ej: usuario, módulo)

### Error: Variables no definidas

**Causa**: Variables de entorno no configuradas
**Solución**:
1. Seleccionar el entorno correcto
2. Configurar las variables necesarias
3. Verificar que no hay typos en los nombres

### Error: 500 Internal Server Error

**Causa**: Error en el servidor
**Solución**:
1. Verificar logs del servidor
2. Verificar configuración de base de datos
3. Verificar variables de entorno del backend

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar la documentación** de la API
2. **Revisar los logs** del servidor
3. **Consultar ejemplos** en la colección
4. **Abrir un issue** en GitHub

---

## 🎯 Próximos Pasos

Después de configurar la colección:

1. **Explorar todos los endpoints** disponibles
2. **Crear tus propios requests** personalizados
3. **Configurar tests automáticos** si es necesario
4. **Compartir con tu equipo** para colaboración

---

*¡Disfruta probando la API de TutorIA! 🚀*
