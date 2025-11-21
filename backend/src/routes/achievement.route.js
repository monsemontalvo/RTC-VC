import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { awardPredictionBadge, recordVideoCall } from '../controllers/achievement.controller.js';

const router = express.Router();

router.post('/award-prediction', protectRoute, awardPredictionBadge);
// Nueva ruta para videollamada
router.post('/record-video-call', protectRoute, recordVideoCall);

export default router;