import { Router } from 'express';
import { askCoachChat, askOpponentChat } from '../controllers/chatController';

const router = Router();

// Routes directes (nouvelles URLs)
router.post('/coach', askCoachChat);
router.post('/opponent', askOpponentChat);

// Routes legacy (rétrocompatibilité pour la V1)
router.post('/', askCoachChat); // équivaut à /api/chat dans la V1

export default router;