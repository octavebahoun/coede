import { Router } from 'express';
import { createDuel, joinDuel, getDuelState, getDuelHistory } from '../controllers/duelController';
import { isAuthenticated } from '../middleware/authGuard';

const router = Router();

router.post('/create', isAuthenticated, createDuel);
router.post('/join', isAuthenticated, joinDuel);
router.get('/history', isAuthenticated, getDuelHistory);
router.get('/:roomId', isAuthenticated, getDuelState);

export default router;