import { Router } from 'express';
import { db, respondWithFirestoreError, OperationType } from '../config/firebase';
import { requireAuth } from '../middlewares/auth';
import { validateLogin } from '../middlewares/validation';

const router = Router();

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
  const userEmail = req.userEmail as string;
  try {
    const userRef = db.collection('users').doc(userEmail);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(userSnap.data());
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.GET, `users/${userEmail}`, userEmail);
  }
});

// POST /auth/login
router.post('/login', requireAuth, validateLogin, async (req, res) => {
  const email = req.userEmail as string;
  const { username, avatar, provider } = req.body;
  try {
    const userRef = db.collection('users').doc(email);
    const userSnap = await userRef.get();
    let userData: any = null;

    if (!userSnap.exists) {
      userData = {
        id: 'user-' + Date.now().toString(36),
        username: username || email.split('@')[0],
        email: email,
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`,
        level: 1,
        totalScore: 0,
        challengesDone: 0,
        wins: 0,
        losses: 0,
        recentScores: [],
        proPassUnlocked: false,
        preferences: {
          editorTheme: 'vs-dark',
          terminalTheme: 'classic',
          siteTheme: 'dark',
          aiModel: 'gemini-3.5-flash'
        },
        provider: provider || 'google'
      };
      await userRef.set(userData);
    } else {
      userData = userSnap.data();
    }
    res.json({ success: true, user: userData });
  } catch (error) {
    respondWithFirestoreError(res, error, OperationType.WRITE, `users/${email}`, email);
  }
});

// POST /auth/logout
router.post('/logout', requireAuth, (req, res) => {
  res.json({ success: true });
});

export default router;
