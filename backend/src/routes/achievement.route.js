import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { awardPredictionBadge } from '../controllers/achievement.controller.js';

const router = express.Router();

router.post('/award-prediction', protectRoute, awardPredictionBadge);

export default router;