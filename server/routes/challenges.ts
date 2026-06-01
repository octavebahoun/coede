import { Router } from 'express';
import { generateChallenge, submitChallenge, getHistory } from '../controllers/challengeController';
import { isAuthenticated } from '../middleware/authGuard';

const router = Router();

router.post('/generate', generateChallenge);
router.post('/submit', submitChallenge);
router.get('/history', isAuthenticated, getHistory);

export default router;