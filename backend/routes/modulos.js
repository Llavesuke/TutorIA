import { Router } from 'express';
import { Modulo } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();

// GET /api/modulos
router.get('/', requireAuth, async (req, res) => {
  try {
    const modulos = await Modulo.getAll();
    res.json(modulos);
  } catch (error) {
    console.error('Error en GET /modulos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/modulos/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const modulo = await Modulo.getById(id);

    if (!modulo) {
      return res.status(404).json({ message: `Módulo con ID ${id} no encontrado` });
    }

    res.json(modulo);
  } catch (error) {
    console.error(`Error en GET /modulos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/modulos/centro/:centroId
router.get('/centro/:centroId', requireAuth, async (req, res) => {
  try {
    const { centroId } = req.params;
    const userRole = req.user.rol;
    const userId = req.user.id;

    console.log(`GET /modulos/centro/${centroId} - User role: ${userRole}, User ID: ${userId}`);

    // Si el usuario es admin, devolver todos los módulos del centro
    if (userRole === 'admin') {
      console.log(`User is admin, returning all modules for center ${centroId}`);
      const modulos = await Modulo.getByCentroId(centroId);
      return res.json(modulos);
    }
    // Si el usuario es profesor, devolver solo los módulos asignados a él
    else if (userRole === 'profesor') {
      console.log(`User is profesor, returning only assigned modules for profesor ${userId} in center ${centroId}`);
      const modulos = await Modulo.getByProfesorId(userId, centroId);
      return res.json(modulos);
    }
    // Para otros roles (estudiantes), devolver una lista vacía o un error
    else {
      console.log(`User with role ${userRole} is not authorized to view modules`);
      return res.status(403).json({
        message: 'No tienes permiso para ver módulos'
      });
    }
  } catch (error) {
    console.error(`Error en GET /modulos/centro/${req.params.centroId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/modulos/curso/:centroId/:curso
router.get('/curso/:centroId/:curso', requireAuth, async (req, res) => {
  try {
    const { centroId, curso } = req.params;
    const modulos = await Modulo.getByCurso(centroId, curso);
    res.json(modulos);
  } catch (error) {
    console.error(`Error en GET /modulos/curso/${req.params.centroId}/${req.params.curso}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/modulos/clase/:centroId/:curso/:clase
router.get('/clase/:centroId/:curso/:clase', requireAuth, async (req, res) => {
  try {
    const { centroId, curso, clase } = req.params;
    const modulos = await Modulo.getByCursoAndClase(centroId, curso, clase);
    res.json(modulos);
  } catch (error) {
    console.error(`Error en GET /modulos/clase/${req.params.centroId}/${req.params.curso}/${req.params.clase}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/modulos/profesor/:profesorId/:centroId
// Obtener módulos asignados a un profesor específico
router.get('/profesor/:profesorId/:centroId', requireAuth, async (req, res) => {
  try {
    const { profesorId, centroId } = req.params;

    // Verificar que el usuario autenticado es el profesor o un admin
    if (req.user.id !== profesorId && req.user.rol !== 'admin') {
      return res.status(403).json({
        message: 'No tienes permiso para ver los módulos de otro profesor'
      });
    }

    const modulos = await Modulo.getByProfesorId(profesorId, centroId);
    res.json(modulos);
  } catch (error) {
    console.error(`Error en GET /modulos/profesor/${req.params.profesorId}/${req.params.centroId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/modulos
router.post('/', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    console.log('Creating module with data:', req.body);
    console.log('Request headers:', req.headers);

    const { centroId, nombre, descripcion, curso, clase } = req.body;

    if (!centroId || !nombre) {
      return res.status(400).json({ message: 'Centro ID y nombre son requeridos' });
    }

    // Log the request details
    console.log(`Creating module: ${nombre} for center ${centroId}, grade ${curso}, class ${clase}`);

    // Crear el módulo
    const nuevoModulo = await Modulo.create(centroId, nombre, descripcion, curso, clase);
    console.log('Module created successfully:', nuevoModulo);

    // Obtener el ID del usuario actual (creador del módulo)
    const usuarioId = req.user.id;

    // Asignar automáticamente el creador del módulo como profesor
    try {
      const { UsuarioModulo } = await import('../models/index.js');
      console.log(`Automatically assigning creator ${usuarioId} to module ${nuevoModulo.id}`);
      await UsuarioModulo.asignarProfesorAModulo(usuarioId, nuevoModulo.id);
      console.log(`Creator ${usuarioId} assigned to module ${nuevoModulo.id}`);
    } catch (assignError) {
      console.error('Error assigning creator to module:', assignError);
      // No devolvemos error para no interrumpir la creación del módulo
    }

    res.status(201).json(nuevoModulo);
  } catch (error) {
    console.error('Error en POST /modulos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// PUT /api/modulos/:id
router.put('/:id', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, curso, clase } = req.body;

    // Verificar que el módulo existe
    const moduloExistente = await Modulo.getById(id);
    if (!moduloExistente) {
      return res.status(404).json({ message: `Módulo con ID ${id} no encontrado` });
    }

    const moduloActualizado = await Modulo.update(id, nombre, descripcion, curso, clase);
    res.json(moduloActualizado);
  } catch (error) {
    console.error(`Error en PUT /modulos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/modulos/:id
router.delete('/:id', requireAuth, requireRole(['admin', 'profesor']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el módulo existe
    const moduloExistente = await Modulo.getById(id);
    if (!moduloExistente) {
      return res.status(404).json({ message: `Módulo con ID ${id} no encontrado` });
    }

    await Modulo.delete(id);
    res.json({ message: `Módulo con ID ${id} eliminado correctamente` });
  } catch (error) {
    console.error(`Error en DELETE /modulos/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
