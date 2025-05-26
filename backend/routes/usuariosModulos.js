import { Router } from 'express';
import { UsuarioModulo, Usuario } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/usuarios-modulos/modulo/:moduloId
// Obtener todos los profesores asignados a un módulo
router.get('/modulo/:moduloId', async (req, res) => {
  try {
    const { moduloId } = req.params;
    const profesores = await UsuarioModulo.getProfesoresPorModulo(moduloId);
    
    // Formatear la respuesta para que coincida con el formato esperado en el frontend
    const formattedProfessors = profesores.map(profesor => ({
      id: profesor.id,
      name: profesor.nombre_real,
      avatar: profesor.foto_perfil,
      email: profesor.email
    }));
    
    res.json(formattedProfessors);
  } catch (error) {
    console.error(`Error en GET /usuarios-modulos/modulo/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// GET /api/usuarios-modulos/usuario/:usuarioId
// Obtener todos los módulos asignados a un profesor
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const modulos = await UsuarioModulo.getModulosPorProfesor(usuarioId);
    res.json(modulos);
  } catch (error) {
    console.error(`Error en GET /usuarios-modulos/usuario/${req.params.usuarioId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// POST /api/usuarios-modulos
// Asignar un profesor a un módulo
router.post('/', async (req, res) => {
  try {
    const { usuarioId, moduloId } = req.body;
    
    if (!usuarioId || !moduloId) {
      return res.status(400).json({ message: 'Usuario ID y Módulo ID son requeridos' });
    }
    
    // Verificar que el usuario es un profesor
    const usuario = await Usuario.getById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (usuario.rol !== 'profesor' && usuario.rol !== 'admin') {
      return res.status(400).json({ message: 'Solo los profesores y administradores pueden ser asignados a módulos' });
    }
    
    const result = await UsuarioModulo.asignarProfesorAModulo(usuarioId, moduloId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en POST /usuarios-modulos:', error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

// DELETE /api/usuarios-modulos/:usuarioId/:moduloId
// Eliminar la asignación de un profesor a un módulo
router.delete('/:usuarioId/:moduloId', async (req, res) => {
  try {
    const { usuarioId, moduloId } = req.params;
    const result = await UsuarioModulo.eliminarProfesorDeModulo(usuarioId, moduloId);
    res.json(result);
  } catch (error) {
    console.error(`Error en DELETE /usuarios-modulos/${req.params.usuarioId}/${req.params.moduloId}:`, error);
    res.status(500).json({ message: 'Error del servidor', error: error.message });
  }
});

export default router;
