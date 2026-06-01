import { Router } from 'express';
import { getUserProfile, updateMe, getLeaderboard, deleteMe } from '../controllers/userController';
import { isAuthenticated } from '../middleware/authGuard';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserProfile);
router.put('/me', isAuthenticated, updateMe);
router.delete('/me', isAuthenticated, deleteMe);

export default router;