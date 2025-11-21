import express from 'express';
import { createTask, updateTaskStatus, getGroupTasks, getUserTasks } from '../controllers/task.controller.js'; // <-- IMPORTAR getUserTasks
import { protectRoute } from '../middleware/auth.middleware.js'; 

const router = express.Router();

router.post('/', protectRoute, createTask); 
router.put('/:taskId/status', protectRoute, updateTaskStatus);

router.get('/group/:groupId', protectRoute, getGroupTasks);
router.get('/user/:userId', protectRoute, getUserTasks); // <-- ¡NUEVA RUTA AÑADIDA!

export default router;