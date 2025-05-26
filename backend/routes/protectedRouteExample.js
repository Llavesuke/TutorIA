import { Router } from 'express';
const router = Router();
import { requireAuth, requireRole } from '../middleware/auth.js';

// Ruta protegida que requiere autenticación
router.get('/protected', requireAuth, (req, res) => {
  res.json({ 
    message: 'Esta es una ruta protegida', 
    user: req.user 
  });
});

// Ruta que requiere rol específico (admin)
router.get('/admin-only', requireAuth, requireRole(['admin']), (req, res) => {
  res.json({ 
    message: 'Esta es una ruta solo para administradores', 
    user: req.user 
  });
});

// Ruta que permite múltiples roles (admin o profesor)
router.get('/staff-only', requireAuth, requireRole(['admin', 'profesor']), (req, res) => {
  res.json({ 
    message: 'Esta es una ruta para personal (admin o profesor)', 
    user: req.user 
  });
});

export default router;
