import { Router } from 'express';
const router = Router();

// Import route modules
import centrosEducativosRoutes from './centrosEducativos.js';
import modulosRoutes from './modulos.js';
import unidadesRoutes from './unidades.js';
import tutoresVirtualesRoutes from './tutoresVirtuales.js';
import usuariosRoutes from './usuarios.js';
import invitacionesRoutes from './invitaciones.js';
import authRoutes from './auth.js';
import uploadsRoutes from './uploads.js';
import documentosRoutes from './documentos.js';
import imagenesActividadRoutes from './imagenesActividad.js';
import chatsRoutes from './chats.js';
import protectedRouteExample from './protectedRouteExample.js';
import usuariosModulosRoutes from './usuariosModulos.js';
import assignmentsRoutes from './assignments.js';
import ragRoutes from './rag.js';

// Use route modules
router.use('/centros-educativos', centrosEducativosRoutes);
router.use('/modulos', modulosRoutes);
router.use('/unidades', unidadesRoutes);
router.use('/tutores-virtuales', tutoresVirtualesRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/invitaciones', invitacionesRoutes);
router.use('/auth', authRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/documentos', documentosRoutes);
router.use('/imagenes-actividad', imagenesActividadRoutes);
router.use('/chats', chatsRoutes);
router.use('/examples', protectedRouteExample);
router.use('/usuarios-modulos', usuariosModulosRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/rag', ragRoutes);

export default router;
