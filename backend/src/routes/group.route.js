import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { createGroup, getGroups } from '../controllers/group.controller.js'; // <--- Importamos getGroups

const router = express.Router();

// Ruta para obtener los grupos del usuario
router.get('/', protectRoute, getGroups); 

// Ruta para crear un grupo nuevo
router.post('/create', protectRoute, createGroup); 

export default router;